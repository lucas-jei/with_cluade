from sqlalchemy.orm import Session
from model import CommonCodeGroup, CommonCode
from schema import CommonCodeGroupCreate, CommonCodeGroupUpdate, CommonCodeCreate, CommonCodeUpdate


# ── 그룹 ──────────────────────────────────────────────

def get_groups(db: Session) -> list:
    return db.query(CommonCodeGroup).order_by(CommonCodeGroup.code).all()


def get_group(db: Session, group_id: int) -> CommonCodeGroup | None:
    return db.query(CommonCodeGroup).filter(CommonCodeGroup.id == group_id).first()


def get_group_by_code(db: Session, code: str) -> CommonCodeGroup | None:
    return db.query(CommonCodeGroup).filter(CommonCodeGroup.code == code).first()


def create_group(db: Session, data: CommonCodeGroupCreate) -> CommonCodeGroup:
    group = CommonCodeGroup(**data.model_dump())
    db.add(group)
    db.commit()
    db.refresh(group)
    return group


def update_group(db: Session, group_id: int, data: CommonCodeGroupUpdate) -> CommonCodeGroup | None:
    group = get_group(db, group_id)
    if not group:
        return None
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(group, field, value)
    db.commit()
    db.refresh(group)
    return group


def delete_group(db: Session, group_id: int) -> bool:
    group = get_group(db, group_id)
    if not group:
        return False
    db.delete(group)
    db.commit()
    return True


# ── 자식코드 ───────────────────────────────────────────

def get_codes(db: Session, group_id: int = None, group_code: str = None, active_only: bool = False) -> list:
    q = db.query(CommonCode)
    if group_id:
        q = q.filter(CommonCode.group_id == group_id)
    elif group_code:
        group = get_group_by_code(db, group_code)
        if not group:
            return []
        q = q.filter(CommonCode.group_id == group.id)
    if active_only:
        q = q.filter(CommonCode.is_active == True)
    return q.order_by(CommonCode.sort_order, CommonCode.id).all()


def get_code(db: Session, code_id: int) -> CommonCode | None:
    return db.query(CommonCode).filter(CommonCode.id == code_id).first()


def create_code(db: Session, data: CommonCodeCreate) -> CommonCode:
    code = CommonCode(**data.model_dump())
    db.add(code)
    db.commit()
    db.refresh(code)
    return code


def update_code(db: Session, code_id: int, data: CommonCodeUpdate) -> CommonCode | None:
    code = get_code(db, code_id)
    if not code:
        return None
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(code, field, value)
    db.commit()
    db.refresh(code)
    return code


def delete_code(db: Session, code_id: int) -> bool:
    code = get_code(db, code_id)
    if not code:
        return False
    db.delete(code)
    db.commit()
    return True


def seed_codes(db: Session):
    group = get_group_by_code(db, 'BOARD_CATEGORY')
    if not group:
        group = CommonCodeGroup(code='BOARD_CATEGORY', name='게시판구분')
        db.add(group)
        db.flush()
        defaults = [('일반', 0), ('공지', 1), ('질문', 2), ('자유', 3)]
        for name, order in defaults:
            db.add(CommonCode(group_id=group.id, code=name, name=name, sort_order=order))
        db.commit()
