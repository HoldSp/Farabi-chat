import json
import sys
from pathlib import Path

import fitz

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from crawler.config import CLEANED_DIR, CRAWL_META_PATH


OUTPUT_PATH = CLEANED_DIR / "cleaned_pdf.json"


def extract_pdf_text(path: str) -> str:
    document = fitz.open(path)
    try:
        parts = [page.get_text("text") for page in document]
        return "\n".join(parts).strip()
    finally:
        document.close()


def main() -> None:
    items = json.loads(CRAWL_META_PATH.read_text(encoding="utf-8"))
    cleaned = []

    for item in items:
        if item["type"] != "pdf":
            continue

        try:
            text = extract_pdf_text(item["path"])
            if len(text) < 300:
                continue

            cleaned.append(
                {
                    "url": item["url"],
                    "source_type": "pdf",
                    "text": text,
                }
            )
        except Exception as error:
            print(f"PDF ERR: {item['url']} {error}")

    OUTPUT_PATH.write_text(
        json.dumps(cleaned, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Saved {len(cleaned)} cleaned PDF documents to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()