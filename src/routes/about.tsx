import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { statisticsCaveat } from "@/data/statistics";
import { loadJson } from "@/lib/radar/load";
import type { Manifest, ObservationsFile } from "@/lib/radar/types";

export const Route = createFileRoute("/about")({ component: AboutPage });

function AboutPage() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [method, setMethod] = useState<string>("");

  useEffect(() => {
    void loadJson<Manifest>("/data/manifest.json").then(setManifest).catch(() => setManifest(null));
    void loadJson<ObservationsFile>("/data/observations.json")
      .then((file) => setMethod(file.method))
      .catch(() => setMethod(""));
  }, []);

  return (
    <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 lg:px-8">
      <article className="mx-auto max-w-3xl space-y-6">
        <header>
          <h1 className="font-serif text-3xl">About the data</h1>
          <p className="mt-2 text-muted">
            Green Radar reads public satellites and official statistics for the Cordillera Administrative Region:
            Abra, Apayao, Benguet, Ifugao, Kalinga, Mountain Province, and Baguio City. It does not collect names of
            farmers or owners.
          </p>
        </header>
        <p className="rounded-2xl border border-line bg-cloud px-4 py-3 text-sm">
          Estimates only, not financial or farming advice. A blank harvest date or a withheld price is intentional.
        </p>
        <section className="space-y-2">
          <h2 className="font-serif text-2xl">What was updated</h2>
          <p className="font-mono text-sm tabular-nums">
            {manifest
              ? `Built ${manifest.generatedAt}. Clear samples ${manifest.imageryFrom} to ${manifest.imageryThrough}. ${manifest.sceneCount} scenes.`
              : "Update file not loaded."}
          </p>
          <p className="text-sm text-muted">
            Sentinel-2 revisits about every five days. This copy is a static snapshot, not a live feed. The next
            refresh is a re-run of the public fetch, not an invented daily map. Cloudy dates are omitted.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-serif text-2xl">Method</h2>
          <p>{method}</p>
          <p className="text-muted">
            The basemap is the EOX Sentinel-2 cloudless mosaic for 2024, which is a composite, not the scene in the
            side panel. Scene chips are single L2A passes. False color uses B08, B04, and B03. NDVI color is a stretch
            of the same bands.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="font-serif text-2xl">Sources</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>Copernicus Sentinel-2 L2A, ESA, via Microsoft Planetary Computer. Scene links open Copernicus Browser and the STAC item.</li>
            <li>{manifest?.mosaic}</li>
            <li>{manifest?.boundarySource}</li>
            <li>PSA-CAR vegetable totals. {statisticsCaveat}</li>
            <li>Crop photographs: Wikimedia Commons, license checked per file. See the crop library.</li>
            <li>{manifest?.osm.detail}</li>
          </ul>
        </section>
        <section className="space-y-2">
          <h2 className="font-serif text-2xl">Limits</h2>
          <ul className="list-disc space-y-2 pl-5 text-muted">
            <li>No species map. The 90% rule is implemented and tested, and every place fails it because there is no score.</li>
            <li>No automatic field outlines. Inventing polygons would look like a survey.</li>
            <li>No price forecast and no plot yield.</li>
            <li>Reference pixels mix crops, roofs, and trees. A low NDVI can be bare soil, plastic, cloud leakage, or a town.</li>
            <li>Sentinel-1, a greenhouse mask, and a labeled training set are not in this release.</li>
            <li>Outside CAR is out of scope.</li>
          </ul>
        </section>
        <section className="space-y-2">
          <h2 className="font-serif text-2xl">Offline</h2>
          <p className="text-muted">
            Boundaries, charts, and scene chips ship with the app and are kept in this browser after the first visit.
            The live cloudless basemap needs a connection. Install from the browser to keep the shell on a phone.
          </p>
        </section>
      </article>
    </main>
  );
}
