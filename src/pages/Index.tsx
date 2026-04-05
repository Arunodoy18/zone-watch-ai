import { useState, useCallback } from "react";
import Navbar from "@/components/dashboard/Navbar";
import LeftSidebar from "@/components/dashboard/LeftSidebar";
import MapPanel from "@/components/dashboard/MapPanel";
import RightSidebar from "@/components/dashboard/RightSidebar";
import OfflineIndicator from "@/components/dashboard/OfflineIndicator";
import { sampleAnalysis, type AnalysisResponse } from "@/data/sampleData";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const ANALYZE_TIMEOUT_MS = 60000;
const ANALYZE_MAX_ATTEMPTS = 3;
const ANALYZE_RETRY_DELAY_MS = 3000;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type AnalysisMode = "live" | "fallback" | null;

const Index = () => {
  const [selectedType, setSelectedType] = useState("landslide");
  const [lat, setLat] = useState(27.6244);
  const [lng, setLng] = useState(88.6124);
  const [radius, setRadius] = useState(5);
  const [intensity, setIntensity] = useState(2);
  const [showPopulation, setShowPopulation] = useState(false);
  const [showRoads, setShowRoads] = useState(true);
  const [showHistorical, setShowHistorical] = useState(false);
  const [clickToSet, setClickToSet] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResponse>(sampleAnalysis);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [locateTarget, setLocateTarget] = useState<{ lat: number; lng: number } | null>(null);

  const runAnalysis = useCallback(async () => {
    if (isAnalyzing) return;

    setIsAnalyzing(true);
    setHasResults(false);
    setStatusBanner("Connecting to backend analysis service. Initial wake-up can take up to 60-90 seconds on free tier.");
    setAnalysisMode(null);

    try {
      let result: AnalysisResponse | null = null;

      for (let attempt = 1; attempt <= ANALYZE_MAX_ATTEMPTS; attempt += 1) {
        const controller = new AbortController();
        const timeoutHandle = setTimeout(() => controller.abort(), ANALYZE_TIMEOUT_MS);

        try {
          const response = await fetch(`${API_BASE_URL}/analyze`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              lat,
              lng,
              radius_km: radius,
              disaster_type: selectedType,
            }),
            signal: controller.signal,
          });

          if (!response.ok) {
            throw new Error(`Analysis request failed with status ${response.status}`);
          }

          result = (await response.json()) as AnalysisResponse;
          break;
        } catch (error) {
          if (attempt < ANALYZE_MAX_ATTEMPTS) {
            setStatusBanner("Backend is waking up. Retrying analysis in a few seconds...");
            await delay(ANALYZE_RETRY_DELAY_MS);
            continue;
          }
          throw error;
        } finally {
          clearTimeout(timeoutHandle);
        }
      }

      if (!result) {
        throw new Error("Analysis returned no data");
      }

      setAnalysis(result);
      setHasResults(true);
      setAnalysisMode("live");
      setStatusBanner("Live backend analysis loaded.");
    } catch (error) {
      console.error("Failed to fetch analysis from backend:", error);
      setAnalysis(sampleAnalysis);
      setHasResults(true);
      setAnalysisMode("fallback");
      setStatusBanner("Backend unavailable. Showing offline sample data for instant demo flow.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, lat, lng, radius, selectedType]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setLat(parseFloat(lat.toFixed(4)));
    setLng(parseFloat(lng.toFixed(4)));
    setClickToSet(false);
  }, []);

  const handleLocateZone = useCallback((lat: number, lng: number) => {
    setLocateTarget({ lat, lng });
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <Navbar onRunAnalysis={runAnalysis} isAnalyzing={isAnalyzing} />
      {statusBanner && (
        <div
          className={`px-4 py-2 text-xs border-b border-border ${
            analysisMode === "fallback" ? "bg-accent/20 text-accent" : "bg-secondary text-foreground"
          }`}
        >
          {statusBanner}
        </div>
      )}
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        <LeftSidebar
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          lat={lat}
          lng={lng}
          onLatChange={setLat}
          onLngChange={setLng}
          radius={radius}
          onRadiusChange={setRadius}
          intensity={intensity}
          onIntensityChange={setIntensity}
          showPopulation={showPopulation}
          onTogglePopulation={() => setShowPopulation(!showPopulation)}
          showRoads={showRoads}
          onToggleRoads={() => setShowRoads(!showRoads)}
          showHistorical={showHistorical}
          onToggleHistorical={() => setShowHistorical(!showHistorical)}
          onRunAnalysis={runAnalysis}
          isAnalyzing={isAnalyzing}
          clickToSetLocation={clickToSet}
          onToggleClickLocation={() => setClickToSet(!clickToSet)}
        />
        <MapPanel
          lat={lat}
          lng={lng}
          radius={radius}
          showRoads={showRoads}
          zones={analysis.zones}
          hasResults={hasResults}
          isAnalyzing={isAnalyzing}
          onMapClick={handleMapClick}
          clickToSet={clickToSet}
          locateTarget={locateTarget}
        />
        <RightSidebar
          hasResults={hasResults}
          isAnalyzing={isAnalyzing}
          totalZones={analysis.total_zones_affected}
          populationExposed={analysis.population_exposed}
          criticalMinutes={analysis.critical_window_minutes}
          zones={analysis.zones}
          corridors={analysis.evacuation_corridors}
          onLocateZone={handleLocateZone}
          analysisMode={analysisMode}
        />
      </div>
      <OfflineIndicator />
    </div>
  );
};

export default Index;
