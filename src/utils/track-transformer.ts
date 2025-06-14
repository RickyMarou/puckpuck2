import {
  GameRect,
  GameCircle,
  Wall,
  Obstacle,
  TrackBounds,
  TrackMarkers,
  GameConfig,
  ScalingFactor,
} from "./track-types";
import { getElementBounds, getCircleData } from "./svg-parser";

export function calculateScalingFactor(
  svgSize: { width: number; height: number },
  gameConfig: GameConfig,
  worldSize?: number,
): ScalingFactor {
  let targetWidth: number;
  let targetHeight: number;

  if (worldSize) {
    // Use the world size to create a square target area
    targetWidth = worldSize;
    targetHeight = worldSize;
  } else {
    // Fallback to 90% of available space for better screen utilization
    targetWidth = gameConfig.worldWidth * 0.9;
    targetHeight = gameConfig.worldHeight * 0.9;
  }

  const scaleX = targetWidth / svgSize.width;
  const scaleY = targetHeight / svgSize.height;

  const scale = Math.min(scaleX, scaleY);

  const scaledWidth = svgSize.width * scale;
  const scaledHeight = svgSize.height * scale;

  const offsetX = (gameConfig.worldWidth - scaledWidth) / 2;
  const offsetY = (gameConfig.worldHeight - scaledHeight) / 2;

  return {
    scaleX: scale,
    scaleY: scale,
    offsetX,
    offsetY,
  };
}

export function transformPoint(
  x: number,
  y: number,
  scaling: ScalingFactor,
): { x: number; y: number } {
  return {
    x: x * scaling.scaleX + scaling.offsetX,
    y: y * scaling.scaleY + scaling.offsetY,
  };
}

export function svgRectToGameRect(
  element: SVGElement,
  scaling: ScalingFactor,
): GameRect {
  const bounds = getElementBounds(element);
  const topLeft = transformPoint(bounds.x, bounds.y, scaling);

  return {
    x: topLeft.x,
    y: topLeft.y,
    width: bounds.width * scaling.scaleX,
    height: bounds.height * scaling.scaleY,
  };
}

export function svgCircleToGameCircle(
  element: SVGElement,
  scaling: ScalingFactor,
): GameCircle {
  const circleData = getCircleData(element);
  const center = transformPoint(circleData.cx, circleData.cy, scaling);

  return {
    x: center.x,
    y: center.y,
    radius: circleData.radius * Math.min(scaling.scaleX, scaling.scaleY),
  };
}

export function processTrackArea(
  elements: SVGElement[],
  scaling: ScalingFactor,
): TrackBounds {
  if (elements.length === 0) {
    throw new Error("No track area elements found");
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  elements.forEach((element) => {
    const rect = svgRectToGameRect(element, scaling);
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.width);
    maxY = Math.max(maxY, rect.y + rect.height);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function processWalls(
  elements: SVGElement[],
  scaling: ScalingFactor,
): Wall[] {
  return elements.map((element, index) => {
    const shape = svgRectToGameRect(element, scaling);
    const id = element.getAttribute("id") || `wall-${index}`;

    return {
      shape,
      type: "wall" as const,
      id,
    };
  });
}

export function processObstacles(
  elements: SVGElement[],
  scaling: ScalingFactor,
): Obstacle[] {
  return elements.map((element, index) => {
    const tagName = element.tagName.toLowerCase();
    const id = element.getAttribute("id") || `obstacle-${index}`;

    if (tagName === "circle") {
      const shape = svgCircleToGameCircle(element, scaling);
      return {
        shape,
        type: "obstacle" as const,
        id,
      };
    } else {
      const shape = svgRectToGameRect(element, scaling);
      return {
        shape,
        type: "obstacle" as const,
        id,
      };
    }
  });
}

export function processStartFinishLines(
  startElements: SVGElement[],
  finishElements: SVGElement[],
  scaling: ScalingFactor,
): TrackMarkers {
  const startLine =
    startElements.length > 0
      ? svgRectToGameRect(startElements[0], scaling)
      : null;

  const finishLine =
    finishElements.length > 0
      ? svgRectToGameRect(finishElements[0], scaling)
      : null;

  return {
    startLine,
    finishLine,
  };
}

export function calculateStartPosition(
  startLine: GameRect | null,
): { x: number; y: number } | null {
  if (!startLine) return null;

  return {
    x: startLine.x + startLine.width / 2,
    y: startLine.y + startLine.height / 2,
  };
}

export function calculateFinishPosition(
  finishLine: GameRect | null,
): { x: number; y: number } | null {
  if (!finishLine) return null;

  return {
    x: finishLine.x + finishLine.width / 2,
    y: finishLine.y + finishLine.height / 2,
  };
}

export function createBoundaryWalls(
  trackBounds: TrackBounds,
  thickness: number = 50,
): GameRect[] {
  return [
    {
      x: trackBounds.x - thickness,
      y: trackBounds.y - thickness,
      width: trackBounds.width + 2 * thickness,
      height: thickness,
    },
    {
      x: trackBounds.x - thickness,
      y: trackBounds.y + trackBounds.height,
      width: trackBounds.width + 2 * thickness,
      height: thickness,
    },
    {
      x: trackBounds.x - thickness,
      y: trackBounds.y,
      width: thickness,
      height: trackBounds.height,
    },
    {
      x: trackBounds.x + trackBounds.width,
      y: trackBounds.y,
      width: thickness,
      height: trackBounds.height,
    },
  ];
}

export function calculateWorldBounds(
  trackBounds: TrackBounds,
  padding: number = 100,
): GameRect {
  return {
    x: trackBounds.x - padding,
    y: trackBounds.y - padding,
    width: trackBounds.width + 2 * padding,
    height: trackBounds.height + 2 * padding,
  };
}
