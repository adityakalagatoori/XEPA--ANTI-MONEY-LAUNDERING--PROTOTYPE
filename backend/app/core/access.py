from app.core.data_store import store
from app.models import User


def accessible_case_ids(user: User) -> set[str]:
    if user.role == "supervisor":
        return {account.case_id for account in store.accounts if account.is_flagged}
    return {case.id for case in store.cases if case.assigned_to == user.id}
