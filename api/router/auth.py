from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
import secrets
import os
from model import PasswordReset
import crud
from email_utils import send_reset_email
from schema import LoginRequest, TokenResponse, ForgotPasswordRequest, ResetPasswordRequest

router = APIRouter(prefix="/auth", tags=["auth"])
bearer_scheme = HTTPBearer()


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, req.email)
    if not user or not crud.verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다.")

    session_id = secrets.token_urlsafe(32)
    expire = datetime.now(timezone.utc) + timedelta(minutes=int(os.getenv("JWT_EXPIRE_MINUTES", 60)))

    crud.create_session(
        db, user.id, session_id, expire,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent"),
    )

    token = jwt.encode(
        {"sub": str(user.id), "session_id": session_id, "exp": expire},
        os.getenv("JWT_SECRET_KEY"),
        algorithm="HS256",
    )
    return {"access_token": token}


@router.post("/logout", status_code=200)
def logout(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    try:
        payload = jwt.decode(credentials.credentials, os.getenv("JWT_SECRET_KEY"), algorithms=["HS256"])
        session_id = payload.get("session_id")
        if session_id:
            crud.deactivate_session(db, session_id)
    except JWTError:
        pass
    return {"message": "로그아웃 되었습니다."}


@router.post("/forgot-password", status_code=200)
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, req.email)
    if user:
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)
        db.query(PasswordReset).filter(
            PasswordReset.user_id == user.id,
            PasswordReset.used == False
        ).delete()
        db.add(PasswordReset(user_id=user.id, token=token, expires_at=expires_at))
        db.commit()
        reset_link = f"{os.getenv('FRONTEND_URL')}/reset-password?token={token}"
        send_reset_email(user.email, reset_link)
    return {"message": "이메일이 발송되었습니다."}


@router.post("/reset-password", status_code=200)
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    record = db.query(PasswordReset).filter(
        PasswordReset.token == req.token,
        PasswordReset.used == False
    ).first()
    if not record or record.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="유효하지 않거나 만료된 링크입니다.")
    user = crud.get_user(db, record.user_id)
    user.hashed_password = crud.hash_password(req.password)
    record.used = True
    db.commit()
    return {"message": "비밀번호가 변경되었습니다."}
