"""
Patterns Router — POST /api/patterns/store, GET /api/patterns
SAR Router     — POST /api/sar/generate
"""

from fastapi import APIRouter, Body, Depends

from app.dependencies import get_current_user
from app.models import User
from app.services.prediction import (
    get_all_patterns,
    match_patterns,
    store_pattern,
    generate_sar_draft,
)

router = APIRouter(tags=["prediction"])


@router.get("/patterns")
def list_patterns(user: User = Depends(get_current_user)) -> dict:
    """Return all stored AML typology patterns."""
    return {"patterns": get_all_patterns()}


@router.post("/patterns/store")
def save_pattern(
    payload: dict = Body(...),
    user: User = Depends(get_current_user),
) -> dict:
    """
    Store a new pattern extracted from a closed case.
    Body: { pattern_id, type, label, nodes, edges, time_gaps, avg_amounts, description }
    """
    pattern = store_pattern(payload)
    return {"success": True, "pattern": pattern}


@router.post("/patterns/match")
def run_match(
    payload: dict = Body(...),
    user: User = Depends(get_current_user),
) -> dict:
    """
    Match a live case graph against stored patterns.
    Body: { nodes, edges, time_gaps?, amounts? }
    """
    result = match_patterns(
        live_nodes      = payload.get("nodes", []),
        live_edges      = payload.get("edges", []),
        live_time_gaps  = payload.get("time_gaps"),
        live_amounts    = payload.get("amounts"),
    )
    return result


@router.post("/sar/generate")
def generate_sar(
    payload: dict = Body(...),
    user: User = Depends(get_current_user),
) -> dict:
    """
    Generate a Pre-Crime Suspicious Activity Report.
    Body: { case_id, accounts, matched_pattern, confidence, predicted_nodes,
            breakdown, description?, intervention? }
    """
    sar = generate_sar_draft(
        case_id         = payload.get("case_id", "UNKNOWN"),
        accounts        = payload.get("accounts", []),
        matched_pattern = payload.get("matched_pattern", "unknown"),
        confidence      = payload.get("confidence", 0.0),
        predicted_nodes = payload.get("predicted_nodes", []),
        breakdown       = payload.get("breakdown", {}),
        description     = payload.get("description", ""),
        intervention    = payload.get("intervention"),
    )
    return sar
