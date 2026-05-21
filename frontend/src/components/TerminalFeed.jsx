// Real-time terminal incident feed
const LOGS = [
  { ts: "03:14:01", lvl: "crit", msg: "ALERT: Wallet 0xA3F9 — 3 hops in <10min. LAYERING DETECTED." },
  { ts: "03:13:55", lvl: "warn", msg: "WARN: Rapid FX conversion USD→CNH→EUR • $480,000" },
  { ts: "03:13:40", lvl: "crit", msg: "ALERT: Case #C-1042 — risk score crossed 90/100 threshold." },
  { ts: "03:13:20", lvl: "ok",   msg: "INFO: Audit block #39 verified. Hash integrity: PASS" },
  { ts: "03:12:58", lvl: "warn", msg: "WARN: Cross-border transfer SG → UAE → CH — flagged." },
  { ts: "03:12:30", lvl: "crit", msg: "ALERT: Profit withdrawal $1.7M after complex routing chain." },
  { ts: "03:12:05", lvl: "ok",   msg: "INFO: Rule engine processed 247 transactions in 0.8s." },
  { ts: "03:11:44", lvl: "warn", msg: "WARN: New account <7 days old transacting >$50,000." },
];

export default function TerminalFeed() {
  return (
    <div className="terminal-feed">
      {LOGS.map((log, i) => (
        <div className="terminal-line" key={i}>
          <span className="ts">{log.ts}</span>
          <span className={`lvl ${log.lvl}`}>
            {log.lvl === "crit" ? "[CRIT]" : log.lvl === "warn" ? "[WARN]" : "[INFO]"}
          </span>
          <span className="msg">{log.msg}</span>
        </div>
      ))}
    </div>
  );
}
