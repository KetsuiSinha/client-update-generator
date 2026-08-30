"""
GitHub API Client Service

Handles all GitHub API interactions for fetching repository activity:
- Commits
- Pull Requests
- Issues
- Releases
"""

from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
import httpx
import logging

from app.core.encryption import decrypt_token

logger = logging.getLogger(__name__)

GITHUB_API_BASE = "https://api.github.com"


class GitHubClient:
    """GitHub API client with token management and rate limiting."""

    def __init__(self, access_token: str):
        self.access_token = access_token
        self.client = httpx.Client(
            base_url=GITHUB_API_BASE,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
            timeout=30.0,
        )
        self._rate_limit_remaining = 5000
        self._rate_limit_reset = 0

    def close(self):
        """Close the HTTP client."""
        self.client.close()

    def _request(self, method: str, url: str, **kwargs) -> httpx.Response:
        """Make a request with rate limit handling."""
        response = self.client.request(method, url, **kwargs)

        # Update rate limit info from headers
        if "X-RateLimit-Remaining" in response.headers:
            self._rate_limit_remaining = int(response.headers["X-RateLimit-Remaining"])
        if "X-RateLimit-Reset" in response.headers:
            self._rate_limit_reset = int(response.headers["X-RateLimit-Reset"])

        # Handle rate limiting
        if response.status_code == 403 and self._rate_limit_remaining == 0:
            reset_time = self._rate_limit_reset
            wait_seconds = max(reset_time - int(datetime.now().timestamp()), 1)
            logger.warning(f"Rate limited. Waiting {wait_seconds}s until reset")
            # In production, you'd wait or raise a specific exception
            # For MVP, we'll just log and continue

        response.raise_for_status()
        return response

    def get_user(self) -> Dict[str, Any]:
        """Get authenticated user info."""
        response = self._request("GET", "/user")
        return response.json()

    def get_user_repos(
        self,
        per_page: int = 100,
        sort: str = "updated",
        direction: str = "desc",
    ) -> List[Dict[str, Any]]:
        """Get repositories accessible to the user."""
        all_repos = []
        page = 1

        while True:
            response = self._request(
                "GET",
                "/user/repos",
                params={
                    "per_page": per_page,
                    "page": page,
                    "sort": sort,
                    "direction": direction,
                    "affiliation": "owner,collaborator,organization_member",
                },
            )
            repos = response.json()
            if not repos:
                break
            all_repos.extend(repos)
            page += 1
            if len(repos) < per_page:
                break

        return all_repos

    def get_repo_commits(
        self,
        owner: str,
        repo: str,
        since: Optional[datetime] = None,
        until: Optional[datetime] = None,
        per_page: int = 100,
    ) -> List[Dict[str, Any]]:
        """Get commits for a repository."""
        params = {"per_page": per_page}
        if since:
            params["since"] = since.isoformat()
        if until:
            params["until"] = until.isoformat()

        response = self._request("GET", f"/repos/{owner}/{repo}/commits", params=params)
        return response.json()

    def get_repo_pull_requests(
        self,
        owner: str,
        repo: str,
        state: str = "all",  # open, closed, all
        per_page: int = 100,
    ) -> List[Dict[str, Any]]:
        """Get pull requests for a repository."""
        all_prs = []
        page = 1

        while True:
            response = self._request(
                "GET",
                f"/repos/{owner}/{repo}/pulls",
                params={
                    "state": state,
                    "per_page": per_page,
                    "page": page,
                    "sort": "updated",
                    "direction": "desc",
                },
            )
            prs = response.json()
            if not prs:
                break
            all_prs.extend(prs)
            page += 1
            if len(prs) < per_page:
                break

        return all_prs

    def get_repo_issues(
        self,
        owner: str,
        repo: str,
        state: str = "all",  # open, closed, all
        since: Optional[datetime] = None,
        per_page: int = 100,
    ) -> List[Dict[str, Any]]:
        """Get issues for a repository (excludes PRs)."""
        params = {"state": state, "per_page": per_page, "filter": "all"}
        if since:
            params["since"] = since.isoformat()

        response = self._request("GET", f"/repos/{owner}/{repo}/issues", params=params)
        issues = response.json()

        # Filter out pull requests (GitHub API returns PRs in issues endpoint)
        return [issue for issue in issues if "pull_request" not in issue]

    def get_repo_releases(
        self,
        owner: str,
        repo: str,
        per_page: int = 100,
    ) -> List[Dict[str, Any]]:
        """Get releases for a repository."""
        all_releases = []
        page = 1

        while True:
            response = self._request(
                "GET",
                f"/repos/{owner}/{repo}/releases",
                params={"per_page": per_page, "page": page},
            )
            releases = response.json()
            if not releases:
                break
            all_releases.extend(releases)
            page += 1
            if len(releases) < per_page:
                break

        return all_releases

    def get_commit_details(self, owner: str, repo: str, sha: str) -> Dict[str, Any]:
        """Get detailed commit info including stats."""
        response = self._request("GET", f"/repos/{owner}/{repo}/commits/{sha}")
        return response.json()

    def get_pr_details(self, owner: str, repo: str, pr_number: int) -> Dict[str, Any]:
        """Get detailed PR info including reviews."""
        response = self._request("GET", f"/repos/{owner}/{repo}/pulls/{pr_number}")
        return response.json()

    def get_pr_reviews(self, owner: str, repo: str, pr_number: int) -> List[Dict[str, Any]]:
        """Get reviews for a PR."""
        response = self._request("GET", f"/repos/{owner}/{repo}/pulls/{pr_number}/reviews")
        return response.json()


def create_github_client(encrypted_token: str) -> GitHubClient:
    """Factory function to create a GitHub client from an encrypted token."""
    access_token = decrypt_token(encrypted_token)
    return GitHubClient(access_token)


# Normalization functions - convert GitHub API objects to ActivityEvent schema
def normalize_commit(commit: Dict[str, Any], repo_full_name: str) -> Dict[str, Any]:
    """Normalize a GitHub commit to ActivityEvent format."""
    commit_data = commit.get("commit", {})
    author = commit_data.get("author", {})
    committer = commit_data.get("committer", {})

    # Use committer date if available, otherwise author date
    timestamp_str = committer.get("date") or author.get("date")
    timestamp = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00")) if timestamp_str else datetime.now(timezone.utc)

    # Extract summary from commit message (first line)
    message = commit_data.get("message", "")
    summary = message.split("\n")[0][:500] if message else "Commit"

    # Get actor (committer or author)
    actor = committer.get("name") or author.get("name") or commit.get("committer", {}).get("login") or commit.get("author", {}).get("login") or "Unknown"

    return {
        "source": "github",
        "event_type": "commit",
        "summary": summary,
        "actor": actor,
        "timestamp": timestamp,
        "raw_ref": commit.get("sha"),
        "raw_payload": commit,
    }


def normalize_pull_request(pr: Dict[str, Any], repo_full_name: str) -> Dict[str, Any]:
    """Normalize a GitHub PR to ActivityEvent format."""
    # Determine event type based on PR state
    state = pr.get("state", "open")
    merged = pr.get("merged", False)
    draft = pr.get("draft", False)

    if merged:
        event_type = "pull_request"
        summary = f"Merged PR #{pr['number']}: {pr.get('title', '')}"
    elif state == "closed":
        event_type = "pull_request"
        summary = f"Closed PR #{pr['number']}: {pr.get('title', '')}"
    elif draft:
        event_type = "pull_request"
        summary = f"Draft PR #{pr['number']}: {pr.get('title', '')}"
    else:
        event_type = "pull_request"
        summary = f"Opened PR #{pr['number']}: {pr.get('title', '')}"

    # Use updated_at for timestamp
    timestamp_str = pr.get("updated_at") or pr.get("created_at")
    timestamp = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00")) if timestamp_str else datetime.now(timezone.utc)

    actor = pr.get("user", {}).get("login", "Unknown")

    return {
        "source": "github",
        "event_type": event_type,
        "summary": summary[:500],
        "actor": actor,
        "timestamp": timestamp,
        "raw_ref": str(pr.get("number")),
        "raw_payload": pr,
    }


def normalize_issue(issue: Dict[str, Any], repo_full_name: str) -> Dict[str, Any]:
    """Normalize a GitHub issue to ActivityEvent format."""
    state = issue.get("state", "open")

    if state == "closed":
        event_type = "issue"
        summary = f"Closed issue #{issue['number']}: {issue.get('title', '')}"
    else:
        event_type = "issue"
        summary = f"Opened issue #{issue['number']}: {issue.get('title', '')}"

    timestamp_str = issue.get("updated_at") or issue.get("created_at")
    timestamp = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00")) if timestamp_str else datetime.now(timezone.utc)

    actor = issue.get("user", {}).get("login", "Unknown")

    return {
        "source": "github",
        "event_type": event_type,
        "summary": summary[:500],
        "actor": actor,
        "timestamp": timestamp,
        "raw_ref": str(issue.get("number")),
        "raw_payload": issue,
    }


def normalize_release(release: Dict[str, Any], repo_full_name: str) -> Dict[str, Any]:
    """Normalize a GitHub release to ActivityEvent format."""
    tag_name = release.get("tag_name", "")
    name = release.get("name", tag_name)

    summary = f"Released {name} ({tag_name})" if tag_name else f"Released {name}"

    timestamp_str = release.get("published_at") or release.get("created_at")
    timestamp = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00")) if timestamp_str else datetime.now(timezone.utc)

    actor = release.get("author", {}).get("login", "Unknown")

    return {
        "source": "github",
        "event_type": "release",
        "summary": summary[:500],
        "actor": actor,
        "timestamp": timestamp,
        "raw_ref": tag_name or str(release.get("id")),
        "raw_payload": release,
    }