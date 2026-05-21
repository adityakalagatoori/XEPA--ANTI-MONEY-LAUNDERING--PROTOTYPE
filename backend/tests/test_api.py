from fastapi.testclient import TestClient

from app.core.data_store import store
from app.main import create_app


client = TestClient(create_app())


def setup_function() -> None:
    store.reset()


def login_headers() -> dict[str, str]:
    response = client.post("/api/auth/login", json={"email": "analyst@xepa.local"})
    assert response.status_code == 200
    token = response.json()["token"]
    return {"Authorization": f"Bearer {token}"}


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_case_bundle() -> None:
    headers = login_headers()
    response = client.get("/api/cases/case-1", headers=headers)
    assert response.status_code == 200
    payload = response.json()
    assert payload["case"]["id"] == "case-1"
    assert len(payload["accounts"]) >= 4
    assert len(payload["transactions"]) >= 4


def test_flag_account() -> None:
    headers = login_headers()
    response = client.post(
        "/api/cases/case-1/flag-account",
        headers=headers,
        json={
            "account_id": "acc-2",
            "reason": "Rapid structuring observed",
            "severity": "HIGH",
            "confirmation": "CONFIRM",
        },
    )
    assert response.status_code == 200
    assert response.json()["account"]["is_flagged"] is True


def test_audit_tamper_detection() -> None:
    headers = login_headers()
    verify_before = client.post("/api/audit/case-1/verify", headers=headers)
    assert verify_before.json()["valid"] is True
    client.post("/api/audit/case-1/tamper", headers=headers)
    verify_after = client.post("/api/audit/case-1/verify", headers=headers)
    assert verify_after.json()["valid"] is False
