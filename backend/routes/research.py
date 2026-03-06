# backend/services/external.py
from typing import List
import httpx
from pydantic import BaseModel
from ..core.config import get_settings


class ExternalArticle(BaseModel):
    title: str
    summary: str
    author: str
    url: str


settings = get_settings()


async def _fetch_proxycurl(keyword: str, country: str) -> List[ExternalArticle]:
    # Minimal example – you can expand with retries like in Supabase function
    if not settings.PROXYCURL_API_KEY:
        # Fallback mock data
        return [
            ExternalArticle(
                title=f"{keyword} — Example Insight",
                summary=f"Sample summary for {keyword}.",
                author="Sample Author",
                url="https://linkedin.com",
            )
        ]

    params = {"keyword": keyword, "page_size": "10"}
    if country and country != "all":
        params["country"] = country

    async with httpx.AsyncClient(timeout=20) as client:
        resp = await client.get(
            "https://nubela.co/proxycurl/api/search/person",
            params=params,
            headers={"Authorization": f"Bearer {settings.PROXYCURL_API_KEY}"},
        )
        resp.raise_for_status()
        data = resp.json()
        results = data.get("results", [])[:10]

    articles: List[ExternalArticle] = []
    for r in results:
        articles.append(
            ExternalArticle(
                title=r.get("headline") or r.get("summary") or f"{keyword} — LinkedIn Profile",
                summary=r.get("summary") or r.get("headline") or f"Content related to {keyword}",
                author=f"{r.get('first_name','')} {r.get('last_name','')}".strip() or "LinkedIn User",
                url=r.get("linkedin_profile_url") or r.get("url") or "https://linkedin.com",
            )
        )
    return articles


def fetch_and_summarize_articles(query: str, country: str = "all") -> List[ExternalArticle]:
    """
    Sync wrapper around async Proxycurl fetch (and optional AI summarization).
    For simplicity, we just fetch and return top N results.
    """
    import anyio

    async def _run() -> List[ExternalArticle]:
        return await _fetch_proxycurl(query, country)

    return anyio.run(_run)