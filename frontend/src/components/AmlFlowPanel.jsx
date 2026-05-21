// AML Money-Flow Visualization — Source → Forex → Crypto → Wallets → Stocks → Profit
import { useState } from "react";

const FLOW_NODES = [
  { id: "source",  label: "Illegal Source",  icon: "💰", amount: "$2.4M",  variant: "danger",  risk: 95 },
  { id: "forex",   label: "Forex Conversion",icon: "💱", amount: "$2.38M", variant: "warn",    risk: 72 },
  { id: "crypto",  label: "Crypto Wallets",  icon: "₿",  amount: "$2.1M",  variant: "blue",    risk: 81 },
  { id: "layer1",  label: "Wallet Hop A",    icon: "🔁", amount: "$1.8M",  variant: "warn",    risk: 88 },
  { id: "layer2",  label: "Wallet Hop B",    icon: "🔁", amount: "$1.6M",  variant: "warn",    risk: 88 },
  { id: "stocks",  label: "Stock Assets",    icon: "📈", amount: "$1.5M",  variant: "blue",    risk: 76 },
  { id: "profit",  label: "Profit Withdraw", icon: "🏦", amount: "$1.7M",  variant: "danger",  risk: 97, flagged: true },
];

const RULE_EXPLANATIONS = {
  source:  { rule: "Rapid Cash Deposit",        score: 25, detail: "Large cash deposit with no prior history." },
  forex:   { rule: "Rapid Currency Conversion", score: 18, detail: ">$500K converted within 24h across 3 currencies." },
  crypto:  { rule: "Fiat-to-Crypto Layering",   score: 20, detail: "Immediate BTC/ETH conversion post-forex." },
  layer1:  { rule: "Multiple Wallet Hops",      score: 22, detail: "3+ wallet hops in <12h — classic layering." },
  layer2:  { rule: "Multiple Wallet Hops",      score: 22, detail: "Sequential relay through anonymous wallets." },
  stocks:  { rule: "Crypto-to-Equity Pivot",    score: 15, detail: "Sudden equity buy after crypto movement." },
  profit:  { rule: "Profit Extraction Pattern", score: 25, detail: "Withdrawal presented as capital gains." },
};

const TOTAL_RISK = 87;

export default function AmlFlowPanel() {
  const [active, setActive] = useState(null);
  const activeRule = active ? RULE_EXPLANATIONS[active] : null;

  return (
    <div className="card aml-flow-panel" style={{ marginBottom: 18 }}>
      <div className="aml-flow-title">⚠ AML Detection — Money Flow Trace</div>

      {/* Flow track */}
      <div className="aml-flow-track">
        {FLOW_NODES.map((node, idx) => (
          <div key={node.id} style={{ display: "flex", alignItems: "center" }}>
            <div className="aml-flow-node" onClick={() => setActive(active === node.id ? null : node.id)}>
              <div
                className={`aml-flow-icon ${node.variant}${node.flagged ? " flagged" : ""}${active === node.id ? " active" : ""}`}
                title={node.label}
                style={active === node.id ? {
                  background: "var(--accent-glow)",
                  borderColor: "rgba(0,255,102,0.6)",
                  boxShadow: "0 0 16px rgba(0,255,102,0.3)",
                } : {}}
              >
                {node.icon}
              </div>
              <div className="aml-flow-label">{node.label}</div>
              <div className="aml-flow-amount">{node.amount}</div>
            </div>
            {idx < FLOW_NODES.length - 1 && (
              <div className="aml-flow-arrow">→</div>
            )}
          </div>
        ))}
      </div>

      {/* Risk bar */}
      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: "0.72rem", fontFamily: "'Fira Code',monospace", color: "var(--muted)", flexShrink: 0 }}>
          COMPOSITE RISK
        </span>
        <div className="aml-risk-bar" style={{ flex: 1 }}>
          <div className="aml-risk-fill" style={{ width: `${TOTAL_RISK}%` }} />
        </div>
        <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--danger)", fontFamily: "'Fira Code',monospace", flexShrink: 0 }}>
          {TOTAL_RISK}/100
        </span>
      </div>

      {/* Rule detail callout */}
      {activeRule && (
        <div style={{
          marginTop: 14,
          padding: "12px 16px",
          borderRadius: 8,
          background: "rgba(0,255,102,0.04)",
          border: "1px solid rgba(0,255,102,0.2)",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
        }}>
          <div>
            <div style={{ fontSize: "0.72rem", fontFamily: "'Fira Code',monospace", color: "var(--accent)", marginBottom: 4 }}>
              RULE TRIGGERED: {activeRule.rule}
            </div>
            <div style={{ fontSize: "0.84rem", color: "var(--text-dim)" }}>{activeRule.detail}</div>
          </div>
          <div style={{
            background: "rgba(255,59,59,0.1)",
            border: "1px solid rgba(255,59,59,0.2)",
            borderRadius: 8,
            padding: "8px 14px",
            textAlign: "center",
            flexShrink: 0,
          }}>
            <div style={{ fontSize: "0.64rem", fontFamily: "'Fira Code',monospace", color: "var(--danger)" }}>SCORE CONTRIB</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--danger)" }}>+{activeRule.score}</div>
          </div>
        </div>
      )}

      {!activeRule && (
        <div style={{ marginTop: 10, fontSize: "0.72rem", fontFamily: "'Fira Code',monospace", color: "var(--muted)", textAlign: "center" }}>
          Click any node to see the detection rule that triggered it
        </div>
      )}
    </div>
  );
}
