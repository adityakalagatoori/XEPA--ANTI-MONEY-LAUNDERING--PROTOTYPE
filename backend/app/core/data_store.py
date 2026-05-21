import json
from copy import deepcopy
from pathlib import Path

from app.models import Account, Alert, AuditBlock, Case, Transaction, User
from app.services.audit import GENESIS_HASH, create_block
from app.services.detection import build_claude_prompt, generate_case_narrative, score_accounts, score_transactions


class DataStore:
    def __init__(self) -> None:
        self.data_path = Path(__file__).resolve().parent.parent / "data" / "seed_data.json"
        self.reset()

    def reset(self) -> None:
        raw = json.loads(self.data_path.read_text(encoding="utf-8"))
        self.users = [User(**item) for item in raw["users"]]
        self.cases = [Case(**item) for item in raw["cases"]]
        base_accounts = [Account(**item) for item in raw["accounts"]]
        base_transactions = [Transaction(**item) for item in raw["transactions"]]
        self.transactions = score_transactions(base_accounts, base_transactions)
        self.accounts = score_accounts(base_accounts, self.transactions)
        self.alerts = [Alert(**item) for item in raw["alerts"]]
        self.tokens: dict[str, User] = {}
        self.audit_blocks = self._seed_audit_blocks()

    def _seed_audit_blocks(self) -> dict[str, list[AuditBlock]]:
        blocks: dict[str, list[AuditBlock]] = {}
        for case in self.cases:
            case_blocks: list[AuditBlock] = []
            prev_hash = GENESIS_HASH
            seed_events = [
                ("case_created", {"title": case.title}),
                ("dataset_loaded", {"accounts": case.account_count, "alerts": case.alert_count}),
                ("risk_scored", {"risk_score": case.risk_score}),
                ("alerts_generated", {"case_id": case.id}),
            ]
            for index, (event_type, event_data) in enumerate(seed_events):
                block = create_block(case.id, index, prev_hash, event_type, event_data, case.assigned_to)
                prev_hash = block.this_hash
                case_blocks.append(block)
            blocks[case.id] = case_blocks
        return blocks

    def copy_case_bundle(self, case_id: str) -> dict:
        case_obj = next(case for case in self.cases if case.id == case_id)
        accounts = [account for account in self.accounts if account.case_id == case_id]
        transactions = [txn for txn in self.transactions if txn.case_id == case_id]
        return {
            "case": deepcopy(case_obj.model_dump()),
            "accounts": deepcopy([item.model_dump() for item in accounts]),
            "transactions": deepcopy([item.model_dump() for item in transactions]),
        }

    def append_audit_event(self, case_id: str, event_type: str, event_data: dict, investigator_id: str) -> AuditBlock:
        blocks = self.audit_blocks.setdefault(case_id, [])
        prev_hash = blocks[-1].this_hash if blocks else GENESIS_HASH
        block = create_block(case_id, len(blocks), prev_hash, event_type, event_data, investigator_id)
        blocks.append(block)
        return block

    def narrative_for_account(self, case_id: str, account_id: str) -> str:
        account = next(acc for acc in self.accounts if acc.id == account_id and acc.case_id == case_id)
        related = [txn for txn in self.transactions if txn.from_account == account_id or txn.to_account == account_id]
        return generate_case_narrative(account, related)

    def narrative_context(self, case_id: str, account_id: str) -> tuple[Account, list[Transaction], str]:
        account = next(acc for acc in self.accounts if acc.id == account_id and acc.case_id == case_id)
        related = [txn for txn in self.transactions if txn.from_account == account_id or txn.to_account == account_id]
        return account, related, build_claude_prompt(account, related)


store = DataStore()
