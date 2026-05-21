from fastapi import Header, HTTPException

from app.core.data_store import store
from app.models import User


def get_current_user(authorization: str | None = Header(default=None)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    token = authorization.replace("Bearer ", "", 1)
    user = store.tokens.get(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user

