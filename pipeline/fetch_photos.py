#!/usr/bin/env python3
"""Attach real Wikimedia Commons photographs to crops.

Keeps only CC0, CC BY, and CC BY-SA (no NC, no ND). If nothing qualifies,
the crop is stored as photo unavailable. Never generates an image.
"""

from __future__ import annotations

import html
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CROPS = ROOT / "src" / "data" / "crops.ts"
OUT = ROOT / "public" / "data" / "crop_photos.json"
PHOTO_DIR = ROOT / "public" / "photos"
UA = "GreenRadar/0.1 (https://github.com/DTopGoat/green-radar; educational crop library)"
API = "https://commons.wikimedia.org/w/api.php"
REJECT_TITLE = (
    "logo",
    "icon",
    "flag",
    "map",
    "diagram",
    "illustration",
    "drawing",
    "painting",
    "stamp",
    "coin",
    "coat of arms",
    "svg",
    "pictogram",
    "clipart",
    "symbol",
)


def crops() -> list[tuple[str, str]]:
    text = CROPS.read_text()
    found = re.findall(r'id:\s*"([^"]+)"[\s\S]*?search:\s*"([^"]+)"', text)
    # The regex is greedy across crops if not careful. Split by lines instead.
    rows = []
    for line in text.splitlines():
        if "search:" not in line or "id:" not in line:
            continue
        id_match = re.search(r'id:\s*"([^"]+)"', line)
        search_match = re.search(r'search:\s*"([^"]+)"', line)
        if id_match and search_match:
            rows.append((id_match.group(1), search_match.group(1)))
    return rows


def license_ok(name: str) -> bool:
    lowered = name.lower().replace("_", " ")
    if any(token in lowered for token in ("nc", "nd", "noncommercial", "no derivatives", "noderiv")):
        return False
    return lowered.startswith("cc0") or lowered.startswith("cc by") or "public domain" in lowered


def strip_html(value: str) -> str:
    text = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", html.unescape(text)).strip()


def api(params: dict) -> dict:
    params = {**params, "format": "json"}
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=40) as res:
        return json.loads(res.read().decode())


def search(query: str) -> list[dict]:
    payload = api(
        {
            "action": "query",
            "generator": "search",
            "gsrsearch": f"filetype:bitmap {query}",
            "gsrnamespace": "6",
            "gsrlimit": "8",
            "prop": "imageinfo",
            "iiprop": "url|extmetadata|mime|size",
            "iiurlwidth": "960",
        }
    )
    pages = (payload.get("query") or {}).get("pages") or {}
    rows = []
    for page in pages.values():
        info = (page.get("imageinfo") or [None])[0]
        if info:
            rows.append({"title": page.get("title") or "", "info": info})
    return rows


def pick(rows: list[dict]) -> dict | None:
    for row in rows:
        title = row["title"].lower()
        if any(word in title for word in REJECT_TITLE):
            continue
        info = row["info"]
        mime = info.get("mime") or ""
        if mime not in ("image/jpeg", "image/png", "image/webp"):
            continue
        meta = info.get("extmetadata") or {}
        license_name = (meta.get("LicenseShortName") or {}).get("value") or ""
        if not license_ok(license_name):
            continue
        thumb = info.get("thumburl") or info.get("url")
        if not thumb:
            continue
        artist = strip_html((meta.get("Artist") or {}).get("value") or "")
        return {
            "title": row["title"].replace("File:", ""),
            "thumb": thumb,
            "original": info.get("descriptionurl") or info.get("url"),
            "fileUrl": info.get("url"),
            "author": artist or "Unknown",
            "license": strip_html(license_name),
            "licenseUrl": (meta.get("LicenseUrl") or {}).get("value") or "",
        }
    return None


def download(url: str, dest: Path) -> bool:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=40) as res:
        blob = res.read()
    if len(blob) < 4000:
        return False
    if not (blob.startswith(b"\xff\xd8") or blob.startswith(b"\x89PNG") or blob.startswith(b"RIFF")):
        return False
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(blob)
    return True


def main() -> None:
    catalog = crops()
    print("crops", len(catalog))
    photos = []
    for crop_id, query in catalog:
        time.sleep(0.35)
        try:
            chosen = pick(search(query))
        except Exception as exc:  # noqa: BLE001
            print("search fail", crop_id, exc)
            chosen = None
        if not chosen:
            photos.append(
                {
                    "cropId": crop_id,
                    "status": "unavailable",
                    "reason": "No CC0, CC BY, or CC BY-SA photograph matched this crop on Wikimedia Commons.",
                    "source": "Wikimedia Commons",
                }
            )
            print("unavailable", crop_id)
            continue
        ext = ".png" if chosen["thumb"].lower().split("?")[0].endswith(".png") else ".jpg"
        dest = PHOTO_DIR / f"{crop_id}{ext}"
        try:
            ok = download(chosen["thumb"], dest)
        except Exception as exc:  # noqa: BLE001
            print("download fail", crop_id, exc)
            ok = False
        if not ok:
            photos.append(
                {
                    "cropId": crop_id,
                    "status": "unavailable",
                    "reason": "A licensed file was found but could not be stored.",
                    "pageUrl": chosen["original"],
                    "source": "Wikimedia Commons",
                }
            )
            continue
        photos.append(
            {
                "cropId": crop_id,
                "status": "available",
                "file": f"/photos/{crop_id}{ext}",
                "originalUrl": chosen["fileUrl"],
                "pageUrl": chosen["original"],
                "author": chosen["author"],
                "license": chosen["license"],
                "licenseUrl": chosen["licenseUrl"],
                "title": chosen["title"],
                "source": "Wikimedia Commons",
            }
        )
        print("saved", crop_id)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"generatedFrom": "Wikimedia Commons", "photos": photos}, indent=2))
    ready = sum(1 for row in photos if row["status"] == "available")
    print("done", ready, "/", len(photos))


if __name__ == "__main__":
    main()
