import { useNavigate } from "react-router-dom";
import { useAuth } from "../state/auth";

export default function Layout({ title, subtitle, children }) {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  return (
    <div className="shell">
      {/* Ambient blobs */}
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      {/* Top navigation bar */}
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">
            <span className="brand-mark-core" />
          </div>
          <div>
            <div className="brand">XEPA</div>
            <div className="brand-subtitle">AML Detection Platform</div>
          </div>
        </div>

        {/* Global search */}
        <div style={{ flex: 1, maxWidth: 360, margin: "0 24px" }}>
          <input
            placeholder="Search cases, accounts, wallets…"
            style={{ padding: "8px 14px", fontSize: "0.82rem", borderRadius: 8 }}
          />
        </div>

        <div className="topbar-actions">
          <span className="session-chip">Live Monitoring</span>
          {/* Alert icon */}
          <button
            style={{
              background: "rgba(255,59,59,0.08)",
              border: "1px solid rgba(255,59,59,0.2)",
              borderRadius: 8,
              padding: "6px 12px",
              color: "var(--danger)",
              fontSize: "0.84rem",
              cursor: "pointer",
            }}
            title="Active alerts"
          >
            🔔 3
          </button>
          <span className="pill">{user?.role || "analyst"}</span>
          <button
            className="ghost-button"
            onClick={() => { logout(); navigate("/"); }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="page">
        <div className="page-heading">
          <h1>{title}</h1>
          <p className="page-kicker">{subtitle}</p>
        </div>
        {children}
      </main>
    </div>
  );
}
