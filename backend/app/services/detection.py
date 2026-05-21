from collections import Counter, defaultdict
from math import exp

from app.models import Account, Transaction


def severity_from_score(score: int) -> str:
    if score >= 85:
        return "CRITICAL"
    if score >= 70:
        return "HIGH"
    if score >= 45:
        return "MEDIUM"
    return "LOW"


def band_from_score(score: int) -> str:
    if score >= 80:
        return "HIGH"
    if score >= 50:
        return "MEDIUM"
    return "LOW"


def parse_time(value: str):
    from datetime import datetime

    return datetime.fromisoformat(value)


def ml_probability(features: dict[str, float]) -> float:
    linear = (
        1.6 * features["amount_norm"]
        + 1.2 * features["rapid_norm"]
        + 1.1 * features["cross_border"]
        + 0.8 * features["location_anomaly"]
        + 0.6 * features["repeat_counterparty"]
        - 1.7
    )
    return 1 / (1 + exp(-linear))


def score_transactions(accounts: list[Account], transactions: list[Transaction]) -> list[Transaction]:
    account_lookup = {account.id: account for account in accounts}
    outbound_by_account: dict[str, list[Transaction]] = defaultdict(list)
    pair_counter = Counter((txn.from_account, txn.to_account) for txn in transactions)

    for txn in transactions:
        outbound_by_account[txn.from_account].append(txn)

    enriched: list[Transaction] = []
    for txn in transactions:
        origin_account = account_lookup[txn.from_account]
        outbound = sorted(outbound_by_account[txn.from_account], key=lambda item: parse_time(item.timestamp))
        txn_time = parse_time(txn.timestamp)
        recent_window = [
            item for item in outbound if abs((txn_time - parse_time(item.timestamp)).total_seconds()) <= 3600
        ]

        reasons: list[str] = []
        rule_score = 0

        if txn.amount >= 90000:
            rule_score += 35
            reasons.append("High transaction amount")
        elif txn.amount >= 40000:
            rule_score += 20
            reasons.append("Elevated transaction amount")

        if len(recent_window) >= 2:
            rule_score += 20
            reasons.append("Multiple transfers within one hour")

        location_anomaly = int(origin_account.baseline_country != txn.origin_country)
        if txn.origin_country != txn.destination_country:
            rule_score += 18
            reasons.append("Cross-border movement detected")
        if location_anomaly:
            rule_score += 12
            reasons.append("Origin differs from known account baseline")

        if pair_counter[(txn.from_account, txn.to_account)] >= 2:
            rule_score += 10
            reasons.append("Repeated counterparty pattern")

        features = {
            "amount_norm": min(txn.amount / 100000, 1.0),
            "rapid_norm": min(len(recent_window) / 4, 1.0),
            "cross_border": 1.0 if txn.origin_country != txn.destination_country else 0.0,
            "location_anomaly": float(location_anomaly),
            "repeat_counterparty": 1.0 if pair_counter[(txn.from_account, txn.to_account)] >= 2 else 0.0,
        }
        ml_score = ml_probability(features)
        final_score = min(100, round(rule_score * 0.65 + ml_score * 100 * 0.35))
        severity = severity_from_score(final_score)

        enriched.append(
            txn.model_copy(
                update={
                    "rule_score": rule_score,
                    "ml_score": round(ml_score, 3),
                    "final_score": final_score,
                    "severity": severity,
                    "reasons": reasons,
                }
            )
        )

    return enriched


def score_accounts(accounts: list[Account], transactions: list[Transaction]) -> list[Account]:
    involved: dict[str, list[Transaction]] = defaultdict(list)
    for txn in transactions:
        involved[txn.from_account].append(txn)
        involved[txn.to_account].append(txn)

    scored: list[Account] = []
    for account in accounts:
        related = involved.get(account.id, [])
        if not related:
            scored.append(account)
            continue

        average_score = sum(txn.final_score for txn in related) / len(related)
        high_count = sum(1 for txn in related if txn.final_score >= 70)
        anomaly_count = sum(1 for txn in related if "Origin differs from known account baseline" in txn.reasons)

        score = min(100, round(average_score * 0.7 + high_count * 8 + anomaly_count * 5))
        reasons = []
        if any(txn.amount >= 90000 for txn in related):
            reasons.append("Linked to high-value transfers")
        if high_count >= 2:
            reasons.append("Repeated suspicious activity")
        if anomaly_count:
            reasons.append("Location anomaly present")
        if any(txn.origin_country != txn.destination_country for txn in related):
            reasons.append("Cross-border pattern detected")

        scored.append(
            account.model_copy(
                update={
                    "risk_score": score,
                    "risk_band": band_from_score(score),
                    "reasons": reasons or ["Low-risk activity profile"],
                    "ml_probability": round(min(0.99, score / 100), 3),
                }
            )
        )

    return scored


def generate_case_narrative(account: Account, related_transactions: list[Transaction]) -> str:
    top_reasons = ", ".join(account.reasons[:3]).lower()
    high_value = max((txn.amount for txn in related_transactions), default=0)
    rapid_count = sum(
        1 for txn in related_transactions if "Multiple transfers within one hour" in txn.reasons
    )
    return (
        f"{account.holder_name} shows a {account.risk_band.lower()} to high-risk AML profile with a score of "
        f"{account.risk_score}/100, driven by {top_reasons}. "
        f"The account touched transfers up to USD {high_value:,.0f} and participated in {rapid_count} "
        "rapid-movement events, which suggests potential layering or structuring behavior. "
        "Recommended action: keep the account under review, preserve the audit trail, and escalate for analyst confirmation."
    )


def build_claude_prompt(account: Account, related_transactions: list[Transaction]) -> str:
    transaction_lines = "\n".join(
        [
            f"- {txn.id}: {txn.origin_country} to {txn.destination_country}, "
            f"{txn.currency} {txn.amount:,.0f}, severity {txn.severity}, reasons: {', '.join(txn.reasons)}"
            for txn in related_transactions[:6]
        ]
    )
    return (
        "You are an AML investigator writing a concise suspicious activity report.\n"
        "Write 3 short paragraphs with headings: Summary, Red Flags, Recommended Action.\n"
        "Keep it factual and readable for a bank compliance officer.\n\n"
        f"Account holder: {account.holder_name}\n"
        f"Masked account: ACC-****{account.account_number[-4:]}\n"
        f"Risk score: {account.risk_score}/100 ({account.risk_band})\n"
        f"Country: {account.country}\n"
        f"IP address: {account.ip_address}\n"
        f"Detection reasons: {', '.join(account.reasons)}\n\n"
        f"Transactions:\n{transaction_lines}"
    )
