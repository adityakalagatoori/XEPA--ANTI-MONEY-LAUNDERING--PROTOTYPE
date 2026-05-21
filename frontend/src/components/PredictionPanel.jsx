/**
 * PredictionPanel
 * ───────────────
 * Displays the result of the pattern matching engine:
 *   • Matched pattern name & confidence
 *   • Confidence breakdown (structure / time / transaction)
 *   • Predicted next nodes
 *   • Time estimate
 *   • Multi-path alternatives
 *   • Pre-crime intervention alert
 *   • "AI vs Analyst" conflict warning
 */

export default function PredictionPanel({ prediction, analystIgnored = false }) {
  if (!prediction) {
    return (
      <div className="card" style={{ padding: 18, marginBottom: 18 }}>
        <div className="section-title">🔮 Predicted Activity</div>
        <div className="empty-state">
          Run a simulation or open a case with 2+ transactions to see predictions.
        </div>
      </div>
    );
  }

  const { match } = prediction;
  const confPct   = Math.round(match.confidence * 100);
  const bd        = match.breakdown || {};

  return (
    <div className="card" style={{ padding: 18, marginBottom: 18, borderColor: "rgba(167,139,250,0.3)" }}>
      {/* Header */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: "linear-gradient(90deg, #A78BFA, rgba(167,139,250,0.2))",
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{
            fontSize: "0.72rem", fontFamily: "'Fira Code',monospace",
            color: "#A78BFA", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6,
          }}>
            🔮 Predicted Activity
          </div>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)" }}>
            {match.label}
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 4 }}>
            Pattern: <code style={{ color: "#A78BFA" }}>{match.matched_pattern}</code>
          </div>
        </div>

        {/* Confidence ring */}
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: `conic-gradient(#A78BFA ${confPct * 3.6}deg, var(--panel-2) 0deg)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "var(--panel)", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: "1rem", fontWeight: 800, color: "#A78BFA" }}>{confPct}%</span>
            </div>
          </div>
          <div style={{ fontSize: "0.6rem", color: "var(--muted)", fontFamily: "'Fira Code',monospace", marginTop: 4 }}>
            CONFIDENCE
          </div>
        </div>
      </div>

      {/* Confidence Breakdown */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: "0.68rem", fontFamily: "'Fira Code',monospace", color: "var(--muted)", marginBottom: 8 }}>
          CONFIDENCE BREAKDOWN
        </div>
        {[
          { label: "Structure",   value: bd.structure,   icon: "🕸" },
          { label: "Time",        value: bd.time,        icon: "⏱" },
          { label: "Transaction", value: bd.transaction, icon: "💰" },
        ].map(({ label, value, icon }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: "0.72rem", color: "var(--text-dim)", width: 80, fontFamily: "'Fira Code',monospace" }}>
              {icon} {label}
            </span>
            <div style={{ flex: 1, height: 4, background: "var(--panel-2)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 2,
                width: `${Math.round((value || 0) * 100)}%`,
                background: (value || 0) >= 0.75 ? "#A78BFA" : (value || 0) >= 0.5 ? "var(--warn)" : "var(--muted)",
                transition: "width 0.8s ease",
              }} />
            </div>
            <span style={{ fontSize: "0.7rem", fontFamily: "'Fira Code',monospace", color: "#A78BFA", width: 36, textAlign: "right" }}>
              {Math.round((value || 0) * 100)}%
            </span>
          </div>
        ))}
      </div>

      {/* Predicted Nodes */}
      {match.next_predicted_nodes?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: "0.68rem", fontFamily: "'Fira Code',monospace", color: "var(--muted)", marginBottom: 8 }}>
            PREDICTED NEXT NODES (ghost)
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {match.next_predicted_nodes.map((node) => (
              <div key={node} style={{
                padding: "5px 12px", borderRadius: 6,
                border: "1px dashed rgba(167,139,250,0.5)",
                background: "rgba(167,139,250,0.06)",
                color: "#A78BFA",
                fontSize: "0.78rem", fontFamily: "'Fira Code',monospace",
              }}>
                ◌ {node}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time Estimate */}
      {match.estimated_next_hours && (
        <div style={{
          padding: "10px 14px", borderRadius: 8,
          background: "rgba(167,139,250,0.06)",
          border: "1px solid rgba(167,139,250,0.15)",
          marginBottom: 14, fontFamily: "'Fira Code',monospace",
        }}>
          <span style={{ fontSize: "0.68rem", color: "var(--muted)" }}>⏱ NEXT ACCOUNT LIKELY IN </span>
          <span style={{ color: "#A78BFA", fontWeight: 700 }}>
            {match.estimated_next_hours.min}–{match.estimated_next_hours.max} hours
          </span>
        </div>
      )}

      {/* Multi-Path Alternatives */}
      {match.multi_paths?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: "0.68rem", fontFamily: "'Fira Code',monospace", color: "var(--muted)", marginBottom: 8 }}>
            ALTERNATIVE PATHS
          </div>
          {match.multi_paths.map((path, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "6px 10px", marginBottom: 4, borderRadius: 6,
              border: "1px solid var(--line)", background: "var(--panel-2)",
              opacity: 0.5 + path.probability * 0.5,
            }}>
              <span style={{ fontSize: "0.72rem", color: "var(--text-dim)", fontFamily: "'Fira Code',monospace" }}>
                {path.label} — {path.next_predicted_nodes?.join("→")}
              </span>
              <span style={{ fontSize: "0.72rem", color: "var(--warn)", fontFamily: "'Fira Code',monospace" }}>
                {Math.round(path.probability * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Pre-Crime Intervention */}
      {match.intervention?.triggered && (
        <div style={{
          padding: "12px 14px", borderRadius: 8,
          background: "rgba(255,59,59,0.06)",
          border: "1px solid rgba(255,59,59,0.3)",
          marginBottom: 14,
        }}>
          <div style={{ fontSize: "0.72rem", color: "var(--danger)", fontFamily: "'Fira Code',monospace", fontWeight: 700, marginBottom: 8 }}>
            🚨 PRE-CRIME INTERVENTION TRIGGERED
          </div>
          {match.intervention.actions.map((action, i) => (
            <div key={i} style={{ fontSize: "0.76rem", color: "var(--text-dim)", padding: "2px 0" }}>
              • {action}
            </div>
          ))}
        </div>
      )}

      {/* AI vs Analyst Conflict */}
      {analystIgnored && (
        <div style={{
          padding: "10px 14px", borderRadius: 8,
          background: "rgba(255,170,0,0.08)",
          border: "1px solid rgba(255,170,0,0.3)",
        }}>
          <div style={{ fontSize: "0.72rem", color: "var(--warn)", fontFamily: "'Fira Code',monospace", fontWeight: 700 }}>
            ⚠ PREDICTION IGNORED — RISK ESCALATING
          </div>
          <div style={{ fontSize: "0.76rem", color: "var(--text-dim)", marginTop: 4 }}>
            The AI flagged this pattern but no analyst action was taken. Risk score is increasing automatically.
          </div>
        </div>
      )}
    </div>
  );
}
