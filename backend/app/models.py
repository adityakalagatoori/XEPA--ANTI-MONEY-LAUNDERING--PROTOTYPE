from typing import Literal

from pydantic import BaseModel, Field


class User(BaseModel):
    id: str
    email: str
    role: str
    name: str


class Case(BaseModel):
    id: str
    title: str
    status: str
    risk_score: int
    alert_count: int
    account_count: int
    assigned_to: str
    created_at: str
    summary: str


class Account(BaseModel):
    id: str
    case_id: str
    account_number: str
    holder_name: str
    country: str
    city: str
    ip_address: str
    phone: str
    email: str
    linked_device: str
    baseline_country: str
    is_flagged: bool = False
    flag_reason: str | None = None
    flag_severity: str | None = None
    flag_updated_by: str | None = None
    flag_timestamp: str | None = None
    risk_score: int = 0
    risk_band: str = "LOW"
    reasons: list[str] = Field(default_factory=list)
    ml_probability: float = 0.0


class Transaction(BaseModel):
    id: str
    case_id: str
    from_account: str
    to_account: str
    amount: float
    currency: str
    timestamp: str
    origin_country: str
    destination_country: str
    channel: str
    note: str
    rule_score: int = 0
    ml_score: float = 0.0
    final_score: int = 0
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"] = "LOW"
    reasons: list[str] = Field(default_factory=list)


class Alert(BaseModel):
    id: str
    case_id: str
    account_id: str
    severity: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    title: str
    message: str
    created_at: str
    acknowledged: bool = False
    acknowledged_by: str | None = None
    acknowledged_at: str | None = None


class AuditBlock(BaseModel):
    block_index: int
    case_id: str
    prev_hash: str
    this_hash: str
    event_type: str
    event_data: dict
    investigator_id: str
    timestamp: str
    tampered: bool = False
