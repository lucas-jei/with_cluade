from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class CommonCodeGroupCreate(BaseModel):
    code: str
    name: str


class CommonCodeGroupUpdate(BaseModel):
    name: Optional[str] = None


class CommonCodeGroupResponse(BaseModel):
    id: int
    code: str
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class CommonCodeCreate(BaseModel):
    group_id: int
    code: str
    name: str
    sort_order: int = 0
    is_active: bool = True


class CommonCodeUpdate(BaseModel):
    name: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class CommonCodeResponse(BaseModel):
    id: int
    group_id: int
    code: str
    name: str
    sort_order: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
