import { TrackBounds } from "./track-types";

export interface Position {
  x: number;
  y: number;
}

export function isOutOfBounds(
  position: Position,
  trackBounds: TrackBounds,
): boolean {
  return (
    position.x < trackBounds.x ||
    position.x > trackBounds.x + trackBounds.width ||
    position.y < trackBounds.y ||
    position.y > trackBounds.y + trackBounds.height
  );
}

export function getDefaultRespawnPosition(trackBounds: TrackBounds): Position {
  return {
    x: trackBounds.x + trackBounds.width / 2,
    y: trackBounds.y + trackBounds.height / 2,
  };
}

export function getRespawnPosition(
  lastValidPosition: Position | null,
  startPosition: Position | null,
  trackBounds: TrackBounds,
): Position {
  // Priority order: lastValidPosition > startPosition > center of track (as last resort)
  if (lastValidPosition) {
    return lastValidPosition;
  }
  if (startPosition) {
    return startPosition;
  }
  // Center fallback only if no start position is available
  return getDefaultRespawnPosition(trackBounds);
}
