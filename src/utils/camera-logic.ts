export interface SlingData {
  length: number;
  maxLength: number;
}

export interface SpeedData {
  velocity: number;
  maxVelocity: number;
}

export interface ZoomConfig {
  minZoom: number;
  maxZoom: number;
  defaultZoom: number;
}

/**
 * Calculate zoom level based on sling length
 * Zoom out linearly as sling extends, capped at maxZoom
 */
export function calculateSlingZoom(
  slingData: SlingData,
  zoomConfig: ZoomConfig,
): number {
  if (slingData.length <= 0) {
    return zoomConfig.defaultZoom;
  }

  // Linear interpolation between defaultZoom and minZoom based on sling length
  const lengthRatio = Math.min(slingData.length / slingData.maxLength, 1);
  const zoomRange = zoomConfig.defaultZoom - zoomConfig.minZoom;
  const targetZoom = zoomConfig.defaultZoom - lengthRatio * zoomRange;

  return Math.max(targetZoom, zoomConfig.minZoom);
}

/**
 * Calculate zoom level based on character speed
 * Zoom in as speed decreases, maximum zoom when still
 */
export function calculateSpeedZoom(
  speedData: SpeedData,
  zoomConfig: ZoomConfig,
): number {
  if (speedData.velocity <= 0) {
    return zoomConfig.maxZoom;
  }

  // Linear interpolation between minZoom and maxZoom based on speed
  const speedRatio = Math.min(speedData.velocity / speedData.maxVelocity, 1);
  const zoomRange = zoomConfig.maxZoom - zoomConfig.minZoom;
  const targetZoom = zoomConfig.maxZoom - speedRatio * zoomRange;

  return Math.max(targetZoom, zoomConfig.minZoom);
}

/**
 * Calculate sling length from two points
 */
export function calculateSlingLength(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): number {
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
}

/**
 * Calculate velocity magnitude from velocity components
 */
export function calculateVelocityMagnitude(
  velocityX: number,
  velocityY: number,
): number {
  return Math.sqrt(velocityX * velocityX + velocityY * velocityY);
}

/**
 * Determine if zoom should be updated during drag
 * Only zoom out (decrease zoom value), never zoom in during drag
 */
export function shouldUpdateZoomDuringDrag(
  currentZoom: number,
  targetZoom: number,
): boolean {
  // Only update if target zoom is smaller (more zoomed out) than current
  return targetZoom < currentZoom;
}
