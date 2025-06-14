import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  Wall,
  Obstacle,
  GameRect,
  TrackBounds,
} from "../src/utils/track-types";
import {
  getWallBodyConfig,
  getObstacleBodyConfig,
  getBoundaryBodyConfig,
  createRectangleBody,
  createCircleBody,
  createWallBodies,
  createObstacleBodies,
  createBoundaryBodies,
  createInvisibleBoundary,
} from "../src/utils/matter-factory";

// Get the global mock bodies from setup
const mockBodies = (globalThis as any).Phaser.Physics.Matter.Matter.Bodies;

describe("matter-factory", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock implementations
    mockBodies.rectangle.mockImplementation((x, y, width, height, options) => ({
      id: Math.random(),
      position: { x, y },
      bounds: {
        min: { x: x - width / 2, y: y - height / 2 },
        max: { x: x + width / 2, y: y + height / 2 },
      },
      label: options?.label || "body",
      ...options,
    }));

    mockBodies.circle.mockImplementation((x, y, radius, options) => ({
      id: Math.random(),
      position: { x, y },
      circleRadius: radius,
      label: options?.label || "body",
      ...options,
    }));
  });

  describe("configuration functions", () => {
    it("should return wall body config", () => {
      const config = getWallBodyConfig();

      expect(config.isStatic).toBe(true);
      expect(config.restitution).toBe(0.8);
      expect(config.label).toBe("wall");
    });

    it("should return obstacle body config", () => {
      const config = getObstacleBodyConfig();

      expect(config.isStatic).toBe(true);
      expect(config.restitution).toBe(0.9);
      expect(config.label).toBe("obstacle");
    });

    it("should return boundary body config", () => {
      const config = getBoundaryBodyConfig();

      expect(config.isStatic).toBe(true);
      expect(config.restitution).toBe(0);
      expect(config.label).toBe("boundary");
      expect(config.isSensor).toBe(false);
    });
  });

  describe("createRectangleBody", () => {
    it("should create rectangle body with correct parameters", () => {
      const rect: GameRect = { x: 100, y: 200, width: 300, height: 150 };
      const options = { isStatic: true, label: "test-rect" };

      const body = createRectangleBody(rect, options);

      expect(mockBodies.rectangle).toHaveBeenCalledWith(
        250, // centerX: x + width/2
        275, // centerY: y + height/2
        300, // width
        150, // height
        options,
      );
      expect(body.label).toBe("test-rect");
    });
  });

  describe("createCircleBody", () => {
    it("should create circle body with correct parameters", () => {
      const options = { isStatic: true, label: "test-circle" };

      const body = createCircleBody(150, 200, 50, options);

      expect(mockBodies.circle).toHaveBeenCalledWith(150, 200, 50, options);
      expect(body.label).toBe("test-circle");
    });
  });

  describe("createWallBodies", () => {
    it("should create bodies for wall objects", () => {
      const walls: Wall[] = [
        {
          type: "wall",
          id: "wall-1",
          shape: { x: 100, y: 200, width: 300, height: 20 },
        },
        {
          type: "wall",
          id: "wall-2",
          shape: { x: 400, y: 150, width: 20, height: 200 },
        },
      ];

      const bodies = createWallBodies(walls);

      expect(bodies).toHaveLength(2);
      expect(mockBodies.rectangle).toHaveBeenCalledTimes(2);

      // Check first wall
      expect(mockBodies.rectangle).toHaveBeenNthCalledWith(
        1,
        250, // centerX
        210, // centerY
        300, // width
        20, // height
        expect.objectContaining({ label: "wall", isStatic: true }),
      );

      expect(bodies[0].label).toBe("wall-wall-1");
      expect(bodies[1].label).toBe("wall-wall-2");
    });
  });

  describe("createObstacleBodies", () => {
    it("should create bodies for circle and rectangle obstacles", () => {
      const obstacles: Obstacle[] = [
        {
          type: "obstacle",
          id: "obs-1",
          shape: { x: 200, y: 300, radius: 50 }, // circle
        },
        {
          type: "obstacle",
          id: "obs-2",
          shape: { x: 400, y: 250, width: 60, height: 40 }, // rectangle
        },
      ];

      const bodies = createObstacleBodies(obstacles);

      expect(bodies).toHaveLength(2);

      // Circle obstacle
      expect(mockBodies.circle).toHaveBeenCalledWith(
        200,
        300,
        50,
        expect.objectContaining({ label: "obstacle", isStatic: true }),
      );

      // Rectangle obstacle
      expect(mockBodies.rectangle).toHaveBeenCalledWith(
        430, // x + width/2
        270, // y + height/2
        60, // width
        40, // height
        expect.objectContaining({ label: "obstacle", isStatic: true }),
      );

      expect(bodies[0].label).toBe("obstacle-obs-1");
      expect(bodies[1].label).toBe("obstacle-obs-2");
    });
  });

  describe("createBoundaryBodies", () => {
    it("should create boundary bodies from rectangles", () => {
      const boundaries: GameRect[] = [
        { x: 0, y: 0, width: 1000, height: 50 },
        { x: 0, y: 750, width: 1000, height: 50 },
      ];

      const bodies = createBoundaryBodies(boundaries);

      expect(bodies).toHaveLength(2);
      expect(mockBodies.rectangle).toHaveBeenCalledTimes(2);

      expect(bodies[0].label).toBe("boundary-0");
      expect(bodies[1].label).toBe("boundary-1");
    });
  });

  describe("createInvisibleBoundary", () => {
    it("should not create any boundaries to allow wall gaps to function", () => {
      const trackBounds: TrackBounds = {
        x: 100,
        y: 150,
        width: 800,
        height: 400,
      };
      const thickness = 25;

      const bodies = createInvisibleBoundary(trackBounds, thickness);

      expect(bodies).toHaveLength(0);
      expect(mockBodies.rectangle).not.toHaveBeenCalled();
    });

    it("should return empty array regardless of thickness", () => {
      const trackBounds: TrackBounds = {
        x: 100,
        y: 150,
        width: 800,
        height: 400,
      };

      const bodies = createInvisibleBoundary(trackBounds);

      expect(bodies).toHaveLength(0);
      expect(mockBodies.rectangle).not.toHaveBeenCalled();
    });
  });
});
