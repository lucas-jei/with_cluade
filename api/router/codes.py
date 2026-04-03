from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import crud
from schema import CommonCodeResponse

router = APIRouter(prefix="/codes", tags=["codes"])


@router.get("/{group_code}", response_model=list[CommonCodeResponse])
def get_codes(group_code: str, db: Session = Depends(get_db)):
    return crud.get_codes(db, group_code=group_code, active_only=True)
