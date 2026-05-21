/**
 * SarPanel
 * ────────
 * Displays the auto-generated Suspicious Activity Report (SAR)
 * from the predictive engine.
 *
 * Features:
 *   • Risk level badge
 *   • Summary, Red Flags, Reasoning, Recommended Actions
 *   • Confidence breakdown
 *   • Mock "Download" button
 */

export default function SarPanel({ sar }) {
  if (!sar) {
    return (
      <div className="card" style={{ padding: 18, marginBottom: 18 }}>
        <div className="section-title">📋 SAR Preview</div>
        <div className="empty-state">SAR will appear after prediction is triggered.</div>
      </div>
    );
  }

  const riskColor =
    sar.risk_level === "CRITICAL" ? "var(--danger)" :
    sar.risk_level === "HIGH"     ? "var(--warn)"   : "var(--accent)";

  return (
    <div className="card" style={{
      padding: 20, marginBottom: 18,
      borderColor: `${riskColor.replace("var(", "rgba(").replace(")", ", 0.3)")}`,
    }}>
      {/* Top glow line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${riskColor}, transparent)`,
      }} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: "0.68rem", fontFamily: "'Fira Code',monospace", color: "var(--muted)", marginBottom: 4 }}>
            SUSPICIOUS ACTIVITY REPORT — AUTO-GENERATED
          </div>
          <div style={{ fontFamily: "'Fira Code',monospace", fontSize: "0.82rem", color: "var(--text-dim)", marginBottom: 6 }}>
            {sar.sar_id} • {new Date(sar.generated_at).toLocaleString()}
          </div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 10px", borderRadius: 4,
            background: `${riskColor.replace("var(", "rgba(").replace(")", ", 0.1)")}`,
            border: `1px solid ${riskColor.replace("var(", "rgba(").replace(")", ", 0.3)")}`,
            color: riskColor, fontSize: "0.72rem", fontWeight: 700,
            fontFamily: "'Fira Code',monospace",
          }}>
            🚨 {sar.risk_level} RISK — {sar.confidence_pct}% CONFIDENCE
          </div>
        </div>
        <button
          className="ghost-button"
          style={{ fontSize: "0.78rem", fontFamily: "'Fira Code',monospace" }}
          onClick={() => {
            const blob = new Blob([JSON.stringify(sar, null, 2)], { type: "application/json" });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement("a");
            a.href     = url;
            a.download = `${sar.sar_id}.json`;
            a.click();
          }}
        >
          ⬇ Download SAR
        </button>
      </div>

      {/* Summary */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: "0.68rem", fontFamily: "'Fira Code',monospace", color: "var(--muted)", marginBottom: 6 }}>
          SUMMARY
        </div>
        <p style={{ fontSize: "0.84rem", color: "var(--text-dim)", lineHeight: 1.6 }}>
          {sar.summary}
        </p>
      </div>

      {/* Red Flags */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: "0.68rem", fontFamily: "'Fira Code',monospace", color: "var(--muted)", marginBottom: 6 }}>
          RED FLAGS DETECTED
        </div>
        <div style={{
          background: "rgba(255,59,59,0.04)", border: "1px solid rgba(255,59,59,0.15)",
          borderRadius: 8, padding: "10px 14px",
        }}>
          {sar.red_flags?.map((flag, i) => (
            <div key={i} style={{
              fontSize: "0.76rem", color: "var(--text-dim)",
              fontFamily: "'Fira Code',monospace", padding: "3px 0",
              borderBottom: i < sar.red_flags.length - 1 ? "1px solid rgba(255,59,59,0.08)" : "none",
            }}>
              🔴 {flag}
            </div>
          ))}
        </div>
      </div>

      {/* Reasoning */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: "0.68rem", fontFamily: "'Fira Code',monospace", color: "var(--muted)", marginBottom: 6 }}>
          REASONING
        </div>
        <p style={{ fontSize: "0.82rem", color: "var(--text-dim)", lineHeight: 1.6 }}>
          {sar.reasoning}
        </p>
      </div>

      {/* Recommended Actions */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: "0.68rem", fontFamily: "'Fira Code',monospace", color: "var(--muted)", marginBottom: 6 }}>
          RECOMMENDED ACTIONS
        </div>
        <div style={{
          background: "rgba(0,255,102,0.04)", border: "1px solid rgba(0,255,102,0.15)",
          borderRadius: 8, padding: "10px 14px",
        }}>
          <pre style={{
            fontSize: "0.76rem", color: "var(--accent)",
            fontFamily: "'Fira Code',monospace", whiteSpace: "pre-wrap", margin: 0,
          }}>
            {sar.recommended_actions}
          </pre>
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{
        fontSize: "0.68rem", color: "var(--muted)", fontFamily: "'Fira Code',monospace",
        padding: "8px 12px", background: "var(--panel-2)", borderRadius: 6,
        borderLeft: "2px solid var(--line-bright)",
      }}>
        ⚠ {sar.disclaimer}
      </div>
    </div>
  );
}
