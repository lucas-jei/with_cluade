from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class PostCreate(BaseModel):
    title: str
    content: str
    category: str = '일반'


class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None


class AttachmentResponse(BaseModel):
    id: int
    post_id: int
    filename: str
    file_size: int
    mime_type: str
    created_at: datetime

    model_config = {"from_attributes": True}


class PostResponse(BaseModel):
    id: int
    title: str
    content: str
    category: str
    user_id: int
    username: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    attachments: list[AttachmentResponse] = []

    model_config = {"from_attributes": True}
