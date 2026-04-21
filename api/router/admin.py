from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from sqlalchemy.orm import Session
from database import get_db
from router.deps import get_admin_user
import crud
from schema import (UserResponse, AdminUserUpdate, SessionResponse,
                     CommonCodeGroupCreate, CommonCodeGroupUpdate, CommonCodeGroupResponse,
                     CommonCodeCreate, CommonCodeUpdate, CommonCodeResponse,
                     PostResponse, PostUpdate)

router = APIRouter(prefix="/admin", tags=["admin"])


# ── 회원 관리 ─────────────────────────────────────────

@router.get("/users", response_model=list[UserResponse])
def admin_list_users(admin=Depends(get_admin_user), db: Session = Depends(get_db)):
    return crud.get_users_desc(db)


@router.get("/users/{user_id}", response_model=UserResponse)
def admin_get_user(user_id: int, admin=Depends(get_admin_user), db: Session = Depends(get_db)):
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    return user


@router.patch("/users/{user_id}", response_model=UserResponse)
def admin_update_user(user_id: int, data: AdminUserUpdate, admin=Depends(get_admin_user), db: Session = Depends(get_db)):
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    if data.is_active is not None:
        user.is_active = data.is_active
    if data.is_admin is not None:
        user.is_admin = data.is_admin
    db.commit()
    db.refresh(user)
    return user


@router.get("/users/{user_id}/sessions", response_model=list[SessionResponse])
def admin_get_user_sessions(user_id: int, admin=Depends(get_admin_user), db: Session = Depends(get_db)):
    return crud.get_user_sessions(db, user_id)


# ── 세션 관리 ─────────────────────────────────────────

@router.get("/sessions", response_model=list[SessionResponse])
def list_sessions(admin=Depends(get_admin_user), db: Session = Depends(get_db)):
    return crud.get_all_sessions(db)


@router.delete("/sessions/{session_id}", status_code=200)
def force_logout(session_id: str, admin=Depends(get_admin_user), db: Session = Depends(get_db)):
    if not crud.deactivate_session(db, session_id):
        raise HTTPException(status_code=404, detail="세션을 찾을 수 없습니다.")
    return {"message": "세션이 만료 처리되었습니다."}


# ── 공통코드 그룹 ─────────────────────────────────────

@router.get("/code-groups", response_model=list[CommonCodeGroupResponse])
def admin_list_groups(admin=Depends(get_admin_user), db: Session = Depends(get_db)):
    return crud.get_groups(db)


@router.post("/code-groups", response_model=CommonCodeGroupResponse, status_code=201)
def admin_create_group(data: CommonCodeGroupCreate, admin=Depends(get_admin_user), db: Session = Depends(get_db)):
    if crud.get_group_by_code(db, data.code):
        raise HTTPException(status_code=409, detail=f"'{data.code}' 코드는 이미 사용 중입니다.")
    return crud.create_group(db, data)


@router.patch("/code-groups/{group_id}", response_model=CommonCodeGroupResponse)
def admin_update_group(group_id: int, data: CommonCodeGroupUpdate, admin=Depends(get_admin_user), db: Session = Depends(get_db)):
    group = crud.update_group(db, group_id, data)
    if not group:
        raise HTTPException(status_code=404, detail="그룹을 찾을 수 없습니다.")
    return group


@router.delete("/code-groups/{group_id}", status_code=204)
def admin_delete_group(group_id: int, admin=Depends(get_admin_user), db: Session = Depends(get_db)):
    if not crud.delete_group(db, group_id):
        raise HTTPException(status_code=404, detail="그룹을 찾을 수 없습니다.")


@router.get("/code-groups/{group_id}/codes", response_model=list[CommonCodeResponse])
def admin_list_codes(group_id: int, admin=Depends(get_admin_user), db: Session = Depends(get_db)):
    return crud.get_codes(db, group_id=group_id)


# ── 공통코드 자식 ─────────────────────────────────────

@router.post("/codes", response_model=CommonCodeResponse, status_code=201)
def admin_create_code(data: CommonCodeCreate, admin=Depends(get_admin_user), db: Session = Depends(get_db)):
    return crud.create_code(db, data)


@router.patch("/codes/{code_id}", response_model=CommonCodeResponse)
def admin_update_code(code_id: int, data: CommonCodeUpdate, admin=Depends(get_admin_user), db: Session = Depends(get_db)):
    code = crud.update_code(db, code_id, data)
    if not code:
        raise HTTPException(status_code=404, detail="코드를 찾을 수 없습니다.")
    return code


@router.delete("/codes/{code_id}", status_code=204)
def admin_delete_code(code_id: int, admin=Depends(get_admin_user), db: Session = Depends(get_db)):
    if not crud.delete_code(db, code_id):
        raise HTTPException(status_code=404, detail="코드를 찾을 수 없습니다.")


# ── 게시글 관리 ───────────────────────────────────────

@router.get("/posts/count")
def admin_count_posts(category: Optional[str] = None, search: Optional[str] = None,
                      admin=Depends(get_admin_user), db: Session = Depends(get_db)):
    return {"total": crud.count_posts(db, category, search)}


@router.get("/posts", response_model=list[PostResponse])
def admin_list_posts(skip: int = 0, limit: int = 20, category: Optional[str] = None,
                     search: Optional[str] = None, admin=Depends(get_admin_user), db: Session = Depends(get_db)):
    return crud.get_posts(db, skip, limit, category, search)


@router.patch("/posts/{post_id}", response_model=PostResponse)
def admin_update_post(post_id: int, data: PostUpdate, admin=Depends(get_admin_user), db: Session = Depends(get_db)):
    post = crud.admin_update_post(db, post_id, data)
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    return post


@router.delete("/posts/{post_id}", status_code=204)
def admin_delete_post(post_id: int, admin=Depends(get_admin_user), db: Session = Depends(get_db)):
    if not crud.delete_post(db, post_id, user_id=0, is_admin=True):
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
