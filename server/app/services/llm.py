"""
LLM Service for Draft Generation

Handles communication with LLM APIs (Claude, OpenAI) to generate
client-ready updates from activity events and tone profiles.
"""

from typing import List, Optional, Dict, Any
import json
import logging
from datetime import datetime, timezone

from app.models import ToneProfile

logger = logging.getLogger(__name__)

# System prompt for draft generation
SYSTEM_PROMPT = """You are an expert at writing professional client status updates for freelancers and agencies.

Your task: Convert raw project activity into a polished, client-ready weekly update.

Structure your response as a JSON object with these four sections:
- "done": Completed work this period (what was shipped/delivered)
- "in_progress": Work currently underway (what's being actively worked on)
- "blocked": Blockers, dependencies, or items needing client input
- "next": What's coming up next week

Guidelines:
- Write in a professional but approachable tone
- Translate technical jargon into client-friendly language
- Group related items together
- Be specific about outcomes, not just activities
- Keep each bullet concise (1-2 sentences max)
- If a section has no items, use ["No significant updates this week."]
- Match the client's preferred tone from the examples provided

Output ONLY valid JSON. No markdown, no explanation."""


# Fallback tone profiles for when no custom tone exists
DEFAULT_TONE = {
    "formality": 6,  # 1-10 scale
    "verbosity": 5,
    "style_notes": "Professional, clear, and concise. Technical details explained simply.",
    "examples": []
}


def build_tone_profile(tone_profile: Optional[ToneProfile]) -> Dict[str, Any]:
    """Convert database ToneProfile to prompt-ready format."""
    if not tone_profile:
        return DEFAULT_TONE

    examples = []
    if tone_profile.example_updates:
        try:
            examples = json.loads(tone_profile.example_updates)
        except (json.JSONDecodeError, TypeError):
            examples = [tone_profile.example_updates] if isinstance(tone_profile.example_updates, str) else []

    style_descriptors = {}
    if tone_profile.style_descriptors:
        try:
            style_descriptors = json.loads(tone_profile.style_descriptors)
        except (json.JSONDecodeError, TypeError):
            pass

    return {
        "formality": tone_profile.formality_level or 5,
        "verbosity": tone_profile.verbosity_level or 5,
        "style_notes": style_descriptors.get("notes", "Professional and concise."),
        "examples": examples,
    }


def format_activity_for_prompt(events: List[Dict[str, Any]]) -> str:
    """Format activity events for the LLM prompt."""
    if not events:
        return "No activity recorded this week."

    # Group by type
    by_type = {}
    for event in events:
        event_type = event.get("type", "other")
        if event_type not in by_type:
            by_type[event_type] = []
        by_type[event_type].append(event)

    lines = []
    for event_type, events_list in by_type.items():
        lines.append(f"\n--- {event_type.upper()} ({len(events_list)}) ---")
        for event in events_list[:10]:  # Limit per type
            summary = event.get("summary", "")
            actor = event.get("actor", "")
            timestamp = event.get("timestamp", "")
            if isinstance(timestamp, datetime):
                timestamp = timestamp.strftime("%Y-%m-%d")
            score = event.get("relevance_score", 0)
            lines.append(f"  • [{score}] {summary} (by {actor} on {timestamp})")

    return "\n".join(lines)


def build_generation_prompt(
    client_name: str,
    week_of: datetime,
    activity_events: List[Dict[str, Any]],
    tone_profile: Dict[str, Any],
) -> str:
    """Build the complete prompt for draft generation."""
    activity_text = format_activity_for_prompt(activity_events)

    # Format tone examples
    examples_text = ""
    if tone_profile.get("examples"):
        examples_text = "\n\nTONE EXAMPLES (match this style):\n"
        for i, example in enumerate(tone_profile["examples"][:3], 1):
            examples_text += f"\nExample {i}:\n{example}\n"

    style_notes = tone_profile.get("style_notes", DEFAULT_TONE["style_notes"])
    formality = tone_profile.get("formality", 5)
    verbosity = tone_profile.get("verbosity", 5)

    prompt = f"""Client: {client_name}
Week of: {week_of.strftime('%B %d, %Y')}

ACTIVITY THIS WEEK:
{activity_text}

{examples_text}

TONE GUIDANCE:
- Formality: {formality}/10 (1=casual, 10=very formal)
- Verbosity: {verbosity}/10 (1=terse, 10=detailed)
- Style: {style_notes}

Generate the weekly update as JSON with keys: done, in_progress, blocked, next."""

    return prompt


class LLMProvider:
    """Abstract base for LLM providers."""

    async def generate(self, prompt: str, system_prompt: str = SYSTEM_PROMPT) -> str:
        raise NotImplementedError


class AnthropicProvider(LLMProvider):
    """Anthropic Claude provider."""

    def __init__(self, api_key: str, model: str = "claude-3-haiku-20240307"):
        self.api_key = api_key
        self.model = model
        self.client = None

    async def generate(self, prompt: str, system_prompt: str = SYSTEM_PROMPT) -> str:
        import anthropic
        if not self.client:
            self.client = anthropic.AsyncAnthropic(api_key=self.api_key)

        response = await self.client.messages.create(
            model=self.model,
            max_tokens=2000,
            temperature=0.3,
            system=system_prompt,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text


class OpenAIProvider(LLMProvider):
    """OpenAI provider."""

    def __init__(self, api_key: str, model: str = "gpt-4o-mini"):
        self.api_key = api_key
        self.model = model
        self.client = None

    async def generate(self, prompt: str, system_prompt: str = SYSTEM_PROMPT) -> str:
        import openai
        if not self.client:
            self.client = openai.AsyncOpenAI(api_key=self.api_key)

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=2000,
            response_format={"type": "json_object"},
        )
        return response.choices[0].message.content


def get_llm_provider() -> Optional[LLMProvider]:
    """Factory to get configured LLM provider."""
    import os
    from app.core.config import settings

    # Try Anthropic first
    anthropic_key = os.getenv("ANTHROPIC_API_KEY") or getattr(settings, "ANTHROPIC_API_KEY", None)
    if anthropic_key:
        return AnthropicProvider(anthropic_key)

    # Try OpenAI
    openai_key = os.getenv("OPENAI_API_KEY") or getattr(settings, "OPENAI_API_KEY", None)
    if openai_key:
        return OpenAIProvider(openai_key)

    return None


async def generate_draft(
    client_name: str,
    week_of: datetime,
    activity_events: List[Dict[str, Any]],
    tone_profile: Optional[ToneProfile] = None,
) -> Dict[str, Any]:
    """
    Generate a draft update using the LLM.

    Returns dict with keys: done, in_progress, blocked, next
    Each value is a list of strings.
    """
    provider = get_llm_provider()

    if not provider:
        logger.warning("No LLM provider configured, returning mock draft")
        return generate_mock_draft(activity_events)

    tone = build_tone_profile(tone_profile)
    prompt = build_generation_prompt(client_name, week_of, activity_events, tone)

    try:
        response = await provider.generate(prompt)
        draft = json.loads(response)

        # Validate structure
        required_keys = ["done", "in_progress", "blocked", "next"]
        for key in required_keys:
            if key not in draft:
                draft[key] = ["No significant updates this week."]
            elif not isinstance(draft[key], list):
                draft[key] = [str(draft[key])]
            elif not draft[key]:
                draft[key] = ["No significant updates this week."]

        return draft

    except Exception as e:
        logger.error(f"LLM generation failed: {e}")
        return generate_mock_draft(activity_events)


def generate_mock_draft(activity_events: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate a mock draft for testing without LLM."""
    done = []
    in_progress = []
    blocked = []
    next_items = []

    for event in activity_events:
        event_type = event.get("type", "")
        summary = event.get("summary", "")

        if event_type in ["commit", "pull_request"] and "merged" in summary.lower():
            done.append(summary)
        elif event_type == "release":
            done.append(f"Released: {summary}")
        elif event_type == "pull_request" and "draft" in summary.lower():
            in_progress.append(summary)
        elif event_type == "pull_request":
            in_progress.append(summary)
        elif event_type == "issue" and "closed" in summary.lower():
            done.append(f"Resolved: {summary}")
        elif event_type == "issue":
            in_progress.append(f"Investigating: {summary}")
        else:
            in_progress.append(summary)

    # Deduplicate and limit
    for section in [done, in_progress, blocked, next_items]:
        seen = set()
        unique = []
        for item in section:
            if item not in seen:
                seen.add(item)
                unique.append(item)
        section[:] = unique[:5]  # Max 5 per section

    if not done:
        done = ["No significant deliveries this week."]
    if not in_progress:
        in_progress = ["No active work in progress."]
    if not blocked:
        blocked = ["No blockers reported."]
    if not next_items:
        next_items = ["Planning next sprint priorities."]

    return {
        "done": done,
        "in_progress": in_progress,
        "blocked": blocked,
        "next": next_items,
    }


def format_draft_for_display(draft: Dict[str, Any]) -> str:
    """Format draft JSON as human-readable text for review/editing."""
    sections = [
        ("✅ Done", draft.get("done", [])),
        ("🔄 In Progress", draft.get("in_progress", [])),
        ("🚫 Blocked", draft.get("blocked", [])),
        ("📅 Next Week", draft.get("next", [])),
    ]

    lines = []
    for title, items in sections:
        lines.append(f"\n{title}")
        lines.append("-" * len(title))
        for item in items:
            lines.append(f"  • {item}")

    return "\n".join(lines)