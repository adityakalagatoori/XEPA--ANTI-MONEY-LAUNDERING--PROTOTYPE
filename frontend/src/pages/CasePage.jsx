import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import AccountDetail from "../components/AccountDetail";
import Layout from "../components/Layout";
import NetworkGraph from "../components/NetworkGraph";
import { useAuth } from "../state/auth";

export default function CasePage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [bundle, setBundle] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [narrative, setNarrative] = useState("");
  const [narrativeSource, setNarrativeSource] = useState("");
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [narrativeError, setNarrativeError] = useState("");
  const [filters, setFilters] = useState({ ip: "", email: "", country: "" });

  useEffect(() => {
    api.getCase(caseId, token).then((response) => {
      setBundle(response);
      setSelectedAccountId(response.accounts[0]?.id ?? null);
    });
  }, [caseId, token]);

  const selectedAccount = useMemo(
    () => bundle?.accounts.find((account) => account.id === selectedAccountId),
    [bundle, selectedAccountId]
  );

  if (!bundle) {
    return (
      <Layout title="Loading case" subtitle="Preparing suspicious network">
        <section className="card">Loading case data...</section>
      </Layout>
    );
  }

  return (
    <Layout title={bundle.case.title} subtitle={`Case ${bundle.case.id}`}>
      <div className="case-layout">
        <section className="filter-card">
          <div className="section-title">Filters</div>
          <label htmlFor="ip">IP Address</label>
          <input
            id="ip"
            value={filters.ip}
            onChange={(event) => setFilters((current) => ({ ...current, ip: event.target.value }))}
          />
          <label htmlFor="email">Email</label>
          <input
            id="email"
            value={filters.email}
            onChange={(event) => setFilters((current) => ({ ...current, email: event.target.value }))}
          />
          <label htmlFor="country">Country</label>
          <input
            id="country"
            value={filters.country}
            onChange={(event) => setFilters((current) => ({ ...current, country: event.target.value }))}
          />
          <button className="secondary-button" onClick={() => setFilters({ ip: "", email: "", country: "" })}>
            Reset Filters
          </button>
        </section>

        <NetworkGraph
          accounts={bundle.accounts}
          transactions={bundle.transactions}
          selectedAccountId={selectedAccountId}
          onSelect={(accountId) => {
            setSelectedAccountId(accountId);
            setNarrative("");
            setNarrativeSource("");
            setNarrativeError("");
          }}
          filters={filters}
        />

        <AccountDetail
          account={selectedAccount}
          transactions={bundle.transactions}
          narrative={narrative}
          narrativeSource={narrativeSource}
          narrativeLoading={narrativeLoading}
          narrativeError={narrativeError}
          onNarrative={async () => {
            setNarrativeLoading(true);
            setNarrativeError("");
            try {
              const response = await api.generateNarrative(caseId, selectedAccount.id, token);
              setNarrative(response.narrative);
              setNarrativeSource(response.source);
              if (!response.narrative) {
                setNarrativeError("The backend returned an empty report.");
              }
            } catch (error) {
              setNarrativeError(error.message || "Report generation failed.");
            } finally {
              setNarrativeLoading(false);
            }
          }}
          onAudit={() => navigate(`/cases/${caseId}/audit`)}
          onFlag={async (confirmation) => {
            const response = await api.flagAccount(
              caseId,
              {
                account_id: selectedAccount.id,
                reason: "Analyst escalated suspicious pattern",
                severity: "HIGH",
                confirmation
              },
              token
            );
            setBundle((current) => ({
              ...current,
              accounts: current.accounts.map((account) =>
                account.id === response.account.id ? response.account : account
              )
            }));
          }}
        />
      </div>
    </Layout>
  );
}
