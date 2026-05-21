import os

import httpx


ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_VERSION = "2023-06-01"
DEFAULT_MODEL = "claude-sonnet-4-20250514"


async def generate_claude_narrative(prompt: str) -> str | None:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return None

    model = os.getenv("ANTHROPIC_MODEL", DEFAULT_MODEL)
    headers = {
        "x-api-key": api_key,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
    }
    payload = {
        "model": model,
        "max_tokens": 250,
        "messages": [{"role": "user", "content": prompt}],
    }

    async with httpx.AsyncClient(timeout=8.0) as client:
        response = await client.post(ANTHROPIC_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()

    parts = data.get("content", [])
    text_parts = [part.get("text", "") for part in parts if part.get("type") == "text"]
    combined = "\n".join(part.strip() for part in text_parts if part.strip())
    return combined or None
