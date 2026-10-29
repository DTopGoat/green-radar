# Pipeline

`fetch_scenes.py` and `fetch_photos.py` are the only data writers. They do not train a model.

Re-run them when you want a newer Sentinel-2 snapshot. Commit the files they write under `public/`. Do not commit API keys; these endpoints are public.

Google Earth Engine is not required for this phase. A later classifier should keep the 90% rule in `src/lib/radar/metrics.ts` and publish a real confusion matrix on the accuracy page.
