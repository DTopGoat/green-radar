#!/usr/bin/env python3
"""Fetch real Sentinel-2 observations for Green Radar.

Reads public Microsoft Planetary Computer STAC + reflectance, writes
static JSON and JPEG chips. Does not classify crops and does not invent
numbers. Pixels that ESA's scene-classification layer marks as cloud,
shadow, cirrus, snow, defective, or nodata are dropped.
"""

from __future__ import annotations

import json
import math
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
DATA = PUBLIC / "data"
IMG = PUBLIC / "imagery"
ADM1 = Path("/tmp/radar/adm1.geojson")
ADM2 = Path("/tmp/radar/adm2.geojson")
ADM3 = Path("/tmp/radar/adm3.geojson")
UA = "GreenRadar/0.1 (Cordillera agriculture dashboard; educational)"
STAC = "https://planetarycomputer.microsoft.com/api/stac/v1/search"
PC = "https://planetarycomputer.microsoft.com/api/data/v1/item"

SITES = [
    {
        "id": "la-trinidad-valley",
        "name": "La Trinidad valley floor",
        "kind": "mixed-valley",
        "kindLabel": "Mixed valley floor — plots, roads and roofs in one 10 m pixel. Not a single farm.",
        "bbox": [120.55, 16.43, 120.64, 16.51],
        "pixels": [
            [120.575, 16.455],
            [120.585, 16.460],
            [120.590, 16.446],
            [120.598, 16.468],
        ],
    },
    {
        "id": "baguio-urban",
        "name": "Baguio built-up",
        "kind": "built-up",
        "kindLabel": "Built-up reference inside Baguio. Not farmland.",
        "bbox": [120.56, 16.39, 120.64, 16.44],
        "pixels": [[120.605, 16.410]],
    },
    {
        "id": "trinidad-ridge",
        "name": "Ridge north of La Trinidad",
        "kind": "forest-reference",
        "kindLabel": "Forest reference. High NDVI here is woody cover, not a vegetable crop.",
        "bbox": [120.53, 16.46, 120.59, 16.51],
        "pixels": [[120.560, 16.480]],
    },
    {
        "id": "buguias-town",
        "name": "Buguias town slopes",
        "kind": "highland-town",
        "kindLabel": "Town and nearby slopes in Buguias. Not a surveyed field.",
        "bbox": [120.78, 16.76, 120.835, 16.815],
        "pixels": [
            [120.832, 16.802],
            [120.820, 16.790],
            [120.815, 16.815],
        ],
    },
]

SCL_KEEP = {4, 5, 6}
SCL_NAME = {
    0: "nodata",
    1: "defective",
    2: "dark",
    3: "cloud-shadow",
    4: "vegetation",
    5: "not-vegetated",
    6: "water",
    7: "unclassified",
    8: "cloud",
    9: "cloud",
    10: "cirrus",
    11: "snow",
}


def ndvi(nir: float, red: float) -> float | None:
    denom = nir + red
    if denom == 0:
        return None
    value = (nir - red) / denom
    if not math.isfinite(value):
        return None
    return value


assert abs((ndvi(2694, 1782) or 0) - (2694 - 1782) / (2694 + 1782)) < 1e-9


def http_json(url: str, payload: dict | None = None, timeout: int = 60) -> dict:
    data = None if payload is None else json.dumps(payload).encode()
    headers = {"User-Agent": UA, "Accept": "application/json"}
    if data is not None:
        headers["Content-Type"] = "application/json"
    last: Exception | None = None
    for attempt in range(4):
        req = urllib.request.Request(url, data=data, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as res:
                return json.loads(res.read().decode())
        except urllib.error.HTTPError as exc:
            last = exc
            if exc.code not in (429, 500, 502, 503, 504):
                body = exc.read().decode("utf-8", "replace")[:300]
                raise RuntimeError(f"HTTP {exc.code} {url} {body}") from exc
            time.sleep(1.5 * (attempt + 1))
        except urllib.error.URLError as exc:
            last = exc
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"failed {url}: {last}")


def http_bytes(url: str, timeout: int = 90) -> bytes:
    headers = {"User-Agent": UA}
    last: Exception | None = None
    for attempt in range(3):
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as res:
                return res.read()
        except urllib.error.HTTPError as exc:
            last = exc
            if exc.code not in (429, 500, 502, 503, 504):
                raise
            time.sleep(1.5 * (attempt + 1))
        except urllib.error.URLError as exc:
            last = exc
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"failed bytes {url}: {last}")


def rings(geom: dict) -> list:
    kind = geom.get("type")
    coords = geom.get("coordinates") or []
    if kind == "Polygon":
        return [coords]
    if kind == "MultiPolygon":
        return coords
    return []


def point_in_ring(x: float, y: float, ring: list) -> bool:
    inside = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-30) + xi):
            inside = not inside
        j = i
    return inside


def point_in_geom(x: float, y: float, geom: dict) -> bool:
    for poly in rings(geom):
        if not poly:
            continue
        if point_in_ring(x, y, poly[0]) and not any(point_in_ring(x, y, hole) for hole in poly[1:]):
            return True
    return False


def ring_area_ha(ring: list) -> float:
    if len(ring) < 3:
        return 0.0
    lat0 = sum(p[1] for p in ring) / len(ring)
    mx = 111320 * math.cos(math.radians(lat0))
    my = 110540
    pts = [(p[0] * mx, p[1] * my) for p in ring]
    acc = 0.0
    for i in range(len(pts)):
        x1, y1 = pts[i]
        x2, y2 = pts[(i + 1) % len(pts)]
        acc += x1 * y2 - x2 * y1
    return abs(acc) / 2 / 10000


def geom_area_ha(geom: dict) -> float:
    total = 0.0
    for poly in rings(geom):
        if not poly:
            continue
        total += ring_area_ha(poly[0])
        for hole in poly[1:]:
            total -= ring_area_ha(hole)
    return max(0.0, total)


def centroid(geom: dict) -> tuple[float, float]:
    ring = rings(geom)[0][0]
    return (sum(p[0] for p in ring) / len(ring), sum(p[1] for p in ring) / len(ring))


def round_geom(geom: dict, digits: int = 5) -> dict:
    def walk(node):
        if isinstance(node, list):
            if node and isinstance(node[0], (int, float)) and not isinstance(node[0], bool):
                return [round(float(node[0]), digits), round(float(node[1]), digits)]
            return [walk(part) for part in node]
        return node

    return {"type": geom["type"], "coordinates": walk(geom["coordinates"])}


def load_boundaries() -> dict:
    baked = DATA / "boundaries.geojson"
    if ADM1.exists() and ADM2.exists() and ADM3.exists():
        adm1 = json.loads(ADM1.read_text())
        adm2 = json.loads(ADM2.read_text())
        adm3 = json.loads(ADM3.read_text())
        car = next(f for f in adm1["features"] if f["properties"]["shapeName"] == "CAR")
        provinces = [f for f in adm2["features"] if point_in_geom(*centroid(f["geometry"]), car["geometry"])]
        features = []
        for feature in adm3["features"]:
            lon, lat = centroid(feature["geometry"])
            name = feature["properties"]["shapeName"]
            province = "Baguio City" if name == "Baguio City" else None
            if province is None:
                for prov in provinces:
                    if point_in_geom(lon, lat, prov["geometry"]):
                        province = prov["properties"]["shapeName"]
                        break
            if province is None:
                continue
            features.append(
                {
                    "type": "Feature",
                    "id": feature["properties"]["shapeID"],
                    "properties": {
                        "id": feature["properties"]["shapeID"],
                        "name": name,
                        "province": province,
                        "areaHa": round(geom_area_ha(feature["geometry"]), 1),
                    },
                    "geometry": round_geom(feature["geometry"]),
                }
            )
        features.sort(key=lambda f: (f["properties"]["province"], f["properties"]["name"]))
        return {"type": "FeatureCollection", "features": features}
    if baked.exists():
        print("boundaries from", baked)
        return json.loads(baked.read_text())
    raise SystemExit("No boundaries. Need geoBoundaries ADM files or public/data/boundaries.geojson.")


def locate(boundaries: dict, lon: float, lat: float) -> tuple[str | None, str | None]:
    for feature in boundaries["features"]:
        if point_in_geom(lon, lat, feature["geometry"]):
            return feature["properties"]["name"], feature["properties"]["province"]
    return None, None


def search_scenes() -> list[dict]:
    start = datetime(2025, 4, 1, tzinfo=timezone.utc)
    end = datetime.now(timezone.utc)
    windows: list[str] = []
    cursor = start
    while cursor < end:
        nxt = min(cursor + timedelta(days=122), end)
        windows.append(
            f"{cursor.strftime('%Y-%m-%dT%H:%M:%SZ')}/{nxt.strftime('%Y-%m-%dT%H:%M:%SZ')}"
        )
        cursor = nxt
    found: list[dict] = []
    seen: set[str] = set()
    for window in windows:
        payload = {
            "collections": ["sentinel-2-l2a"],
            "bbox": [120.40, 16.12, 121.05, 16.98],
            "datetime": window,
            "query": {"eo:cloud_cover": {"lt": 45}},
            "limit": 100,
        }
        url = STAC
        body: dict | None = payload
        for _ in range(5):
            if not url:
                break
            page = http_json(url, body)
            for feature in page.get("features") or []:
                if feature["id"] not in seen:
                    seen.add(feature["id"])
                    found.append(feature)
            body = None
            url = ""
            for link in page.get("links") or []:
                if link.get("rel") == "next" and link.get("href"):
                    url = link["href"]
                    break
        print(" window", window, "total", len(found))
    return found


def month_key(iso: str) -> str:
    return iso[:7]


def platform_name(item_id: str) -> str:
    if item_id.startswith("S2A"):
        return "Sentinel-2A"
    if item_id.startswith("S2B"):
        return "Sentinel-2B"
    if item_id.startswith("S2C"):
        return "Sentinel-2C"
    return "Sentinel-2"


def tile_of(props: dict) -> str:
    return str(props.get("s2:mgrs_tile") or props.get("grid:code") or "unknown")


def candidates_by_month(items: list[dict], lon: float, lat: float) -> dict[str, list[dict]]:
    buckets: dict[str, list[dict]] = {}
    for feature in items:
        if not point_in_geom(lon, lat, feature.get("geometry") or {}):
            continue
        when = (feature.get("properties") or {}).get("datetime")
        if not when:
            continue
        buckets.setdefault(month_key(when), []).append(feature)
    chosen: dict[str, list[dict]] = {}
    for key, rows in buckets.items():
        rows.sort(key=lambda feature: float((feature.get("properties") or {}).get("eo:cloud_cover") or 100))
        chosen[key] = rows[:4]
    return chosen


def sample_pixel(item_id: str, lon: float, lat: float) -> dict | None:
    query = urllib.parse.urlencode(
        [("collection", "sentinel-2-l2a"), ("item", item_id), ("assets", "B04"), ("assets", "B08"), ("assets", "SCL")],
        doseq=True,
    )
    try:
        payload = http_json(f"{PC}/point/{lon},{lat}?{query}", timeout=40)
    except Exception as exc:  # noqa: BLE001
        print("  pixel miss", item_id[:24], exc)
        return None
    values = dict(zip(payload.get("band_names") or [], payload.get("values") or []))
    red, nir, scl_raw = values.get("B04_b1"), values.get("B08_b1"), values.get("SCL_b1")
    if red is None or nir is None or scl_raw is None:
        return None
    scl = int(scl_raw)
    if scl not in SCL_KEEP:
        return {"scl": scl, "kept": False}
    value = ndvi(float(nir), float(red))
    if value is None:
        return {"scl": scl, "kept": False}
    return {"scl": scl, "kept": True, "ndvi": value}


def chip_url(item_id: str, bbox: list[float], mode: str) -> str:
    minx, miny, maxx, maxy = bbox
    path = f"{PC}/bbox/{minx},{miny},{maxx},{maxy}/720x540.jpg"
    if mode == "true":
        pairs = [("assets", "visual")]
    elif mode == "false":
        pairs = [
            ("assets", "B08"),
            ("assets", "B04"),
            ("assets", "B03"),
            ("color_formula", "Gamma RGB 3.0 Sigmoidal RGB 20 0.35"),
        ]
    else:
        pairs = [
            ("expression", "(B08-B04)/(B08+B04)"),
            ("asset_as_band", "True"),
            ("rescale", "0,0.8"),
            ("colormap_name", "rdylgn"),
        ]
    pairs = [("collection", "sentinel-2-l2a"), ("item", item_id), *pairs]
    return path + "?" + urllib.parse.urlencode(pairs, doseq=True)


def save_chip(url: str, dest: Path) -> bool:
    if dest.exists() and dest.stat().st_size > 20000:
        return True
    try:
        blob = http_bytes(url)
    except Exception as exc:  # noqa: BLE001
        print("  chip fail", dest.name, exc)
        return False
    if len(blob) < 20000 or not blob.startswith(b"\xff\xd8"):
        print("  chip empty", dest.name, len(blob))
        return False
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(blob)
    return True


def viewer_links(item_id: str, lon: float, lat: float, day: str) -> dict[str, str]:
    return {
        "copernicusUrl": (
            "https://browser.dataspace.copernicus.eu/"
            f"?zoom=13&lat={lat}&lng={lon}&datasetId=S2_L2A_CDAS"
            f"&fromTime={day}T00:00:00.000Z&toTime={day}T23:59:59.999Z"
        ),
        "planetaryUrl": (
            "https://planetarycomputer.microsoft.com/explore"
            f"?c={lon}%2C{lat}&z=13&v=2&d=sentinel-2-l2a&s=false&ae={urllib.parse.quote(item_id)}"
        ),
        "stacUrl": (
            "https://planetarycomputer.microsoft.com/api/stac/v1/collections/sentinel-2-l2a/items/"
            + urllib.parse.quote(item_id)
        ),
    }


def even_dates(keys: list[str], count: int) -> list[str]:
    if len(keys) <= count:
        return keys
    picked: list[str] = []
    for i in range(count):
        key = keys[round(i * (len(keys) - 1) / (count - 1))]
        if key not in picked:
            picked.append(key)
    return picked


def dominant(scl_values: list[int]) -> str:
    if not scl_values:
        return "none"
    return SCL_NAME.get(Counter(scl_values).most_common(1)[0][0], "other")


def observe_month(pixels: list[list[float]], feature: dict) -> dict | None:
    kept_ndvi: list[float] = []
    kept_scl: list[int] = []
    for lon, lat in pixels:
        sampled = sample_pixel(feature["id"], lon, lat)
        if not sampled or not sampled.get("kept"):
            continue
        kept_ndvi.append(sampled["ndvi"])
        kept_scl.append(sampled["scl"])
    if not kept_ndvi:
        return None
    kept_ndvi.sort()
    mid = kept_ndvi[len(kept_ndvi) // 2]
    if len(kept_ndvi) % 2 == 0:
        mid = (kept_ndvi[len(kept_ndvi) // 2 - 1] + mid) / 2
    props = feature["properties"]
    when = props["datetime"]
    return {
        "date": when[:10],
        "datetime": when,
        "itemId": feature["id"],
        "tile": tile_of(props),
        "platform": platform_name(feature["id"]),
        "cloudCover": None if props.get("eo:cloud_cover") is None else round(float(props["eo:cloud_cover"]), 2),
        "medianNdvi": round(mid, 4),
        "minNdvi": round(kept_ndvi[0], 4),
        "maxNdvi": round(kept_ndvi[-1], 4),
        "clearCount": len(kept_ndvi),
        "pixelCount": len(pixels),
        "dominantScl": dominant(kept_scl),
    }


def build_site(site: dict, items: list[dict], boundaries: dict) -> dict:
    lon, lat = site["pixels"][0]
    monthly = candidates_by_month(items, lon, lat)
    muni, province = locate(boundaries, lon, lat)
    series = []
    for key in sorted(monthly):
        row = None
        for feature in monthly[key]:
            row = observe_month(site["pixels"], feature)
            if row:
                break
        if row:
            series.append(row)
            print(f"  {site['id']} {row['date']} ndvi={row['medianNdvi']} n={row['clearCount']} scl={row['dominantScl']}")
        else:
            print(f"  {site['id']} {key} cloudy")
    limit = 6 if site["id"] == "la-trinidad-valley" else 2
    by_month = {row["date"][:7]: row for row in series}
    scenes = []
    for key in even_dates(sorted(by_month), limit):
        row = by_month[key]
        paths: dict[str, str | None] = {}
        ok = True
        for mode in ("true", "false", "ndvi"):
            dest = IMG / site["id"] / f"{row['date']}-{mode}.jpg"
            if save_chip(chip_url(row["itemId"], site["bbox"], mode), dest):
                paths[mode] = f"/imagery/{site['id']}/{row['date']}-{mode}.jpg"
            elif mode == "true":
                ok = False
                break
            else:
                paths[mode] = None
        if not ok:
            continue
        center_lon = round(sum(p[0] for p in site["pixels"]) / len(site["pixels"]), 5)
        center_lat = round(sum(p[1] for p in site["pixels"]) / len(site["pixels"]), 5)
        scenes.append(
            {
                "date": row["date"],
                "datetime": row["datetime"],
                "itemId": row["itemId"],
                "tile": row["tile"],
                "platform": row["platform"],
                "cloudCover": row["cloudCover"],
                "trueColor": paths["true"],
                "falseColor": paths.get("false"),
                "ndviColor": paths.get("ndvi"),
                "bbox": site["bbox"],
                "center": [center_lon, center_lat],
                **viewer_links(row["itemId"], center_lon, center_lat, row["date"]),
            }
        )
    return {
        "id": site["id"],
        "name": site["name"],
        "kind": site["kind"],
        "kindLabel": site["kindLabel"],
        "municipality": muni,
        "province": province,
        "pixels": [{"id": f"{site['id']}-{i+1}", "lon": px, "lat": py} for i, (px, py) in enumerate(site["pixels"])],
        "series": series,
        "scenes": scenes,
    }


def try_osm() -> dict:
    query = '[out:json][timeout:20];way["landuse"~"^(farmland|orchard|greenhouse_horticulture)$"](16.42,120.54,16.50,120.64);out tags center;'
    data = urllib.parse.urlencode({"data": query}).encode()
    req = urllib.request.Request("https://overpass-api.de/api/interpreter", data=data, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            payload = json.loads(res.read().decode())
    except Exception as exc:  # noqa: BLE001
        return {
            "status": "unavailable",
            "count": 0,
            "detail": f"Overpass request failed ({exc}). No field polygons were invented.",
        }
    count = len(payload.get("elements") or [])
    return {
        "status": "ok",
        "count": count,
        "detail": (
            f"OpenStreetMap returned {count} farmland, orchard, or greenhouse ways in the La Trinidad chip. "
            "They are not drawn: a partial layer would look like a complete field survey."
        ),
    }


def main() -> None:
    DATA.mkdir(parents=True, exist_ok=True)
    boundaries = load_boundaries()
    (DATA / "boundaries.geojson").write_text(json.dumps(boundaries, separators=(",", ":")))
    print("features", len(boundaries["features"]))
    items = search_scenes()
    print("scenes", len(items))
    sites = []
    for site in SITES:
        print("site", site["id"])
        built = build_site(site, items, boundaries)
        if built["series"]:
            sites.append(built)
    generated = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    dates = [row["date"] for site in sites for row in site["series"]]
    (DATA / "observations.json").write_text(
        json.dumps(
            {
                "generatedAt": generated,
                "method": (
                    "NDVI = (B08 − B04) / (B08 + B04) from Sentinel-2 L2A surface reflectance at fixed 10 m pixels. "
                    "A pixel is kept only when ESA scene classification (SCL) is vegetation (4), not-vegetated (5), or water (6). "
                    "Up to four low-cloud scenes are tried per month, from April 2025 through the refresh time. No crop label is assigned."
                ),
                "sites": sites,
            },
            indent=2,
        )
    )
    manifest = {
        "generatedAt": generated,
        "imageryThrough": max(dates) if dates else None,
        "imageryFrom": min(dates) if dates else None,
        "sceneCount": len({row["itemId"] for site in sites for row in site["series"]}),
        "boundarySource": "geoBoundaries gbOpen PHL ADM3 simplified, via NAMRIA / PSA / OCHA (HDX), CC BY 4.0",
        "boundaryLicense": "CC BY 4.0",
        "mosaic": "EOX Sentinel-2 cloudless 2024 (contains modified Copernicus Sentinel data 2024)",
        "reflectance": "Copernicus Sentinel-2 L2A via Microsoft Planetary Computer",
        "osm": try_osm(),
        "notes": [
            "Crop species are not classified in this release.",
            "Field boundaries were not auto-segmented and were not invented.",
            "Price forecasts are not published.",
        ],
    }
    (DATA / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print("wrote", generated)


if __name__ == "__main__":
    main()
