import { useState, useEffect } from "react";
import { Hexagon, Users, Clock, MapPin, Download, AlertTriangle } from "lucide-react";
import { type Zone, type EvacCorridor } from "@/data/sampleData";

interface RightSidebarProps {
  hasResults: boolean;
  isAnalyzing: boolean;
  totalZones: number;
  populationExposed: number;
  criticalMinutes: number;
  zones: Zone[];
  corridors: EvacCorridor[];
  onLocateZone: (lat: number, lng: number) => void;
}

function getRankColor(rank: number) {
  if (rank <= 3) return "bg-destructive";
  if (rank <= 6) return "bg-accent";
  return "bg-success";
}

function getStatusBadge(status: string) {
  switch (status) {
    case "open": return { label: "OPEN", cls: "bg-success/20 text-success" };
    case "at_risk": return { label: "AT RISK", cls: "bg-accent/20 text-accent" };
    case "blocked": return { label: "BLOCKED", cls: "bg-destructive/20 text-destructive" };
    default: return { label: status, cls: "bg-muted text-muted-foreground" };
  }
}

const RightSidebar = ({
  hasResults, isAnalyzing, totalZones, populationExposed, criticalMinutes,
  zones, corridors, onLocateZone,
}: RightSidebarProps) => {
  const hours = Math.floor(criticalMinutes / 60);
  const mins = criticalMinutes % 60;

  return (
    <aside className="w-full lg:w-[320px] bg-card border-l border-border flex flex-col shrink-0 overflow-y-auto scrollbar-thin">
      <div className="p-4 space-y-4">
        <h2 className="font-heading font-semibold text-base text-foreground">Vulnerability Analysis</h2>

        {!hasResults && !isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <Hexagon className="w-16 h-16 text-primary opacity-60" />
            <p className="text-sm text-foreground">Configure a disaster scenario and run analysis to see vulnerability mapping</p>
            <p className="text-xs text-muted-foreground">Model pre-loaded · Offline ready</p>
          </div>
        )}

        {isAnalyzing && !hasResults && (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 rounded-lg bg-secondary animate-pulse" />
            ))}
          </div>
        )}

        {hasResults && (
          <>
            {/* Metric cards */}
            <div className="grid grid-cols-3 gap-2">
              <MetricCard label="Zones at Risk" value={totalZones.toString()} color="text-destructive" />
              <MetricCard label="Pop. Exposed" value={populationExposed.toLocaleString()} color="text-accent" />
              <MetricCard label="Critical Window" value={`${hours}h ${mins}m`} color="text-destructive" />
            </div>

            {/* Zone list */}
            <div>
              <p className="text-[10px] font-semibold tracking-[0.15em] text-muted-foreground uppercase mb-2">
                Top Vulnerable Zones
              </p>
              <div className="space-y-2">
                {zones.map((z, i) => (
                  <div
                    key={z.rank}
                    className="bg-secondary rounded-lg p-3 border border-border hover:border-primary/40 transition-all duration-200 animate-fade-in"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className={`w-6 h-6 rounded-full ${getRankColor(z.rank)} flex items-center justify-center text-[10px] font-bold text-foreground shrink-0`}>
                        {z.rank}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{z.name}</p>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />{z.population.toLocaleString()}</span>
                          <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{z.isolation_minutes}m</span>
                        </div>
                        <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-destructive transition-all duration-500"
                            style={{ width: `${z.risk_score}%` }}
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => onLocateZone(z.lat, z.lng)}
                        className="text-[9px] text-primary hover:text-primary/80 flex items-center gap-0.5 shrink-0 mt-1"
                      >
                        <MapPin className="w-3 h-3" />
                        Locate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Evacuation corridors */}
            <div>
              <p className="text-[10px] font-semibold tracking-[0.15em] text-muted-foreground uppercase mb-2">
                Evacuation Corridors
              </p>
              <div className="space-y-2">
                {corridors.map((c) => {
                  const badge = getStatusBadge(c.status);
                  return (
                    <div key={c.name} className="bg-secondary rounded-lg p-3 border border-border flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-foreground">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground">Capacity: {c.capacity}</p>
                      </div>
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Export */}
            <button className="w-full py-2.5 rounded-lg border border-primary text-primary text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/10 transition-all duration-200">
              <Download className="w-4 h-4" />
              EXPORT REPORT
            </button>
            <p className="text-center text-[9px] text-muted-foreground -mt-2">OFFLINE PDF</p>
          </>
        )}
      </div>
    </aside>
  );
};

const MetricCard = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div className="bg-secondary rounded-lg p-2.5 text-center border border-border">
    <p className={`text-lg font-heading font-bold ${color}`}>{value}</p>
    <p className="text-[9px] text-muted-foreground mt-0.5">{label}</p>
  </div>
);

export default RightSidebar;
