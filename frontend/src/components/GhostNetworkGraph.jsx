/**
 * GhostNetworkGraph
 * ─────────────────
 * Extends the Spider Map with:
 *   • Ghost (predicted) nodes — dashed border, purple tint, "Predicted (X%)"
 *   • Multiple ghost branches with opacity based on probability
 *   • Drag deadzone (6px threshold) — no accidental panning
 *   • Reduced pan sensitivity (factor 0.85)
 *   • Event.stopPropagation on all node interactions
 */

import { useEffect, useRef, useState } from "react";

const GW  = 720;  // graph width
const GH  = 460;  // graph height
const PAN_FACTOR     = 0.85;
const DRAG_THRESHOLD = 6;   // px deadzone

function riskColor(score) {
  if (score >= 80) return "#FF3B3B";
  if (score >= 50) return "#FFAA00";
  return "#00FF66";
}

function initialPos(accounts) {
  return accounts.reduce((acc, a, i) => {
    const angle = (Math.PI * 2 * i) / Math.max(accounts.length, 1);
    acc[a.id] = { x: GW / 2 + Math.cos(angle) * 150, y: GH / 2 + Math.sin(angle) * 108 };
    return acc;
  }, {});
}

export default function GhostNetworkGraph({
  accounts, transactions, selectedAccountId, onSelect, filters,
  // Prediction overlay
  ghostNodes = [],    // string[] — predicted node labels
  ghostEdges = [],    // [from, to][] — predicted edges
  multiPaths = [],    // [{label, probability, next_predicted_nodes, next_edges}]
  confidence = 0,     // 0–1 for display
}) {
  const [pos, setPos]           = useState(() => initialPos(accounts));
  const [hovered, setHovered]   = useState(null);
  const [dragging, setDragging] = useState(null);
  const [vb, setVb]             = useState({ x: 0, y: 0, w: GW, h: GH });
  const panOrigin   = useRef(null);
  const downPt      = useRef(null);
  const didPan      = useRef(false);

  // Ghost node virtual positions (laid out in a ring beyond real nodes)
  const [ghostPos, setGhostPos] = useState({});

  useEffect(() => {
    setPos((cur) => ({ ...initialPos(accounts), ...cur }));
  }, [accounts]);

  // Place ghost nodes in a prediction zone to the right of the graph
  useEffect(() => {
    const gp = {};
    ghostNodes.forEach((label, i) => {
      gp[label] = {
        x: GW * 0.75 + 60,
        y: GH * 0.2 + i * 90,
      };
    });
    // Add multi-path ghost nodes
    multiPaths.forEach((path, pi) => {
      (path.next_predicted_nodes || []).forEach((n, ni) => {
        if (!gp[n]) {
          gp[n] = { x: GW * 0.85 + 70, y: GH * 0.5 + pi * 80 + ni * 45 };
        }
      });
    });
    setGhostPos(gp);
  }, [ghostNodes, multiPaths]);

  const visAccounts = accounts.filter((a) => {
    const ip  = !filters?.ip      || a.ip_address.toLowerCase().includes(filters.ip.toLowerCase());
    const em  = !filters?.email   || a.email.toLowerCase().includes(filters.email.toLowerCase());
    const co  = !filters?.country || a.country.toLowerCase().includes(filters.country.toLowerCase());
    return ip && em && co;
  });
  const visIds = new Set(visAccounts.map((a) => a.id));
  const visTx  = transactions.filter((t) => visIds.has(t.from_account) && visIds.has(t.to_account));

  // ── Graph point conversion ─────────────────────────────────────────────────
  function gpt(e) {
    const svg  = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    return {
      x: vb.x + (e.clientX - rect.left) * (vb.w / rect.width),
      y: vb.y + (e.clientY - rect.top)  * (vb.h / rect.height),
    };
  }

  function resetView() {
    setVb({ x: 0, y: 0, w: GW, h: GH });
    setPos(initialPos(accounts));
  }

  // ── Pointer handlers ───────────────────────────────────────────────────────
  function onBgDown(e) {
    if (e.target.tagName !== "svg") return;
    const p = gpt(e);
    downPt.current  = { x: e.clientX, y: e.clientY };
    panOrigin.current = { sx: vb.x, sy: vb.y, px: p.x, py: p.y };
    didPan.current  = false;
  }

  function onMove(e) {
    const p = gpt(e);
    if (dragging) {
      setPos((c) => ({ ...c, [dragging]: { x: p.x, y: p.y } }));
      return;
    }
    if (panOrigin.current && downPt.current) {
      const dx   = e.clientX - downPt.current.x;
      const dy   = e.clientY - downPt.current.y;
      if (!didPan.current && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      didPan.current = true;
      setVb((c) => ({
        ...c,
        x: panOrigin.current.sx - (p.x - panOrigin.current.px) * PAN_FACTOR,
        y: panOrigin.current.sy - (p.y - panOrigin.current.py) * PAN_FACTOR,
      }));
    }
  }

  function onUp() {
    setDragging(null);
    panOrigin.current = null;
    downPt.current    = null;
  }

  return (
    <div className="graph-card">
      <div className="graph-header">
        <div>
          <div className="section-title">🕸 Spider Map — Money Flow + Prediction Overlay</div>
          <p className="muted">
            Real nodes (solid) + predicted ghost nodes (
            <span style={{ color: "#A78BFA", fontFamily: "'Fira Code',monospace" }}>dashed purple</span>
            ) from pattern engine.
          </p>
        </div>
        <button className="small-button" onClick={resetView}>Reset Map</button>
      </div>

      <svg
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        className="graph-canvas"
        role="img"
        aria-label="Ghost network prediction graph"
        onWheel={(e) => {
          e.preventDefault();
          const f = e.deltaY > 0 ? 1.08 : 0.92;
          setVb((c) => ({
            x: c.x + (GW - c.w * f) / 2,
            y: c.y + (GH - c.h * f) / 2,
            w: Math.min(GW, Math.max(280, c.w * f)),
            h: Math.min(GH, Math.max(180, c.h * f)),
          }));
        }}
        onPointerDown={onBgDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
      >
        <defs>
          <radialGradient id="hubG" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#00FF66" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#00C94F" stopOpacity="0.2" />
          </radialGradient>
          <filter id="gGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="ghostGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <marker id="arrow"      markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
            <path d="M0,0 L0,6 L9,3 z" fill="rgba(0,255,102,0.5)" />
          </marker>
          <marker id="ghostArrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
            <path d="M0,0 L0,6 L9,3 z" fill="rgba(167,139,250,0.6)" />
          </marker>
        </defs>

        {/* Orbit rings */}
        <circle cx={GW/2} cy={GH/2} r="155" className="orbit-ring" />
        <circle cx={GW/2} cy={GH/2} r="92"  className="orbit-ring faint" />

        {/* Hub */}
        <circle cx={GW/2} cy={GH/2} r="32" fill="url(#hubG)" className="hub-node" filter="url(#gGlow)" />
        <text x={GW/2} y={GH/2+5} textAnchor="middle" className="hub-label">XEPA</text>

        {/* ── Real transaction edges ──────────────────────────────────────── */}
        {visTx.map((tx) => {
          const f = pos[tx.from_account], t = pos[tx.to_account];
          const em = selectedAccountId === tx.from_account || selectedAccountId === tx.to_account
                  || hovered === tx.from_account || hovered === tx.to_account;
          if (!f || !t) return null;
          return (
            <g key={tx.id}>
              <line x1={f.x} y1={f.y} x2={t.x} y2={t.y}
                stroke={em ? "rgba(0,255,102,0.8)" : "rgba(0,255,102,0.2)"}
                strokeWidth={Math.max(1.5, tx.amount / 40000)}
                markerEnd="url(#arrow)" />
              <text x={(f.x+t.x)/2} y={(f.y+t.y)/2-8} className="edge-label">
                ${Math.round(tx.amount/1000)}k
              </text>
            </g>
          );
        })}

        {/* ── Ghost edges (predicted) ─────────────────────────────────────── */}
        {ghostEdges.map(([from, to], i) => {
          const f = ghostPos[from] || pos[from];
          const t = ghostPos[to]   || pos[to];
          if (!f || !t) return null;
          return (
            <g key={`ge-${i}`}>
              <line x1={f.x} y1={f.y} x2={t.x} y2={t.y}
                stroke="rgba(167,139,250,0.45)" strokeWidth="2"
                strokeDasharray="8 5"
                markerEnd="url(#ghostArrow)" />
            </g>
          );
        })}

        {/* ── Multi-path ghost edges ──────────────────────────────────────── */}
        {multiPaths.flatMap((path, pi) =>
          (path.next_edges || []).map(([from, to], ei) => {
            const f = ghostPos[from] || pos[from];
            const t = ghostPos[to]   || pos[to];
            if (!f || !t) return null;
            return (
              <line key={`mp-${pi}-${ei}`} x1={f.x} y1={f.y} x2={t.x} y2={t.y}
                stroke={`rgba(167,139,250,${Math.max(0.15, path.probability * 0.4)})`}
                strokeWidth="1.5" strokeDasharray="5 7"
                markerEnd="url(#ghostArrow)" />
            );
          })
        )}

        {/* ── Real account nodes ─────────────────────────────────────────── */}
        {visAccounts.map((account) => {
          const p   = pos[account.id];
          const sel = account.id === selectedAccountId;
          const hov = account.id === hovered;
          if (!p) return null;
          return (
            <g key={account.id}
              onClick={(e) => { e.stopPropagation(); if (!didPan.current) onSelect(account.id); }}
              onPointerDown={(e) => { e.stopPropagation(); setDragging(account.id); didPan.current = false; }}
              onPointerEnter={() => setHovered(account.id)}
              onPointerLeave={() => setHovered(null)}
              className="graph-node"
            >
              <circle cx={p.x} cy={p.y} r={sel ? 46 : hov ? 40 : 36} className="node-halo"
                style={sel ? { fill: "rgba(0,255,102,0.12)" } : {}} />
              <circle cx={p.x} cy={p.y} r={sel ? 32 : 26}
                fill={riskColor(account.risk_score)}
                stroke={sel ? "#00FF66" : "rgba(255,255,255,0.12)"}
                strokeWidth={sel ? 3 : 1.5}
                filter={sel ? "url(#gGlow)" : undefined} />
              <text x={p.x} y={p.y+4} textAnchor="middle" className="node-label">
                {account.account_number.slice(-4)}
              </text>
              <text x={p.x} y={p.y+50} textAnchor="middle" className="node-meta-label">
                {account.holder_name}
              </text>
              {account.risk_score >= 80 && (
                <circle cx={p.x+18} cy={p.y-18} r="8"
                  fill="var(--danger)" stroke="var(--panel)" strokeWidth="2" />
              )}
            </g>
          );
        })}

        {/* ── Ghost (predicted) nodes ─────────────────────────────────────── */}
        {ghostNodes.map((label) => {
          const p = ghostPos[label];
          if (!p) return null;
          return (
            <g key={`ghost-${label}`}>
              {/* Pulsing halo */}
              <circle cx={p.x} cy={p.y} r="38"
                fill="rgba(167,139,250,0.06)"
                stroke="rgba(167,139,250,0.2)"
                strokeWidth="1" />
              {/* Main ghost circle — dashed border */}
              <circle cx={p.x} cy={p.y} r="26"
                fill="rgba(167,139,250,0.12)"
                stroke="rgba(167,139,250,0.7)"
                strokeWidth="2"
                strokeDasharray="6 4"
                filter="url(#ghostGlow)" />
              {/* Label */}
              <text x={p.x} y={p.y+4} textAnchor="middle"
                fill="rgba(167,139,250,0.9)" fontSize="10" fontWeight="700"
                fontFamily="'Fira Code',monospace">
                {label}
              </text>
              <text x={p.x} y={p.y+46} textAnchor="middle"
                fill="rgba(167,139,250,0.6)" fontSize="9"
                fontFamily="'Fira Code',monospace">
                Predicted ({Math.round(confidence * 100)}%)
              </text>
            </g>
          );
        })}

        {/* ── Multi-path ghost nodes (lower opacity) ──────────────────────── */}
        {multiPaths.flatMap((path) =>
          (path.next_predicted_nodes || []).filter((n) => !ghostNodes.includes(n)).map((n) => {
            const p = ghostPos[n];
            if (!p) return null;
            return (
              <g key={`mp-ghost-${n}`} style={{ opacity: path.probability }}>
                <circle cx={p.x} cy={p.y} r="20"
                  fill="rgba(167,139,250,0.06)"
                  stroke="rgba(167,139,250,0.4)"
                  strokeWidth="1.5" strokeDasharray="4 4" />
                <text x={p.x} y={p.y+4} textAnchor="middle"
                  fill="rgba(167,139,250,0.7)" fontSize="9"
                  fontFamily="'Fira Code',monospace">
                  {n}
                </text>
                <text x={p.x} y={p.y+38} textAnchor="middle"
                  fill="rgba(167,139,250,0.5)" fontSize="8"
                  fontFamily="'Fira Code',monospace">
                  {Math.round(path.probability * 100)}% path
                </text>
              </g>
            );
          })
        )}

        {/* Prediction confidence label in corner */}
        {ghostNodes.length > 0 && (
          <text x={vb.x + 10} y={vb.y + 20}
            fill="rgba(167,139,250,0.7)" fontSize="10"
            fontFamily="'Fira Code',monospace">
            🔮 PREDICTION ACTIVE — {Math.round(confidence * 100)}% CONFIDENCE
          </text>
        )}
      </svg>
    </div>
  );
}
