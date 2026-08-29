from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ClientBase(BaseModel):
    name: str
    delivery_preference: Optional[str] = "manual"


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    tone_profile_id: Optional[int] = None
    delivery_preference: Optional[str] = None


class ClientResponse(ClientBase):
    id: int
    owner_id: int
    tone_profile_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True