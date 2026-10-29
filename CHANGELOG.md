# Changelog

## Unreleased

- GitHub Actions checks every push.
- Weekly Sentinel-2 refresh workflow. The fetch now runs through the current time and can reuse the saved municipality file when the raw boundary download is absent.

## 0.1.0 — 2026-10-27

- CAR municipality boundaries on a Sentinel-2 cloudless 2024 basemap (Leaflet).
- Fixed-pixel NDVI from April 2025 through October 2026 for La Trinidad valley, a nearby ridge, Baguio, and Buguias, from clear Sentinel-2 L2A scenes. Cloudy months are omitted, not filled in.
- True-color, false-color, and NDVI chips with scene id, time, tile, cloud cover, and links to Copernicus Browser and Planetary Computer.
- Crop library with Wikimedia photographs or an explicit “Photo unavailable”.
- 90% naming rule implemented and tested. Every place stays Unclassified because no model score exists.
- Accuracy page states precision and recall as not measured.
- PSA 2016/2020 vegetable figures shown only as transcribed history, with the PDF-not-refetched caveat.
- Price forecast and plot yield withheld.
- No login.
