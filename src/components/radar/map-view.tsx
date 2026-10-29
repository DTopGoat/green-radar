import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { BoundaryProps } from "@/lib/radar/types";

const leafletPromise: Promise<typeof import("leaflet")> | null =
  typeof window === "undefined" ? null : import("leaflet");

export type MapMode = "satellite" | "vigor" | "both";

export type AreaFeature = {
  type: "Feature";
  id: string;
  properties: BoundaryProps & { ndvi: number; sampled: number };
  geometry: { type: string; coordinates: unknown };
};

type Pixel = { lon: number; lat: number; id: string };

type Props = {
  areas: AreaFeature[];
  pixels: Pixel[];
  selectedId: string | null;
  mode: MapMode;
  onSelect: (id: string) => void;
};

const STOPS: [number, [number, number, number]][] = [
  [-0.1, [196, 181, 154]],
  [0.2, [126, 163, 106]],
  [0.45, [27, 94, 59]],
  [0.7, [14, 61, 38]],
];

export function MapView({ areas, pixels, selectedId, mode, onSelect }: Props) {
  const holder = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const tilesRef = useRef<import("leaflet").TileLayer | null>(null);
  const areasRef = useRef<import("leaflet").GeoJSON | null>(null);
  const pixelsRef = useRef<import("leaflet").LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let map: import("leaflet").Map | null = null;
    void (async () => {
      const L = await (leafletPromise ?? import("leaflet"));
      if (cancelled || !holder.current) return;
      map = L.map(holder.current, {
        zoomControl: false,
        attributionControl: true,
        preferCanvas: false,
      });
      L.control.zoom({ position: "topright" }).addTo(map);
      map.attributionControl.setPrefix("");
      const tiles = L.tileLayer(
        "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2024_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg",
        {
          maxZoom: 16,
          attribution:
            "Sentinel-2 cloudless 2024 © EOX — modified Copernicus Sentinel data 2024 · Boundaries © geoBoundaries / NAMRIA, PSA, OCHA (CC BY 4.0)",
        },
      );
      tiles.addTo(map);
      const areaLayer = L.geoJSON(undefined, {
        onEachFeature: (feature, layer) => {
          layer.on("click", () => {
            const id = (feature as AreaFeature).properties?.id;
            if (id) onSelectRef.current(id);
          });
        },
      });
      areaLayer.addTo(map);
      const pixelLayer = L.layerGroup().addTo(map);
      map.fitBounds(
        [
          [16.15, 120.45],
          [18.5, 121.6],
        ],
        { padding: [28, 28] },
      );
      mapRef.current = map;
      tilesRef.current = tiles;
      areasRef.current = areaLayer;
      pixelsRef.current = pixelLayer;
      map.invalidateSize();
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const map = mapRef.current;
    const areaLayer = areasRef.current;
    const pixelLayer = pixelsRef.current;
    const tiles = tilesRef.current;
    if (!map || !areaLayer || !pixelLayer || !tiles) return;
    void import("leaflet").then((L) => {
      areaLayer.clearLayers();
      areaLayer.addData({ type: "FeatureCollection", features: areas } as never);
      areaLayer.setStyle((feature) => styleFor(feature as AreaFeature | undefined, selectedId, mode));
      pixelLayer.clearLayers();
      for (const pixel of pixels) {
        L.circleMarker([pixel.lat, pixel.lon], {
          radius: 5,
          color: "#1c1915",
          weight: 1.5,
          fillColor: "#e2b98a",
          fillOpacity: 1,
        }).addTo(pixelLayer);
      }
      const showTiles = mode !== "vigor";
      if (showTiles && !map.hasLayer(tiles)) tiles.addTo(map);
      if (!showTiles && map.hasLayer(tiles)) map.removeLayer(tiles);
      if (showTiles) tiles.bringToBack();
    });
  }, [ready, areas, pixels, mode, selectedId]);

  useEffect(() => {
    if (!ready || !selectedId) return;
    const map = mapRef.current;
    const feature = areas.find((item) => item.properties.id === selectedId);
    if (!map || !feature) return;
    const coords = collect(feature.geometry.coordinates);
    if (!coords.length) return;
    let minX = coords[0][0];
    let minY = coords[0][1];
    let maxX = minX;
    let maxY = minY;
    for (const [x, y] of coords) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    map.fitBounds(
      [
        [minY, minX],
        [maxY, maxX],
      ],
      { padding: [40, 40], maxZoom: 13 },
    );
  }, [ready, selectedId, areas]);

  return (
    <div className="relative z-0 h-full min-h-0">
      <div ref={holder} className="h-full w-full" role="application" aria-label="Map of the Cordillera" />
    </div>
  );
}

function styleFor(feature: AreaFeature | undefined, selectedId: string | null, mode: MapMode) {
  const props = feature?.properties;
  const sampled = props?.sampled === 1;
  const selected = Boolean(props?.id) && props?.id === selectedId;
  return {
    color: selected ? "#f4efe4" : "#1c1915",
    weight: selected ? 2.4 : 0.6,
    opacity: 0.9,
    fillColor: sampled ? ndviColor(props?.ndvi ?? 0) : "#efe8dc",
    fillOpacity: mode === "satellite" ? 0 : 0.55,
  };
}

function ndviColor(value: number): string {
  if (value <= STOPS[0][0]) return rgb(STOPS[0][1]);
  for (let i = 1; i < STOPS.length; i++) {
    const [a, ca] = STOPS[i - 1];
    const [b, cb] = STOPS[i];
    if (value <= b) {
      const t = (value - a) / (b - a);
      return rgb([
        Math.round(ca[0] + (cb[0] - ca[0]) * t),
        Math.round(ca[1] + (cb[1] - ca[1]) * t),
        Math.round(ca[2] + (cb[2] - ca[2]) * t),
      ]);
    }
  }
  return rgb(STOPS[STOPS.length - 1][1]);
}

function rgb([r, g, b]: [number, number, number]) {
  return `rgb(${r} ${g} ${b})`;
}

function collect(node: unknown, out: [number, number][] = []): [number, number][] {
  if (!Array.isArray(node)) return out;
  if (typeof node[0] === "number" && typeof node[1] === "number") {
    out.push([node[0], node[1]]);
    return out;
  }
  for (const child of node) collect(child, out);
  return out;
}
