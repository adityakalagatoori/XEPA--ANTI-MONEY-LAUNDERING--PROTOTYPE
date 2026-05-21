"""
Bank Portal + Case Flow Router
────────────────────────────────
GET  /api/bank/cases           — bank user sees approved flagged cases + SAR
POST /api/flow/flag            — analyst flags an account (updates flow engine)
POST /api/flow/decision        — supervisor approves/rejects
GET  /api/flow/status          — get all account flow states (panic alerts etc.)
GET  /api/flow/status/{account_id}  — single account flow
"""

from fastapi import APIRouter, Body, Depends, HTTPException

from app.core.data_store import store
from app.dependencies import get_current_user
from app.models import User
from app.services.case_flow import (
    get_all_flows,
    get_flow,
    record_analyst_flag,
    record_ai_detection,
    record_supervisor_decision,
    PANIC_THRESHOLD,
)
from app.services.prediction import generate_sar_draft, match_patterns

router = APIRouter(tags=["workflow"])


# ── Bank Portal ────────────────────────────────────────────────────────────────

@router.get("/bank/cases")
def bank_cases(user: User = Depends(get_current_user)) -> dict:
    """
    Bank users see only approved-flagged accounts with full SAR + transaction history.
    Supervisors and bank_users can call this.
    """
    if user.role not in ("supervisor", "bank_user", "analyst"):
        raise HTTPException(status_code=403, detail="Access denied")

    results = []
    for account in store.accounts:
        if not account.is_flagged:
            continue

        related_txns = [
            t.model_dump() for t in store.transactions
            if t.from_account == account.id or t.to_account == account.id
        ]

        # Auto-generate a quick SAR for this account
        # Use the account risk score to create a simple pattern match
        nodes  = [account.id]
        edges  = [[t["from_account"], t["to_account"]] for t in related_txns[:4]]
        amounts= [t["amount"] for t in related_txns[:4]]
        match  = match_patterns(nodes + [f"NEXT_{account.id}"], edges)

        sar = generate_sar_draft(
            case_id         = account.case_id,
            accounts        = [account.model_dump()],
            matched_pattern = match.get("matched_pattern", "rule_based"),
            confidence      = match.get("confidence", round(account.risk_score / 100, 2)),
            predicted_nodes = match.get("next_predicted_nodes", []),
            breakdown       = match.get("breakdown", {}),
            description     = match.get("description", ""),
            intervention    = match.get("intervention"),
        )

        flow = get_flow(account.id)

        results.append({
            "account":      account.model_dump(),
            "transactions": related_txns,
            "sar":          sar,
            "flow":         flow,
        })

    return {"cases": results, "total": len(results)}


# ── Case Flow API ──────────────────────────────────────────────────────────────

@router.post("/flow/flag")
def analyst_flag(
    payload: dict = Body(...),
    user: User = Depends(get_current_user),
) -> dict:
    """
    Analyst flags an account.
    Body: { account_id, risk_score }
    """
    account_id = payload.get("account_id")
    risk_score = int(payload.get("risk_score", 50))
    if not account_id:
        raise HTTPException(status_code=400, detail="account_id required")

    flow = record_analyst_flag(account_id, risk_score)
    return {"success": True, "flow": flow}


@router.post("/flow/ai-detect")
def ai_detect(
    payload: dict = Body(...),
    user: User = Depends(get_current_user),
) -> dict:
    """
    AI/rule engine reports detection of an account.
    Body: { account_id, risk_score }
    """
    account_id = payload.get("account_id")
    risk_score = int(payload.get("risk_score", 50))
    if not account_id:
        raise HTTPException(status_code=400, detail="account_id required")

    flow = record_ai_detection(account_id, risk_score)
    return {"success": True, "flow": flow}


@router.post("/flow/decision")
def supervisor_decision(
    payload: dict = Body(...),
    user: User = Depends(get_current_user),
) -> dict:
    """
    Supervisor approves or rejects a flagged account.
    Body: { account_id, decision, explanation? }
    """
    if user.role not in ("supervisor",):
        raise HTTPException(status_code=403, detail="Only supervisors can make decisions")

    account_id  = payload.get("account_id")
    decision    = payload.get("decision")   # "approved" | "rejected"
    explanation = payload.get("explanation", "")

    if not account_id or decision not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="account_id and decision are required")

    flow = record_supervisor_decision(account_id, decision, explanation)

    # Check if explanation is required (2nd rejection without explanation)
    if flow.get("__requires_explanation"):
        raise HTTPException(
            status_code=422,
            detail="Second rejection requires a detailed explanation. Please provide 'explanation' field."
        )

    return {"success": True, "flow": flow}


@router.get("/flow/status")
def all_flow_status(user: User = Depends(get_current_user)) -> dict:
    """
    Return all account flow states.
    Includes panic accounts and supervisor-risk accounts.
    """
    flows = get_all_flows()
    panic_accounts = [f for f in flows if f.get("panic")]
    supervisor_risk= [f for f in flows if f.get("supervisor_risk")]
    ai_ignored     = [f for f in flows if not f["flagged_by_analyst"] and f["ai_flag_count"] >= 3]

    return {
        "flows":           flows,
        "panic_accounts":  panic_accounts,
        "panic_threshold": PANIC_THRESHOLD,
        "supervisor_risk": supervisor_risk,
        "ai_ignored":      ai_ignored,
    }


@router.get("/flow/status/{account_id}")
def single_flow_status(account_id: str, user: User = Depends(get_current_user)) -> dict:
    """Get flow state for a single account."""
    return get_flow(account_id)
