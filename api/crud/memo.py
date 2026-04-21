from sqlalchemy.orm import Session
from model import Memo
from schema import MemoCreate, MemoUpdate


def get_memos(db: Session, user_id: int) -> list:
    return db.query(Memo).filter(Memo.user_id == user_id).order_by(Memo.updated_at.desc().nullslast(), Memo.created_at.desc()).all()


def get_memo(db: Session, memo_id: int, user_id: int) -> Memo | None:
    return db.query(Memo).filter(Memo.id == memo_id, Memo.user_id == user_id).first()


def create_memo(db: Session, user_id: int, data: MemoCreate) -> Memo:
    memo = Memo(user_id=user_id, title=data.title, content=data.content)
    db.add(memo)
    db.commit()
    db.refresh(memo)
    return memo


def update_memo(db: Session, memo_id: int, user_id: int, data: MemoUpdate) -> Memo | None:
    memo = get_memo(db, memo_id, user_id)
    if not memo:
        return None
    if data.title is not None:
        memo.title = data.title
    if data.content is not None:
        memo.content = data.content
    db.commit()
    db.refresh(memo)
    return memo


def delete_memo(db: Session, memo_id: int, user_id: int) -> bool:
    memo = get_memo(db, memo_id, user_id)
    if not memo:
        return False
    db.delete(memo)
    db.commit()
    return True
