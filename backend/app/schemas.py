from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str


class NarrativeRequest(BaseModel):
    account_id: str


class FlagAccountRequest(BaseModel):
    account_id: str
    reason: str = Field(min_length=3)
    severity: str = Field(default="HIGH")
    confirmation: str


class AlertAcknowledgeRequest(BaseModel):
    note: str = ""
