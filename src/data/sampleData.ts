export interface Zone {
  rank: number;
  name: string;
  population: number;
  isolation_minutes: number;
  risk_score: number;
  alternate_routes: number;
  lat: number;
  lng: number;
}

export interface EvacCorridor {
  name: string;
  status: "open" | "at_risk" | "blocked";
  capacity: string;
}

export interface AnalysisResponse {
  analysis_id: string;
  disaster_type: string;
  epicenter: { lat: number; lng: number };
  total_zones_affected: number;
  population_exposed: number;
  critical_window_minutes: number;
  zones: Zone[];
  evacuation_corridors: EvacCorridor[];
}

export const sampleAnalysis: AnalysisResponse = {
  analysis_id: "SK-2024-001",
  disaster_type: "landslide",
  epicenter: { lat: 27.6244, lng: 88.6124 },
  total_zones_affected: 12,
  population_exposed: 34820,
  critical_window_minutes: 100,
  zones: [
    { rank: 1, name: "Mangan Village", population: 4200, isolation_minutes: 28, risk_score: 97, alternate_routes: 0, lat: 27.5100, lng: 88.5300 },
    { rank: 2, name: "Chungthang Cluster", population: 3800, isolation_minutes: 45, risk_score: 91, alternate_routes: 0, lat: 27.6050, lng: 88.6200 },
    { rank: 3, name: "Lachen Valley", population: 2900, isolation_minutes: 52, risk_score: 85, alternate_routes: 1, lat: 27.7200, lng: 88.5500 },
    { rank: 4, name: "Singhik Settlement", population: 1800, isolation_minutes: 70, risk_score: 76, alternate_routes: 1, lat: 27.5500, lng: 88.5800 },
    { rank: 5, name: "Toong Village", population: 1200, isolation_minutes: 88, risk_score: 68, alternate_routes: 2, lat: 27.4800, lng: 88.6000 },
    { rank: 6, name: "Phensang Area", population: 980, isolation_minutes: 95, risk_score: 61, alternate_routes: 1, lat: 27.6600, lng: 88.5900 },
    { rank: 7, name: "Kabi Longstok", population: 760, isolation_minutes: 112, risk_score: 52, alternate_routes: 2, lat: 27.4200, lng: 88.5700 },
    { rank: 8, name: "Dikchu Village", population: 540, isolation_minutes: 130, risk_score: 44, alternate_routes: 3, lat: 27.3900, lng: 88.6100 },
  ],
  evacuation_corridors: [
    { name: "NH10 — Rangpo to Gangtok", status: "open", capacity: "High" },
    { name: "Mangan — Singhik Route", status: "at_risk", capacity: "Medium" },
    { name: "Chungthang — Lachen Bypass", status: "blocked", capacity: "None" },
  ],
};

export const sampleRoadNetwork = {
  type: "FeatureCollection" as const,
  features: [
    { type: "Feature" as const, properties: { name: "NH10" }, geometry: { type: "LineString" as const, coordinates: [[88.61, 27.33], [88.60, 27.39], [88.59, 27.45], [88.58, 27.51], [88.57, 27.55], [88.60, 27.60], [88.61, 27.62]] } },
    { type: "Feature" as const, properties: { name: "Mangan Road" }, geometry: { type: "LineString" as const, coordinates: [[88.53, 27.51], [88.55, 27.53], [88.58, 27.55], [88.59, 27.58], [88.59, 27.60]] } },
    { type: "Feature" as const, properties: { name: "Lachen Bypass" }, geometry: { type: "LineString" as const, coordinates: [[88.60, 27.60], [88.58, 27.65], [88.56, 27.68], [88.55, 27.72]] } },
    { type: "Feature" as const, properties: { name: "East Link" }, geometry: { type: "LineString" as const, coordinates: [[88.61, 27.62], [88.62, 27.65], [88.60, 27.68], [88.59, 27.72]] } },
  ],
};

