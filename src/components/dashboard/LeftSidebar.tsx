import {
  Mountain, Droplets, Activity, Wind,
  Play, MapPin, Search, Clock, Users, Map,
} from "lucide-react";
import { useState } from "react";

const disasterTypes = [
  { id: "landslide", label: "Landslide", icon: Mountain },
  { id: "flood", label: "Flash Flood", icon: Droplets },
  { id: "earthquake", label: "Earthquake", icon: Activity },
  { id: "cyclone", label: "Cyclone", icon: Wind },
];

const intensitySteps = ["Low", "Medium", "High", "Extreme"];

interface LeftSidebarProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
  lat: number;
  lng: number;
  onLatChange: (v: number) => void;
  onLngChange: (v: number) => void;
  radius: number;
  onRadiusChange: (v: number) => void;
  intensity: number;
  onIntensityChange: (v: number) => void;
  showPopulation: boolean;
  onTogglePopulation: () => void;
  showRoads: boolean;
  onToggleRoads: () => void;
  showHistorical: boolean;
  onToggleHistorical: () => void;
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
  clickToSetLocation: boolean;
  onToggleClickLocation: () => void;
}

const LeftSidebar = (props: LeftSidebarProps) => {
  const {
    selectedType, onTypeChange, lat, lng, onLatChange, onLngChange,
    radius, onRadiusChange, intensity, onIntensityChange,
    showPopulation, onTogglePopulation, showRoads, onToggleRoads,
    showHistorical, onToggleHistorical, onRunAnalysis, isAnalyzing,
    clickToSetLocation, onToggleClickLocation,
  } = props;

  return (
    <aside className={`w-full lg:w-[280px] bg-card border-r border-border flex flex-col shrink-0 overflow-y-auto scrollbar-thin relative ${isAnalyzing ? 'pointer-events-none' : ''}`}>
      {isAnalyzing && <div className="absolute inset-0 bg-background/40 z-10" />}
      
      <div className="p-4 space-y-5">
        <p className="text-[10px] font-semibold tracking-[0.2em] text-primary uppercase">
          Disaster Configuration
        </p>

        {/* Event Type */}
        <div className="grid grid-cols-2 gap-2">
          {disasterTypes.map((dt) => {
            const active = selectedType === dt.id;
            return (
              <button
                key={dt.id}
                onClick={() => onTypeChange(dt.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all duration-200 text-xs font-medium ${
                  active
                    ? "border-primary bg-primary/10 text-primary shadow-[0_0_12px_hsl(175_100%_35%/0.15)]"
                    : "border-border bg-secondary text-muted-foreground hover:border-primary/40"
                }`}
              >
                <dt.icon className={`w-5 h-5 ${active ? "text-primary" : ""}`} />
                {dt.label}
              </button>
            );
          })}
        </div>

        {/* Coordinates */}
        <div>
          <p className="text-[10px] font-semibold tracking-[0.15em] text-muted-foreground mb-2 uppercase flex items-center gap-1">
            <MapPin className="w-3 h-3 text-primary" /> Epicenter Coordinates
          </p>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[9px] text-muted-foreground">LAT</label>
              <input
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => onLatChange(parseFloat(e.target.value) || 0)}
                className="w-full mt-0.5 px-2 py-1.5 rounded-md bg-secondary border border-border text-xs text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex-1">
              <label className="text-[9px] text-muted-foreground">LNG</label>
              <input
                type="number"
                step="0.0001"
                value={lng}
                onChange={(e) => onLngChange(parseFloat(e.target.value) || 0)}
                className="w-full mt-0.5 px-2 py-1.5 rounded-md bg-secondary border border-border text-xs text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="mt-2 relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <input
              placeholder="Or enter location name"
              className="w-full pl-7 pr-2 py-1.5 rounded-md bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <button
            onClick={onToggleClickLocation}
            className={`mt-2 w-full text-[10px] py-1.5 rounded-full font-medium transition-all duration-200 ${
              clickToSetLocation
                ? "bg-accent text-accent-foreground"
                : "bg-secondary text-muted-foreground border border-border"
            }`}
          >
            <Map className="w-3 h-3 inline mr-1" />
            Click on map to set location
          </button>
        </div>

        {/* Impact Parameters */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-wide">Impact Radius</label>
              <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{radius} km</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="20"
              step="0.5"
              value={radius}
              onChange={(e) => onRadiusChange(parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-secondary accent-primary cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
            />
            <div className="flex justify-between text-[8px] text-muted-foreground mt-0.5">
              <span>0.5km</span><span>20km</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">Disaster Intensity</label>
            <div className="flex gap-1">
              {intensitySteps.map((step, i) => (
                <button
                  key={step}
                  onClick={() => onIntensityChange(i)}
                  className={`flex-1 text-[9px] py-1.5 rounded-md font-medium transition-all duration-200 ${
                    intensity === i
                      ? i <= 1 ? "bg-primary text-primary-foreground" : i === 2 ? "bg-accent text-accent-foreground" : "bg-destructive text-destructive-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {step}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-1">Time of Event</label>
            <div className="relative">
              <Clock className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <input
                type="time"
                defaultValue={new Date().toTimeString().slice(0, 5)}
                className="w-full pl-7 pr-2 py-1.5 rounded-md bg-secondary border border-border text-xs text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-2">
          <Toggle label="Show Population Density" checked={showPopulation} onChange={onTogglePopulation} />
          <Toggle label="Show Road Network" checked={showRoads} onChange={onToggleRoads} />
          <Toggle label="Show Historical Incidents" checked={showHistorical} onChange={onToggleHistorical} />
        </div>

        {/* Run Button */}
        <button
          onClick={onRunAnalysis}
          disabled={isAnalyzing}
          className={`w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 hover:brightness-110 disabled:opacity-60 ${
            isAnalyzing ? "animate-pulse-ring" : ""
          }`}
        >
          <Play className="w-4 h-4" />
          {isAnalyzing ? "ANALYZING..." : "RUN ANALYSIS"}
        </button>
      </div>
    </aside>
  );
};

const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) => (
  <label className="flex items-center justify-between cursor-pointer group">
    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
    <div
      onClick={onChange}
      className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
        checked ? "bg-primary" : "bg-secondary"
      }`}
    >
      <div
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-transform duration-200 ${
          checked ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </div>
  </label>
);

export default LeftSidebar;
