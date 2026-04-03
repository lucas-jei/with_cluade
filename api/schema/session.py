from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class SessionResponse(BaseModel):
    id: int
    user_id: int
    session_id: str
    is_active: bool
    ip_address: Optional[str]
    user_agent: Optional[str]
    created_at: datetime
    expires_at: datetime
    username: Optional[str] = None
    email: Optional[str] = None

    model_config = {"from_attributes": True}
