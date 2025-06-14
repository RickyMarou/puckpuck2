// Using Phaser's exposed Matter.js Body type
type Body = MatterJS.BodyType;

export interface GameRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GameCircle {
  x: number;
  y: number;
  radius: number;
}

export type GameShape = GameRect | GameCircle;

export interface Wall {
  shape: GameRect;
  type: "wall";
  id?: string;
}

export interface Obstacle {
  shape: GameShape;
  type: "obstacle";
  id?: string;
}

export interface TrackBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TrackMarkers {
  startLine: GameRect | null;
  finishLine: GameRect | null;
}

export interface RawTrackElements {
  trackAreas: SVGElement[];
  walls: SVGElement[];
  obstacles: SVGElement[];
  startLines: SVGElement[];
  finishLines: SVGElement[];
}

export interface GameConfig {
  worldWidth: number;
  worldHeight: number;
  scaleFactor?: number;
}

export interface TrackMetadata {
  originalSVGSize: { width: number; height: number };
  scaleFactor: number;
  elementCounts: {
    walls: number;
    obstacles: number;
    trackAreas: number;
  };
}

export interface ImportedTrack {
  bounds: TrackBounds;
  walls: Body[];
  obstacles: Body[];
  boundaries: Body[];
  startPosition: { x: number; y: number } | null;
  finishPosition: { x: number; y: number } | null;
  metadata: TrackMetadata;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ScalingFactor {
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
}

export const TRACK_COLORS = {
  TRACK_AREA: "#00FF00",
  WALL: "#000000",
  START_LINE: "#0000FF",
  FINISH_LINE: "#FFD700",
  OBSTACLE: "#800080",
  OUT_OF_BOUNDS: "#FF0000",
} as const;

export function isGameCircle(shape: GameShape): shape is GameCircle {
  return "radius" in shape;
}

export function isGameRect(shape: GameShape): shape is GameRect {
  return "width" in shape && "height" in shape;
}
