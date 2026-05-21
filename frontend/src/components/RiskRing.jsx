// Risk Score Ring — circular SVG indicator
export default function RiskRing({ score = 0, size = 100 }) {
  const radius      = 38;
  const circ        = 2 * Math.PI * radius;
  const dash        = (score / 100) * circ;
  const color       = score >= 80 ? "var(--danger)" : score >= 50 ? "var(--warn)" : "var(--accent)";
  const glowColor   = score >= 80 ? "rgba(255,59,59,0.4)" : score >= 50 ? "rgba(255,170,0,0.4)" : "rgba(0,255,102,0.4)";

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--line)" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ filter: `drop-shadow(0 0 6px ${glowColor})`, transition: "stroke-dasharray 1s ease" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: "1.4rem", fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: "0.55rem", fontFamily: "'Fira Code',monospace", color: "var(--muted)", marginTop: 2 }}>RISK</span>
      </div>
    </div>
  );
}
