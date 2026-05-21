import { useState } from "react";

export default function AccountDetail({
  account,
  transactions,
  narrative,
  narrativeSource,
  narrativeLoading,
  narrativeError,
  onNarrative,
  onFlag,
  onAudit
}) {
  const [confirmText, setConfirmText] = useState("");

  if (!account) {
    return (
      <aside className="detail-card">
        <p>Select an account in the graph to inspect suspicious activity.</p>
      </aside>
    );
  }

  const related = transactions.filter(
    (transaction) => transaction.from_account === account.id || transaction.to_account === account.id
  );

  return (
    <aside className="detail-card">
      <div className="section-title">Account Detail</div>
      <h2>{account.holder_name}</h2>
      <p className="muted">ACC-****{account.account_number.slice(-4)}</p>
      <div className={`severity-badge ${account.risk_band.toLowerCase()}`}>{account.risk_band}</div>
      <div className="score-line">{account.risk_score}/100 risk</div>
      <ul className="reason-list">
        {account.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      <div className="meta-grid">
        <span>Country</span>
        <strong>{account.country}</strong>
        <span>IP</span>
        <strong>{account.ip_address}</strong>
        <span>Email</span>
        <strong>{account.email}</strong>
      </div>
      <div className="section-title">Related Transactions</div>
      <div className="mini-list">
        {related.map((transaction) => (
          <div key={transaction.id} className="mini-row">
            <span>{transaction.id}</span>
            <strong>${transaction.amount.toLocaleString()}</strong>
          </div>
        ))}
      </div>
      <div className="button-stack">
        <button className="primary-button" onClick={onNarrative} disabled={narrativeLoading}>
          {narrativeLoading ? "Generating..." : "Generate Claude Report"}
        </button>
        <button className="secondary-button" onClick={onAudit}>
          View Audit Trail
        </button>
      </div>
      <div className="flag-box">
        <label htmlFor="confirm">Type CONFIRM to flag</label>
        <input
          id="confirm"
          value={confirmText}
          onChange={(event) => setConfirmText(event.target.value)}
          placeholder="CONFIRM"
        />
        <button className="danger-button" onClick={() => onFlag(confirmText)} disabled={confirmText !== "CONFIRM"}>
          Flag Account
        </button>
      </div>
      {narrative ? (
        <div className="narrative-box">
          <div className="section-title">Case Report</div>
          <div className="report-source">
            Source: {narrativeSource === "claude" ? "Claude" : "Local fallback"}
          </div>
          <p>{narrative}</p>
        </div>
      ) : null}
      {narrativeError ? (
        <div className="error-banner" role="alert">
          {narrativeError}
        </div>
      ) : null}
    </aside>
  );
}
