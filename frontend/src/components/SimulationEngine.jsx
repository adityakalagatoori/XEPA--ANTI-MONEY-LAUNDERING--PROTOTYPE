/**
 * SimulationEngine
 * ─────────────────
 * Runs two demo simulations step-by-step:
 *   Case 1: Layering   — A→B (2s)→ B→C (2s)→ C→D
 *   Case 2: Structuring — A→B1, A→B2, A→B3 (fan-out)
 *
 * After step 2 it:
 *   1. Calls pattern-match API
 *   2. Returns ghost nodes for graph overlay
 *   3. Generates SAR draft
 *
 * Props:
 *   token           — auth token
 *   onPrediction    — fn(result) called with match result + SAR
 *   onStepChange    — fn({ nodes, edges, step }) live graph update
 */

import { useRef, useState } from "react";
import { api } from "../api/client";

// ── Simulation Scenarios ────────────────────────────────────────────────────
const SCENARIOS = {
  layering: {
    name: "Layering Chain (A→B→C→D)",
    type: "layering",
    steps: [
      { nodes: ["A"],       edges: [],              label: "A — Initial deposit detected" },
      { nodes: ["A","B"],   edges: [["A","B"]],     label: "A→B transfer ($94,000 wire)" },
      { nodes: ["A","B","C"], edges: [["A","B"],["B","C"]], label: "B→C cross-border move ($47,000)" },
      { nodes: ["A","B","C","D"], edges: [["A","B"],["B","C"],["C","D"]], label: "C→D final hop (crypto off-ramp)" },
    ],
    timeGaps: [1.5, 2.0, 1.8],
    amounts:  [94000, 47000, 47000, 94000],
  },
  structuring: {
    name: "Structuring Fan-out (A→B1,B2,B3)",
    type: "structuring",
    steps: [
      { nodes: ["A"],                   edges: [],                              label: "A — Source account active" },
      { nodes: ["A","B1"],              edges: [["A","B1"]],                   label: "A→B1 ($9,800 cash deposit)" },
      { nodes: ["A","B1","B2"],         edges: [["A","B1"],["A","B2"]],        label: "A→B2 ($9,900 — structuring!)" },
      { nodes: ["A","B1","B2","B3"],    edges: [["A","B1"],["A","B2"],["A","B3"]], label: "A→B3 ($9,700 — confirmed pattern)" },
    ],
    timeGaps: [0.1, 0.1, 0.1],
    amounts:  [9800, 9900, 9700],
  },
};

export default function SimulationEngine({ token, onPrediction, onStepChange }) {
  const [scenario, setScenario]   = useState("layering");
  const [step, setStep]           = useState(0);
  const [running, setRunning]     = useState(false);
  const [log, setLog]             = useState([]);
  const [predicted, setPredicted] = useState(false);
  const timers                    = useRef([]);

  const scene = SCENARIOS[scenario];

  function addLog(msg, type = "info") {
    setLog((prev) => [...prev, { msg, type, ts: new Date().toLocaleTimeString() }]);
  }

  function reset() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setStep(0);
    setRunning(false);
    setPredicted(false);
    setLog([]);
    onStepChange && onStepChange({ nodes: [], edges: [], step: 0, ghostNodes: [], ghostEdges: [] });
    onPrediction && onPrediction(null);
  }

  async function runPrediction(currentStep) {
    const nodes  = scene.steps[currentStep].nodes;
    const edges  = scene.steps[currentStep].edges;
    const gaps   = scene.timeGaps.slice(0, currentStep);
    const amounts= scene.amounts.slice(0, currentStep + 1);

    addLog("🔍 Running pattern match engine…", "info");

    try {
      const matchResult = await api.matchPatterns({ nodes, edges, time_gaps: gaps, amounts }, token);

      if (matchResult.matched) {
        addLog(`✅ Match: ${matchResult.label} (${Math.round(matchResult.confidence * 100)}% confidence)`, "success");
        addLog(`🔮 Predicted next nodes: ${matchResult.next_predicted_nodes.join(", ")}`, "predict");
        addLog(`⏱ Est. next hop: ${matchResult.estimated_next_hours?.min}–${matchResult.estimated_next_hours?.max}h`, "predict");

        if (matchResult.intervention?.triggered) {
          addLog("🚨 PRE-CRIME ALERT: Intervention recommended!", "danger");
        }

        // Generate SAR
        addLog("📄 Generating SAR draft…", "info");
        const sar = await api.generateSar({
          case_id:         "DEMO-SIM-001",
          accounts:        nodes.map((n) => ({ account_number: n, id: n })),
          matched_pattern: matchResult.matched_pattern,
          confidence:      matchResult.confidence,
          predicted_nodes: matchResult.next_predicted_nodes,
          breakdown:       matchResult.breakdown,
          description:     matchResult.description,
          intervention:    matchResult.intervention,
        }, token);

        addLog(`📋 SAR generated: ${sar.sar_id}`, "success");
        setPredicted(true);
        onPrediction && onPrediction({ match: matchResult, sar });

        // Push ghost nodes to graph
        onStepChange && onStepChange({
          nodes,
          edges,
          step:       currentStep,
          ghostNodes: matchResult.next_predicted_nodes,
          ghostEdges: matchResult.next_edges || [],
          multiPaths: matchResult.multi_paths || [],
          timeEst:    matchResult.estimated_next_hours,
          matchResult,
        });
      } else {
        addLog(`ℹ No pattern match yet — ${matchResult.reason}`, "warn");
        onStepChange && onStepChange({ nodes, edges, step: currentStep, ghostNodes: [], ghostEdges: [] });
      }
    } catch (err) {
      addLog(`❌ Prediction error: ${err.message}`, "danger");
    }
  }

  function startSimulation() {
    reset();
    setRunning(true);
    addLog(`▶ Starting simulation: ${scene.name}`, "info");

    scene.steps.forEach((s, idx) => {
      const delay = idx * 2200;
      const id = setTimeout(async () => {
        setStep(idx);
        addLog(`⬡ Step ${idx + 1}: ${s.label}`, "step");

        // After step 2 (index 1), trigger prediction
        if (idx >= 1 && !predicted) {
          await runPrediction(idx);
        } else {
          onStepChange && onStepChange({
            nodes:      s.nodes,
            edges:      s.edges,
            step:       idx,
            ghostNodes: [],
            ghostEdges: [],
          });
        }

        if (idx === scene.steps.length - 1) setRunning(false);
      }, delay);
      timers.current.push(id);
    });
  }

  return (
    <div className="card" style={{ padding: 18, marginBottom: 18 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div className="section-title">🎬 Simulation Engine — Demo Mode</div>
          <p className="muted" style={{ fontSize: "0.78rem" }}>
            Watch the AML pattern unfold in real-time and see predictions appear.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {!running && (
            <select
              value={scenario}
              onChange={(e) => { setScenario(e.target.value); reset(); }}
              style={{
                background: "var(--panel-2)", border: "1px solid var(--line-bright)",
                borderRadius: 6, color: "var(--text-dim)", padding: "8px 12px",
                fontFamily: "'Fira Code',monospace", fontSize: "0.8rem",
              }}
            >
              <option value="layering">Layering (A→B→C→D)</option>
              <option value="structuring">Structuring Fan-out</option>
            </select>
          )}
          <button
            className={running ? "ghost-button" : "primary-button"}
            onClick={running ? reset : startSimulation}
            style={{ fontFamily: "'Fira Code',monospace", fontSize: "0.82rem" }}
          >
            {running ? "⏹ Stop" : "▶ Start Simulation"}
          </button>
        </div>
      </div>

      {/* Progress Steps */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, overflowX: "auto" }}>
        {scene.steps.map((s, idx) => (
          <div key={idx} style={{
            flex: 1, minWidth: 120,
            padding: "8px 10px",
            borderRadius: 8,
            border: `1px solid ${idx <= step && running || idx < step ? "rgba(0,255,102,0.3)" : "var(--line)"}`,
            background: idx < step ? "rgba(0,255,102,0.06)" :
                         idx === step && running ? "rgba(0,255,102,0.12)" : "var(--panel-2)",
            transition: "all 0.4s",
          }}>
            <div style={{
              fontSize: "0.65rem", fontFamily: "'Fira Code',monospace",
              color: idx <= step ? "var(--accent)" : "var(--muted)",
              marginBottom: 4,
            }}>
              STEP {idx + 1} {idx < step ? "✓" : idx === step && running ? "⟳" : ""}
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", lineHeight: 1.3 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Simulation Log */}
      <div style={{
        background: "rgba(0,0,0,0.4)", border: "1px solid var(--line)",
        borderRadius: 8, padding: "10px 12px",
        fontFamily: "'Fira Code',monospace", fontSize: "0.72rem",
        maxHeight: 160, overflowY: "auto",
      }}>
        {log.length === 0 && (
          <div style={{ color: "var(--muted)", padding: 4 }}>
            Press "Start Simulation" to begin demo…
          </div>
        )}
        {log.map((entry, i) => (
          <div key={i} style={{
            display: "flex", gap: 12, padding: "2px 0",
            color: entry.type === "success" ? "var(--accent)"  :
                   entry.type === "predict" ? "#A78BFA"        :
                   entry.type === "danger"  ? "var(--danger)"  :
                   entry.type === "warn"    ? "var(--warn)"    :
                   entry.type === "step"    ? "var(--text)"    : "var(--muted)",
          }}>
            <span style={{ flexShrink: 0, color: "var(--muted)" }}>{entry.ts}</span>
            <span>{entry.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
