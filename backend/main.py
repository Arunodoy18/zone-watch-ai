from __future__ import annotations

from datetime import datetime, timezone
import os
from typing import Any

import geopandas as gpd
import networkx as nx
import numpy as np
import osmnx as ox
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pyproj import Transformer


class AnalyzeRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    radius_km: float = Field(..., gt=0, le=50)
    disaster_type: str = Field(..., min_length=1)


app = FastAPI(title="DeadZone AI Backend")


def _parse_allowed_origins() -> list[str]:
    raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    origins = [origin.strip() for origin in raw.split(",") if origin.strip()]
    return origins or ["http://localhost:5173", "http://127.0.0.1:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_parse_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


DISASTER_URGENCY_WEIGHT = {
    "landslide": 1.25,
    "flood": 1.15,
    "earthquake": 1.45,
    "cyclone": 1.05,
}

DISASTER_POPULATION_FACTOR = {
    "landslide": 125,
    "flood": 155,
    "earthquake": 140,
    "cyclone": 115,
}


def _safe_disaster_key(value: str) -> str:
    return value.strip().lower()


def _fetch_road_network(lat: float, lng: float, radius_km: float) -> nx.MultiDiGraph:
    # Pull a larger context window than impact radius so fragmentation is observable.
    dist_m = max(int(radius_km * 4000), 6000)
    return ox.graph_from_point(
        center_point=(lat, lng),
        dist=dist_m,
        network_type="drive",
        simplify=True,
        retain_all=True,
    )


def _remove_impacted_nodes(
    graph_projected: nx.MultiDiGraph,
    center_lat: float,
    center_lng: float,
    radius_km: float,
) -> tuple[nx.MultiDiGraph, set[int], float, float, float]:
    radius_m = radius_km * 1000.0
    transformer = Transformer.from_crs("EPSG:4326", graph_projected.graph["crs"], always_xy=True)
    center_x, center_y = transformer.transform(center_lng, center_lat)

    impacted_nodes: set[int] = set()
    for node_id, data in graph_projected.nodes(data=True):
        node_x = float(data["x"])
        node_y = float(data["y"])
        if float(np.hypot(node_x - center_x, node_y - center_y)) <= radius_m:
            impacted_nodes.add(int(node_id))

    graph_failed = graph_projected.copy()
    if impacted_nodes:
        graph_failed.remove_nodes_from(impacted_nodes)

    return graph_failed, impacted_nodes, center_x, center_y, radius_m


def _component_centroid_lat_lng(original_graph: nx.MultiDiGraph, component_nodes: list[int]) -> tuple[float, float]:
    frame = pd.DataFrame(
        {
            "node": component_nodes,
            "lat": [float(original_graph.nodes[n]["y"]) for n in component_nodes],
            "lng": [float(original_graph.nodes[n]["x"]) for n in component_nodes],
        }
    )
    gdf = gpd.GeoDataFrame(frame, geometry=gpd.points_from_xy(frame["lng"], frame["lat"]), crs="EPSG:4326")
    centroid_web_mercator = gdf.to_crs(epsg=3857).geometry.unary_union.centroid
    centroid_wgs84 = gpd.GeoSeries([centroid_web_mercator], crs=3857).to_crs(epsg=4326).iloc[0]
    return float(centroid_wgs84.y), float(centroid_wgs84.x)


def _build_zone_rows(
    original_graph: nx.MultiDiGraph,
    failed_graph: nx.MultiDiGraph,
    impacted_nodes: set[int],
    center_x: float,
    center_y: float,
    radius_m: float,
    disaster_type: str,
) -> list[dict[str, Any]]:
    undirected_failed = nx.Graph(failed_graph)
    components = list(nx.connected_components(undirected_failed))
    if not components:
        return []

    largest_component = max(components, key=len)
    isolated_components = [component for component in components if component != largest_component]

    disaster_key = _safe_disaster_key(disaster_type)
    urgency_base = DISASTER_URGENCY_WEIGHT.get(disaster_key, 1.1)
    population_factor = DISASTER_POPULATION_FACTOR.get(disaster_key, 120)

    zones: list[dict[str, Any]] = []

    for idx, component in enumerate(isolated_components, start=1):
        node_ids = list(component)
        if not node_ids:
            continue

        distances = np.array(
            [
                np.hypot(
                    float(failed_graph.nodes[node_id]["x"]) - center_x,
                    float(failed_graph.nodes[node_id]["y"]) - center_y,
                )
                for node_id in node_ids
            ],
            dtype=float,
        )
        min_distance = float(np.min(distances)) if distances.size > 0 else radius_m

        # Count unique neighboring removed nodes as alternate ways out after disruption.
        adjacent_removed: set[int] = set()
        for node_id in node_ids:
            for neighbor in original_graph.neighbors(node_id):
                if int(neighbor) in impacted_nodes:
                    adjacent_removed.add(int(neighbor))
        alternate_routes_available = int(len(adjacent_removed))
        route_divisor = max(0.5, float(alternate_routes_available))

        mean_degree = float(np.mean([failed_graph.degree(node_id) for node_id in node_ids])) if node_ids else 1.0
        estimated_population = int(
            max(
                50,
                np.round(len(node_ids) * population_factor * (1.0 + (mean_degree / 3.0))),
            )
        )

        proximity_boost = max(0.0, (2.0 * radius_m - min_distance) / (2.0 * radius_m))
        urgency_weight = urgency_base * (1.0 + proximity_boost)

        raw_score = estimated_population * (1.0 / route_divisor) * urgency_weight

        zone_lat, zone_lng = _component_centroid_lat_lng(original_graph, node_ids)

        isolation_minutes = int(np.clip(20.0 + (min_distance / 40.0) + (len(node_ids) * 0.8), 10.0, 240.0))

        zones.append(
            {
                "_raw_score": float(raw_score),
                "name": f"Zone {idx}",
                "population": estimated_population,
                "isolation_minutes": isolation_minutes,
                "alternate_routes": alternate_routes_available,
                "lat": round(zone_lat, 4),
                "lng": round(zone_lng, 4),
            }
        )

    if not zones:
        return []

    # Normalize risk scores to 1..99 while preserving ranking.
    raw_scores = np.array([row["_raw_score"] for row in zones], dtype=float)
    if len(raw_scores) == 1:
        normalized = np.array([85], dtype=int)
    else:
        spread = float(np.max(raw_scores) - np.min(raw_scores))
        if spread <= 0:
            normalized = np.full_like(raw_scores, 70, dtype=int)
        else:
            normalized = np.clip(np.round(40 + 59 * ((raw_scores - np.min(raw_scores)) / spread)), 1, 99).astype(int)

    for i, row in enumerate(zones):
        row["risk_score"] = int(normalized[i])

    zones.sort(key=lambda item: item["risk_score"], reverse=True)

    for rank, row in enumerate(zones, start=1):
        row["rank"] = rank
        row.pop("_raw_score", None)

    return zones[:12]


def _build_evacuation_corridors(failed_graph: nx.MultiDiGraph, fragmentation_ratio: float) -> list[dict[str, str]]:
    edge_names: list[str] = []
    seen_names: set[str] = set()

    for _, _, _, data in failed_graph.edges(keys=True, data=True):
        edge_name = data.get("name")
        if isinstance(edge_name, list):
            candidates = [str(name).strip() for name in edge_name if str(name).strip()]
        elif edge_name:
            candidates = [str(edge_name).strip()]
        else:
            candidates = []

        for candidate in candidates:
            if candidate not in seen_names:
                seen_names.add(candidate)
                edge_names.append(candidate)
            if len(edge_names) >= 3:
                break
        if len(edge_names) >= 3:
            break

    if not edge_names:
        edge_names = [
            "NH10 - Rangpo to Gangtok",
            "Mangan - Singhik Route",
            "Chungthang - Lachen Bypass",
        ]

    status_cycle = ["open", "at_risk", "blocked"]
    capacities = {"open": "High", "at_risk": "Medium", "blocked": "Low"}

    corridors: list[dict[str, str]] = []
    for index, name in enumerate(edge_names[:3]):
        if fragmentation_ratio >= 0.55:
            status = status_cycle[min(index + 1, 2)]
        elif fragmentation_ratio >= 0.3:
            status = status_cycle[min(index, 2)]
        else:
            status = status_cycle[0 if index == 0 else 1]

        corridors.append(
            {
                "name": name,
                "status": status,
                "capacity": capacities[status],
            }
        )

    return corridors


@app.post("/analyze")
def analyze(payload: AnalyzeRequest) -> dict[str, Any]:
    try:
        base_graph = _fetch_road_network(payload.lat, payload.lng, payload.radius_km)
        if base_graph.number_of_nodes() == 0:
            raise HTTPException(status_code=400, detail="No road network found for the selected coordinates.")

        projected_graph = ox.project_graph(base_graph)

        failed_graph, impacted_nodes, center_x, center_y, radius_m = _remove_impacted_nodes(
            projected_graph,
            payload.lat,
            payload.lng,
            payload.radius_km,
        )

        zones = _build_zone_rows(
            original_graph=base_graph,
            failed_graph=failed_graph,
            impacted_nodes=impacted_nodes,
            center_x=center_x,
            center_y=center_y,
            radius_m=radius_m,
            disaster_type=payload.disaster_type,
        )

        population_exposed = int(sum(zone["population"] for zone in zones))

        if failed_graph.number_of_nodes() > 0:
            component_count = nx.number_connected_components(nx.Graph(failed_graph))
            fragmentation_ratio = max(0.0, min(1.0, (component_count - 1) / max(component_count, 1)))
        else:
            fragmentation_ratio = 1.0

        corridors = _build_evacuation_corridors(failed_graph, fragmentation_ratio)

        disaster_key = _safe_disaster_key(payload.disaster_type)
        urgency_weight = DISASTER_URGENCY_WEIGHT.get(disaster_key, 1.1)
        critical_window_minutes = int(
            np.clip(
                140.0 / urgency_weight - (len(impacted_nodes) / 120.0),
                20.0,
                180.0,
            )
        )

        return {
            "analysis_id": f"DZ-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
            "disaster_type": disaster_key,
            "epicenter": {
                "lat": round(payload.lat, 4),
                "lng": round(payload.lng, 4),
            },
            "total_zones_affected": len(zones),
            "population_exposed": population_exposed,
            "critical_window_minutes": critical_window_minutes,
            "zones": zones,
            "evacuation_corridors": corridors,
        }
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}") from exc


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
