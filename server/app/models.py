from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class UserRole(str, enum.Enum):
    FREE = "free"
    PRO = "pro"
    AGENCY = "agency"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    role = Column(SQLEnum(UserRole), default=UserRole.FREE)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    clients = relationship("Client", back_populates="owner")
    integrations = relationship("Integration", back_populates="owner")
    tone_profiles = relationship("ToneProfile", back_populates="owner")
    drafts = relationship("Draft", back_populates="owner")
    draft_edits = relationship("DraftEdit", back_populates="editor")


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    tone_profile_id = Column(Integer, ForeignKey("tone_profiles.id"), nullable=True)
    delivery_preference = Column(String, default="manual")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="clients")
    tone_profile = relationship("ToneProfile", back_populates="clients")
    integrations = relationship("ClientIntegration", back_populates="client")
    drafts = relationship("Draft", back_populates="client")


class IntegrationProvider(str, enum.Enum):
    GITHUB = "github"
    LINEAR = "linear"
    SLACK = "slack"
    TRELLO = "trello"
    ASANA = "asana"


class Integration(Base):
    __tablename__ = "integrations"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    provider = Column(SQLEnum(IntegrationProvider), nullable=False)
    access_token = Column(Text, nullable=False)
    refresh_token = Column(Text, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    scopes = Column(Text, nullable=True)
    metadata = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="integrations")
    client_links = relationship("ClientIntegration", back_populates="integration")


class ClientIntegration(Base):
    __tablename__ = "client_integrations"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    integration_id = Column(Integer, ForeignKey("integrations.id"), nullable=False)
    external_project_ref = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    client = relationship("Client", back_populates="integrations")
    integration = relationship("Integration", back_populates="client_links")


class ToneProfile(Base):
    __tablename__ = "tone_profiles"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    example_updates = Column(Text, nullable=True)
    style_vector = Column(Text, nullable=True)
    formality_level = Column(Integer, default=5)
    verbosity_level = Column(Integer, default=5)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="tone_profiles")
    clients = relationship("Client", back_populates="tone_profile")


class ActivityEvent(Base):
    __tablename__ = "activity_events"

    id = Column(Integer, primary_key=True, index=True)
    integration_id = Column(Integer, ForeignKey("integrations.id"), nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True)
    source = Column(String, nullable=False)
    event_type = Column(String, nullable=False)
    summary = Column(Text, nullable=False)
    actor = Column(String, nullable=True)
    raw_payload = Column(Text, nullable=True)
    relevance_score = Column(Integer, default=0)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Draft(Base):
    __tablename__ = "drafts"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    week_of = Column(DateTime(timezone=True), nullable=False)
    status = Column(String, default="draft")
    content = Column(Text, nullable=False)
    raw_content = Column(Text, nullable=True)
    relevance_scores = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    sent_at = Column(DateTime(timezone=True), nullable=True)

    owner = relationship("User", back_populates="drafts")
    client = relationship("Client", back_populates="drafts")
    edits = relationship("DraftEdit", back_populates="draft")


class DraftEdit(Base):
    __tablename__ = "draft_edits"

    id = Column(Integer, primary_key=True, index=True)
    draft_id = Column(Integer, ForeignKey("drafts.id"), nullable=False)
    editor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    diff = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    draft = relationship("Draft", back_populates="edits")
    editor = relationship("User", back_populates="draft_edits")