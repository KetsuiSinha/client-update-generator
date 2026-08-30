from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from enum import Enum

from app.models import IntegrationProvider
from app.schemas.user import Token


class TokenData(BaseModel):
    email: Optional[str] = None


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None


class UserOut(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ClientBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    delivery_preference: Optional[str] = None


class ClientOut(ClientBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class IntegrationBase(BaseModel):
    provider: IntegrationProvider
    scope_config: Optional[dict] = None


class IntegrationCreate(IntegrationBase):
    access_token: str
    refresh_token: Optional[str] = None


class IntegrationOut(IntegrationBase):
    id: int
    user_id: int
    is_active: bool
    last_sync: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class ClientProjectLinkCreate(BaseModel):
    integration_id: int
    external_project_ref: str


class ClientProjectLinkOut(BaseModel):
    id: int
    client_id: int
    integration_id: int
    external_project_ref: str
    created_at: datetime

    class Config:
        from_attributes = True


class ToneProfileBase(BaseModel):
    examples: Optional[List[str]] = None
    style_descriptors: Optional[dict] = None


class ToneProfileCreate(ToneProfileBase):
    pass


class ToneProfileOut(ToneProfileBase):
    id: int
    client_id: int
    updated_at: datetime

    class Config:
        from_attributes = True


class ActivityEventBase(BaseModel):
    source: str
    type: str
    summary: str
    actor: Optional[str] = None
    raw_ref: Optional[str] = None


class ActivityEventCreate(ActivityEventBase):
    client_id: int
    timestamp: datetime


class ActivityEventOut(ActivityEventBase):
    id: int
    client_id: int
    relevance_score: int
    processed: bool
    created_at: datetime

    class Config:
        from_attributes = True


class DraftBase(BaseModel):
    content: str
    status: str = "draft"


class DraftCreate(DraftBase):
    client_id: int
    week_of: datetime


class DraftUpdate(BaseModel):
    content: Optional[str] = None
    status: Optional[str] = None


class DraftOut(DraftBase):
    id: int
    client_id: int
    week_of: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DraftStatus(str, Enum):
    DRAFT = "draft"
    EDITED = "edited"
    SENT = "sent"


class DraftEditOut(BaseModel):
    id: int
    draft_id: int
    diff: str
    edited_at: datetime

    class Config:
        from_attributes = True