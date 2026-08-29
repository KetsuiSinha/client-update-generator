from datetime import datetime, UTC
from typing import Optional
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Index, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    tone_profile_id = Column(Integer, ForeignKey("tone_profiles.id"), nullable=True)
    delivery_preference = Column(String(50), default="manual")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    user = relationship("User", back_populates="clients")
    tone_profile = relationship("ToneProfile")
    project_links = relationship("ClientProjectLink", back_populates="client")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    clients = relationship("Client", back_populates="user")
    integrations = relationship("Integration", back_populates="user")


class Integration(Base):
    __tablename__ = "integrations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    provider = Column(String(50), nullable=False)  # github, linear, slack, trello, etc.
    access_token_encrypted = Column(Text, nullable=False)
    refresh_token_encrypted = Column(Text, nullable=True)
    scope_config = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    last_sync = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    user = relationship("User", back_populates="integrations")
    project_links = relationship("ClientProjectLink", back_populates="integration")


class ClientProjectLink(Base):
    __tablename__ = "client_project_links"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    integration_id = Column(Integer, ForeignKey("integrations.id"), nullable=False)
    external_project_ref = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    client = relationship("Client", back_populates="project_links")
    integration = relationship("Integration", back_populates="project_links")


class ToneProfile(Base):
    __tablename__ = "tone_profiles"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False, unique=True)
    examples = Column(Text, nullable=True)
    style_descriptors = Column(Text, nullable=True)
    embedding = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    client = relationship("Client", back_populates="tone_profile")


class ActivityEventType(str, enum.Enum):
    COMMIT = "commit"
    PULL_REQUEST = "pull_request"
    ISSUE = "issue"
    CARD_MOVE = "card_move"
    CARD_CREATE = "card_create"
    CARD_UPDATE = "card_update"
    MESSAGE = "message"
    DEPLOY = "deploy"
    REVIEW = "review"


class ActivityEvent(Base):
    __tablename__ = "activity_events"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False, index=True)
    source = Column(String(50), nullable=False)
    type = Column(SQLEnum(ActivityEventType), nullable=False)
    summary = Column(Text, nullable=False)
    actor = Column(String(255))
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    relevance_score = Column(Integer, default=0)
    raw_ref = Column(String(255))
    processed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    client = relationship("Client")


class DraftStatus(str, enum.Enum):
    DRAFT = "draft"
    EDITED = "edited"
    SENT = "sent"


class Draft(Base):
    __tablename__ = "drafts"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False, index=True)
    week_of = Column(DateTime(timezone=True), nullable=False, index=True)
    content = Column(Text, nullable=False)
    status = Column(SQLEnum(DraftStatus), default=DraftStatus.DRAFT, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))

    client = relationship("Client")


class DraftEdit(Base):
    __tablename__ = "draft_edits"

    id = Column(Integer, primary_key=True, index=True)
    draft_id = Column(Integer, ForeignKey("drafts.id"), nullable=False, index=True)
    diff = Column(Text, nullable=False)
    edited_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    draft = relationship("Draft")