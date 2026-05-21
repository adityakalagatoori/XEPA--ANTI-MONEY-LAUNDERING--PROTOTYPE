from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from app.core.access import accessible_case_ids
from app.core.data_store import store
from app.dependencies import get_current_user
from app.models import User
from app.schemas import AlertAcknowledgeRequest


router = APIRouter(tags=["alerts"])


@router.get("/alerts")
def list_alerts(user: User = Depends(get_current_user), severity: str | None = None) -> dict:
    allowed_ids = accessible_case_ids(user)
    alerts = [alert for alert in store.alerts if alert.case_id in allowed_ids]
    if severity:
        alerts = [alert for alert in alerts if alert.severity == severity.upper()]
    alerts = sorted(alerts, key=lambda item: item.created_at, reverse=True)
    return {"alerts": [alert.model_dump() for alert in alerts]}


@router.post("/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str, payload: AlertAcknowledgeRequest, user: User = Depends(get_current_user)) -> dict:
    alert = next((item for item in store.alerts if item.id == alert_id), None)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.acknowledged = True
    alert.acknowledged_by = user.id
    alert.acknowledged_at = datetime.utcnow().isoformat()
    store.append_audit_event(alert.case_id, "alert_acknowledged", {"alert_id": alert.id, "note": payload.note}, user.id)
    return {"success": True, "alert": alert.model_dump()}
