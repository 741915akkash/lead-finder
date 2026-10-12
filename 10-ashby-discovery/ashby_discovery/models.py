from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime


@dataclass(frozen=True)
class CandidateSlug:
    slug: str
    source_type: str
    source_url: str
    notes: str = ""
    discovered_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class VerificationResult:
    slug: str
    ashby_url: str
    verification_status: str
    inferred_company_name: str | None = None
    notes: str = ""
    http_status: int | None = None
    checked_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class FetchedPage:
    url: str
    final_url: str
    status_code: int
    text: str
    fetched_at: datetime = field(default_factory=datetime.utcnow)
