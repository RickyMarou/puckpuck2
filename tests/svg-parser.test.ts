import { describe, it, expect } from "vitest";
import {
  parseSVGText,
  extractElementsByColor,
  extractElementsByTag,
  extractTrackElements,
  getSVGDimensions,
  getSVGWorldSize,
  getElementBounds,
  getCircleData,
} from "../src/utils/svg-parser";
import {
  createMockSVG,
  createMockDocument,
  MOCK_TRACK_SVG,
} from "./test-utils";

describe("svg-parser", () => {
  describe("parseSVGText", () => {
    it("should parse valid SVG text", () => {
      const svgText = '<svg><rect x="0" y="0" width="100" height="100"/></svg>';
      const doc = parseSVGText(svgText);
      expect(doc).toBeDefined();
      expect(doc.querySelector("rect")).toBeTruthy();
    });

    it("should throw error for invalid SVG", () => {
      const invalidSVG = "<svg><unclosed-tag></svg>";
      expect(() => parseSVGText(invalidSVG)).toThrow();
    });
  });

  describe("extractElementsByColor", () => {
    it("should extract elements by fill color", () => {
      const svgText = createMockSVG([
        { type: "rect", x: 0, y: 0, width: 100, height: 100, fill: "#00FF00" },
        {
          type: "rect",
          x: 100,
          y: 0,
          width: 100,
          height: 100,
          fill: "#FF0000",
        },
        { type: "circle", cx: 50, cy: 50, r: 25, fill: "#00FF00" },
      ]);
      const doc = createMockDocument(svgText);

      const greenElements = extractElementsByColor(doc, "#00FF00");
      expect(greenElements).toHaveLength(2);
      expect(greenElements[0].tagName.toLowerCase()).toBe("rect");
      expect(greenElements[1].tagName.toLowerCase()).toBe("circle");
    });

    it("should extract elements by stroke color", () => {
      const svgText = createMockSVG([
        {
          type: "line",
          x1: 0,
          y1: 0,
          x2: 100,
          y2: 100,
          stroke: "#0000FF",
          strokeWidth: 5,
        },
        { type: "rect", x: 0, y: 0, width: 100, height: 100, fill: "#FF0000" },
      ]);
      const doc = createMockDocument(svgText);

      const blueElements = extractElementsByColor(doc, "#0000FF");
      expect(blueElements).toHaveLength(1);
      expect(blueElements[0].tagName.toLowerCase()).toBe("line");
    });

    it("should handle case insensitive color matching", () => {
      const svgText = createMockSVG([
        { type: "rect", x: 0, y: 0, width: 100, height: 100, fill: "#00ff00" },
      ]);
      const doc = createMockDocument(svgText);

      const elements = extractElementsByColor(doc, "#00FF00");
      expect(elements).toHaveLength(1);
    });
  });

  describe("extractElementsByTag", () => {
    it("should extract elements by tag name", () => {
      const svgText = createMockSVG([
        { type: "rect", x: 0, y: 0, width: 100, height: 100, fill: "#00FF00" },
        { type: "circle", cx: 50, cy: 50, r: 25, fill: "#FF0000" },
        {
          type: "rect",
          x: 100,
          y: 100,
          width: 50,
          height: 50,
          fill: "#0000FF",
        },
      ]);
      const doc = createMockDocument(svgText);

      const rects = extractElementsByTag(doc, "rect");
      expect(rects).toHaveLength(2);

      const circles = extractElementsByTag(doc, "circle");
      expect(circles).toHaveLength(1);
    });
  });

  describe("getSVGDimensions", () => {
    it("should extract SVG dimensions", () => {
      const svgText = '<svg width="800" height="600"><rect/></svg>';
      const doc = createMockDocument(svgText);

      const dimensions = getSVGDimensions(doc);
      expect(dimensions.width).toBe(800);
      expect(dimensions.height).toBe(600);
    });

    it("should throw error for missing SVG element", () => {
      const doc = createMockDocument("<div></div>");
      expect(() => getSVGDimensions(doc)).toThrow("No SVG root element found");
    });

    it("should throw error for invalid dimensions", () => {
      const svgText = '<svg width="0" height="600"><rect/></svg>';
      const doc = createMockDocument(svgText);
      expect(() => getSVGDimensions(doc)).toThrow(
        "SVG dimensions are invalid or missing",
      );
    });
  });

  describe("getSVGWorldSize", () => {
    it("should extract data-size attribute", () => {
      const svgText =
        '<svg width="800" height="600" data-size="4000"><rect/></svg>';
      const doc = createMockDocument(svgText);

      const worldSize = getSVGWorldSize(doc);
      expect(worldSize).toBe(4000);
    });

    it("should return null when data-size is missing", () => {
      const svgText = '<svg width="800" height="600"><rect/></svg>';
      const doc = createMockDocument(svgText);

      const worldSize = getSVGWorldSize(doc);
      expect(worldSize).toBeNull();
    });

    it("should return null for invalid data-size", () => {
      const svgText =
        '<svg width="800" height="600" data-size="invalid"><rect/></svg>';
      const doc = createMockDocument(svgText);

      const worldSize = getSVGWorldSize(doc);
      expect(worldSize).toBeNull();
    });

    it("should return null for negative data-size", () => {
      const svgText =
        '<svg width="800" height="600" data-size="-1000"><rect/></svg>';
      const doc = createMockDocument(svgText);

      const worldSize = getSVGWorldSize(doc);
      expect(worldSize).toBeNull();
    });
  });

  describe("extractTrackElements", () => {
    it("should extract all track elements by color", () => {
      const doc = createMockDocument(MOCK_TRACK_SVG);
      const elements = extractTrackElements(doc);

      expect(elements.trackAreas).toHaveLength(1);
      expect(elements.walls).toHaveLength(2);
      expect(elements.obstacles).toHaveLength(2);
      expect(elements.startLines).toHaveLength(1);
      expect(elements.finishLines).toHaveLength(1);
    });
  });

  describe("getElementBounds", () => {
    it("should get bounds for rectangle element", () => {
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

      const bounds = getElementBounds(rect as SVGElement);
      expect(bounds.x).toBe(100);
      expect(bounds.y).toBe(200);
      expect(bounds.width).toBe(300);
      expect(bounds.height).toBe(150);
    });

    it("should get bounds for circle element", () => {
      const svgText = createMockSVG([
        { type: "circle", cx: 150, cy: 200, r: 50, fill: "#FF0000" },
      ]);
      const doc = createMockDocument(svgText);
      const circle = doc.querySelector("circle")!;

      const bounds = getElementBounds(circle as SVGElement);
      expect(bounds.x).toBe(100); // cx - r
      expect(bounds.y).toBe(150); // cy - r
      expect(bounds.width).toBe(100); // r * 2
      expect(bounds.height).toBe(100); // r * 2
    });

    it("should get bounds for line element", () => {
      const svgText = createMockSVG([
        {
          type: "line",
          x1: 100,
          y1: 150,
          x2: 200,
          y2: 250,
          stroke: "#0000FF",
          strokeWidth: 10,
        },
      ]);
      const doc = createMockDocument(svgText);
      const line = doc.querySelector("line")!;

      const bounds = getElementBounds(line as SVGElement);
      expect(bounds.x).toBe(95); // min(x1,x2) - strokeWidth/2
      expect(bounds.y).toBe(145); // min(y1,y2) - strokeWidth/2
      expect(bounds.width).toBe(110); // |x2-x1| + strokeWidth
      expect(bounds.height).toBe(110); // |y2-y1| + strokeWidth
    });
  });

  describe("getCircleData", () => {
    it("should extract circle data", () => {
      const svgText = createMockSVG([
        { type: "circle", cx: 150, cy: 200, r: 75, fill: "#FF0000" },
      ]);
      const doc = createMockDocument(svgText);
      const circle = doc.querySelector("circle")!;

      const data = getCircleData(circle as SVGElement);
      expect(data.cx).toBe(150);
      expect(data.cy).toBe(200);
      expect(data.radius).toBe(75);
    });

    it("should throw error for non-circle element", () => {
      const svgText = createMockSVG([
        { type: "rect", x: 0, y: 0, width: 100, height: 100, fill: "#00FF00" },
      ]);
      const doc = createMockDocument(svgText);
      const rect = doc.querySelector("rect")!;

      expect(() => getCircleData(rect as SVGElement)).toThrow(
        "Element is not a circle",
      );
    });
  });
});
