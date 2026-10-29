# Green Radar

Public dashboard for the Cordillera Administrative Region. It shows real Sentinel-2 imagery, fixed-pixel NDVI, and transcribed PSA vegetable totals. It does not name a crop unless a model score is at least 90%. No such score exists yet, so every place is **Unclassified**.

App ID: **APP-001**

## Run

```bash
npm run dev
```

The dev server listens on port 8080. Static scenes and boundaries are in `public/data` and `public/imagery`.

## Test

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

Crop-label rules live in `src/lib/radar/metrics.ts` and are covered by `src/lib/radar/metrics.test.ts`.

## Deploy

This workspace builds with TanStack Start and Nitro for the hosted preview. Production deploys should come from `main` only.

GitHub: https://github.com/DTopGoat/green-radar. Actions runs tests, typecheck, and a production build on every push. Repo-wide lint still fails on a pre-existing empty catch in platform code, so lint is not a required check.

`refresh-scenes` reruns the Sentinel-2 fetch every Monday night Philippine time, and whenever you start it from the Actions tab. It commits only if the chips or the NDVI series changed. No key is stored in the repo.

Netlify is not wired. The app is not a plain static folder. Do not add secrets to the repo.

## Data refresh

```bash
python3 pipeline/fetch_scenes.py
python3 pipeline/fetch_photos.py
```

`fetch_scenes.py` reads Copernicus Sentinel-2 L2A through Microsoft Planetary Computer (no key for these public endpoints) and writes:

- `public/data/boundaries.geojson` — CAR municipalities (geoBoundaries, CC BY 4.0)
- `public/data/observations.json` — NDVI at fixed pixels
- `public/data/manifest.json` — dates and source notes
- `public/imagery/` — true-color, false-color, and NDVI chips

`fetch_photos.py` copies Wikimedia Commons files only under CC0, CC BY, or CC BY-SA into `public/photos` and `public/data/crop_photos.json`.

Cloudy pixels are dropped. Missing months are not filled in. Prices are not forecast.

PSA tonnes in `src/data/statistics.ts` were transcribed from PSA-CAR release text. The PDF host returned HTTP 403 during the build, so those rows are marked unverified-by-file.

## Restart

`startup.sh` starts `npm run dev` if port 8080 is down.

## Honesty rules

- No generated satellite images and no generated crop photos.
- No invented precision, recall, yield, harvest date, or peso price.
- Field polygons are not invented when OpenStreetMap or a segmenter is missing.
