export default function AlertPanel({ alerts, onAcknowledge }) {
  if (!alerts?.length) return null;
  return (
    <section className="card" style={{ marginBottom: 18 }}>
      <div className="card-headline">
        <div>
          <div className="section-title">🔔 Suspicious Alerts</div>
          <p className="muted">Unacknowledged alerts require review within 24h.</p>
        </div>
        <span style={{
          fontFamily: "'Fira Code',monospace", fontSize: "0.78rem",
          color: alerts.filter(a => !a.acknowledged).length > 0 ? "var(--danger)" : "var(--accent)",
        }}>
          {alerts.filter(a => !a.acknowledged).length} pending
        </span>
      </div>
      <div className="alert-list">
        {alerts.map((alert) => (
          <article key={alert.id} className="alert-item">
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div className={`severity-badge ${alert.severity?.toLowerCase()}`}>{alert.severity}</div>
                {!alert.acknowledged && (
                  <span style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: "var(--danger)", boxShadow: "0 0 6px var(--danger)", display: "inline-block"
                  }} />
                )}
              </div>
              <h3>{alert.title}</h3>
              <p style={{ fontSize: "0.84rem", color: "var(--muted)", margin: "4px 0" }}>{alert.message}</p>
              <div className="alert-meta">
                <span>Case: {alert.case_id}</span>
                <span>{new Date(alert.created_at).toLocaleString()}</span>
              </div>
            </div>
            <button
              className={alert.acknowledged ? "ghost-button" : "small-button"}
              disabled={alert.acknowledged}
              onClick={() => onAcknowledge(alert.id)}
              style={{ flexShrink: 0 }}
            >
              {alert.acknowledged ? "✓ Done" : "Acknowledge"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
