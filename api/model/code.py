from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base


class CommonCodeGroup(Base):
    __tablename__ = "common_code_groups"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CommonCode(Base):
    __tablename__ = "common_codes"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("common_code_groups.id"), nullable=False)
    code = Column(String, nullable=False)
    name = Column(String, nullable=False)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
