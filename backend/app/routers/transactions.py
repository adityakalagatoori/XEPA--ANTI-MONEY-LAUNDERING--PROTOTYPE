from fastapi import APIRouter, Depends

from app.core.access import accessible_case_ids
from app.core.data_store import store
from app.dependencies import get_current_user
from app.models import User


router = APIRouter(tags=["transactions"])


@router.get("/transactions")
def list_transactions(user: User = Depends(get_current_user), severity: str | None = None) -> dict:
    allowed_ids = accessible_case_ids(user)
    transactions = [txn for txn in store.transactions if txn.case_id in allowed_ids]
    if severity:
        transactions = [txn for txn in transactions if txn.severity == severity.upper()]
    return {"transactions": [txn.model_dump() for txn in transactions]}


@router.get("/transactions/summary")
def transaction_summary(user: User = Depends(get_current_user)) -> dict:
    allowed_ids = accessible_case_ids(user)
    transactions = [txn for txn in store.transactions if txn.case_id in allowed_ids]
    suspicious = [txn for txn in transactions if txn.final_score >= 70]
    return {
        "total_transactions": len(transactions),
        "total_amount": sum(txn.amount for txn in transactions),
        "suspicious_transactions": len(suspicious),
        "highest_risk_score": max((txn.final_score for txn in transactions), default=0),
    }
