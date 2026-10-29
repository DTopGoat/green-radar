import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { crops, groupById, groups } from "@/data/crops";
import { loadJson } from "@/lib/radar/load";
import type { CropPhoto } from "@/lib/radar/types";

export const Route = createFileRoute("/crops")({ component: CropLibrary });

function CropLibrary() {
  const [photos, setPhotos] = useState<Record<string, CropPhoto>>({});
  const [groupId, setGroupId] = useState("all");

  useEffect(() => {
    void loadJson<{ photos: CropPhoto[] }>("/data/crop_photos.json")
      .then((file) => {
        const next: Record<string, CropPhoto> = {};
        for (const photo of file.photos) next[photo.cropId] = photo;
        setPhotos(next);
      })
      .catch(() => setPhotos({}));
  }, []);

  const visible = crops.filter((crop) => groupId === "all" || crop.groupId === groupId);

  return (
    <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-serif text-3xl">Crop library</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Photographs are copied from Wikimedia Commons only when the license is CC0, CC BY, or CC BY-SA. If that search
          fails, the card says photo unavailable. None of these pictures were generated.
        </p>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          <FilterChip current={groupId} value="all" label="All" onSelect={setGroupId} />
          {groups.map((group) => (
            <FilterChip key={group.id} current={groupId} value={group.id} label={group.name} onSelect={setGroupId} />
          ))}
        </div>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((crop) => {
            const photo = photos[crop.id];
            const group = groupById(crop.groupId);
            return (
              <li key={crop.id} className="overflow-hidden rounded-2xl border border-line bg-cloud">
                {photo?.status === "available" && photo.file ? (
                  <img src={photo.file} alt={`${crop.name}, ${crop.local}`} className="aspect-video w-full object-cover" />
                ) : (
                  <div className="flex aspect-video items-center justify-center bg-paper-2 px-4 text-center text-sm text-muted">
                    Photo unavailable
                  </div>
                )}
                <div className="space-y-2 px-3 py-3">
                  <h2 className="font-medium">
                    {crop.name}
                    <span className="block font-normal text-muted">{crop.local}</span>
                  </h2>
                  <p className="font-mono text-xs text-muted">{crop.scientific}</p>
                  <p className="text-xs text-muted">{group?.name}</p>
                  {crop.parentId ? <p className="text-xs">Variety. Shown only if a future model reaches 90%.</p> : null}
                  {crop.covered ? <p className="text-xs">Often under plastic. Flag covered; do not guess the species.</p> : null}
                  {photo?.status === "available" ? (
                    <p className="text-xs text-muted">
                      {photo.source}. {photo.author}. {photo.license}.{" "}
                      {photo.pageUrl ? (
                        <a className="text-pine underline" href={photo.pageUrl} target="_blank" rel="noreferrer">
                          Original
                        </a>
                      ) : null}
                    </p>
                  ) : (
                    <p className="text-xs text-muted">{photo?.reason ?? "Library file not loaded yet."}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}

function FilterChip({
  current,
  value,
  label,
  onSelect,
}: {
  current: string;
  value: string;
  label: string;
  onSelect: (value: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`inline-flex h-11 shrink-0 items-center rounded-full px-3 text-sm ${
        current === value ? "bg-pine text-cloud" : "border border-line bg-cloud"
      }`}
      aria-pressed={current === value}
    >
      {label}
    </button>
  );
}
