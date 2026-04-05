import { Hexagon, Play } from "lucide-react";
import { useState, useEffect } from "react";

interface NavbarProps {
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
}

const Navbar = ({ onRunAnalysis, isAnalyzing }: NavbarProps) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const statusPills = [
    { label: "MODEL READY", color: "bg-success" },
    { label: "DATA LOADED", color: "bg-primary" },
    { label: "OFFLINE MODE", color: "bg-accent" },
  ];

  return (
    <nav className="h-14 bg-card border-b border-border flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-2">
        <Hexagon className="w-5 h-5 text-primary" />
        <span className="font-heading font-bold text-lg text-primary tracking-wide">
          DEADZONE AI
        </span>
      </div>

      <div className="hidden md:flex items-center gap-3">
        {statusPills.map((pill) => (
          <div
            key={pill.label}
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-xs font-medium"
          >
            <span className={`w-2 h-2 rounded-full ${pill.color} animate-pulse-dot`} />
            <span className="text-foreground">{pill.label}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <span className="hidden sm:block text-xs text-muted-foreground font-mono">
          {time.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}
          {" · "}
          {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
        <button
          onClick={onRunAnalysis}
          disabled={isAnalyzing}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold transition-all duration-200 hover:brightness-110 disabled:opacity-60 ${
            isAnalyzing ? "animate-pulse-ring" : ""
          }`}
        >
          <Play className="w-3 h-3" />
          {isAnalyzing ? "Analyzing..." : "Run Analysis"}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
