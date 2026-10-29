export type Observation = {
  date: string;
  datetime: string;
  itemId: string;
  tile: string;
  platform: string;
  cloudCover: number | null;
  medianNdvi: number | null;
  minNdvi: number | null;
  maxNdvi: number | null;
  clearCount: number;
  pixelCount: number;
  dominantScl: string;
};

export type SceneImage = {
  date: string;
  datetime: string;
  itemId: string;
  tile: string;
  platform: string;
  cloudCover: number | null;
  trueColor: string;
  falseColor: string | null;
  ndviColor: string | null;
  bbox: [number, number, number, number];
  center: [number, number];
  copernicusUrl: string;
  planetaryUrl: string;
  stacUrl: string;
};

export type SamplePixel = { id: string; lon: number; lat: number };

export type SiteKind = "mixed-valley" | "built-up" | "forest-reference" | "highland-town";

export type Site = {
  id: string;
  name: string;
  kind: SiteKind;
  kindLabel: string;
  municipality: string | null;
  province: string | null;
  pixels: SamplePixel[];
  series: Observation[];
  scenes: SceneImage[];
};

export type ObservationsFile = {
  generatedAt: string;
  method: string;
  sites: Site[];
};

export type Manifest = {
  generatedAt: string;
  imageryThrough: string | null;
  imageryFrom: string | null;
  sceneCount: number;
  boundarySource: string;
  boundaryLicense: string;
  mosaic: string;
  reflectance: string;
  osm: { status: string; count: number; detail: string };
  notes: string[];
};

export type BoundaryProps = {
  id: string;
  name: string;
  province: string;
  areaHa: number;
};

export type CropPhoto = {
  cropId: string;
  status: "available" | "unavailable";
  reason?: string;
  file?: string;
  originalUrl?: string;
  pageUrl?: string;
  author?: string;
  license?: string;
  licenseUrl?: string;
  title?: string;
  source?: string;
};
