import RiskRing from "./RiskRing";

export default function StatCard({ label, value, tone }) {
  const isRisk = typeof value === "string" && value.includes("/100");
  const score  = isRisk ? parseInt(value) : null;

  return (
    <div className={`stat-card${tone ? ` ${tone}` : ""}`}>
      <div className="stat-card-top">
        <span>{label}</span>
        <div className={`stat-dot${tone ? ` ${tone}` : ""}`} />
      </div>

      {isRisk ? (
        <RiskRing score={score} size={90} />
      ) : (
        <strong>{value}</strong>
      )}

      <p className="stat-footnote">
        {tone === "danger" ? "⚠ Requires review" :
         tone === "warn"   ? "↑ Up from last 24h" :
         tone === "success"? "✓ Monitored" :
         "Updated live"}
      </p>
    </div>
  );
}
