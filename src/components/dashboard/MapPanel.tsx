import { useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Circle, Polyline, CircleMarker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { sampleRoadNetwork, type Zone } from "@/data/sampleData";

interface MapPanelProps {
  lat: number;
  lng: number;
  radius: number;
  showRoads: boolean;
  zones: Zone[];
  hasResults: boolean;
  isAnalyzing: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  clickToSet: boolean;
  onLocateZone?: (lat: number, lng: number) => void;
  locateTarget?: { lat: number; lng: number } | null;
}

function MapClickHandler({ onClick, active }: { onClick: (lat: number, lng: number) => void; active: boolean }) {
  useMapEvents({
    click(e) {
      if (active) onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyToTarget({ target }: { target: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 12, { duration: 1 });
  }, [target, map]);
  return null;
}

function getRankColor(rank: number) {
  if (rank <= 3) return "#E84855";
  if (rank <= 6) return "#F5A623";
  return "#2ECC71";
}

const MapPanel = ({
  lat, lng, radius, showRoads, zones, hasResults, isAnalyzing,
  onMapClick, clickToSet, locateTarget,
}: MapPanelProps) => {
  const radiusMeters = radius * 1000;

  return (
    <div className="flex-1 relative min-h-[300px]">
      <MapContainer
        center={[lat, lng]}
        zoom={10}
        className="w-full h-full z-0"
        style={{ background: "#0A1628" }}
        zoomControl={false}
      >
        <TileLayer
          url="https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png"
          attribution='&copy; CartoDB'
        />
        <MapClickHandler onClick={onMapClick || (() => {})} active={clickToSet} />
        <FlyToTarget target={locateTarget || null} />

        {/* Impact zones */}
        <Circle center={[lat, lng]} radius={radiusMeters} pathOptions={{ color: "#E84855", fillColor: "#E84855", fillOpacity: 0.3, weight: 1 }} />
        <Circle center={[lat, lng]} radius={radiusMeters * 1.8} pathOptions={{ color: "#F5A623", fillColor: "#F5A623", fillOpacity: 0.2, weight: 1 }} />
        <Circle center={[lat, lng]} radius={radiusMeters * 3} pathOptions={{ color: "#FFD700", fillColor: "#FFD700", fillOpacity: 0.15, weight: 1 }} />

        {/* Epicenter pulse */}
        <CircleMarker center={[lat, lng]} radius={6} pathOptions={{ color: "#E84855", fillColor: "#E84855", fillOpacity: 1, weight: 2 }} />

        {/* Roads */}
        {showRoads &&
          sampleRoadNetwork.features.map((f, i) => (
            <Polyline
              key={i}
              positions={f.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number])}
              pathOptions={{ color: "#00B4A6", weight: 1.5, opacity: 0.6 }}
            />
          ))}

        {/* Zone markers */}
        {hasResults &&
          zones.map((z) => (
            <CircleMarker
              key={z.rank}
              center={[z.lat, z.lng]}
              radius={8}
              pathOptions={{
                color: getRankColor(z.rank),
                fillColor: getRankColor(z.rank),
                fillOpacity: 0.8,
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-xs space-y-1 min-w-[160px]" style={{ color: "#0A1628" }}>
                  <p className="font-bold text-sm">{z.name}</p>
                  <p>Risk Score: <strong>{z.risk_score}</strong></p>
                  <p>Population: {z.population.toLocaleString()}</p>
                  <p>Time to Isolation: {z.isolation_minutes}m</p>
                  <p>Alternate Routes: {z.alternate_routes}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
      </MapContainer>

      {/* Radar overlay */}
      {isAnalyzing && (
        <div className="absolute inset-0 flex items-center justify-center z-[1000] pointer-events-none">
          <div className="w-48 h-48 rounded-full border-2 border-primary/40 relative">
            <div className="absolute inset-0 animate-radar">
              <div className="absolute top-0 left-1/2 w-0.5 h-1/2 bg-gradient-to-b from-primary to-transparent origin-bottom" />
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-3 left-3 z-[1000] bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 space-y-1.5">
        {[
          { color: "bg-destructive", label: "Critical" },
          { color: "bg-accent", label: "High" },
          { color: "bg-[#FFD700]", label: "Moderate" },
          { color: "bg-success", label: "Safe" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-2 text-[10px] text-foreground">
            <span className={`w-2.5 h-2.5 rounded-sm ${l.color}`} />
            {l.label}
          </div>
        ))}
      </div>

      {/* Bottom pill */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-card/90 backdrop-blur-sm border border-border rounded-full px-4 py-1.5 text-[10px] text-muted-foreground font-mono">
        Simulating Sikkim Road Network — 2,847 nodes · 3,412 edges
      </div>
    </div>
  );
};

export default MapPanel;
