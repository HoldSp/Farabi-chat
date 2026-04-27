import json
import sys
from pathlib import Path

from bs4 import BeautifulSoup

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from crawler.config import CLEANED_DIR, CRAWL_META_PATH


OUTPUT_PATH = CLEANED_DIR / "cleaned_html.json"


def extract_html_text(raw: bytes) -> str:
    try:
        import trafilatura

        extracted = trafilatura.extract(
            raw,
            include_links=True,
            include_tables=True,
            no_fallback=False,
        )
        if extracted:
            return extracted
    except Exception:
        pass

    soup = BeautifulSoup(raw, "lxml")
    for tag_name in ("script", "style", "noscript", "header", "footer", "nav"):
        for tag in soup.find_all(tag_name):
            tag.decompose()
    return soup.get_text("\n", strip=True)


def main() -> None:
    items = json.loads(CRAWL_META_PATH.read_text(encoding="utf-8"))
    cleaned = []

    for item in items:
        if item["type"] != "html":
            continue

        raw = Path(item["path"]).read_bytes()
        extracted = extract_html_text(raw)

        if not extracted or len(extracted.strip()) < 200:
            continue

        cleaned.append(
            {
                "url": item["url"],
                "source_type": "html",
                "text": extracted,
            }
        )

    OUTPUT_PATH.write_text(
        json.dumps(cleaned, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Saved {len(cleaned)} cleaned HTML documents to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()