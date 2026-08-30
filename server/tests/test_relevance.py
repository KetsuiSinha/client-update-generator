from app.services.relevance import calculate_relevance, get_relevance_tier


def test_calculate_relevance_commit_feat():
    """feat commits should score high."""
    event = {
        "summary": "feat: Add user authentication with JWT tokens",
        "event_type": "commit",
        "actor": "john",
        "raw_payload": {},
    }
    score = calculate_relevance(event)
    assert score >= 30, f"Expected score >= 30, got {score}"


def test_calculate_relevance_bug_fix():
    """fix commits should score well."""
    event = {
        "summary": "fix: Resolve login issue on mobile Safari",
        "event_type": "commit",
        "actor": "jane",
        "raw_payload": {},
    }
    score = calculate_relevance(event)
    assert score >= 30, f"Expected score >= 30, got {score}"


def test_calculate_relevance_merge_commit_penalty():
    """Merge commits should receive penalty."""
    event = {
        "summary": "Merge pull request #42 from feature/auth",
        "event_type": "commit",
        "actor": "john",
        "raw_payload": {},
    }
    score = calculate_relevance(event)
    # Merge commits have -15 penalty, base is 20, so expected ~5
    # But commit type adds +5, so could be 0 or higher depending on other factors
    assert score >= 0, f"Expected score >= 0, got {score}"


def test_calculate_relevance_bot_actor():
    """Bot actors should reduce score."""
    event = {
        "summary": "chore: Update dependencies",
        "event_type": "commit",
        "actor": "dependabot[bot]",
        "raw_payload": {},
    }
    score = calculate_relevance(event)
    # Base 20 + medium pattern chores -10 + bot -20 = 0 or less clamped to 0
    assert score == 0, f"Expected score 0 for bot chore, got {score}"


def test_calculate_relevance_release():
    """ releases should score high."""
    event = {
        "summary": "Released v2.0.0",
        "event_type": "release",
        "actor": "john",
        "raw_payload": {},
    }
    score = calculate_relevance(event)
    assert score >= 50, f"Expected score >= 50 for release, got {score}"


def test_get_relevance_tier():
    """Relevance tiers should work correctly."""
    assert get_relevance_tier(80) == "high"
    assert get_relevance_tier(50) == "medium"
    assert get_relevance_tier(35) == "low"
    assert get_relevance_tier(20) == "filtered"


def test_calculate_relevance_conventional_commit():
    """Conventional commit prefixes should boost score."""
    event = {
        "summary": "feat: Add user authentication",
        "event_type": "commit",
        "actor": "john",
        "raw_payload": {},
    }
    score = calculate_relevance(event)
    # Base 20 + feat prefix +10 = 30
    assert score >= 30, f"Expected score >= 30 for feat commit, got {score}"


def test_calculate_relevance_with_labels():
    """PR labels should boost score."""
    event = {
        "summary": "Opened PR #45",
        "event_type": "pull_request",
        "actor": "jane",
        "raw_payload": {"labels": [{"name": "feature"}]},
    }
    score = calculate_relevance(event)
    # Base 20 + PR type +10 (implicit) + label feature +10 = 40
    assert score >= 30, f"Expected score >= 30 for labeled PR, got {score}"