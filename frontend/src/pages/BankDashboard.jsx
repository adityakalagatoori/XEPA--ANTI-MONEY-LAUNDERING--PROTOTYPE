/**
 * BankDashboard
 * ─────────────
 * Portal for bank_user role — shows:
 *   • Flagged accounts sent by supervisor
 *   • Full SAR report per account
 *   • Transaction history
 *   • Risk score + flow state
 *   • Downloadable SAR JSON (mock)
 */

import { useEffect, useState } from "react";
import { api } from "../api/client";
import Layout from "../components/Layout";
import SarPanel from "../components/SarPanel";
import Reveal from "../components/Reveal";
import { useAuth } from "../state/auth";

export default function BankDashboard() {
  const { token } = useAuth();
  const [cases, setCases]   = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBankCases(token)
      .then((r) => { setCases(r.cases || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const selected = cases.find((c) => c.account.id === active);

  return (
    <Layout title="Bank Compliance Portal" subtitle="Flagged accounts, SAR reports, and transaction records">
      {loading ? (
        <div className="empty-state">Loading bank portal…</div>
      ) : cases.length === 0 ? (
        <div className="empty-state">No flagged accounts available for review.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16 }}>
          {/* Left sidebar — account list */}
          <div>
            <div className="section-title" style={{ marginBottom: 10 }}>Flagged Accounts</div>
            <div style={{ display: "grid", gap: 8 }}>
              {cases.map(({ account, flow }, i) => (
                <Reveal key={account.id} delay={i * 40}>
                  <div
                    onClick={() => setActive(account.id)}
                    style={{
                      padding: "12px 14px", borderRadius: 10,
                      border: `1px solid ${active === account.id ? "rgba(0,255,102,0.4)" : "var(--line)"}`,
                      background: active === account.id ? "rgba(0,255,102,0.04)" : "var(--panel)",
                      cursor: "pointer", transition: "all 0.2s",
                    }}
                  >
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
                      {account.holder_name}
                    </div>
                    <div style={{ fontSize: "0.68rem", fontFamily: "'Fira Code',monospace", color: "var(--muted)", marginBottom: 6 }}>
                      ACC-****{account.account_number.slice(-4)}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{
                        fontSize: "0.64rem", fontFamily: "'Fira Code',monospace",
                        padding: "2px 8px", borderRadius: 4,
                        background: account.risk_score >= 80 ? "rgba(255,59,59,0.1)" :
                                    account.risk_score >= 50 ? "rgba(255,170,0,0.1)" : "rgba(0,255,102,0.06)",
                        color: account.risk_score >= 80 ? "var(--danger)" :
                               account.risk_score >= 50 ? "var(--warn)" : "var(--accent)",
                        border: `1px solid ${account.risk_score >= 80 ? "rgba(255,59,59,0.2)" :
                               account.risk_score >= 50 ? "rgba(255,170,0,0.2)" : "rgba(0,255,102,0.15)"}`,
                      }}>
                        {account.risk_score}/100
                      </div>
                      {flow?.panic && (
                        <span style={{ fontSize: "0.64rem", color: "var(--danger)", fontFamily: "'Fira Code',monospace" }}>
                          🚨 PANIC
                        </span>
                      )}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Right panel — account detail */}
          <div>
            {!selected ? (
              <div className="empty-state" style={{ marginTop: 40 }}>
                Select an account from the left to view details and SAR
              </div>
            ) : (
              <>
                {/* Account Header */}
                <Reveal>
                  <div className="card" style={{ padding: 20, marginBottom: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div className="section-title">Account Details</div>
                        <h2 style={{ fontSize: "1.3rem", margin: "6px 0" }}>
                          {selected.account.holder_name}
                        </h2>
                        <div style={{ fontFamily: "'Fira Code',monospace", fontSize: "0.78rem", color: "var(--muted)" }}>
                          {selected.account.account_number} • {selected.account.country} • {selected.account.city}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "2rem", fontWeight: 800,
                          color: selected.account.risk_score >= 80 ? "var(--danger)" :
                                 selected.account.risk_score >= 50 ? "var(--warn)" : "var(--accent)" }}>
                          {selected.account.risk_score}
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "var(--muted)", fontFamily: "'Fira Code',monospace" }}>
                          RISK SCORE
                        </div>
                      </div>
                    </div>

                    {/* Flow state */}
                    {selected.flow && (
                      <div style={{
                        marginTop: 14, padding: "10px 14px", borderRadius: 8,
                        background: "var(--panel-2)", border: "1px solid var(--line)",
                        display: "flex", gap: 20, flexWrap: "wrap",
                        fontFamily: "'Fira Code',monospace", fontSize: "0.72rem", color: "var(--muted)",
                      }}>
                        <span>Flagged by Analyst: <b style={{ color: selected.flow.flagged_by_analyst ? "var(--accent)" : "var(--muted)" }}>
                          {selected.flow.flagged_by_analyst ? "YES" : "NO"}
                        </b></span>
                        <span>Reflag Count: <b style={{ color: "var(--warn)" }}>{selected.flow.reflag_count}</b></span>
                        <span>AI Detections: <b style={{ color: "var(--blue)" }}>{selected.flow.ai_flag_count}</b></span>
                        {selected.flow.panic && <span style={{ color: "var(--danger)", fontWeight: 700 }}>🚨 PANIC ALERT</span>}
                        {selected.flow.supervisor_risk && <span style={{ color: "var(--warn)", fontWeight: 700 }}>⚠ SUPERVISOR RISK</span>}
                      </div>
                    )}

                    {/* Flag reason */}
                    {selected.account.flag_reason && (
                      <div style={{
                        marginTop: 10, padding: "8px 12px", borderRadius: 6,
                        background: "rgba(255,59,59,0.05)", border: "1px solid rgba(255,59,59,0.15)",
                        fontSize: "0.78rem", color: "var(--text-dim)", fontFamily: "'Fira Code',monospace",
                      }}>
                        🔴 FLAG REASON: {selected.account.flag_reason}
                        {selected.account.flag_severity && ` [${selected.account.flag_severity}]`}
                      </div>
                    )}
                  </div>
                </Reveal>

                {/* Transaction History */}
                <Reveal delay={60}>
                  <div className="card" style={{ padding: 18, marginBottom: 18 }}>
                    <div className="section-title">Transaction History</div>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>From</th><th>To</th><th>Amount</th><th>Channel</th>
                            <th>Date</th><th>Risk</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selected.transactions.slice(0, 10).map((tx) => (
                            <tr key={tx.id}>
                              <td>{tx.from_account.slice(-4)}</td>
                              <td>{tx.to_account.slice(-4)}</td>
                              <td>${tx.amount.toLocaleString()}</td>
                              <td>{tx.channel}</td>
                              <td>{tx.timestamp.slice(0, 10)}</td>
                              <td>
                                <span className={`severity-badge ${tx.severity?.toLowerCase()}`}>
                                  {tx.final_score}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Reveal>

                {/* SAR Report */}
                <Reveal delay={120}>
                  <SarPanel sar={selected.sar} />
                </Reveal>
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
