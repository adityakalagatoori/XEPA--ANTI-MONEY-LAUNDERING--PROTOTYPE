"""
Case Flow Engine
────────────────
Tracks per-account:
  • reflag_count, supervisor_decision history
  • ai_flag_count vs analyst action
  • risk score escalation on repeated flags
  • panic alerts when risk_score > threshold
  • supervisor accountability (forced explanation on 2nd rejection)
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

# ── In-memory case flow store ──────────────────────────────────────────────────
# keyed by account_id
_account_flows: dict[str, dict] = {}

# Panic threshold
PANIC_THRESHOLD = 80
AI_IGNORE_ESCALATION_THRESHOLD = 3  # AI flags without analyst action → escalate


def _get_or_create_flow(account_id: str) -> dict:
    if account_id not in _account_flows:
        _account_flows[account_id] = {
            "account_id":          account_id,
            "flagged_by_analyst":  False,
            "supervisor_decision": None,   # "approved" | "rejected"
            "reflag_count":        0,
            "ai_flag_count":       0,
            "risk_score":          0,
            "history":             [],
            "panic":               False,
            "supervisor_risk":     False,   # supervisor keeps rejecting flagged accounts
            "rejection_count":     0,
            "forced_explanation":  None,
        }
    return _account_flows[account_id]


def get_all_flows() -> list[dict]:
    return list(_account_flows.values())


def get_flow(account_id: str) -> dict:
    return _get_or_create_flow(account_id)


def record_analyst_flag(account_id: str, risk_score: int) -> dict:
    """Called when an analyst flags an account."""
    flow = _get_or_create_flow(account_id)
    flow["reflag_count"] += 1
    flow["flagged_by_analyst"] = True
    flow["supervisor_decision"] = None  # reset pending supervisor decision

    # Escalate risk on re-flags
    escalation = min(10 * flow["reflag_count"], 25)
    flow["risk_score"] = min(100, risk_score + escalation)

    _append_history(flow, "analyst_flag", {
        "reflag_count": flow["reflag_count"],
        "risk_score":   flow["risk_score"],
    })

    _check_panic(flow)
    return flow


def record_ai_detection(account_id: str, risk_score: int) -> dict:
    """Called when AI (rule/ML engine) detects an account but analyst has not flagged."""
    flow = _get_or_create_flow(account_id)
    flow["ai_flag_count"] += 1

    # If analyst ignored AI multiple times, escalate
    if not flow["flagged_by_analyst"] and flow["ai_flag_count"] >= AI_IGNORE_ESCALATION_THRESHOLD:
        escalation = 5 * (flow["ai_flag_count"] - AI_IGNORE_ESCALATION_THRESHOLD + 1)
        flow["risk_score"] = min(100, risk_score + escalation)
        _append_history(flow, "ai_escalation", {
            "ai_flag_count": flow["ai_flag_count"],
            "risk_score":    flow["risk_score"],
            "alert":         "Analyst ignored AI detection — risk escalated",
        })
    else:
        flow["risk_score"] = min(100, max(flow["risk_score"], risk_score))
        _append_history(flow, "ai_detection", {"ai_flag_count": flow["ai_flag_count"]})

    _check_panic(flow)
    return flow


def record_supervisor_decision(
    account_id: str,
    decision: str,
    explanation: str = "",
) -> dict:
    """
    decision: "approved" | "rejected"
    On second rejection, explanation is REQUIRED.
    """
    flow = _get_or_create_flow(account_id)
    flow["supervisor_decision"] = decision

    if decision == "rejected":
        flow["rejection_count"] = flow.get("rejection_count", 0) + 1

        # 2nd rejection — force explanation
        if flow["rejection_count"] >= 2:
            if not explanation:
                # Return a special flag — frontend must enforce this
                return {**flow, "__requires_explanation": True}
            flow["forced_explanation"] = explanation

        # Return account to analyst on first rejection
        if flow["rejection_count"] == 1:
            flow["flagged_by_analyst"] = False  # marks as returned

        # Suspicious supervisor detection
        if flow["rejection_count"] >= 2 and flow["reflag_count"] >= 2:
            flow["supervisor_risk"] = True
            _append_history(flow, "supervisor_risk_flag", {
                "rejection_count": flow["rejection_count"],
                "reflag_count":    flow["reflag_count"],
                "alert":           "Supervisor repeat-rejection of multiply-flagged account",
            })

    elif decision == "approved":
        flow["rejection_count"] = 0
        flow["supervisor_risk"] = False

    _append_history(flow, f"supervisor_{decision}", {
        "rejection_count":    flow.get("rejection_count", 0),
        "forced_explanation": explanation or None,
    })

    _check_panic(flow)
    return flow


def _check_panic(flow: dict) -> None:
    """Set panic flag if risk_score crosses threshold."""
    if flow["risk_score"] >= PANIC_THRESHOLD:
        flow["panic"] = True


def _append_history(flow: dict, event: str, data: dict) -> None:
    flow["history"].append({
        "event":      event,
        "data":       data,
        "timestamp":  datetime.utcnow().isoformat() + "Z",
    })


# ── Seed demo flows ─────────────────────────────────────────────────────────────
def _seed_demo_flows() -> None:
    """
    Demo data:
      Account A → flagged → approved
      Account B → flagged → rejected → flagged again
      Account C → AI repeatedly detects, analyst ignores
    """
    # Account A — clean approval
    a = _get_or_create_flow("demo_account_A")
    a["risk_score"]          = 72
    a["reflag_count"]        = 1
    a["flagged_by_analyst"]  = True
    a["supervisor_decision"] = "approved"
    _append_history(a, "analyst_flag",      {"risk_score": 72})
    _append_history(a, "supervisor_approved", {})

    # Account B — flagged, rejected, re-flagged
    b = _get_or_create_flow("demo_account_B")
    b["risk_score"]           = 83
    b["reflag_count"]         = 2
    b["rejection_count"]      = 1
    b["flagged_by_analyst"]   = True
    b["supervisor_decision"]  = "rejected"
    b["panic"]                = True
    _append_history(b, "analyst_flag",       {"risk_score": 75})
    _append_history(b, "supervisor_rejected", {"rejection_count": 1})
    _append_history(b, "analyst_flag",       {"risk_score": 83, "reflag_count": 2})

    # Account C — AI detects, analyst ignores
    c = _get_or_create_flow("demo_account_C")
    c["risk_score"]   = 78
    c["ai_flag_count"] = 4
    c["panic"]         = True
    _append_history(c, "ai_detection",  {"ai_flag_count": 1})
    _append_history(c, "ai_detection",  {"ai_flag_count": 2})
    _append_history(c, "ai_escalation", {
        "ai_flag_count": 3,
        "alert": "Analyst ignored AI detection — risk escalated",
    })
    _append_history(c, "ai_escalation", {
        "ai_flag_count": 4,
        "alert": "Analyst ignored AI detection — risk escalated",
    })


_seed_demo_flows()
