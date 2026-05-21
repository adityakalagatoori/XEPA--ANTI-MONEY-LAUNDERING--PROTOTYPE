import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import Layout from "../components/Layout";
import { useAuth } from "../state/auth";

export default function AuditPage() {
  const { caseId } = useParams();
  const { token } = useAuth();
  const [blocks, setBlocks] = useState([]);
  const [verification, setVerification] = useState(null);

  async function load() {
    const response = await api.getAudit(caseId, token);
    setBlocks(response.blocks);
  }

  useEffect(() => {
    load();
  }, [caseId, token]);

  return (
    <Layout title="Audit Trail" subtitle={`Case ${caseId}`}>
      <section className="card">
        <div className="card-headline">
          <div>
            <div className="section-title">Evidence Ledger</div>
            <p className="muted">Every analyst action is chained to preserve case integrity.</p>
          </div>
        </div>
        <div className="audit-actions">
          <button className="primary-button" onClick={async () => setVerification(await api.verifyAudit(caseId, token))}>
            Verify Chain Integrity
          </button>
          <button
            className="secondary-button"
            onClick={async () => {
              await api.tamperAudit(caseId, token);
              await load();
            }}
          >
            Tamper Demo Block
          </button>
        </div>
        {verification ? (
          <div className={`verification-banner ${verification.valid ? "ok" : "bad"}`}>
            {verification.message}
          </div>
        ) : null}
        <div className="audit-grid">
          {blocks.map((block) => (
            <article key={block.block_index} className={`audit-block ${block.tampered ? "tampered" : ""}`}>
              <div className="audit-index">Block {block.block_index}</div>
              <strong>{block.event_type}</strong>
              <code>{block.this_hash.slice(0, 16)}...</code>
              <code>{block.prev_hash.slice(0, 16)}...</code>
              <span>{new Date(block.timestamp).toLocaleString()}</span>
            </article>
          ))}
        </div>
      </section>
    </Layout>
  );
}
