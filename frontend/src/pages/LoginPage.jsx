import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../state/auth";
import CanvasBackground from "../components/CanvasBackground";

export default function LoginPage() {
  const [email, setEmail]   = useState("analyst@xepa.local");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleLogin(selectedEmail) {
    try {
      setLoading(true);
      setError("");
      const response = await api.login(selectedEmail);
      login(response.token, response.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      {/* Animated node network background */}
      <CanvasBackground />

      {/* Glassmorphism login card */}
      <div className="login-card" style={{ animationName: "none" }}>
        {/* Brand */}
        <div className="login-brand">XEPA</div>
        <p className="login-tagline">
          Anti-Money Laundering Detection Platform<br />
          <span style={{ color: "var(--accent)", opacity: 0.7 }}>v2.0 • SECURE ENCLAVE</span>
        </p>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--line)", margin: "4px 0" }} />

        {/* Email field */}
        <div className="login-field">
          <label htmlFor="email">Access Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin(email)}
            placeholder="analyst@xepa.local"
          />
        </div>

        {/* Buttons */}
        <button
          id="btn-signin"
          className="primary-button"
          onClick={() => handleLogin(email)}
          disabled={loading}
          style={{ width: "100%", marginTop: 4, fontSize: "0.9rem", letterSpacing: "0.04em" }}
        >
          {loading ? "Authenticating…" : "▶ Sign In"}
        </button>

        <button className="secondary-button" onClick={() => handleLogin("supervisor@xepa.local")} disabled={loading}
          style={{ width: "100%", fontSize: "0.84rem", textAlign: "center" }}>
          Sign In as Supervisor
        </button>

        <button className="ghost-button" onClick={() => handleLogin("bank@xepa.local")} disabled={loading}
          style={{ width: "100%", fontSize: "0.82rem", textAlign: "center", color: "var(--blue)" }}>
          🏦 Sign In as Bank Officer
        </button>

        {/* Error */}
        {error && (
          <div className="error-banner" role="alert">{error}</div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: 4,
          fontSize: "0.68rem",
          fontFamily: "'Fira Code',monospace",
          color: "var(--muted)",
          textAlign: "center",
        }}>
          🔒 End-to-end encrypted session • Audit logged
        </div>
      </div>
    </div>
  );
}
