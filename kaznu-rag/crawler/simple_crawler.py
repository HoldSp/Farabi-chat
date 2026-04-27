import hashlib
import json
import os
import sys
import time
from collections import deque
from pathlib import Path
from urllib.parse import urljoin, urlparse, urlunparse

import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from crawler.config import (
    ALLOWED_DOMAINS,
    BLOCK_PATTERNS,
    CRAWL_META_PATH,
    DEFAULT_HEADERS,
    RAW_HTML_DIR,
    RAW_PDF_DIR,
    SEED_URLS,
)


MAX_PAGES = int(os.getenv("CRAWL_MAX_PAGES", "500"))
REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT_SECONDS", "20"))
CRAWL_DELAY = float(os.getenv("CRAWL_DELAY_SECONDS", "1.0"))
VERIFY_SSL = os.getenv("VERIFY_SSL", "true").lower() not in {"0", "false", "no"}


def build_session() -> requests.Session:
    session = requests.Session()
    session.headers.update(DEFAULT_HEADERS)
    session.verify = VERIFY_SSL
    retry = Retry(
        total=3,
        connect=3,
        read=3,
        backoff_factor=1.0,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=("GET", "HEAD"),
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session


def normalize_url(url: str) -> str:
    parsed = urlparse(url.strip())
    clean_path = parsed.path or "/"
    normalized = parsed._replace(fragment="", path=clean_path)
    return urlunparse(normalized)


def allowed(url: str) -> bool:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        return False

    host = parsed.netloc.lower()
    if host not in ALLOWED_DOMAINS:
        return False

    lowered_url = url.lower()
    return not any(pattern in lowered_url for pattern in BLOCK_PATTERNS)


def save_file(content: bytes, url: str, folder, ext: str) -> str:
    name = hashlib.sha256(url.encode("utf-8")).hexdigest() + ext
    path = folder / name
    path.write_bytes(content)
    return str(path)


def extract_links(base_url: str, html: str) -> list[str]:
    soup = BeautifulSoup(html, "lxml")
    links = []
    for anchor in soup.find_all("a", href=True):
        link = normalize_url(urljoin(base_url, anchor["href"]))
        if allowed(link):
            links.append(link)
    return links


def crawl(max_pages: int = MAX_PAGES) -> None:
    seen = set()
    queued = {normalize_url(url) for url in SEED_URLS}
    queue = deque(queued)
    metadata = []
    session = build_session()

    while queue and len(seen) < max_pages:
        url = queue.popleft()
        if url in seen or not allowed(url):
            continue

        try:
            response = session.get(url, timeout=REQUEST_TIMEOUT)
            content_type = response.headers.get("Content-Type", "").lower()
            if response.status_code != 200:
                continue

            seen.add(url)

            if "application/pdf" in content_type or url.lower().endswith(".pdf"):
                saved_path = save_file(response.content, url, RAW_PDF_DIR, ".pdf")
                metadata.append({"url": url, "type": "pdf", "path": saved_path})
                print(f"PDF: {url}")
                time.sleep(CRAWL_DELAY)
                continue

            if "text/html" not in content_type:
                continue

            saved_path = save_file(response.content, url, RAW_HTML_DIR, ".html")
            metadata.append({
                "url": url,
                "type": "html",
                "path": saved_path,
                "title": response.text.split("<title>", 1)[-1].split("</title>", 1)[0].strip() if "<title>" in response.text.lower() else "",
            })
            print(f"HTML: {url}")

            for link in extract_links(url, response.text):
                if link not in seen and link not in queued:
                    queue.append(link)
                    queued.add(link)

            time.sleep(CRAWL_DELAY)
        except requests.RequestException as error:
            print(f"ERR: {url} {error}")

    CRAWL_META_PATH.write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Saved metadata to {CRAWL_META_PATH}")


if __name__ == "__main__":
    crawl()