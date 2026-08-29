"""
Relevance Filter Service

Rule-based scoring for activity events to determine client-worthiness.
Scores range from 0-100. Events with score >= 30 are passed to draft generation.
"""

import re
from typing import Dict, Any, List


# High signal keywords/patterns (boost score)
HIGH_SIGNAL_PATTERNS = [
    # Feature work
    (r"\b(feat|feature|add|implement|introduce|new)\b", 15),
    (r"\b(ship|deploy|release|launch|publish)\b", 20),
    (r"\b(deliver|complete|finish|done)\b", 10),
    # Bug fixes
    (r"\b(fix|bug|resolve|patch|hotfix)\b", 10),
    # PR/Review actions
    (r"\b(merge|merged|approved|ready for review)\b", 15),
    # Releases
    (r"\b(tag|version|v\d+\.\d+)\b", 10),
]

# Medium signal patterns
MEDIUM_SIGNAL_PATTERNS = [
    (r"\b(refactor|refact|cleanup|clean up)\b", 8),
    (r"\b(perf|performance|optimize|speed up)\b", 8),
    (r"\b(test|spec|coverage)\b", 5),
    (r"\b(doc|document|readme|changelog)\b", 5),
    (r"\b(config|setup|configure|install)\b", 5),
    (r"\b(review|feedback|comment)\b", 5),
    (r"\b(open|create|start)\b", 5),
]

# Low/negative signal patterns (reduce score)
NEGATIVE_SIGNAL_PATTERNS = [
    # Trivial changes
    (r"\b(typo|whitespace|format|lint|style|prettier)\b", -15),
    (r"\b(chore|maintenance|housekeeping|cleanup)\b", -10),
    (r"\b(wip|work in progress|draft)\b", -10),
    # Bot/automated
    (r"\b(dependabot|renovate|bot|automated)\b", -20),
    (r"\b(auto-merge|auto merge)\b", -10),
    # Merge commits (unless they're feature merges)
    (r"^Merge (branch|pull request|remote-tracking)", -15),
    # Version bumps only
    (r"\b(bump|version bump|update version)\b", -10),
]

# Actor-based scoring
TRUSTED_ACTORS = ["owner", "maintainer", "admin"]  # Would come from team config
BOT_ACTORS = ["dependabot[bot]", "renovate[bot]", "github-actions[bot]"]


def calculate_relevance(event: Dict[str, Any]) -> int:
    """
    Calculate relevance score for an activity event.

    Args:
        event: Normalized activity event dict with keys:
            - summary: Human-readable summary
            - event_type: commit, pull_request, issue, release, etc.
            - actor: GitHub username
            - raw_payload: Original API response

    Returns:
        Score from 0-100 (threshold for draft generation: 30)
    """
    score = 20  # Base score

    summary = event.get("summary", "").lower()
    event_type = event.get("event_type", "").lower()
    actor = event.get("actor", "").lower()
    raw_payload = event.get("raw_payload", {})

    # Event type bonuses
    if event_type == "release":
        score += 25
    elif event_type == "pull_request":
        # Check if merged
        if isinstance(raw_payload, dict) and raw_payload.get("merged"):
            score += 20
        elif "merged" in summary:
            score += 20
        elif "closed" in summary and not raw_payload.get("draft", False):
            score += 10
        elif raw_payload.get("draft", False):
            score += 5
        else:
            score += 10
    elif event_type == "issue":
        if "closed" in summary:
            score += 10
        else:
            score += 5
    elif event_type == "commit":
        score += 5

    # Apply high signal patterns
    for pattern, boost in HIGH_SIGNAL_PATTERNS:
        if re.search(pattern, summary, re.IGNORECASE):
            score += boost

    # Apply medium signal patterns
    for pattern, boost in MEDIUM_SIGNAL_PATTERNS:
        if re.search(pattern, summary, re.IGNORECASE):
            score += boost

    # Apply negative signal patterns
    for pattern, penalty in NEGATIVE_SIGNAL_PATTERNS:
        if re.search(pattern, summary, re.IGNORECASE):
            score += penalty  # penalty is negative

    # Actor-based adjustments
    if actor in BOT_ACTORS:
        score -= 20

    # Check for conventional commit prefixes in commits
    if event_type == "commit":
        conventional_prefixes = ["feat:", "fix:", "perf:", "refactor:", "test:", "docs:", "chore:"]
        for prefix in conventional_prefixes:
            if summary.startswith(prefix):
                if prefix in ["feat:", "fix:"]:
                    score += 10
                elif prefix in ["perf:", "refactor:"]:
                    score += 8
                else:
                    score += 5
                break

    # PR-specific: check labels
    if event_type == "pull_request" and isinstance(raw_payload, dict):
        labels = raw_payload.get("labels", [])
        for label in labels:
            label_name = label.get("name", "").lower() if isinstance(label, dict) else str(label).lower()
            if label_name in ["bug", "feature", "enhancement", "release", "hotfix"]:
                score += 10
            elif label_name in ["documentation", "dependencies", "chore"]:
                score += 2

    # Clamp to 0-100
    return max(0, min(100, score))


def get_relevance_tier(score: int) -> str:
    """Get human-readable tier for a relevance score."""
    if score >= 70:
        return "high"
    elif score >= 40:
        return "medium"
    elif score >= 30:
        return "low"
    else:
        return "filtered"


# For testing/debugging
if __name__ == "__main__":
    test_events = [
        {
            "summary": "feat: Add user authentication with JWT tokens",
            "event_type": "commit",
            "actor": "john",
            "raw_payload": {},
        },
        {
            "summary": "fix: Resolve login issue on mobile Safari",
            "event_type": "commit",
            "actor": "jane",
            "raw_payload": {},
        },
        {
            "summary": "Merge pull request #42 from feature/auth",
            "event_type": "commit",
            "actor": "john",
            "raw_payload": {},
        },
        {
            "summary": "chore: Update dependencies",
            "event_type": "commit",
            "actor": "dependabot[bot]",
            "raw_payload": {},
        },
        {
            "summary": "Merged PR #45: Add payment integration",
            "event_type": "pull_request",
            "actor": "jane",
            "raw_payload": {"merged": True, "labels": [{"name": "feature"}]},
        },
        {
            "summary": "Opened PR #46: Fix typo in README",
            "event_type": "pull_request",
            "actor": "intern",
            "raw_payload": {"merged": False, "labels": [{"name": "documentation"}]},
        },
        {
            "summary": "Released v2.0.0",
            "event_type": "release",
            "actor": "john",
            "raw_payload": {},
        },
    ]

    for event in test_events:
        score = calculate_relevance(event)
        tier = get_relevance_tier(score)
        print(f"[{tier:7}] {score:3} - {event['summary'][:60]}")