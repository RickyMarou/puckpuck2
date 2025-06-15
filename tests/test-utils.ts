// Test utilities and mock data

export function createMockSVG(elements: MockSVGElement[]): string {
  const svgElements = elements
    .map((el) => {
      switch (el.type) {
        case "rect":
          return `<rect id="${el.id || ""}" x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="${el.fill}"/>`;
        case "circle":
          return `<circle id="${el.id || ""}" cx="${el.cx}" cy="${el.cy}" r="${el.r}" fill="${el.fill}"/>`;
        case "line":
          return `<line id="${el.id || ""}" x1="${el.x1}" y1="${el.y1}" x2="${el.x2}" y2="${el.y2}" stroke="${el.stroke}" stroke-width="${el.strokeWidth || 1}"/>`;
        default:
          return "";
      }
    })
    .join("\n  ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1000" height="500" xmlns="http://www.w3.org/2000/svg">
  ${svgElements}
</svg>`;
}

export interface MockSVGElement {
  type: "rect" | "circle" | "line";
  id?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  // Rect props
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  // Circle props
  cx?: number;
  cy?: number;
  r?: number;
  // Line props
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
}

export function createMockDocument(svgText: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(svgText, "image/svg+xml");
}

export const MOCK_TRACK_SVG = createMockSVG([
  // Track area
  {
    type: "rect",
    id: "track-area",
    x: 100,
    y: 100,
    width: 800,
    height: 300,
    fill: "#FFFFFF",
  },

  // Walls
  {
    type: "rect",
    id: "wall-1",
    x: 100,
    y: 80,
    width: 400,
    height: 20,
    fill: "#000000",
  },
  {
    type: "rect",
    id: "wall-2",
    x: 100,
    y: 400,
    width: 400,
    height: 20,
    fill: "#000000",
  },

  // Obstacles
  {
    type: "circle",
    id: "obstacle-1",
    cx: 300,
    cy: 250,
    r: 30,
    fill: "#800080",
  },
  {
    type: "rect",
    id: "obstacle-2",
    x: 500,
    y: 200,
    width: 50,
    height: 50,
    fill: "#800080",
  },

  // Start/Finish lines
  {
    type: "rect",
    id: "start-line",
    x: 150,
    y: 100,
    width: 10,
    height: 300,
    fill: "#0000FF",
  },
  {
    type: "rect",
    id: "finish-line",
    x: 840,
    y: 100,
    width: 10,
    height: 300,
    fill: "#FFD700",
  },
]);

export const MOCK_GAME_CONFIG = {
  worldWidth: 1024,
  worldHeight: 768,
};

export const MOCK_SCALING_FACTOR = {
  scaleX: 1.024,
  scaleY: 1.536,
  offsetX: 12,
  offsetY: 134,
};

export function assertMatterBodyEquals(
  actual: any,
  expected: Partial<any>,
): void {
  if (expected.position) {
    expect(actual.position.x).toBeCloseTo(expected.position.x, 1);
    expect(actual.position.y).toBeCloseTo(expected.position.y, 1);
  }

  if (expected.label) {
    expect(actual.label).toBe(expected.label);
  }

  if (expected.bounds) {
    expect(actual.bounds.min.x).toBeCloseTo(expected.bounds.min.x, 1);
    expect(actual.bounds.min.y).toBeCloseTo(expected.bounds.min.y, 1);
    expect(actual.bounds.max.x).toBeCloseTo(expected.bounds.max.x, 1);
    expect(actual.bounds.max.y).toBeCloseTo(expected.bounds.max.y, 1);
  }

  if (expected.circleRadius) {
    expect(actual.circleRadius).toBeCloseTo(expected.circleRadius, 1);
  }
}
