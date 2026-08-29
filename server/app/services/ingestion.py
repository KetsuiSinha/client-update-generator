"""
Activity Ingestion Service

Background job that pulls activity from connected integrations (GitHub, etc.),
normalizes it, applies relevance filtering, and stores as ActivityEvent records.
"""

from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.dialects.sqlite import insert as sqlite_insert

from app.models import Integration, Client, ClientProjectLink, ActivityEvent, ActivityEventType
from app.services.github import (
    create_github_client,
    normalize_commit,
    normalize_pull_request,
    normalize_issue,
    normalize_release,
)
from app.services.relevance import calculate_relevance

logger = logging.getLogger(__name__)


async def ingest_client_activity(
    client_id: int,
    db: AsyncSession,
    weeks_back: int = 1,
) -> Dict[str, int]:
    """
    Ingest activity for a specific client from all their connected integrations.

    Returns summary: {events_fetched, events_stored, events_filtered_out, errors}
    """
    summary = {
        "events_fetched": 0,
        "events_stored": 0,
        "events_filtered_out": 0,
        "errors": 0,
    }

    # Get all active GitHub integrations for this client
    result = await db.execute(
        select(Integration, ClientProjectLink)
        .join(ClientProjectLink, Integration.id == ClientProjectLink.integration_id)
        .where(
            ClientProjectLink.client_id == client_id,
            Integration.provider == "github",
            Integration.is_active == True,
        )
    )
    integrations = result.all()

    if not integrations:
        logger.info(f"No active GitHub integrations for client {client_id}")
        return summary

    # Calculate date range
    since = datetime.now(timezone.utc) - timedelta(weeks=weeks_back)

    for integration, project_link in integrations:
        try:
            client_summary = await _ingest_github_integration(
                integration, project_link, client_id, since, db
            )
            summary["events_fetched"] += client_summary["events_fetched"]
            summary["events_stored"] += client_summary["events_stored"]
            summary["events_filtered_out"] += client_summary["events_filtered_out"]
        except Exception as e:
            logger.error(f"Error ingesting for integration {integration.id}: {e}")
            summary["errors"] += 1

    await db.commit()
    logger.info(f"Ingestion complete for client {client_id}: {summary}")
    return summary


async def _ingest_github_integration(
    integration: Integration,
    project_link: ClientProjectLink,
    client_id: int,
    since: datetime,
    db: AsyncSession,
) -> Dict[str, int]:
    """Ingest activity from a single GitHub integration."""
    summary = {
        "events_fetched": 0,
        "events_stored": 0,
        "events_filtered_out": 0,
    }

    # Create GitHub client
    github_client = await create_github_client(integration.access_token_encrypted)

    try:
        # Parse external_project_ref (format: "owner/repo")
        external_ref = project_link.external_project_ref
        if "/" not in external_ref:
            logger.warning(f"Invalid external_project_ref format: {external_ref}")
            return summary

        owner, repo = external_ref.split("/", 1)

        # Fetch commits
        commits = await github_client.get_repo_commits(owner, repo, since=since)
        summary["events_fetched"] += len(commits)

        for commit in commits:
            normalized = normalize_commit(commit, external_ref)
            await _store_activity_event(normalized, client_id, integration.id, db, summary)

        # Fetch pull requests
        prs = await github_client.get_repo_pull_requests(owner, repo)
        # Filter by updated date
        filtered_prs = [
            pr for pr in prs
            if pr.get("updated_at") and datetime.fromisoformat(pr["updated_at"].replace("Z", "+00:00")) >= since
        ]
        summary["events_fetched"] += len(filtered_prs)

        for pr in filtered_prs:
            normalized = normalize_pull_request(pr, external_ref)
            await _store_activity_event(normalized, client_id, integration.id, db, summary)

        # Fetch issues
        issues = await github_client.get_repo_issues(owner, repo, since=since)
        summary["events_fetched"] += len(issues)

        for issue in issues:
            normalized = normalize_issue(issue, external_ref)
            await _store_activity_event(normalized, client_id, integration.id, db, summary)

        # Fetch releases
        releases = await github_client.get_repo_releases(owner, repo)
        filtered_releases = [
            r for r in releases
            if r.get("published_at") and datetime.fromisoformat(r["published_at"].replace("Z", "+00:00")) >= since
        ]
        summary["events_fetched"] += len(filtered_releases)

        for release in filtered_releases:
            normalized = normalize_release(release, external_ref)
            await _store_activity_event(normalized, client_id, integration.id, db, summary)

        # Update last_sync
        integration.last_sync = datetime.now(timezone.utc)

    finally:
        await github_client.close()

    return summary


async def _store_activity_event(
    normalized: Dict[str, Any],
    client_id: int,
    integration_id: int,
    db: AsyncSession,
    summary: Dict[str, int],
) -> None:
    """Store a normalized activity event if it passes relevance filter."""
    # Calculate relevance score
    relevance_score = calculate_relevance(normalized)

    # Filter out low-relevance events (threshold: 30)
    if relevance_score < 30:
        summary["events_filtered_out"] += 1
        return

    # Check for duplicate using raw_ref + integration_id
    # For SQLite, use INSERT OR IGNORE with a unique constraint
    # First check if exists
    existing = await db.execute(
        select(ActivityEvent).where(
            and_(
                ActivityEvent.integration_id == integration_id,
                ActivityEvent.source == normalized["source"],
                ActivityEvent.raw_ref == normalized["raw_ref"],
            )
        )
    )
    if existing.scalar_one_or_none():
        # Already stored
        return

    # Create new event
    event = ActivityEvent(
        client_id=client_id,
        integration_id=integration_id,
        source=normalized["source"],
        type=normalized["event_type"],
        summary=normalized["summary"],
        actor=normalized["actor"],
        timestamp=normalized["timestamp"],
        relevance_score=relevance_score,
        raw_ref=normalized["raw_ref"],
        raw_payload=str(normalized.get("raw_payload", "")),  # Store as string for MVP
        processed=False,
    )
    db.add(event)
    summary["events_stored"] += 1


async def ingest_all_clients_weekly(db: AsyncSession) -> Dict[str, Any]:
    """
    Weekly ingestion job for all clients with active integrations.
    This would be called by Celery beat on a schedule.
    """
    # Get all clients with active GitHub integrations
    result = await db.execute(
        select(Client.id)
        .join(ClientProjectLink, Client.id == ClientProjectLink.client_id)
        .join(Integration, ClientProjectLink.integration_id == Integration.id)
        .where(
            Integration.provider == "github",
            Integration.is_active == True,
        )
        .distinct()
    )
    client_ids = [row[0] for row in result.all()]

    total_summary = {
        "clients_processed": 0,
        "total_events_fetched": 0,
        "total_events_stored": 0,
        "total_events_filtered_out": 0,
        "total_errors": 0,
    }

    for client_id in client_ids:
        try:
            summary = await ingest_client_activity(client_id, db, weeks_back=1)
            total_summary["clients_processed"] += 1
            total_summary["total_events_fetched"] += summary["events_fetched"]
            total_summary["total_events_stored"] += summary["events_stored"]
            total_summary["total_events_filtered_out"] += summary["events_filtered_out"]
            total_summary["total_errors"] += summary["errors"]
        except Exception as e:
            logger.error(f"Error processing client {client_id}: {e}")
            total_summary["total_errors"] += 1

    await db.commit()
    logger.info(f"Weekly ingestion complete: {total_summary}")
    return total_summary