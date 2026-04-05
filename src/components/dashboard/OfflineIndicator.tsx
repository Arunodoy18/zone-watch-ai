const OfflineIndicator = () => (
  <div className="fixed bottom-4 left-4 z-50 bg-card border border-border rounded-lg p-3 space-y-1 shadow-lg">
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-success animate-pulse-dot" />
      <span className="text-[11px] font-medium text-foreground">Model Active</span>
    </div>
    <p className="text-[9px] text-muted-foreground">No internet required</p>
    <p className="text-[9px] text-muted-foreground">Last sync: Pre-loaded</p>
  </div>
);

export default OfflineIndicator;
