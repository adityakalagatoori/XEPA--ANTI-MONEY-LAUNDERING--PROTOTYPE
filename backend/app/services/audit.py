import hashlib
import json
from datetime import datetime

from app.models import AuditBlock


GENESIS_HASH = "0" * 64


def hash_block(prev_hash: str, timestamp: str, event_type: str, event_data: dict, investigator_id: str) -> str:
    payload = json.dumps(
        {
            "prev_hash": prev_hash,
            "timestamp": timestamp,
            "event_type": event_type,
            "event_data": event_data,
            "investigator_id": investigator_id,
        },
        sort_keys=True,
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def create_block(case_id: str, index: int, prev_hash: str, event_type: str, event_data: dict, investigator_id: str) -> AuditBlock:
    timestamp = datetime.utcnow().isoformat()
    return AuditBlock(
        block_index=index,
        case_id=case_id,
        prev_hash=prev_hash,
        this_hash=hash_block(prev_hash, timestamp, event_type, event_data, investigator_id),
        event_type=event_type,
        event_data=event_data,
        investigator_id=investigator_id,
        timestamp=timestamp,
    )


def verify_chain(blocks: list[AuditBlock]) -> dict:
    for index, block in enumerate(blocks):
        expected_prev = GENESIS_HASH if index == 0 else blocks[index - 1].this_hash
        expected_hash = hash_block(
            expected_prev,
            block.timestamp,
            block.event_type,
            block.event_data,
            block.investigator_id,
        )
        if block.prev_hash != expected_prev or block.this_hash != expected_hash:
            return {
                "valid": False,
                "blocks_verified": index,
                "tampered_at_block": block.block_index,
                "message": f"Hash mismatch at block {block.block_index}",
            }

    return {
        "valid": True,
        "blocks_verified": len(blocks),
        "message": "Chain integrity verified",
    }
