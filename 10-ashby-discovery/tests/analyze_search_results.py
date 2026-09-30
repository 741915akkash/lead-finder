import json
from collections import Counter
from urllib.parse import urlparse, parse_qs, unquote


PATH = "output/search-test/yahoo.json"


def unwrap_yahoo_url(url: str) -> str:
    """
    Try to recover the real destination from Yahoo redirect URLs.

    Example:
        rd.search.yahoo.com/.../RU=https%3A%2F%2Fjobs.ashbyhq.com%2Ffoo
        ->
        https://jobs.ashbyhq.com/foo
    """

    decoded = unquote(url)

    # Yahoo redirect URLs commonly contain:
    # RU=https://...
    if "RU=" in decoded:
        destination = decoded.split("RU=", 1)[1]

        # Remove Yahoo's remaining redirect parameters.
        destination = destination.split("/RK=", 1)[0]
        destination = destination.split("&", 1)[0]

        return destination

    return url


def is_real_ashby_board(url: str) -> bool:
    """
    True only for direct jobs.ashbyhq.com URLs.

    We deliberately reject:
        search.yahoo.com
        rd.search.yahoo.com
        login.yahoo.com
        etc.
    """

    try:
        parsed = urlparse(url)
    except Exception:
        return False

    host = parsed.netloc.lower()

    if host != "jobs.ashbyhq.com":
        return False

    # Need an actual path:
    # /company-slug
    path = parsed.path.strip("/")

    if not path:
        return False

    return True


def extract_ashby_boards(data):
    boards = []

    for item in data:
        original_url = item.get("result_url", "")

        destination_url = unwrap_yahoo_url(original_url)

        if is_real_ashby_board(destination_url):
            boards.append(
                {
                    "query": item["query"],
                    "rank": item.get("rank"),
                    "original_url": original_url,
                    "destination_url": destination_url,
                }
            )

    return boards


def main():
    data = json.load(open(PATH))

    print(f"Total extracted links: {len(data)}")
    print()

    # ---------------------------------------------------------
    # Host analysis
    # ---------------------------------------------------------

    hosts = Counter()

    for item in data:
        url = item.get("result_url", "")

        try:
            host = urlparse(url).netloc.lower()
        except Exception:
            host = ""

        hosts[host] += 1

    print("TOP HOSTS")
    print("=" * 60)

    for host, count in hosts.most_common(30):
        print(f"{count:4}  {host}")

    # ---------------------------------------------------------
    # Real Ashby boards
    # ---------------------------------------------------------

    boards = extract_ashby_boards(data)

    print()
    print("REAL ASHBY BOARDS")
    print("=" * 60)

    print(f"Found {len(boards)} direct Ashby board URLs")
    print()

    for board in boards:
        print(f"[{board['query']}]")
        print(f"  {board['destination_url']}")
        print()

    # ---------------------------------------------------------
    # Unique boards
    # ---------------------------------------------------------

    unique_urls = sorted(
        {
            board["destination_url"]
            for board in boards
        }
    )

    print()
    print("UNIQUE ASHBY BOARDS")
    print("=" * 60)

    print(f"Unique boards: {len(unique_urls)}")
    print()

    for url in unique_urls:
        print(url)


if __name__ == "__main__":
    main()