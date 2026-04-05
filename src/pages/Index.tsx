import { useState, useCallback } from "react";
import Navbar from "@/components/dashboard/Navbar";
import LeftSidebar from "@/components/dashboard/LeftSidebar";
import MapPanel from "@/components/dashboard/MapPanel";
import RightSidebar from "@/components/dashboard/RightSidebar";
import OfflineIndicator from "@/components/dashboard/OfflineIndicator";
import { sampleAnalysis } from "@/data/sampleData";

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
  const [locateTarget, setLocateTarget] = useState<{ lat: number; lng: number } | null>(null);

  const runAnalysis = useCallback(() => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setHasResults(false);
    setTimeout(() => {
      setIsAnalyzing(false);
      setHasResults(true);
    }, 3000);
  }, [isAnalyzing]);

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
          zones={sampleAnalysis.zones}
          hasResults={hasResults}
          isAnalyzing={isAnalyzing}
          onMapClick={handleMapClick}
          clickToSet={clickToSet}
          locateTarget={locateTarget}
        />
        <RightSidebar
          hasResults={hasResults}
          isAnalyzing={isAnalyzing}
          totalZones={sampleAnalysis.total_zones_affected}
          populationExposed={sampleAnalysis.population_exposed}
          criticalMinutes={sampleAnalysis.critical_window_minutes}
          zones={sampleAnalysis.zones}
          corridors={sampleAnalysis.evacuation_corridors}
          onLocateZone={handleLocateZone}
        />
      </div>
      <OfflineIndicator />
    </div>
  );
};

export default Index;
