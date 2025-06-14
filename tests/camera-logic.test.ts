import { describe, it, expect } from "vitest";
import {
  calculateSlingZoom,
  calculateSpeedZoom,
  calculateSlingLength,
  calculateVelocityMagnitude,
  shouldUpdateZoomDuringDrag,
} from "../src/utils/camera-logic";

describe("calculateSlingZoom", () => {
  const zoomConfig = {
    minZoom: 0.5,
    maxZoom: 2.0,
    defaultZoom: 1.0,
  };

  it("should return default zoom when sling length is zero", () => {
    const slingData = { length: 0, maxLength: 100 };

    const result = calculateSlingZoom(slingData, zoomConfig);

    expect(result).toBe(1.0);
  });

  it("should return default zoom when sling length is negative", () => {
    const slingData = { length: -10, maxLength: 100 };

    const result = calculateSlingZoom(slingData, zoomConfig);

    expect(result).toBe(1.0);
  });

  it("should return minimum zoom when sling is at maximum length", () => {
    const slingData = { length: 100, maxLength: 100 };

    const result = calculateSlingZoom(slingData, zoomConfig);

    expect(result).toBe(0.5);
  });

  it("should interpolate linearly between default and min zoom", () => {
    const slingData = { length: 50, maxLength: 100 }; // 50% extended

    const result = calculateSlingZoom(slingData, zoomConfig);

    // 50% between 1.0 and 0.5 should be 0.75
    expect(result).toBe(0.75);
  });

  it("should cap at minimum zoom when sling exceeds max length", () => {
    const slingData = { length: 150, maxLength: 100 }; // 150% extended

    const result = calculateSlingZoom(slingData, zoomConfig);

    expect(result).toBe(0.5);
  });

  it("should handle small sling lengths correctly", () => {
    const slingData = { length: 10, maxLength: 100 }; // 10% extended

    const result = calculateSlingZoom(slingData, zoomConfig);

    // 10% between 1.0 and 0.5 should be 0.95
    expect(result).toBe(0.95);
  });
});

describe("calculateSpeedZoom", () => {
  const zoomConfig = {
    minZoom: 0.5,
    maxZoom: 2.0,
    defaultZoom: 1.0,
  };

  it("should return max zoom when velocity is zero (character is still)", () => {
    const speedData = { velocity: 0, maxVelocity: 100 };

    const result = calculateSpeedZoom(speedData, zoomConfig);

    expect(result).toBe(2.0);
  });

  it("should return max zoom when velocity is negative", () => {
    const speedData = { velocity: -10, maxVelocity: 100 };

    const result = calculateSpeedZoom(speedData, zoomConfig);

    expect(result).toBe(2.0);
  });

  it("should return minimum zoom when at maximum velocity", () => {
    const speedData = { velocity: 100, maxVelocity: 100 };

    const result = calculateSpeedZoom(speedData, zoomConfig);

    expect(result).toBe(0.5);
  });

  it("should interpolate linearly between max and min zoom based on speed", () => {
    const speedData = { velocity: 50, maxVelocity: 100 }; // 50% of max speed

    const result = calculateSpeedZoom(speedData, zoomConfig);

    // 50% between 2.0 and 0.5 should be 1.25
    expect(result).toBe(1.25);
  });

  it("should cap at minimum zoom when velocity exceeds max", () => {
    const speedData = { velocity: 150, maxVelocity: 100 }; // 150% of max speed

    const result = calculateSpeedZoom(speedData, zoomConfig);

    expect(result).toBe(0.5);
  });

  it("should handle low velocities correctly", () => {
    const speedData = { velocity: 10, maxVelocity: 100 }; // 10% of max speed

    const result = calculateSpeedZoom(speedData, zoomConfig);

    // 10% between 2.0 and 0.5 should be 1.85
    expect(result).toBe(1.85);
  });
});

describe("calculateSlingLength", () => {
  it("should return zero for identical points", () => {
    const result = calculateSlingLength(10, 20, 10, 20);

    expect(result).toBe(0);
  });

  it("should calculate horizontal distance correctly", () => {
    const result = calculateSlingLength(0, 0, 3, 0);

    expect(result).toBe(3);
  });

  it("should calculate vertical distance correctly", () => {
    const result = calculateSlingLength(0, 0, 0, 4);

    expect(result).toBe(4);
  });

  it("should calculate diagonal distance correctly (3-4-5 triangle)", () => {
    const result = calculateSlingLength(0, 0, 3, 4);

    expect(result).toBe(5);
  });

  it("should handle negative coordinates", () => {
    const result = calculateSlingLength(-2, -3, 1, 1);

    // Distance between (-2, -3) and (1, 1) = sqrt(9 + 16) = 5
    expect(result).toBe(5);
  });

  it("should handle floating point coordinates", () => {
    const result = calculateSlingLength(1.5, 2.5, 4.5, 6.5);

    // Distance = sqrt(9 + 16) = 5
    expect(result).toBe(5);
  });
});

describe("calculateVelocityMagnitude", () => {
  it("should return zero for zero velocity", () => {
    const result = calculateVelocityMagnitude(0, 0);

    expect(result).toBe(0);
  });

  it("should calculate horizontal velocity correctly", () => {
    const result = calculateVelocityMagnitude(5, 0);

    expect(result).toBe(5);
  });

  it("should calculate vertical velocity correctly", () => {
    const result = calculateVelocityMagnitude(0, 12);

    expect(result).toBe(12);
  });

  it("should calculate diagonal velocity correctly (5-12-13 triangle)", () => {
    const result = calculateVelocityMagnitude(5, 12);

    expect(result).toBe(13);
  });

  it("should handle negative velocities", () => {
    const result = calculateVelocityMagnitude(-3, -4);

    expect(result).toBe(5);
  });

  it("should handle mixed positive and negative velocities", () => {
    const result = calculateVelocityMagnitude(-8, 6);

    expect(result).toBe(10);
  });
});

describe("shouldUpdateZoomDuringDrag", () => {
  it("should allow zoom out (target zoom smaller than current)", () => {
    const result = shouldUpdateZoomDuringDrag(1.0, 0.8);

    expect(result).toBe(true);
  });

  it("should not allow zoom in (target zoom larger than current)", () => {
    const result = shouldUpdateZoomDuringDrag(0.8, 1.0);

    expect(result).toBe(false);
  });

  it("should not update when zooms are equal", () => {
    const result = shouldUpdateZoomDuringDrag(1.0, 1.0);

    expect(result).toBe(false);
  });

  it("should handle extreme zoom differences", () => {
    const allowZoomOut = shouldUpdateZoomDuringDrag(2.0, 0.5);
    const preventZoomIn = shouldUpdateZoomDuringDrag(0.5, 2.0);

    expect(allowZoomOut).toBe(true);
    expect(preventZoomIn).toBe(false);
  });

  it("should handle small zoom differences", () => {
    const allowSmallZoomOut = shouldUpdateZoomDuringDrag(1.0, 0.99);
    const preventSmallZoomIn = shouldUpdateZoomDuringDrag(0.99, 1.0);

    expect(allowSmallZoomOut).toBe(true);
    expect(preventSmallZoomIn).toBe(false);
  });
});
