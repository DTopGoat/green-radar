import { useState } from "react";
import type { SceneImage } from "@/lib/radar/types";

type Band = "true" | "false" | "ndvi";

export function SceneViewer({ scenes }: { scenes: SceneImage[] }) {
  const [index, setIndex] = useState(Math.max(0, scenes.length - 1));
  const [band, setBand] = useState<Band>("true");
  const scene = scenes[index];
  if (!scene) return <p className="text-sm text-muted">No scene chip stored for this site.</p>;

  const src =
    band === "false" ? scene.falseColor : band === "ndvi" ? scene.ndviColor : scene.trueColor;
  const shown = src ?? scene.trueColor;
  const captured = scene.datetime.replace("T", " ").replace(/\.\d+Z$/, " UTC");

  return (
    <figure className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-line bg-ink">
        <img
          src={shown}
          alt={`${band === "ndvi" ? "NDVI" : band === "false" ? "False-color" : "True-color"} Sentinel-2 view, ${scene.date}`}
          className="aspect-video w-full object-cover"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <BandButton current={band} value="true" label="True color" onSelect={setBand} />
        <BandButton current={band} value="false" label="False color" disabled={!scene.falseColor} onSelect={setBand} />
        <BandButton current={band} value="ndvi" label="NDVI" disabled={!scene.ndviColor} onSelect={setBand} />
      </div>
      {scenes.length > 1 ? (
        <label className="block text-sm text-muted">
          <span className="mb-1 block">Time lapse · {scene.date}</span>
          <input
            type="range"
            min={0}
            max={scenes.length - 1}
            value={index}
            onChange={(event) => setIndex(Number(event.target.value))}
            className="w-full accent-pine"
          />
        </label>
      ) : null}
      <figcaption className="space-y-2 text-sm text-muted">
        <p>
          Copernicus Sentinel-2, ESA. {scene.platform}. Captured {captured}. Scene {scene.itemId}. Tile{" "}
          {scene.tile}. Scene cloud cover {scene.cloudCover == null ? "not reported" : `${scene.cloudCover}%`}.
        </p>
        {band === "false" ? (
          <p>False color is near-infrared, red, and green (bands B08, B04, B03). Vegetation reads red. Not a tinted photograph from another source.</p>
        ) : null}
        {band === "ndvi" ? (
          <p>
            NDVI from bands B08 and B04, colored red (low, about 0) through yellow to green (high, about 0.8). Clouds and
            bare ground also read red. This is a measurement view, not a photograph.
          </p>
        ) : null}
        <p>Chip rendered by Microsoft Planetary Computer from unmodified L2A reflectance. The annual basemap is a separate EOX cloudless mosaic.</p>
        <p className="flex flex-wrap gap-3">
          <a className="text-pine underline" href={scene.copernicusUrl} target="_blank" rel="noreferrer">
            Copernicus Browser
          </a>
          <a className="text-pine underline" href={scene.planetaryUrl} target="_blank" rel="noreferrer">
            Planetary Computer
          </a>
          <a className="text-pine underline" href={scene.stacUrl} target="_blank" rel="noreferrer">
            STAC item
          </a>
        </p>
      </figcaption>
    </figure>
  );
}

function BandButton({
  current,
  value,
  label,
  disabled,
  onSelect,
}: {
  current: Band;
  value: Band;
  label: string;
  disabled?: boolean;
  onSelect: (value: Band) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(value)}
      className={`inline-flex h-11 items-center rounded-full px-3 text-sm disabled:opacity-40 ${
        current === value ? "bg-pine text-cloud" : "border border-line text-ink"
      }`}
      aria-pressed={current === value}
    >
      {label}
    </button>
  );
}
