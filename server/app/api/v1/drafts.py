from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from datetime import datetime, timedelta, timezone
from typing import List, Optional
import json

from app.core.config import settings
from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models import User, Client, ActivityEvent, Draft, ToneProfile, DraftStatus
from app.schemas import DraftCreate, DraftUpdate, DraftOut, DraftStatus
from app.services.ingestion import ingest_client_activity
from app.services.llm import generate_draft, format_draft_for_display

router = APIRouter()


@router.post("/clients/{client_id}/drafts/generate", response_model=DraftOut, status_code=status.HTTP_201_CREATED)
async def generate_draft_endpoint(
    client_id: int,
    week_of: Optional[datetime] = None,
    auto_ingest: bool = True,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate a draft update for a client.

    - Fetches recent activity (optionally runs ingestion first)
    - Applies relevance filtering
    - Generates draft using LLM with tone profile
    - Stores draft in database
    """
    # Verify client ownership
    result = await db.execute(
        select(Client).where(Client.id == client_id, Client.owner_id == current_user.id)
    )
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Determine week (defaults to last Monday)
    if not week_of:
        today = datetime.now(timezone.utc)
        days_since_monday = today.weekday()
        week_of = today - timedelta(days=days_since_monday)
        week_of = week_of.replace(hour=0, minute=0, second=0, microsecond=0)

    # Optionally run ingestion first
    if auto_ingest:
        await ingest_client_activity(client_id, db, weeks_back=1)

    # Fetch activity events for this client and week
    week_start = week_of
    week_end = week_of + timedelta(days=7)

    result = await db.execute(
        select(ActivityEvent).where(
            and_(
                ActivityEvent.client_id == client_id,
                ActivityEvent.timestamp >= week_start,
                ActivityEvent.timestamp < week_end,
                ActivityEvent.relevance_score >= 30,  # Only relevant events
            )
        ).order_by(desc(ActivityEvent.relevance_score), desc(ActivityEvent.timestamp))
    )
    events = result.scalars().all()

    # Convert to dict format for LLM
    activity_events = [
        {
            "type": event.type.value if hasattr(event.type, 'value') else str(event.type),
            "summary": event.summary,
            "actor": event.actor,
            "timestamp": event.timestamp,
            "relevance_score": event.relevance_score,
            "raw_payload": event.raw_payload,
        }
        for event in events
    ]

    # Get tone profile
    tone_profile = None
    if client.tone_profile_id:
        result = await db.execute(
            select(ToneProfile).where(ToneProfile.id == client.tone_profile_id)
        )
        tone_profile = result.scalar_one_or_none()

    # Generate draft using LLM
    draft_content = await generate_draft(
        client_name=client.name,
        week_of=week_of,
        activity_events=activity_events,
        tone_profile=tone_profile,
    )

    # Format as JSON string for storage
    content_json = json.dumps(draft_content, ensure_ascii=False, indent=2)

    # Check if draft already exists for this week
    result = await db.execute(
        select(Draft).where(
            and_(
                Draft.client_id == client_id,
                Draft.week_of == week_of,
            )
        )
    )
    existing_draft = result.scalar_one_or_none()

    if existing_draft:
        # Update existing draft
        existing_draft.content = content_json
        existing_draft.status = DraftStatus.DRAFT
        existing_draft.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(existing_draft)
        draft = existing_draft
    else:
        # Create new draft
        draft = Draft(
            owner_id=current_user.id,
            client_id=client_id,
            week_of=week_of,
            content=content_json,
            status=DraftStatus.DRAFT,
        )
        db.add(draft)
        await db.commit()
        await db.refresh(draft)

    return draft


@router.get("/clients/{client_id}/drafts", response_model=List[DraftOut])
async def list_drafts(
    client_id: int,
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """List drafts for a client."""
    # Verify client ownership
    result = await db.execute(
        select(Client).where(Client.id == client_id, Client.owner_id == current_user.id)
    )
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    result = await db.execute(
        select(Draft)
        .where(Draft.client_id == client_id)
        .order_by(desc(Draft.week_of))
        .limit(limit)
        .offset(offset)
    )
    drafts = result.scalars().all()
    return drafts


@router.get("/drafts/{draft_id}", response_model=DraftOut)
async def get_draft(
    draft_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single draft by ID."""
    result = await db.execute(
        select(Draft)
        .join(Client, Draft.client_id == Client.id)
        .where(Draft.id == draft_id, Client.owner_id == current_user.id)
    )
    draft = result.scalar_one_or_none()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    return draft


@router.patch("/drafts/{draft_id}", response_model=DraftOut)
async def update_draft(
    draft_id: int,
    draft_in: DraftUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a draft (user edits)."""
    result = await db.execute(
        select(Draft)
        .join(Client, Draft.client_id == Client.id)
        .where(Draft.id == draft_id, Client.owner_id == current_user.id)
    )
    draft = result.scalar_one_or_none()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    # Capture diff for feedback loop
    old_content = draft.content
    new_content = draft_in.content if draft_in.content is not None else draft.content

    # Simple diff (in production, use a proper diff library)
    diff = f"OLD:\n{old_content}\n\nNEW:\n{new_content}"

    # Update draft
    if draft_in.content is not None:
        draft.content = draft_in.content
    if draft_in.status is not None:
        draft.status = draft_in.status
    draft.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(draft)

    # TODO: Store diff in DraftEdit table for feedback loop

    return draft


@router.post("/drafts/{draft_id}/finalize", response_model=DraftOut)
async def finalize_draft(
    draft_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark draft as sent/finalized."""
    result = await db.execute(
        select(Draft)
        .join(Client, Draft.client_id == Client.id)
        .where(Draft.id == draft_id, Client.owner_id == current_user.id)
    )
    draft = result.scalar_one_or_none()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    draft.status = DraftStatus.SENT
    draft.sent_at = datetime.now(timezone.utc)
    draft.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(draft)

    return draft


@router.delete("/drafts/{draft_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_draft(
    draft_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a draft."""
    result = await db.execute(
        select(Draft)
        .join(Client, Draft.client_id == Client.id)
        .where(Draft.id == draft_id, Client.owner_id == current_user.id)
    )
    draft = result.scalar_one_or_none()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    await db.delete(draft)
    await db.commit()