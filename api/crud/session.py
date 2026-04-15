from sqlalchemy.orm import Session
from model import User, UserSession
from datetime import datetime, timezone


def create_session(db: Session, user_id: int, session_id: str, expires_at,
                   ip_address: str = None, user_agent: str = None) -> UserSession:
    session = UserSession(
        user_id=user_id,
        session_id=session_id,
        expires_at=expires_at,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_session(db: Session, session_id: str) -> UserSession | None:
    return db.query(UserSession).filter(UserSession.session_id == session_id).first()


def extend_session(db: Session, session_id: str, expires_at) -> None:
    session = get_session(db, session_id)
    if session:
        session.expires_at = expires_at
        db.commit()


def deactivate_session(db: Session, session_id: str) -> bool:
    session = get_session(db, session_id)
    if not session:
        return False
    session.is_active = False
    db.commit()
    return True


def get_user_sessions(db: Session, user_id: int) -> list:
    return (
        db.query(UserSession)
        .filter(UserSession.user_id == user_id)
        .order_by(UserSession.created_at.desc())
        .all()
    )


def get_all_sessions(db: Session) -> list:
    now = datetime.now(timezone.utc)
    rows = (
        db.query(UserSession, User.username, User.email)
        .join(User, UserSession.user_id == User.id)
        .filter(UserSession.expires_at > now)
        .order_by(UserSession.created_at.desc())
        .all()
    )
    result = []
    for s, username, email in rows:
        s.username = username
        s.email = email
        result.append(s)
    return result
