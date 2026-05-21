import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import AlertPanel from "../components/AlertPanel";
import AmlFlowPanel from "../components/AmlFlowPanel";
import FlaggedAccountsPanel from "../components/FlaggedAccountsPanel";
import Layout from "../components/Layout";
import PredictionPanel from "../components/PredictionPanel";
import Reveal from "../components/Reveal";
import SimulationEngine from "../components/SimulationEngine";
import StatCard from "../components/StatCard";
import TerminalFeed from "../components/TerminalFeed";
import TransactionTable from "../components/TransactionTable";
import { useAuth } from "../state/auth";

export default function DashboardPage() {
  const { token, user } = useAuth();
  const navigate        = useNavigate();
  const [cases, setCases]                   = useState([]);
  const [transactions, setTransactions]     = useState([]);
  const [alerts, setAlerts]                 = useState([]);
  const [summary, setSummary]               = useState(null);
  const [flaggedAccounts, setFlaggedAccounts] = useState([]);
  const [caseOverview, setCaseOverview]     = useState(null);
  // Prediction state
  const [prediction, setPrediction]         = useState(null);
  const [simGraph, setSimGraph]             = useState({ nodes: [], edges: [], ghostNodes: [], ghostEdges: [] });

  async function load() {
    const [casesR, txR, alertsR, summaryR, flaggedR, overviewR] = await Promise.all([
      api.getCases(token),
      api.getTransactions(token),
      api.getAlerts(token),
      api.getSummary(token),
      api.getFlaggedAccounts(token),
      api.getCaseOverview(token),
    ]);
    setCases(casesR.cases);
    setTransactions(txR.transactions);
    setAlerts(alertsR.alerts);
    setSummary(summaryR);
    setFlaggedAccounts(flaggedR.accounts);
    setCaseOverview(overviewR);
  }

  useEffect(() => { load(); }, []);

  return (
    <Layout title="AML Command Center" subtitle="Real-time threat intelligence • transaction monitoring • risk scoring">

      {/* ── Hero ─────────────────────────────────── */}
      <Reveal>
        <section className="hero-panel">
          <div className="hero-copy">
            <div className="section-title">Investigation Control</div>
            <h2>Follow the Money.</h2>
            <p>
              Track illegal cash from source through forex, crypto layering, stock markets,
              and profit extraction — all in real time.
            </p>
            <div className="hero-tags">
              <span>Rule Scoring Engine</span>
              <span>Crypto Wallet Tracking</span>
              <span>Blockchain Audit Trail</span>
              <span>AI Narrative</span>
            </div>
          </div>
          <div className="hero-orbital">
            <div className="hero-center">XEPA</div>
            <div className="hero-node hero-node-a">Critical ⚠</div>
            <div className="hero-node hero-node-b">Layering 🔁</div>
            <div className="hero-node hero-node-c">Structuring 📊</div>
          </div>
        </section>
      </Reveal>

      {/* ── Stats ────────────────────────────────── */}
      <Reveal delay={80}>
        <section className="stats-grid">
          {user?.role === "supervisor" ? (
            <>
              <StatCard label="Open Cases"       value={caseOverview?.open ?? 0} />
              <StatCard label="Closed Cases"     value={caseOverview?.closed ?? 0}   tone="warm" />
              <StatCard label="Reviewed"         value={caseOverview?.reviewed ?? 0} tone="danger" />
              <StatCard label="Flagged Accounts" value={flaggedAccounts.length}       tone="success" />
            </>
          ) : (
            <>
              <StatCard label="Active Cases"   value={cases.length} />
              <StatCard label="Transactions"   value={summary?.total_transactions ?? 0}   tone="warm" />
              <StatCard label="Suspicious"     value={summary?.suspicious_transactions ?? 0} tone="danger" />
              <StatCard label="Highest Risk"   value={`${summary?.highest_risk_score ?? 0}/100`} tone="success" />
            </>
          )}
        </section>
      </Reveal>

      {/* ── AML Money Flow Visualization ─────────── */}
      <Reveal delay={120}>
        <AmlFlowPanel />
      </Reveal>

      {/* ── Simulation Engine + Prediction Panel ─── */}
      <Reveal delay={140}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
          <SimulationEngine
            token={token}
            onPrediction={setPrediction}
            onStepChange={setSimGraph}
          />
          <PredictionPanel prediction={prediction} />
        </div>
      </Reveal>

      {/* ── Terminal Feed + Flagged Accounts (two-col) ── */}
      <Reveal delay={160}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 18 }}>
          <div className="card" style={{ padding: 18 }}>
            <div className="section-title">Real-Time Incident Feed</div>
            <p className="muted" style={{ marginBottom: 12 }}>Live system log — critical alerts in red.</p>
            <TerminalFeed />
          </div>
          <FlaggedAccountsPanel
            accounts={flaggedAccounts}
            isSupervisor={user?.role === "supervisor"}
            onUnflag={async (caseId, accountId) => {
              await api.unflagAccount(caseId, accountId, token);
              await load();
            }}
          />
        </div>
      </Reveal>

      {/* ── Cases ────────────────────────────────── */}
      <Reveal delay={200}>
        <section className="card">
          <div className="card-headline">
            <div>
              <div className="section-title">
                {user?.role === "supervisor" ? "Escalated Cases" : "Open Cases"}
              </div>
              <p className="muted">
                {user?.role === "supervisor"
                  ? "Analyst-flagged cases awaiting supervisor approval."
                  : "Investigations sorted by risk score and alert density."}
              </p>
            </div>
          </div>

          {cases.length ? (
            <div className="case-grid">
              {cases.map((item, i) => (
                <Reveal key={item.id} delay={i * 40}>
                  <article className="case-card">
                    <div className="case-card-glow" />
                    <div className={`severity-badge ${
                      item.risk_score >= 80 ? "critical" : item.risk_score >= 50 ? "medium" : "low"
                    }`}>
                      {item.risk_score}/100
                    </div>
                    <h2>{item.title}</h2>
                    <p>{item.summary}</p>
                    <div className="risk-meter">
                      <div className="risk-meter-bar" style={{ width: `${item.risk_score}%` }} />
                    </div>
                    <div className="meta-line">
                      <span>👤 {item.account_count} accounts</span>
                      <span>🔔 {item.alert_count} alerts</span>
                    </div>
                    <button className="small-button" onClick={() => navigate(`/cases/${item.id}`)}>
                      Open Case →
                    </button>
                  </article>
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="empty-state">No active cases available.</div>
          )}
        </section>
      </Reveal>

      {/* ── Alerts ───────────────────────────────── */}
      <Reveal delay={240}>
        <AlertPanel
          alerts={alerts}
          onAcknowledge={async (alertId) => {
            await api.acknowledgeAlert(alertId, token);
            await load();
          }}
        />
      </Reveal>

      {/* ── Transactions ─────────────────────────── */}
      <Reveal delay={280}>
        <TransactionTable transactions={transactions} />
      </Reveal>
    </Layout>
  );
}
