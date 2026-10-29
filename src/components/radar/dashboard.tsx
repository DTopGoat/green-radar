import { useEffect, useMemo, useState } from "react";
import { cropSnapshots, statisticsCaveat, vegetableRows } from "@/data/statistics";
import { cropById, crops, groupById, groups } from "@/data/crops";
import { formatHa, formatMt, formatNdvi, impliedYield, vegetationPeak } from "@/lib/radar/metrics";
import { loadJson } from "@/lib/radar/load";
import type { BoundaryProps, CropPhoto, Manifest, ObservationsFile, Site } from "@/lib/radar/types";
import { MapView, type AreaFeature, type MapMode } from "@/components/radar/map-view";
import { NdviChart } from "@/components/radar/ndvi-chart";
import { SceneViewer } from "@/components/radar/scene-viewer";

type BoundaryFile = {
  type: "FeatureCollection";
  features: {
    type: "Feature";
    properties: BoundaryProps;
    geometry: { type: string; coordinates: unknown };
  }[];
};

const PROVINCES = ["Abra", "Apayao", "Benguet", "Ifugao", "Kalinga", "Mountain Province", "Baguio City"];

export function Dashboard() {
  const [boundaries, setBoundaries] = useState<BoundaryFile | null>(null);
  const [observations, setObservations] = useState<ObservationsFile | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [photos, setPhotos] = useState<CropPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [province, setProvince] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [siteId, setSiteId] = useState<string | null>("la-trinidad-valley");
  const [cropId, setCropId] = useState("all");
  const [mode, setMode] = useState<MapMode>("both");

  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        const [areas, obs, meta] = await Promise.all([
          loadJson<BoundaryFile>("/data/boundaries.geojson"),
          loadJson<ObservationsFile>("/data/observations.json"),
          loadJson<Manifest>("/data/manifest.json"),
        ]);
        if (!live) return;
        setBoundaries(areas);
        setObservations(obs);
        setManifest(meta);
        try {
          const photoFile = await loadJson<{ photos: CropPhoto[] }>("/data/crop_photos.json");
          if (live) setPhotos(photoFile.photos);
        } catch {
          /* photos are optional until the library file exists */
        }
      } catch (err) {
        if (live) setError(err instanceof Error ? err.message : "Could not load map data");
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  const sites = useMemo(() => observations?.sites ?? [], [observations]);
  const selected = boundaries?.features.find((feature) => feature.properties.id === selectedId) ?? null;
  const site = sites.find((item) => item.id === siteId) ?? null;

  const areas = useMemo<AreaFeature[]>(() => {
    if (!boundaries) return [];
    return boundaries.features
      .filter((feature) => province === "all" || feature.properties.province === province)
      .map((feature) => {
        const match = sites.find(
          (item) =>
            item.municipality === feature.properties.name &&
            (item.kind === "mixed-valley" || item.kind === "highland-town"),
        );
        const latest = match?.series.at(-1)?.medianNdvi;
        return {
          type: "Feature" as const,
          id: feature.properties.id,
          geometry: feature.geometry,
          properties: {
            ...feature.properties,
            ndvi: latest ?? 0,
            sampled: latest == null ? 0 : 1,
          },
        };
      });
  }, [boundaries, province, sites]);

  const listed = areas.filter((feature) => feature.properties.name.toLowerCase().includes(query.trim().toLowerCase()));
  const pixels = (site ? [site] : sites).flatMap((item) => item.pixels);
  const crop = cropId === "all" ? undefined : cropById(cropId);
  const photo = photos.find((item) => item.cropId === cropId);

  function chooseMunicipality(id: string) {
    setSelectedId(id);
    const feature = boundaries?.features.find((item) => item.properties.id === id);
    const match = sites.find(
      (item) =>
        item.municipality === feature?.properties.name &&
        (item.kind === "mixed-valley" || item.kind === "highland-town"),
    );
    setSiteId(match?.id ?? sites.find((item) => item.municipality === feature?.properties.name)?.id ?? null);
  }

  return (
    <div className="grid min-h-0 flex-1 grid-rows-2 lg:grid-cols-3 lg:grid-rows-1">
      <section className="relative min-h-0 lg:col-span-2" aria-label="Satellite map">
        <MapView areas={areas} pixels={site ? pixels : []} selectedId={selectedId} mode={mode} onSelect={chooseMunicipality} />
        <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-2">
          {(["satellite", "both", "vigor"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={`inline-flex h-11 items-center rounded-full px-3 text-sm ${
                mode === value ? "bg-ink text-cloud" : "bg-cloud text-ink"
              }`}
              aria-pressed={mode === value}
            >
              {value === "satellite" ? "Satellite" : value === "vigor" ? "Vigor" : "Both"}
            </button>
          ))}
        </div>
        <div className="absolute bottom-12 left-3 z-10 max-w-xs rounded-2xl bg-cloud px-3 py-2 text-xs text-ink shadow-sm">
          <p className="font-medium">Not a crop map</p>
          <p className="text-muted">
            Fill, where shown, is the latest clear-pixel NDVI at a fixed reference site. Tan is low vigor, green is high.
            Uncolored towns were not sampled.
          </p>
        </div>
      </section>
      <aside className="min-h-0 overflow-y-auto border-t border-line bg-paper lg:border-t-0 lg:border-l">
        <div className="space-y-5 px-4 py-4 lg:px-5">
          <div>
            <p className="font-mono text-xs text-muted tabular-nums">
              {manifest ? `Scenes ${manifest.imageryFrom} – ${manifest.imageryThrough}` : "Loading scenes"}
            </p>
            <h1 className="font-serif text-2xl text-ink">Benguet reference pixels</h1>
            <p className="text-sm text-muted">
              CAR municipalities are on the map. Reflectance is sampled only at fixed points in La Trinidad, Baguio, and
              Buguias. Nothing here is a detected farm plot.
            </p>
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <div className="grid gap-3">
            <label className="text-sm">
              <span className="mb-1 block text-muted">Province</span>
              <select
                value={province}
                onChange={(event) => setProvince(event.target.value)}
                className="h-11 w-full rounded-xl border border-line bg-cloud px-3"
              >
                <option value="all">All of CAR</option>
                {PROVINCES.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted">Municipality</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search a name"
                className="h-11 w-full rounded-xl border border-line bg-cloud px-3"
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted">Crop reference</span>
              <select
                value={cropId}
                onChange={(event) => setCropId(event.target.value)}
                className="h-11 w-full rounded-xl border border-line bg-cloud px-3"
              >
                <option value="all">No crop selected</option>
                {groups.map((group) => (
                  <optgroup key={group.id} label={group.name}>
                    {crops
                      .filter((item) => item.groupId === group.id && !item.parentId)
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </label>
          </div>
          <p className="rounded-2xl border border-line bg-cloud px-3 py-3 text-sm">
            <span className="font-medium">Label: Unclassified.</span> No model score is published, so the 90% rule
            names nothing. A species would appear only at confidence ≥ 90%.
          </p>
          {crop ? <CropCard cropId={crop.id} photo={photo} /> : null}
          {site ? <SiteCard site={site} /> : null}
          {selected && !site ? (
            <section className="space-y-2">
              <h2 className="font-serif text-xl">
                {selected.properties.name}
                <span className="block text-sm font-sans text-muted">{selected.properties.province}</span>
              </h2>
              <p className="text-sm text-muted">
                Administrative area about {formatHa(selected.properties.areaHa)} ha. That is the town boundary, not
                planted area. No reference pixel falls here, so vigor, harvest, and yield are withheld.
              </p>
            </section>
          ) : null}
          <section>
            <h2 className="mb-2 text-sm font-medium">Towns</h2>
            <ul className="max-h-56 space-y-1 overflow-y-auto">
              {listed.map((feature) => (
                <li key={feature.properties.id}>
                  <button
                    type="button"
                    onClick={() => chooseMunicipality(feature.properties.id)}
                    className={`flex h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm ${
                      feature.properties.id === selectedId ? "bg-pine text-cloud" : "bg-cloud"
                    }`}
                  >
                    <span>{feature.properties.name}</span>
                    <span className="text-xs opacity-80">{feature.properties.province}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <section className="space-y-2">
            <h2 className="text-sm font-medium">Reference sites</h2>
            <div className="flex flex-wrap gap-2">
              {sites.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSiteId(item.id);
                    const feature = boundaries?.features.find((row) => row.properties.name === item.municipality);
                    setSelectedId(feature?.properties.id ?? null);
                  }}
                  className={`inline-flex h-11 items-center rounded-full px-3 text-sm ${
                    item.id === siteId ? "bg-pine text-cloud" : "border border-line"
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </section>
          <ProvinceTable />
          <section className="space-y-2 rounded-2xl border border-line bg-cloud px-3 py-3">
            <h2 className="font-medium">Prices</h2>
            <p className="text-sm text-muted">
              No 2–8 week price is published. Green Radar will not invent a peso-per-kilo forecast. A range appears
              only after a documented DA or PSA price series is joined to a validated harvest volume.
            </p>
            <p className="text-sm">
              <a className="text-pine underline" href="https://www.da.gov.ph/" target="_blank" rel="noreferrer">
                Department of Agriculture
              </a>
              {" · "}
              <a className="text-pine underline" href="https://openstat.psa.gov.ph/" target="_blank" rel="noreferrer">
                PSA OpenSTAT
              </a>
            </p>
            <p className="text-sm text-muted">La Trinidad Agri-Pinoy Trading Center reports are not ingested.</p>
          </section>
          <p className="text-xs text-muted">
            Estimates only where a number is shown, and those are either measured NDVI or transcribed PSA history. Not
            financial or farming advice.
          </p>
        </div>
      </aside>
    </div>
  );
}

function SiteCard({ site }: { site: Site }) {
  const latest = site.series.at(-1);
  const peak = vegetationPeak(site.series.map((row) => ({ date: row.date, ndvi: row.medianNdvi })));
  const first = site.series[0]?.date;
  const last = site.series.at(-1)?.date;
  const shortSpan = first && last ? Date.parse(last) - Date.parse(first) < 1000 * 60 * 60 * 24 * 150 : true;
  return (
    <section className="space-y-3">
      <h2 className="font-serif text-xl">{site.name}</h2>
      <p className="text-sm text-muted">
        {site.municipality ?? "Unmatched"}, {site.province ?? "CAR"}. {site.kindLabel}
      </p>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-cloud px-3 py-3">
          <dt className="text-muted">Latest median NDVI</dt>
          <dd className="font-mono text-2xl tabular-nums">{formatNdvi(latest?.medianNdvi ?? null)}</dd>
          <dd className="text-xs text-muted">
            {latest ? `${latest.date} · ${latest.dominantScl}` : "—"} · {latest?.clearCount ?? 0} clear pixels
          </dd>
        </div>
        <div className="rounded-2xl bg-cloud px-3 py-3">
          <dt className="text-muted">Greenest date</dt>
          <dd className="font-mono text-lg tabular-nums">{peak ? peak.date : "—"}</dd>
          <dd className="text-xs text-muted">Vegetation peak of these pixels. Not a harvest date.</dd>
        </div>
      </dl>
      {shortSpan ? (
        <p className="text-sm text-soil">
          Clear dates here span under about five months. Cloudy passes were dropped rather than filled in.{" "}
          {site.series.length} date{site.series.length === 1 ? "" : "s"} kept.
        </p>
      ) : (
        <p className="text-sm text-muted">
          {site.series.length} clear dates from {first} to {last}.
        </p>
      )}
      <NdviChart series={site.series} />
      <div className="space-y-2 text-sm">
        <p>
          <span className="font-medium">Harvest window:</span> withheld. It needs a crop label at 90% or higher and a
          field boundary. This site has neither.
        </p>
        <p>
          <span className="font-medium">Yield:</span> withheld for this site. Do not multiply NDVI by area.
        </p>
      </div>
      <SceneViewer key={site.id} scenes={site.scenes} />
      <ul className="font-mono text-xs text-muted tabular-nums">
        {site.pixels.map((pixel) => (
          <li key={pixel.id}>
            {pixel.id} · {pixel.lat.toFixed(5)}, {pixel.lon.toFixed(5)}
          </li>
        ))}
      </ul>
    </section>
  );
}

function CropCard({ cropId, photo }: { cropId: string; photo?: CropPhoto }) {
  const crop = cropById(cropId);
  if (!crop) return null;
  const group = groupById(crop.groupId);
  const snaps = cropSnapshots.filter((row) => row.cropId === crop.id);
  return (
    <section className="space-y-2 rounded-2xl border border-line bg-cloud px-3 py-3">
      <h2 className="font-medium">
        {crop.name} <span className="font-normal text-muted">· {crop.local}</span>
      </h2>
      <p className="text-sm text-muted">{group?.note}</p>
      {photo?.status === "available" && photo.file ? (
        <figure>
          <img src={photo.file} alt={`${crop.name} (${crop.local})`} className="w-full rounded-xl object-cover" />
          <figcaption className="mt-1 text-xs text-muted">
            {crop.name} ({crop.local}). {photo.source}. {photo.author}. {photo.license}.{" "}
            {photo.pageUrl ? (
              <a className="text-pine underline" href={photo.pageUrl} target="_blank" rel="noreferrer">
                Original
              </a>
            ) : null}
          </figcaption>
        </figure>
      ) : (
        <p className="text-sm">Photo unavailable.</p>
      )}
      {snaps.length ? (
        <ul className="text-sm">
          {snaps.map((row) => (
            <li key={row.id}>
              {row.geography} {row.year}: {formatMt(row.productionMt)} MT ({row.source})
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No crop-specific PSA row is loaded for this name.</p>
      )}
      <p className="text-sm">The map is not filtered to this crop. That would pretend we detected it.</p>
    </section>
  );
}

function ProvinceTable() {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium">PSA vegetables, 2020</h2>
      <p className="text-xs text-muted">{statisticsCaveat}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-muted">
            <tr>
              <th className="py-1 pr-2 font-medium">Area</th>
              <th className="py-1 pr-2 font-medium">MT</th>
              <th className="py-1 font-medium">t/ha</th>
            </tr>
          </thead>
          <tbody className="font-mono tabular-nums">
            {vegetableRows.map((row) => {
              const yieldValue = row.areaHa ? impliedYield(row.productionMt, row.areaHa) : null;
              return (
                <tr key={row.id} className="border-t border-line">
                  <td className="py-1 pr-2 font-sans">{row.geography}</td>
                  <td className="py-1 pr-2">{formatMt(row.productionMt)}</td>
                  <td className="py-1">{yieldValue == null ? "—" : yieldValue.toFixed(1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">Implied t/ha is volume ÷ harvested area from the same transcribed row. Not a forecast.</p>
    </section>
  );
}
