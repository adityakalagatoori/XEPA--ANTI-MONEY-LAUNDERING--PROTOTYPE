export default function FlaggedAccountsPanel({ accounts, isSupervisor, onUnflag }) {
  if (!isSupervisor) {
    return null;
  }

  return (
    <section className="card">
      <div className="card-headline">
        <div>
          <div className="section-title">Analyst Escalations</div>
          <p className="muted">Accounts flagged or frozen by analysts for supervisor review.</p>
        </div>
      </div>
      {accounts.length ? (
        <div className="flagged-grid">
          {accounts.map((account) => (
            <article key={account.id} className="flagged-card">
              <div className={`severity-badge ${(account.flag_severity || account.risk_band).toLowerCase()}`}>
                {account.flag_severity || account.risk_band}
              </div>
              <h3>{account.holder_name}</h3>
              <p className="muted">ACC-****{account.account_number.slice(-4)}</p>
              <div className="flagged-meta">
                <span>{account.case_title}</span>
                <span>{account.country}</span>
              </div>
              <p className="flagged-reason">{account.flag_reason || "Flagged for supervisor review"}</p>
              <div className="flagged-footer">
                <span>By {account.flag_updated_by || "Analyst"}</span>
                <span>{account.flag_timestamp ? new Date(account.flag_timestamp).toLocaleString() : "Pending timestamp"}</span>
              </div>
              <div className="flagged-actions">
                <button className="secondary-button" onClick={() => onUnflag?.(account.case_id, account.id)}>
                  Unflag Account
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">No flagged accounts yet. Analyst escalations will appear here.</div>
      )}
    </section>
  );
}
