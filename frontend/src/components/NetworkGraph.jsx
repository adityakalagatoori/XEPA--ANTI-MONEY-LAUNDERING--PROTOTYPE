// Spider Map — with drag deadzone threshold + reduced pan sensitivity
import { useEffect, useRef, useState } from "react";

const GRAPH_WIDTH  = 720;
const GRAPH_HEIGHT = 460;
const DRAG_THRESHOLD = 6; // px — below this is a click, not a drag
const PAN_FACTOR     = 0.85; // < 1 = slower, heavier panning

function colorForRisk(score) {
  if (score >= 80) return "#FF3B3B";
  if (score >= 50) return "#FFAA00";
  return "#00FF66";
}

function makeInitialPositions(accounts) {
  const cx = GRAPH_WIDTH / 2, cy = GRAPH_HEIGHT / 2, r = 150;
  return accounts.reduce((acc, account, i) => {
    const angle = (Math.PI * 2 * i) / Math.max(accounts.length, 1);
    acc[account.id] = { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * (r * 0.72) };
    return acc;
  }, {});
}

export default function NetworkGraph({ accounts, transactions, selectedAccountId, onSelect, filters }) {
  const [positions, setPositions]         = useState(() => makeInitialPositions(accounts));
  const [hoveredAccountId, setHoveredId]  = useState(null);
  const [draggingNodeId, setDraggingNode] = useState(null);
  const [viewBox, setViewBox]             = useState({ x: 0, y: 0, width: GRAPH_WIDTH, height: GRAPH_HEIGHT });
  const panOrigin   = useRef(null); // { startX, startY, pointerX, pointerY }
  const pointerDown = useRef(null); // { x, y } — for deadzone tracking
  const didPan      = useRef(false);

  useEffect(() => {
    setPositions((cur) => ({ ...makeInitialPositions(accounts), ...cur }));
  }, [accounts]);

  const visibleAccounts = accounts.filter((a) => {
    const byIp      = !filters.ip      || a.ip_address.toLowerCase().includes(filters.ip.toLowerCase());
    const byEmail   = !filters.email   || a.email.toLowerCase().includes(filters.email.toLowerCase());
    const byCountry = !filters.country || a.country.toLowerCase().includes(filters.country.toLowerCase());
    return byIp && byEmail && byCountry;
  });

  const visibleIds = new Set(visibleAccounts.map((a) => a.id));
  const visibleTx  = transactions.filter(
    (t) => visibleIds.has(t.from_account) && visibleIds.has(t.to_account)
  );

  function graphPoint(event) {
    const svg   = event.currentTarget;
    const rect  = svg.getBoundingClientRect();
    const scaleX = viewBox.width  / rect.width;
    const scaleY = viewBox.height / rect.height;
    return {
      x: viewBox.x + (event.clientX - rect.left) * scaleX,
      y: viewBox.y + (event.clientY - rect.top)  * scaleY,
    };
  }

  function resetView() {
    setViewBox({ x: 0, y: 0, width: GRAPH_WIDTH, height: GRAPH_HEIGHT });
    setPositions(makeInitialPositions(accounts));
  }

  // ── Pointer handlers ─────────────────────────────────────────────────────
  function handlePointerDown(event) {
    if (event.target.tagName !== "svg") return;
    const point = graphPoint(event);
    pointerDown.current = { x: event.clientX, y: event.clientY };
    panOrigin.current   = { startX: viewBox.x, startY: viewBox.y, pointerX: point.x, pointerY: point.y };
    didPan.current      = false;
  }

  function handlePointerMove(event) {
    const point = graphPoint(event);

    if (draggingNodeId) {
      // Move node freely
      setPositions((cur) => ({ ...cur, [draggingNodeId]: { x: point.x, y: point.y } }));
      return;
    }

    if (panOrigin.current && pointerDown.current) {
      const dx = event.clientX - pointerDown.current.x;
      const dy = event.clientY - pointerDown.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (!didPan.current && dist < DRAG_THRESHOLD) return; // inside deadzone
      didPan.current = true;

      // Pan with reduced sensitivity
      setViewBox((cur) => ({
        ...cur,
        x: panOrigin.current.startX - (point.x - panOrigin.current.pointerX) * PAN_FACTOR,
        y: panOrigin.current.startY - (point.y - panOrigin.current.pointerY) * PAN_FACTOR,
      }));
    }
  }

  function handlePointerUp() {
    setDraggingNode(null);
    panOrigin.current   = null;
    pointerDown.current = null;
  }

  return (
    <div className="graph-card">
      <div className="graph-header">
        <div>
          <div className="section-title">Spider Map — Money Flow Network</div>
          <p className="muted">Drag nodes • scroll to zoom • drag background ≥6px to pan</p>
        </div>
        <button className="small-button" onClick={resetView}>Reset Map</button>
      </div>

      <svg
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        className="graph-canvas"
        role="img"
        aria-label="Interactive suspicious account network"
        onWheel={(e) => {
          e.preventDefault();
          const factor = e.deltaY > 0 ? 1.08 : 0.92;
          setViewBox((cur) => ({
            x: cur.x + ((GRAPH_WIDTH  - cur.width  * factor) / 2),
            y: cur.y + ((GRAPH_HEIGHT - cur.height * factor) / 2),
            width:  Math.min(GRAPH_WIDTH,  Math.max(280, cur.width  * factor)),
            height: Math.min(GRAPH_HEIGHT, Math.max(180, cur.height * factor)),
          }));
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <defs>
          <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#00FF66" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#00C94F" stopOpacity="0.2" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <marker id="xepaArrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
            <path d="M0,0 L0,6 L9,3 z" fill="rgba(0,255,102,0.5)" />
          </marker>
        </defs>

        {/* Orbit rings */}
        <circle cx={GRAPH_WIDTH/2} cy={GRAPH_HEIGHT/2} r="155" className="orbit-ring" />
        <circle cx={GRAPH_WIDTH/2} cy={GRAPH_HEIGHT/2} r="92"  className="orbit-ring faint" />

        {/* Hub node */}
        <circle cx={GRAPH_WIDTH/2} cy={GRAPH_HEIGHT/2} r="32"
          fill="url(#hubGlow)" className="hub-node" filter="url(#glow)" />
        <text x={GRAPH_WIDTH/2} y={GRAPH_HEIGHT/2+5} textAnchor="middle" className="hub-label">
          XEPA
        </text>

        {/* Transaction edges */}
        {visibleTx.map((tx) => {
          const from = positions[tx.from_account];
          const to   = positions[tx.to_account];
          const emphasized =
            selectedAccountId === tx.from_account || selectedAccountId === tx.to_account ||
            hoveredAccountId  === tx.from_account || hoveredAccountId  === tx.to_account;
          if (!from || !to) return null;
          return (
            <g key={tx.id}>
              <line
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke={emphasized ? "rgba(0,255,102,0.8)" : "rgba(0,255,102,0.2)"}
                strokeWidth={Math.max(1.5, tx.amount / 40000)}
                opacity={emphasized ? 1 : 0.5}
                markerEnd="url(#xepaArrow)"
              />
              <text x={(from.x+to.x)/2} y={(from.y+to.y)/2-8} className="edge-label">
                ${Math.round(tx.amount / 1000)}k
              </text>
            </g>
          );
        })}

        {/* Account nodes */}
        {visibleAccounts.map((account) => {
          const point      = positions[account.id];
          const isSelected = account.id === selectedAccountId;
          const isHovered  = account.id === hoveredAccountId;
          if (!point) return null;
          const nodeColor  = colorForRisk(account.risk_score);

          return (
            <g
              key={account.id}
              onClick={(e) => {
                e.stopPropagation(); // prevent accidental pan trigger
                if (!didPan.current) onSelect(account.id);
              }}
              onPointerDown={(e) => {
                e.stopPropagation(); // isolate from pan handler
                setDraggingNode(account.id);
                didPan.current = false;
              }}
              onPointerEnter={() => setHoveredId(account.id)}
              onPointerLeave={() => setHoveredId(null)}
              className="graph-node"
            >
              {/* Halo */}
              <circle cx={point.x} cy={point.y} r={isSelected ? 46 : isHovered ? 40 : 36} className="node-halo"
                style={isSelected ? { fill: "rgba(0,255,102,0.12)" } : {}} />
              {/* Main circle */}
              <circle
                cx={point.x} cy={point.y}
                r={isSelected ? 32 : 26}
                fill={nodeColor}
                stroke={isSelected ? "#00FF66" : "rgba(255,255,255,0.12)"}
                strokeWidth={isSelected ? 3 : 1.5}
                filter={isSelected ? "url(#glow)" : undefined}
              />
              {/* Account number */}
              <text x={point.x} y={point.y+4} textAnchor="middle" className="node-label">
                {account.account_number.slice(-4)}
              </text>
              {/* Name */}
              <text x={point.x} y={point.y+50} textAnchor="middle" className="node-meta-label">
                {account.holder_name}
              </text>
              {/* Risk badge */}
              {account.risk_score >= 80 && (
                <circle cx={point.x+18} cy={point.y-18} r="8" fill="var(--danger)"
                  stroke="var(--panel)" strokeWidth="2" />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
