const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const { headers: optionHeaders = {}, ...restOptions } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...restOptions,
    headers: {
      "Content-Type": "application/json",
      ...optionHeaders
    }
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ detail: "Request failed" }));
    const detail = payload.detail;
    if (Array.isArray(detail)) {
      throw new Error(detail.map((item) => item.msg || JSON.stringify(item)).join(", "));
    }
    if (typeof detail === "object" && detail !== null) {
      throw new Error(JSON.stringify(detail));
    }
    throw new Error(detail || "Request failed");
  }

  return response.json();
}

export const api = {
  login(email) {
    return request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email })
    });
  },
  getCases(token) {
    return request("/api/cases", {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  getCaseOverview(token) {
    return request("/api/cases/overview", {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  getFlaggedAccounts(token) {
    return request("/api/accounts/flagged", {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  getCase(caseId, token) {
    return request(`/api/cases/${caseId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  getTransactions(token) {
    return request("/api/transactions", {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  getSummary(token) {
    return request("/api/transactions/summary", {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  getAlerts(token) {
    return request("/api/alerts", {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  acknowledgeAlert(alertId, token) {
    return request(`/api/alerts/${alertId}/acknowledge`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ note: "Acknowledged from dashboard" })
    });
  },
  generateNarrative(caseId, accountId, token) {
    return request(`/api/cases/${caseId}/narrative`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ account_id: accountId })
    });
  },
  flagAccount(caseId, payload, token) {
    return request(`/api/cases/${caseId}/flag-account`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
  },
  unflagAccount(caseId, accountId, token) {
    return request(`/api/cases/${caseId}/unflag-account`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ account_id: accountId })
    });
  },
  getAudit(caseId, token) {
    return request(`/api/audit/${caseId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  verifyAudit(caseId, token) {
    return request(`/api/audit/${caseId}/verify`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  tamperAudit(caseId, token) {
    return request(`/api/audit/${caseId}/tamper`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  // ── Predictive Engine ───────────────────────────────────────────
  getPatterns(token) {
    return request("/api/patterns", { headers: { Authorization: `Bearer ${token}` } });
  },
  storePattern(payload, token) {
    return request("/api/patterns/store", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
  },
  matchPatterns(payload, token) {
    return request("/api/patterns/match", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
  },
  generateSar(payload, token) {
    return request("/api/sar/generate", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
  },

  // ── Case Flow / Workflow ────────────────────────────────────────
  analystFlag(payload, token) {
    return request("/api/flow/flag", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
  },
  supervisorDecision(payload, token) {
    return request("/api/flow/decision", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
  },
  getFlowStatus(token) {
    return request("/api/flow/status", { headers: { Authorization: `Bearer ${token}` } });
  },

  // ── Bank Portal ─────────────────────────────────────────────────
  getBankCases(token) {
    return request("/api/bank/cases", { headers: { Authorization: `Bearer ${token}` } });
  },
};
