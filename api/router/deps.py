from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from datetime import datetime, timezone
from jose import jwt, JWTError
import os
import crud

bearer_scheme = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, os.getenv("JWT_SECRET_KEY"), algorithms=["HS256"])
        session_id: str = payload.get("session_id")
        user_id: int = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="인증 정보가 유효하지 않습니다.")

    session = crud.get_session(db, session_id)
    if not session or not session.is_active or session.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="세션이 만료되었거나 로그아웃된 상태입니다.")

    user = crud.get_user(db, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="사용자를 찾을 수 없습니다.")
    return user

def get_admin_user(current_user=Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")
    return current_user
