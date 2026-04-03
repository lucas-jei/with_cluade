from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from typing import Optional
from sqlalchemy.orm import Session
from database import get_db
from router.deps import get_current_user
import crud
from schema import PostCreate, PostUpdate, PostResponse, AttachmentResponse
import uuid, os

router = APIRouter(prefix="/posts", tags=["posts"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB


@router.get("/count")
def get_posts_count(category: Optional[str] = None, search: Optional[str] = None, db: Session = Depends(get_db)):
    return {"total": crud.count_posts(db, category, search)}


@router.get("", response_model=list[PostResponse])
def list_posts(skip: int = 0, limit: int = 10, category: Optional[str] = None, search: Optional[str] = None, db: Session = Depends(get_db)):
    return crud.get_posts(db, skip, limit, category, search)


@router.post("", response_model=PostResponse, status_code=201)
def create_post(post: PostCreate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.create_post(db, current_user.id, post)


@router.get("/{post_id}", response_model=PostResponse)
def get_post(post_id: int, db: Session = Depends(get_db)):
    post = crud.get_post(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    return post


@router.patch("/{post_id}", response_model=PostResponse)
def update_post(post_id: int, data: PostUpdate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    post = crud.update_post(db, post_id, current_user.id, data)
    if not post:
        raise HTTPException(status_code=403, detail="수정 권한이 없거나 게시글이 없습니다.")
    return post


@router.delete("/{post_id}", status_code=204)
def delete_post(post_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if not crud.delete_post(db, post_id, current_user.id, current_user.is_admin):
        raise HTTPException(status_code=403, detail="삭제 권한이 없거나 게시글이 없습니다.")


@router.post("/{post_id}/attachments", response_model=AttachmentResponse, status_code=201)
async def upload_attachment(post_id: int, file: UploadFile = File(...), current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    post = crud.get_post(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    if post.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="권한이 없습니다.")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="파일 크기는 20MB를 초과할 수 없습니다.")

    ext = os.path.splitext(file.filename)[1]
    stored_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, stored_name)

    with open(file_path, "wb") as f:
        f.write(content)

    return crud.create_attachment(
        db,
        post_id=post_id,
        filename=file.filename,
        stored_name=stored_name,
        file_size=len(content),
        mime_type=file.content_type or "application/octet-stream",
    )


@router.get("/attachments/{attachment_id}/view")
def view_attachment(attachment_id: int, db: Session = Depends(get_db)):
    att = crud.get_attachment(db, attachment_id)
    if not att:
        raise HTTPException(status_code=404, detail="첨부파일을 찾을 수 없습니다.")
    file_path = os.path.join(UPLOAD_DIR, att.stored_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="파일이 서버에 존재하지 않습니다.")
    return FileResponse(file_path, media_type=att.mime_type)


@router.get("/attachments/{attachment_id}/download")
def download_attachment(attachment_id: int, db: Session = Depends(get_db)):
    att = crud.get_attachment(db, attachment_id)
    if not att:
        raise HTTPException(status_code=404, detail="첨부파일을 찾을 수 없습니다.")
    file_path = os.path.join(UPLOAD_DIR, att.stored_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="파일이 서버에 존재하지 않습니다.")
    return FileResponse(file_path, filename=att.filename, media_type=att.mime_type)


@router.delete("/attachments/{attachment_id}", status_code=204)
def delete_attachment(attachment_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    att = crud.delete_attachment(db, attachment_id, current_user.id, current_user.is_admin)
    if not att:
        raise HTTPException(status_code=403, detail="삭제 권한이 없거나 파일이 없습니다.")
    file_path = os.path.join(UPLOAD_DIR, att.stored_name)
    if os.path.exists(file_path):
        os.remove(file_path)
