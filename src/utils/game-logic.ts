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

export interface ControlState {
  isRespawning: boolean;
  isDragging?: boolean;
}

export function isControlAllowed(
  gameObject: Phaser.GameObjects.GameObject,
  puck: Phaser.GameObjects.GameObject,
  controlState: ControlState,
): boolean {
  // Control is allowed only if:
  // 1. The target object is the puck
  // 2. We are not currently in a respawn animation
  return gameObject === puck && !controlState.isRespawning;
}

export function isDragAllowed(
  gameObject: Phaser.GameObjects.GameObject,
  puck: Phaser.GameObjects.GameObject,
  controlState: ControlState,
): boolean {
  // Drag is allowed if control is allowed AND we are already dragging
  return (
    isControlAllowed(gameObject, puck, controlState) &&
    !!controlState.isDragging
  );
}
