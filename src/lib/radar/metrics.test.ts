import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CONFIDENCE_THRESHOLD,
  classifyObservation,
  impliedYield,
  ndvi,
  vegetationPeak,
} from "./metrics.ts";

describe("ndvi", () => {
  it("matches the Sentinel-2 ratio", () => {
    const value = ndvi(2694, 1782);
    assert.ok(value != null);
    assert.ok(Math.abs(value - (2694 - 1782) / (2694 + 1782)) < 1e-12);
  });

  it("returns null when the denominator is zero", () => {
    assert.equal(ndvi(0, 0), null);
  });
});

describe("classifyObservation", () => {
  it("withholds a species name below 90%", () => {
    const call = classifyObservation({
      score: 0.89,
      cropName: "Cabbage",
      groupName: "Highland vegetable",
      covered: false,
    });
    assert.equal(call.status, "group");
    assert.equal(call.label, "Highland vegetable");
    assert.ok(CONFIDENCE_THRESHOLD === 0.9);
  });

  it("allows a species name at 90% and above", () => {
    const call = classifyObservation({
      score: 0.9,
      cropName: "Cabbage",
      groupName: "Highland vegetable",
      covered: false,
    });
    assert.equal(call.status, "specific");
    assert.equal(call.label, "Cabbage");
  });

  it("never names a crop when the plot is covered", () => {
    const call = classifyObservation({
      score: 0.99,
      cropName: "Strawberry",
      groupName: "Fruit",
      covered: true,
    });
    assert.equal(call.status, "covered");
    assert.equal(call.label, "Greenhouse / covered");
  });

  it("stays unclassified when no model score exists", () => {
    const call = classifyObservation({
      score: null,
      cropName: "Cabbage",
      groupName: "Highland vegetable",
      covered: false,
    });
    assert.equal(call.status, "unclassified");
    assert.equal(call.label, "Unclassified");
  });

  it("says uncertain when a weak score has no group", () => {
    const call = classifyObservation({
      score: 0.4,
      cropName: null,
      groupName: null,
      covered: false,
    });
    assert.equal(call.status, "uncertain");
  });
});

describe("vegetationPeak", () => {
  it("returns the date of the highest NDVI and ignores gaps", () => {
    const peak = vegetationPeak([
      { date: "2026-04-01", ndvi: 0.2 },
      { date: "2026-05-01", ndvi: null },
      { date: "2026-06-01", ndvi: 0.61 },
      { date: "2026-07-01", ndvi: 0.4 },
    ]);
    assert.deepEqual(peak, { date: "2026-06-01", ndvi: 0.61 });
  });
});

describe("impliedYield", () => {
  it("divides official volume by official area", () => {
    const value = impliedYield(305052, 17408);
    assert.ok(value != null);
    assert.ok(Math.abs(value - 305052 / 17408) < 1e-9);
  });

  it("returns null for a zero area", () => {
    assert.equal(impliedYield(10, 0), null);
  });
});
