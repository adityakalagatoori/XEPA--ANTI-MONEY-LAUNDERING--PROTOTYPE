import secrets

from fastapi import APIRouter, HTTPException

from app.core.data_store import store
from app.schemas import LoginRequest


router = APIRouter(tags=["auth"])


@router.post("/auth/login")
def login(payload: LoginRequest) -> dict:
    user = next((user for user in store.users if user.email == payload.email), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    token = secrets.token_urlsafe(24)
    store.tokens[token] = user
    return {"token": token, "user": user.model_dump()}

