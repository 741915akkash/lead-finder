from __future__ import annotations

import re
from urllib.parse import quote

from .extractors import infer_company_name
from .http_client import AsyncFetcher
from .logging_utils import debug_log
from .models import VerificationResult
from .utils import clean_whitespace


POSITIVE_MARKERS = (
    "jobs.ashbyhq.com",
    "ashbyhq",
    "window.ashby",
    "__ashbybasejobboardurl",
    "embed?version=2",
    "open roles",
    "all teams",
)

NEGATIVE_MARKERS = (
    "404",
    "not found",
    "page could not be found",
    "access denied",
    "temporarily unavailable",
    "just a moment",
    "attention required",
)


def _score_board_html(slug: str, html: str) -> tuple[int, int]:
    lower = html.lower()
    positive = 0
    negative = 0
    encoded_slug = quote(slug, safe="").lower()

    for marker in POSITIVE_MARKERS:
        if marker in lower:
            positive += 1

    for marker in NEGATIVE_MARKERS:
        if marker in lower:
            negative += 1

    if f"jobs.ashbyhq.com/{slug.lower()}" in lower:
        positive += 2

    if f"jobs.ashbyhq.com/{encoded_slug}" in lower:
        positive += 2

    if re.search(rf"/{re.escape(slug)}/job/", lower):
        positive += 2

    if re.search(rf"/{re.escape(encoded_slug)}/job/", lower):
        positive += 2

    return positive, negative


async def verify_slug(
    fetcher: AsyncFetcher,
    slug: str,
    *,
    verbose: bool = False,
) -> VerificationResult:
    encoded_slug = quote(slug, safe="")
    ashby_url = f"https://jobs.ashbyhq.com/{encoded_slug}"

    debug_log(
        f"[verify] START slug={slug} url={ashby_url}",
        verbose=verbose,
    )

    try:
        page = await fetcher.fetch(
            ashby_url,
            use_cache=False,
        )
    except Exception as exc:  # noqa: BLE001
        error = clean_whitespace(str(exc))

        debug_log(
            f"[verify] ERROR slug={slug} error={error}",
            verbose=verbose,
        )

        return VerificationResult(
            slug=slug,
            ashby_url=ashby_url,
            verification_status="ERROR",
            notes=f"Request failed: {error}",
        )

    debug_log(
        (
            f"[verify] RESPONSE slug={slug} "
            f"status={page.status_code} "
            f"final_url={page.final_url}"
        ),
        verbose=verbose,
    )

    if page.status_code != 200:
        debug_log(
            (
                f"[verify] NOT_VERIFIED slug={slug} "
                f"reason=http_status "
                f"status={page.status_code}"
            ),
            verbose=verbose,
        )

        return VerificationResult(
            slug=slug,
            ashby_url=ashby_url,
            verification_status="NOT_VERIFIED",
            http_status=page.status_code,
            notes=f"HTTP {page.status_code}",
        )

    positive, negative = _score_board_html(
        slug,
        page.text,
    )

    company = infer_company_name(page.text)

    debug_log(
        (
            f"[verify] SCORED slug={slug} "
            f"positive={positive} "
            f"negative={negative} "
            f"company={company or 'unknown'}"
        ),
        verbose=verbose,
    )

    if positive >= 3 and negative <= 2:
        debug_log(
            (
                f"[verify] VERIFIED slug={slug} "
                f"score={positive} "
                f"negatives={negative}"
            ),
            verbose=verbose,
        )

        return VerificationResult(
            slug=slug,
            ashby_url=ashby_url,
            verification_status="VERIFIED",
            inferred_company_name=company,
            http_status=page.status_code,
            notes=(
                f"Strong Ashby board indicators detected "
                f"(score={positive}, negatives={negative})"
            ),
        )

    debug_log(
        (
            f"[verify] NOT_VERIFIED slug={slug} "
            f"reason=weak_indicators "
            f"score={positive} "
            f"negatives={negative}"
        ),
        verbose=verbose,
    )

    return VerificationResult(
        slug=slug,
        ashby_url=ashby_url,
        verification_status="NOT_VERIFIED",
        inferred_company_name=company,
        http_status=page.status_code,
        notes=(
            f"Weak board indicators "
            f"(score={positive}, negatives={negative})"
        ),
    )