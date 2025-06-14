import { describe, it, expect } from "vitest";
import {
  isOutOfBounds,
  getDefaultRespawnPosition,
  getRespawnPosition,
  isControlAllowed,
  isDragAllowed,
} from "../src/utils/game-logic";
import { TrackBounds } from "../src/utils/track-types";

describe("isOutOfBounds", () => {
  const trackBounds: TrackBounds = {
    x: 100,
    y: 200,
    width: 800,
    height: 600,
  };

  it("should return false when position is inside bounds", () => {
    expect(isOutOfBounds({ x: 500, y: 500 }, trackBounds)).toBe(false);
    expect(isOutOfBounds({ x: 100, y: 200 }, trackBounds)).toBe(false); // Top-left edge
    expect(isOutOfBounds({ x: 900, y: 800 }, trackBounds)).toBe(false); // Bottom-right edge
  });

  it("should return true when position is to the left of bounds", () => {
    expect(isOutOfBounds({ x: 99, y: 500 }, trackBounds)).toBe(true);
    expect(isOutOfBounds({ x: 0, y: 500 }, trackBounds)).toBe(true);
    expect(isOutOfBounds({ x: -100, y: 500 }, trackBounds)).toBe(true);
  });

  it("should return true when position is to the right of bounds", () => {
    expect(isOutOfBounds({ x: 901, y: 500 }, trackBounds)).toBe(true);
    expect(isOutOfBounds({ x: 1000, y: 500 }, trackBounds)).toBe(true);
    expect(isOutOfBounds({ x: 2000, y: 500 }, trackBounds)).toBe(true);
  });

  it("should return true when position is above bounds", () => {
    expect(isOutOfBounds({ x: 500, y: 199 }, trackBounds)).toBe(true);
    expect(isOutOfBounds({ x: 500, y: 0 }, trackBounds)).toBe(true);
    expect(isOutOfBounds({ x: 500, y: -100 }, trackBounds)).toBe(true);
  });

  it("should return true when position is below bounds", () => {
    expect(isOutOfBounds({ x: 500, y: 801 }, trackBounds)).toBe(true);
    expect(isOutOfBounds({ x: 500, y: 1000 }, trackBounds)).toBe(true);
    expect(isOutOfBounds({ x: 500, y: 2000 }, trackBounds)).toBe(true);
  });

  it("should return true when position is in a corner outside bounds", () => {
    expect(isOutOfBounds({ x: 99, y: 199 }, trackBounds)).toBe(true); // Top-left
    expect(isOutOfBounds({ x: 901, y: 199 }, trackBounds)).toBe(true); // Top-right
    expect(isOutOfBounds({ x: 99, y: 801 }, trackBounds)).toBe(true); // Bottom-left
    expect(isOutOfBounds({ x: 901, y: 801 }, trackBounds)).toBe(true); // Bottom-right
  });

  it("should handle edge cases with exact boundary values", () => {
    // Exactly on the edge should be considered in bounds
    expect(isOutOfBounds({ x: 100, y: 500 }, trackBounds)).toBe(false); // Left edge
    expect(isOutOfBounds({ x: 900, y: 500 }, trackBounds)).toBe(false); // Right edge
    expect(isOutOfBounds({ x: 500, y: 200 }, trackBounds)).toBe(false); // Top edge
    expect(isOutOfBounds({ x: 500, y: 800 }, trackBounds)).toBe(false); // Bottom edge
  });
});

describe("getDefaultRespawnPosition", () => {
  it("should return center of track bounds", () => {
    const trackBounds: TrackBounds = {
      x: 100,
      y: 200,
      width: 800,
      height: 600,
    };

    const respawnPos = getDefaultRespawnPosition(trackBounds);

    expect(respawnPos.x).toBe(500); // 100 + 800/2
    expect(respawnPos.y).toBe(500); // 200 + 600/2
  });

  it("should handle different track sizes", () => {
    const smallTrack: TrackBounds = {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    };

    expect(getDefaultRespawnPosition(smallTrack)).toEqual({ x: 50, y: 50 });

    const largeTrack: TrackBounds = {
      x: 1000,
      y: 2000,
      width: 5000,
      height: 3000,
    };

    expect(getDefaultRespawnPosition(largeTrack)).toEqual({ x: 3500, y: 3500 });
  });

  it("should handle tracks with negative coordinates", () => {
    const trackBounds: TrackBounds = {
      x: -200,
      y: -100,
      width: 400,
      height: 200,
    };

    const respawnPos = getDefaultRespawnPosition(trackBounds);

    expect(respawnPos.x).toBe(0); // -200 + 400/2
    expect(respawnPos.y).toBe(0); // -100 + 200/2
  });
});

describe("getRespawnPosition", () => {
  const trackBounds: TrackBounds = {
    x: 100,
    y: 200,
    width: 800,
    height: 600,
  };

  it("should return lastValidPosition when available", () => {
    const lastValidPosition = { x: 300, y: 400 };
    const startPosition = { x: 150, y: 250 };

    const result = getRespawnPosition(
      lastValidPosition,
      startPosition,
      trackBounds,
    );

    expect(result).toEqual(lastValidPosition);
  });

  it("should return startPosition when lastValidPosition is null", () => {
    const lastValidPosition = null;
    const startPosition = { x: 150, y: 250 };

    const result = getRespawnPosition(
      lastValidPosition,
      startPosition,
      trackBounds,
    );

    expect(result).toEqual(startPosition);
  });

  it("should return center of track when both lastValidPosition and startPosition are null", () => {
    const lastValidPosition = null;
    const startPosition = null;

    const result = getRespawnPosition(
      lastValidPosition,
      startPosition,
      trackBounds,
    );

    expect(result).toEqual({ x: 500, y: 500 }); // Center of track
  });

  it("should prioritize lastValidPosition over startPosition", () => {
    const lastValidPosition = { x: 300, y: 400 };
    const startPosition = { x: 150, y: 250 };

    const result = getRespawnPosition(
      lastValidPosition,
      startPosition,
      trackBounds,
    );

    expect(result).toEqual(lastValidPosition);
    expect(result).not.toEqual(startPosition);
  });

  it("should handle edge case with zero coordinates", () => {
    const lastValidPosition = { x: 0, y: 0 };
    const startPosition = { x: 150, y: 250 };

    const result = getRespawnPosition(
      lastValidPosition,
      startPosition,
      trackBounds,
    );

    expect(result).toEqual({ x: 0, y: 0 });
  });
});

describe("isControlAllowed", () => {
  const mockPuck = { id: "puck" } as Phaser.GameObjects.GameObject;
  const mockOtherObject = { id: "other" } as Phaser.GameObjects.GameObject;

  it("should allow control when target is puck and not respawning", () => {
    const controlState = { isRespawning: false };

    const result = isControlAllowed(mockPuck, mockPuck, controlState);

    expect(result).toBe(true);
  });

  it("should deny control when not respawning but target is not puck", () => {
    const controlState = { isRespawning: false };

    const result = isControlAllowed(mockOtherObject, mockPuck, controlState);

    expect(result).toBe(false);
  });

  it("should deny control when target is puck but respawning", () => {
    const controlState = { isRespawning: true };

    const result = isControlAllowed(mockPuck, mockPuck, controlState);

    expect(result).toBe(false);
  });

  it("should deny control when both conditions are wrong", () => {
    const controlState = { isRespawning: true };

    const result = isControlAllowed(mockOtherObject, mockPuck, controlState);

    expect(result).toBe(false);
  });

  it("should handle isDragging state without affecting result", () => {
    const controlState = { isRespawning: false, isDragging: true };

    const result = isControlAllowed(mockPuck, mockPuck, controlState);

    expect(result).toBe(true);
  });
});

describe("isDragAllowed", () => {
  const mockPuck = { id: "puck" } as Phaser.GameObjects.GameObject;
  const mockOtherObject = { id: "other" } as Phaser.GameObjects.GameObject;

  it("should allow drag when control allowed and is dragging", () => {
    const controlState = { isRespawning: false, isDragging: true };

    const result = isDragAllowed(mockPuck, mockPuck, controlState);

    expect(result).toBe(true);
  });

  it("should deny drag when control allowed but not dragging", () => {
    const controlState = { isRespawning: false, isDragging: false };

    const result = isDragAllowed(mockPuck, mockPuck, controlState);

    expect(result).toBe(false);
  });

  it("should deny drag when control allowed but isDragging is undefined", () => {
    const controlState = { isRespawning: false };

    const result = isDragAllowed(mockPuck, mockPuck, controlState);

    expect(result).toBe(false);
  });

  it("should deny drag when target is not puck", () => {
    const controlState = { isRespawning: false, isDragging: true };

    const result = isDragAllowed(mockOtherObject, mockPuck, controlState);

    expect(result).toBe(false);
  });

  it("should deny drag when respawning", () => {
    const controlState = { isRespawning: true, isDragging: true };

    const result = isDragAllowed(mockPuck, mockPuck, controlState);

    expect(result).toBe(false);
  });

  it("should deny drag when all conditions are wrong", () => {
    const controlState = { isRespawning: true, isDragging: false };

    const result = isDragAllowed(mockOtherObject, mockPuck, controlState);

    expect(result).toBe(false);
  });
});
