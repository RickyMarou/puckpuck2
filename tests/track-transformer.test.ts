import { describe, it, expect } from "vitest";
import {
  calculateScalingFactor,
  transformPoint,
  svgRectToGameRect,
  svgCircleToGameCircle,
  processTrackArea,
  processWalls,
  processObstacles,
  processStartFinishLines,
  calculateStartPosition,
  calculateFinishPosition,
} from "../src/utils/track-transformer";
import { createMockSVG, createMockDocument } from "./test-utils";

describe("track-transformer", () => {
  describe("calculateScalingFactor", () => {
    it("should calculate correct scaling for fitting SVG to game world", () => {
      const svgSize = { width: 1000, height: 500 };
      const gameConfig = { worldWidth: 1024, worldHeight: 768 };

      const scaling = calculateScalingFactor(svgSize, gameConfig);

      // Should use minimum scale to maintain aspect ratio with 90% utilization
      const availableWidth = 1024 * 0.9;
      const availableHeight = 768 * 0.9;
      const expectedScale = Math.min(
        availableWidth / 1000,
        availableHeight / 500,
      );
      expect(scaling.scaleX).toBeCloseTo(expectedScale, 3);
      expect(scaling.scaleY).toBeCloseTo(expectedScale, 3);

      // Should center the scaled content
      const scaledWidth = 1000 * expectedScale;
      const scaledHeight = 500 * expectedScale;
      expect(scaling.offsetX).toBeCloseTo((1024 - scaledWidth) / 2, 1);
      expect(scaling.offsetY).toBeCloseTo((768 - scaledHeight) / 2, 1);
    });

    it("should use data-size when provided", () => {
      const svgSize = { width: 1000, height: 500 };
      const gameConfig = { worldWidth: 1024, worldHeight: 768 };
      const worldSize = 2000;

      const scaling = calculateScalingFactor(svgSize, gameConfig, worldSize);

      // Should scale to fit within the world size (square)
      const expectedScale = Math.min(2000 / 1000, 2000 / 500); // Min of 2.0 and 4.0 = 2.0
      expect(scaling.scaleX).toBeCloseTo(expectedScale, 3);
      expect(scaling.scaleY).toBeCloseTo(expectedScale, 3);

      // Should center the scaled content
      const scaledWidth = 1000 * expectedScale;
      const scaledHeight = 500 * expectedScale;
      expect(scaling.offsetX).toBeCloseTo((1024 - scaledWidth) / 2, 1);
      expect(scaling.offsetY).toBeCloseTo((768 - scaledHeight) / 2, 1);
    });

    it("should handle very small SVG", () => {
      const svgSize = { width: 100, height: 50 };
      const gameConfig = { worldWidth: 1024, worldHeight: 768 };

      const scaling = calculateScalingFactor(svgSize, gameConfig);

      expect(scaling.scaleX).toBeGreaterThan(1);
      expect(scaling.scaleY).toBeGreaterThan(1);
    });
  });

  describe("transformPoint", () => {
    it("should transform point according to scaling factor", () => {
      const scaling = { scaleX: 2, scaleY: 1.5, offsetX: 100, offsetY: 50 };

      const result = transformPoint(10, 20, scaling);

      expect(result.x).toBe(10 * 2 + 100); // 120
      expect(result.y).toBe(20 * 1.5 + 50); // 80
    });
  });

  describe("svgRectToGameRect", () => {
    it("should convert SVG rect to game coordinates", () => {
      const svgText = createMockSVG([
        {
          type: "rect",
          x: 100,
          y: 200,
          width: 300,
          height: 150,
          fill: "#00FF00",
        },
      ]);
      const doc = createMockDocument(svgText);
      const rect = doc.querySelector("rect")!;
      const scaling = { scaleX: 2, scaleY: 1.5, offsetX: 50, offsetY: 25 };

      const gameRect = svgRectToGameRect(rect as SVGElement, scaling);

      expect(gameRect.x).toBe(100 * 2 + 50); // 250
      expect(gameRect.y).toBe(200 * 1.5 + 25); // 325
      expect(gameRect.width).toBe(300 * 2); // 600
      expect(gameRect.height).toBe(150 * 1.5); // 225
    });
  });

  describe("svgCircleToGameCircle", () => {
    it("should convert SVG circle to game coordinates", () => {
      const svgText = createMockSVG([
        { type: "circle", cx: 150, cy: 200, r: 50, fill: "#FF0000" },
      ]);
      const doc = createMockDocument(svgText);
      const circle = doc.querySelector("circle")!;
      const scaling = { scaleX: 2, scaleY: 1.5, offsetX: 50, offsetY: 25 };

      const gameCircle = svgCircleToGameCircle(circle as SVGElement, scaling);

      expect(gameCircle.x).toBe(150 * 2 + 50); // 350
      expect(gameCircle.y).toBe(200 * 1.5 + 25); // 325
      expect(gameCircle.radius).toBe(50 * Math.min(2, 1.5)); // 75 (uses minimum scale)
    });
  });

  describe("processTrackArea", () => {
    it("should process track area elements and calculate bounds", () => {
      const svgText = createMockSVG([
        {
          type: "rect",
          x: 100,
          y: 150,
          width: 600,
          height: 200,
          fill: "#00FF00",
        },
        {
          type: "rect",
          x: 200,
          y: 100,
          width: 400,
          height: 300,
          fill: "#00FF00",
        },
      ]);
      const doc = createMockDocument(svgText);
      const trackElements = Array.from(
        doc.querySelectorAll("rect"),
      ) as SVGElement[];
      const scaling = { scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 };

      const bounds = processTrackArea(trackElements, scaling);

      // Should encompass both rectangles
      expect(bounds.x).toBe(100); // min x
      expect(bounds.y).toBe(100); // min y
      expect(bounds.width).toBe(600); // max x - min x (700 - 100)
      expect(bounds.height).toBe(300); // max y - min y (400 - 100)
    });

    it("should throw error for empty track areas", () => {
      const scaling = { scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 };

      expect(() => processTrackArea([], scaling)).toThrow(
        "No track area elements found",
      );
    });
  });

  describe("processWalls", () => {
    it("should convert wall elements to Wall objects", () => {
      const svgText = createMockSVG([
        {
          type: "rect",
          id: "wall-1",
          x: 100,
          y: 200,
          width: 300,
          height: 20,
          fill: "#000000",
        },
        {
          type: "rect",
          id: "wall-2",
          x: 200,
          y: 100,
          width: 20,
          height: 200,
          fill: "#000000",
        },
      ]);
      const doc = createMockDocument(svgText);
      const wallElements = Array.from(
        doc.querySelectorAll("rect"),
      ) as SVGElement[];
      const scaling = { scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 };

      const walls = processWalls(wallElements, scaling);

      expect(walls).toHaveLength(2);
      expect(walls[0].type).toBe("wall");
      expect(walls[0].id).toBe("wall-1");
      expect(walls[0].shape.x).toBe(100);
      expect(walls[0].shape.y).toBe(200);
      expect(walls[0].shape.width).toBe(300);
      expect(walls[0].shape.height).toBe(20);

      expect(walls[1].id).toBe("wall-2");
    });
  });

  describe("processObstacles", () => {
    it("should convert obstacle elements to Obstacle objects", () => {
      const svgText = createMockSVG([
        {
          type: "circle",
          id: "obstacle-1",
          cx: 200,
          cy: 300,
          r: 30,
          fill: "#800080",
        },
        {
          type: "rect",
          id: "obstacle-2",
          x: 400,
          y: 250,
          width: 50,
          height: 50,
          fill: "#800080",
        },
      ]);
      const doc = createMockDocument(svgText);
      const obstacleElements = Array.from(
        doc.querySelectorAll("circle, rect"),
      ) as SVGElement[];
      const scaling = { scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 };

      const obstacles = processObstacles(obstacleElements, scaling);

      expect(obstacles).toHaveLength(2);

      // Circle obstacle
      expect(obstacles[0].type).toBe("obstacle");
      expect(obstacles[0].id).toBe("obstacle-1");
      expect("radius" in obstacles[0].shape).toBe(true);
      if ("radius" in obstacles[0].shape) {
        expect(obstacles[0].shape.x).toBe(200);
        expect(obstacles[0].shape.y).toBe(300);
        expect(obstacles[0].shape.radius).toBe(30);
      }

      // Rectangle obstacle
      expect(obstacles[1].type).toBe("obstacle");
      expect(obstacles[1].id).toBe("obstacle-2");
      expect("width" in obstacles[1].shape).toBe(true);
      if ("width" in obstacles[1].shape) {
        expect(obstacles[1].shape.x).toBe(400);
        expect(obstacles[1].shape.y).toBe(250);
        expect(obstacles[1].shape.width).toBe(50);
        expect(obstacles[1].shape.height).toBe(50);
      }
    });
  });

  describe("processStartFinishLines", () => {
    it("should process start and finish line elements", () => {
      const svgText = createMockSVG([
        {
          type: "rect",
          id: "start",
          x: 100,
          y: 150,
          width: 10,
          height: 200,
          fill: "#0000FF",
        },
        {
          type: "rect",
          id: "finish",
          x: 800,
          y: 150,
          width: 10,
          height: 200,
          fill: "#FFD700",
        },
      ]);
      const doc = createMockDocument(svgText);
      const startElements = [doc.querySelector("rect")!] as SVGElement[];
      const finishElements = [doc.querySelectorAll("rect")[1]!] as SVGElement[];
      const scaling = { scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 };

      const markers = processStartFinishLines(
        startElements,
        finishElements,
        scaling,
      );

      expect(markers.startLine).toBeTruthy();
      expect(markers.finishLine).toBeTruthy();

      if (markers.startLine) {
        expect(markers.startLine.x).toBe(100);
        expect(markers.startLine.y).toBe(150);
      }

      if (markers.finishLine) {
        expect(markers.finishLine.x).toBe(800);
        expect(markers.finishLine.y).toBe(150);
      }
    });

    it("should handle missing start or finish lines", () => {
      const scaling = { scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 };

      const markers = processStartFinishLines([], [], scaling);

      expect(markers.startLine).toBeNull();
      expect(markers.finishLine).toBeNull();
    });
  });

  describe("calculateStartPosition", () => {
    it("should calculate center of start line", () => {
      const startLine = { x: 100, y: 150, width: 10, height: 200 };

      const position = calculateStartPosition(startLine);

      expect(position).toBeTruthy();
      if (position) {
        expect(position.x).toBe(105); // x + width/2
        expect(position.y).toBe(250); // y + height/2
      }
    });

    it("should return null for missing start line", () => {
      const position = calculateStartPosition(null);
      expect(position).toBeNull();
    });
  });

  describe("calculateFinishPosition", () => {
    it("should calculate center of finish line", () => {
      const finishLine = { x: 800, y: 150, width: 10, height: 200 };

      const position = calculateFinishPosition(finishLine);

      expect(position).toBeTruthy();
      if (position) {
        expect(position.x).toBe(805); // x + width/2
        expect(position.y).toBe(250); // y + height/2
      }
    });

    it("should return null for missing finish line", () => {
      const position = calculateFinishPosition(null);
      expect(position).toBeNull();
    });
  });
});
