import { RawTrackElements, TRACK_COLORS } from "./track-types";

export function parseSVGText(svgText: string): Document {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, "image/svg+xml");

  const parserError = doc.querySelector("parsererror");
  if (parserError) {
    throw new Error(`SVG parsing failed: ${parserError.textContent}`);
  }

  return doc;
}

export function extractElementsByColor(
  doc: Document,
  color: string,
): SVGElement[] {
  const elements: SVGElement[] = [];
  const allElements = doc.querySelectorAll("*");

  allElements.forEach((element) => {
    const svgElement = element as SVGElement;
    const fill = svgElement.getAttribute("fill")?.toUpperCase();
    const stroke = svgElement.getAttribute("stroke")?.toUpperCase();

    if (fill === color.toUpperCase() || stroke === color.toUpperCase()) {
      elements.push(svgElement);
    }
  });

  return elements;
}

export function extractElementsByTag(
  doc: Document,
  tagName: string,
): SVGElement[] {
  const elements = doc.querySelectorAll(tagName);
  return Array.from(elements) as SVGElement[];
}

export function extractElementsById(
  doc: Document,
  idPattern: RegExp,
): SVGElement[] {
  const elements: SVGElement[] = [];
  const allElements = doc.querySelectorAll("[id]");

  allElements.forEach((element) => {
    const id = element.getAttribute("id");
    if (id && idPattern.test(id)) {
      elements.push(element as SVGElement);
    }
  });

  return elements;
}

export function getSVGDimensions(doc: Document): {
  width: number;
  height: number;
} {
  const svgElement = doc.querySelector("svg");
  if (!svgElement) {
    throw new Error("No SVG root element found");
  }

  const width = parseFloat(svgElement.getAttribute("width") || "0");
  const height = parseFloat(svgElement.getAttribute("height") || "0");

  if (width === 0 || height === 0) {
    throw new Error("SVG dimensions are invalid or missing");
  }

  return { width, height };
}

export function getSVGWorldSize(doc: Document): number | null {
  const svgElement = doc.querySelector("svg");
  if (!svgElement) {
    return null;
  }

  const dataSizeAttr = svgElement.getAttribute("data-size");
  if (!dataSizeAttr) {
    return null;
  }

  const worldSize = parseFloat(dataSizeAttr);
  if (isNaN(worldSize) || worldSize <= 0) {
    console.warn("Invalid data-size attribute:", dataSizeAttr);
    return null;
  }

  return worldSize;
}

export function extractTrackElements(doc: Document): RawTrackElements {
  return {
    trackAreas: extractElementsByColor(doc, TRACK_COLORS.TRACK_AREA),
    walls: extractElementsByColor(doc, TRACK_COLORS.WALL),
    obstacles: extractElementsByColor(doc, TRACK_COLORS.OBSTACLE),
    startLines: extractElementsByColor(doc, TRACK_COLORS.START_LINE),
    finishLines: extractElementsByColor(doc, TRACK_COLORS.FINISH_LINE),
  };
}

export function extractWallElements(doc: Document): SVGElement[] {
  return extractElementsByColor(doc, TRACK_COLORS.WALL);
}

export function extractObstacleElements(doc: Document): SVGElement[] {
  return extractElementsByColor(doc, TRACK_COLORS.OBSTACLE);
}

export function extractStartFinishLines(doc: Document): {
  start: SVGElement[];
  finish: SVGElement[];
} {
  return {
    start: extractElementsByColor(doc, TRACK_COLORS.START_LINE),
    finish: extractElementsByColor(doc, TRACK_COLORS.FINISH_LINE),
  };
}

export function getElementBounds(element: SVGElement): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const tagName = element.tagName.toLowerCase();

  switch (tagName) {
    case "rect":
      return {
        x: parseFloat(element.getAttribute("x") || "0"),
        y: parseFloat(element.getAttribute("y") || "0"),
        width: parseFloat(element.getAttribute("width") || "0"),
        height: parseFloat(element.getAttribute("height") || "0"),
      };

    case "circle":
      const cx = parseFloat(element.getAttribute("cx") || "0");
      const cy = parseFloat(element.getAttribute("cy") || "0");
      const r = parseFloat(element.getAttribute("r") || "0");
      return {
        x: cx - r,
        y: cy - r,
        width: r * 2,
        height: r * 2,
      };

    case "line":
      const x1 = parseFloat(element.getAttribute("x1") || "0");
      const y1 = parseFloat(element.getAttribute("y1") || "0");
      const x2 = parseFloat(element.getAttribute("x2") || "0");
      const y2 = parseFloat(element.getAttribute("y2") || "0");
      const strokeWidth = parseFloat(
        element.getAttribute("stroke-width") || "1",
      );

      return {
        x: Math.min(x1, x2) - strokeWidth / 2,
        y: Math.min(y1, y2) - strokeWidth / 2,
        width: Math.abs(x2 - x1) + strokeWidth,
        height: Math.abs(y2 - y1) + strokeWidth,
      };

    default:
      console.warn(`Unsupported SVG element type: ${tagName}`);
      return { x: 0, y: 0, width: 0, height: 0 };
  }
}

export function getCircleData(element: SVGElement): {
  cx: number;
  cy: number;
  radius: number;
} {
  if (element.tagName.toLowerCase() !== "circle") {
    throw new Error("Element is not a circle");
  }

  return {
    cx: parseFloat(element.getAttribute("cx") || "0"),
    cy: parseFloat(element.getAttribute("cy") || "0"),
    radius: parseFloat(element.getAttribute("r") || "0"),
  };
}
