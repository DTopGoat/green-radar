# APP-001 · Green Radar

- **Purpose:** Public Cordillera farmland dashboard. Real Sentinel-2, honest gaps.
- **Phase:** 1 — Benguet reference pixels, CAR municipality shell, crop library, accuracy page.
- **Users:** Public. No login.
- **Stack:** TanStack Start, React, Leaflet, Recharts. Static Sentinel-2 chips from Planetary Computer. Python fetch scripts.
- **Live:** Preview in this builder. Code: https://github.com/DTopGoat/green-radar (public). Netlify is not connected.
- **Update cycle:** GitHub Actions tests every push. Sentinel-2 chips refresh weekly (Monday night Philippine time) and on demand. An agent pass continues the honest backlog about every 20 minutes until usage is near 90%, then it stops.
- **Label rule:** Species name only at ≥ 90% confidence. Current label everywhere: Unclassified.
- **Measured:** NDVI at fixed 10 m pixels, 21 April 2025–16 October 2026 where clouds allowed. Scene chips are real L2A renders.
- **Withheld:** Crop identity, field boundaries, harvest dates, plot yields, price forecasts, precision/recall.
- **PSA:** 2020 provincial vegetable tonnes and 2016 cabbage/potato/carrot figures, transcribed, PDF not re-fetched (HTTP 403).
- **Photos:** Wikimedia Commons, CC0 / CC BY / CC BY-SA, or “Photo unavailable”.
- **Defaults:** Benguet sampling only; other CAR towns are boundaries. Basemap is the 2024 EOX mosaic. Theme follows the system until toggled. Confidence threshold 0.90. Price horizon not published.
- **Known issues:** No Sentinel-1. No auto field segments. OSM Overpass failed (502), so no farm polygons. Some months are cloudy and absent. One Buguias sample point sat outside the Sentinel tile and was dropped. PSA numbers are not file-verified. Price panel is empty on purpose. Netlify is not connected. The weekly job can only add scenes after the repo exists and Actions is allowed to push.
- **Next:** Ingest a real DA price file, add Sentinel-1 at the same pixels, then a crop model only with a labeled hold-out set.
