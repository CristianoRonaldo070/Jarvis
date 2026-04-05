const HUDLoader = ({ text = "AUTHENTICATING..." }: { text?: string }) => (
  <div className="fixed inset-0 bg-background/95 flex flex-col items-center justify-center z-50">
    {/* Scanning effect */}
    <div className="relative w-64 h-64">
      <div className="absolute inset-0 border border-primary/30 rounded-lg" />
      <div className="absolute inset-0 overflow-hidden rounded-lg">
        <div className="absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line" />
      </div>
      {/* Corner brackets */}
      {["top-0 left-0 border-t border-l", "top-0 right-0 border-t border-r", "bottom-0 left-0 border-b border-l", "bottom-0 right-0 border-b border-r"].map((cls, i) => (
        <div key={i} className={`absolute w-6 h-6 border-primary/60 ${cls}`} />
      ))}
      {/* Center dot */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-4 h-4 rounded-full bg-primary/30 animate-glow-pulse" />
      </div>
    </div>
    <p className="mt-8 font-orbitron text-sm tracking-[0.3em] text-primary/70 animate-text-glow">
      {text}
    </p>
  </div>
);

export default HUDLoader;
