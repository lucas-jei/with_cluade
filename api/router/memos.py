from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from router.deps import get_current_user
import crud
from schema import MemoCreate, MemoUpdate, MemoResponse

router = APIRouter(prefix="/memos", tags=["memos"])


@router.get("", response_model=list[MemoResponse])
def list_memos(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.get_memos(db, current_user.id)


@router.post("", response_model=MemoResponse, status_code=201)
def create_memo(data: MemoCreate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.create_memo(db, current_user.id, data)


@router.patch("/{memo_id}", response_model=MemoResponse)
def update_memo(memo_id: int, data: MemoUpdate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    memo = crud.update_memo(db, memo_id, current_user.id, data)
    if not memo:
        raise HTTPException(status_code=404, detail="메모를 찾을 수 없습니다.")
    return memo


@router.delete("/{memo_id}", status_code=204)
def delete_memo(memo_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    if not crud.delete_memo(db, memo_id, current_user.id):
        raise HTTPException(status_code=404, detail="메모를 찾을 수 없습니다.")
