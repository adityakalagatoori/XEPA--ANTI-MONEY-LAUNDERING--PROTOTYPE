from fastapi import APIRouter, Depends, HTTPException

from app.core.access import accessible_case_ids
from app.core.data_store import store
from app.dependencies import get_current_user
from app.models import User
from app.services.audit import verify_chain


router = APIRouter(tags=["audit"])


@router.get("/audit/{case_id}")
def get_audit_trail(case_id: str, user: User = Depends(get_current_user)) -> dict:
    case = next((item for item in store.cases if item.id == case_id and item.id in accessible_case_ids(user)), None)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    return {"blocks": [block.model_dump() for block in store.audit_blocks.get(case_id, [])]}


@router.post("/audit/{case_id}/verify")
def verify_audit(case_id: str, user: User = Depends(get_current_user)) -> dict:
    _ = get_audit_trail(case_id, user)
    return verify_chain(store.audit_blocks.get(case_id, []))


@router.post("/audit/{case_id}/tamper")
def tamper_audit(case_id: str, user: User = Depends(get_current_user)) -> dict:
    _ = get_audit_trail(case_id, user)
    blocks = store.audit_blocks.get(case_id, [])
    if len(blocks) < 2:
        raise HTTPException(status_code=400, detail="Not enough blocks to tamper")

    blocks[1].this_hash = "tampered-" + blocks[1].this_hash[9:]
    blocks[1].tampered = True
    return {"success": True, "message": "Block 1 hash modified for demo purposes"}
