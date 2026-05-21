export default function TransactionTable({ transactions }) {
  return (
    <section className="card">
      <div className="table-header">
        <div>
          <div className="section-title">Transactions</div>
          <p className="muted">Recent movement scored by rule signals and AML heuristics.</p>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Case</th>
              <th>Amount</th>
              <th>Route</th>
              <th>Severity</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>{transaction.id}</td>
                <td>{transaction.case_id}</td>
                <td>${transaction.amount.toLocaleString()}</td>
                <td>
                  {transaction.origin_country} → {transaction.destination_country}
                </td>
                <td>
                  <span className={`severity-badge ${transaction.severity.toLowerCase()}`}>
                    {transaction.severity}
                  </span>
                </td>
                <td>{transaction.final_score}/100</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
