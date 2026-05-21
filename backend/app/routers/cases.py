from datetime import datetime
from collections import Counter

from fastapi import APIRouter, Body, Depends, HTTPException

from app.core.access import accessible_case_ids
from app.core.data_store import store
from app.dependencies import get_current_user
from app.models import User
from app.schemas import FlagAccountRequest
from app.services.anthropic_client import generate_claude_narrative


router = APIRouter(tags=["cases"])


@router.get("/cases")
def list_cases(user: User = Depends(get_current_user)) -> dict:
    allowed_ids = accessible_case_ids(user)
    cases = [case for case in store.cases if case.id in allowed_ids]
    return {"cases": [case.model_dump() for case in cases]}


@router.get("/cases/overview")
def cases_overview(user: User = Depends(get_current_user)) -> dict:
    cases = store.cases if user.role == "supervisor" else [case for case in store.cases if case.assigned_to == user.id]
    counts = {
        "open": sum(1 for case in cases if case.status.lower() == "open"),
        "closed": sum(1 for case in cases if case.status.lower() == "closed"),
        "reviewed": sum(1 for case in cases if case.status.lower() == "reviewed"),
        "total": len(cases),
    }
    return counts


@router.get("/cases/{case_id}")
def get_case(case_id: str, user: User = Depends(get_current_user)) -> dict:
    case = next((item for item in store.cases if item.id == case_id and item.id in accessible_case_ids(user)), None)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    bundle = store.copy_case_bundle(case_id)
    suspicious = [txn for txn in bundle["transactions"] if txn["final_score"] >= 70]
    account_freq = Counter([txn["from_account"] for txn in bundle["transactions"]])
    bundle["insights"] = {
        "suspicious_transaction_count": len(suspicious),
        "highest_transaction": max(txn["amount"] for txn in bundle["transactions"]),
        "most_active_sender": account_freq.most_common(1)[0][0] if account_freq else None,
    }
    return bundle


@router.post("/cases/{case_id}/narrative")
async def generate_narrative(
    case_id: str,
    payload: dict | None = Body(default=None),
    user: User = Depends(get_current_user),
) -> dict:
    _ = get_case(case_id, user)
    if not payload or not isinstance(payload, dict) or not payload.get("account_id"):
        raise HTTPException(status_code=400, detail="account_id is required")

    account_id = payload["account_id"]
    account, related, prompt = store.narrative_context(case_id, account_id)
    source = "claude"
    try:
        narrative = await generate_claude_narrative(prompt)
    except Exception:
        narrative = None
    if not narrative:
        narrative = store.narrative_for_account(case_id, account_id)
        source = "fallback"
    store.append_audit_event(case_id, "narrative_generated", {"account_id": account_id}, user.id)
    return {
        "narrative": narrative,
        "source": source,
        "account": account.model_dump(),
        "transaction_count": len(related),
    }


@router.post("/cases/{case_id}/flag-account")
def flag_account(case_id: str, payload: FlagAccountRequest, user: User = Depends(get_current_user)) -> dict:
    if payload.confirmation != "CONFIRM":
        raise HTTPException(status_code=400, detail="Confirmation text must be CONFIRM")

    _ = get_case(case_id, user)
    account = next(
        (item for item in store.accounts if item.id == payload.account_id and item.case_id == case_id),
        None,
    )
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    account.is_flagged = True
    account.flag_reason = payload.reason
    account.flag_severity = payload.severity
    account.flag_updated_by = user.name
    account.flag_timestamp = datetime.utcnow().isoformat()
    store.append_audit_event(
        case_id,
        "account_flagged",
        {"account_id": account.id, "reason": payload.reason, "severity": payload.severity},
        user.id,
    )
    return {"success": True, "account": account.model_dump()}


@router.get("/accounts/flagged")
def list_flagged_accounts(user: User = Depends(get_current_user)) -> dict:
    allowed_ids = accessible_case_ids(user)
    case_lookup = {case.id: case for case in store.cases}
    flagged = []
    for account in store.accounts:
        if account.case_id in allowed_ids and account.is_flagged:
            payload = account.model_dump()
            payload["case_title"] = case_lookup[account.case_id].title
            flagged.append(payload)
    return {"accounts": flagged}


@router.post("/cases/{case_id}/unflag-account")
def unflag_account(case_id: str, payload: dict | None = Body(default=None), user: User = Depends(get_current_user)) -> dict:
    if user.role != "supervisor":
        raise HTTPException(status_code=403, detail="Only supervisors can unflag accounts")
    if not payload or not isinstance(payload, dict) or not payload.get("account_id"):
        raise HTTPException(status_code=400, detail="account_id is required")

    account = next(
        (item for item in store.accounts if item.id == payload["account_id"] and item.case_id == case_id),
        None,
    )
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    account.is_flagged = False
    account.flag_reason = None
    account.flag_severity = None
    account.flag_updated_by = user.name
    account.flag_timestamp = datetime.utcnow().isoformat()
    store.append_audit_event(
        case_id,
        "account_unflagged",
        {"account_id": account.id, "reviewed_by": user.name},
        user.id,
    )
    return {"success": True, "account": account.model_dump()}
