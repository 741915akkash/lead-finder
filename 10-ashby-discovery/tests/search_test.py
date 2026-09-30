from __future__ import annotations

import asyncio
import json
from pathlib import Path

from bs4 import BeautifulSoup

from ashby_discovery.http_client import AsyncFetcher
from ashby_discovery.search_providers import (
    DEFAULT_SEARCH_ENGINES,
    search_urls_for,
    select_result_links,
)


BASE_DIR = Path(__file__).resolve().parent.parent
QUERIES_FILE = BASE_DIR / "search_queries.txt"
OUTPUT_DIR = BASE_DIR / "output" / "search-test"


def load_queries() -> list[str]:
    queries = []

    for line in QUERIES_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()

        if not line or line.startswith("#"):
            continue

        queries.append(line)

    return queries


async def run_search(
    engine: str,
    queries: list[str],
    pages: int = 1,
):
    results = []

    fetcher = AsyncFetcher(
        store=None,
        timeout_seconds=15,
        retries=1,
        min_interval_seconds=1.0,
        max_connections=3,
    )

    try:
        for query in queries:
            print(f"\n[{engine}] query: {query}")

            for page_idx in range(pages):
                search_urls = search_urls_for(
                    engine=engine,
                    query=query,
                    page_idx=page_idx,
                )

                # DuckDuckGo returns two possible URLs:
                # HTML and Lite.
                for search_url in search_urls:
                    print(f"  page={page_idx}")
                    print(f"  URL: {search_url}")

                    try:
                        page = await fetcher.fetch(
                            search_url,
                            use_cache=False,
                        )

                        if engine == "yahoo" and query == "site:jobs.ashbyhq.com":
                          debug_file = OUTPUT_DIR / "yahoo_raw.html"
                          debug_file.parent.mkdir(parents=True, exist_ok=True)
                          debug_file.write_text(page.text, encoding="utf-8")
                          print(f"  saved raw HTML -> {debug_file}")



                        print(
                            f"  status={page.status_code} "
                            f"final_url={page.final_url}"
                        )

                        soup = BeautifulSoup(
                            page.text,
                            "html.parser",
                        )

                        links = select_result_links(
                            engine=engine,
                            soup=soup,
                        )

                        print(f"  extracted links={len(links)}")

                        for rank, url in enumerate(links, start=1):
                            results.append(
                                {
                                    "engine": engine,
                                    "query": query,
                                    "page": page_idx,
                                    "search_url": search_url,
                                    "status_code": page.status_code,
                                    "final_url": page.final_url,
                                    "rank": rank,
                                    "result_url": url,
                                }
                            )

                    except Exception as exc:
                        print(f"  ERROR: {exc}")

                        results.append(
                            {
                                "engine": engine,
                                "query": query,
                                "page": page_idx,
                                "search_url": search_url,
                                "error": str(exc),
                            }
                        )

    finally:
        await fetcher.close()

    return results


def save_results(
    engine: str,
    results: list[dict],
):
    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    output_file = OUTPUT_DIR / f"{engine}.json"

    output_file.write_text(
        json.dumps(
            results,
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    print()
    print(f"Saved {len(results)} results:")
    print(output_file)


async def main():
    queries = load_queries()

    # ---------------------------------------------------------
    # TEST CONFIG
    # ---------------------------------------------------------
    #
    # Start with only 10 queries and 1 page.
    #
    # Once this looks good, change to:
    #
    # queries = load_queries()
    # pages = 5
    #
    # ---------------------------------------------------------

    queries = queries[:10]
    pages = 1

    print("=" * 70)
    print("ASHBY SEARCH ENGINE TEST")
    print("=" * 70)

    print(f"Queries:       {len(queries)}")
    print(f"Pages/query:   {pages}")
    print(f"Search engines: {', '.join(DEFAULT_SEARCH_ENGINES)}")
    print()

    for engine in DEFAULT_SEARCH_ENGINES:
        print()
        print("=" * 70)
        print(f"ENGINE: {engine}")
        print("=" * 70)

        results = await run_search(
            engine=engine,
            queries=queries,
            pages=pages,
        )

        save_results(
            engine=engine,
            results=results,
        )


if __name__ == "__main__":
    asyncio.run(main())