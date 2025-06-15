import {
  ImportedTrack,
  GameConfig,
  ValidationResult,
  TrackMetadata,
} from "./track-types";
import {
  parseSVGText,
  extractTrackElements,
  getSVGDimensions,
  getSVGWorldSize,
} from "./svg-parser";
import {
  calculateScalingFactor,
  processTrackArea,
  processWalls,
  processObstacles,
  processStartFinishLines,
  calculateStartPosition,
  calculateFinishPosition,
  calculateWorldBounds,
} from "./track-transformer";
import {
  createWallBodies,
  createObstacleBodies,
  createInvisibleBoundary,
  addBodiesWithPhysics,
  removeBodiesFromPhysics,
} from "./matter-factory";

export function importTrack(
  svgText: string,
  gameConfig: GameConfig,
): ImportedTrack {
  try {
    const doc = parseSVGText(svgText);
    const svgDimensions = getSVGDimensions(doc);
    const worldSize = getSVGWorldSize(doc);
    const scaling = calculateScalingFactor(
      svgDimensions,
      gameConfig,
      worldSize ?? undefined,
    );

    const rawElements = extractTrackElements(doc);

    if (rawElements.trackAreas.length === 0) {
      throw new Error("No track areas found in SVG");
    }

    const trackBounds = processTrackArea(rawElements.trackAreas, scaling);
    const walls = processWalls(rawElements.walls, scaling);
    const obstacles = processObstacles(rawElements.obstacles, scaling);
    const markers = processStartFinishLines(
      rawElements.startLines,
      rawElements.finishLines,
      scaling,
    );

    const wallBodies = createWallBodies(walls);
    const obstacleBodies = createObstacleBodies(obstacles);
    const boundaryBodies = createInvisibleBoundary(trackBounds);

    const startPosition = calculateStartPosition(markers.startLine);
    const finishPosition = calculateFinishPosition(markers.finishLine);

    const metadata: TrackMetadata = {
      originalSVGSize: svgDimensions,
      scaleFactor: scaling.scaleX,
      elementCounts: {
        walls: walls.length,
        obstacles: obstacles.length,
        trackAreas: rawElements.trackAreas.length,
      },
    };

    return {
      bounds: trackBounds,
      walls: wallBodies,
      obstacles: obstacleBodies,
      boundaries: boundaryBodies,
      startPosition,
      finishPosition,
      metadata,
    };
  } catch (error) {
    throw new Error(
      `Track import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export function validateTrackData(track: ImportedTrack): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (track.bounds.width <= 0 || track.bounds.height <= 0) {
    errors.push("Track bounds are invalid");
  }

  if (!track.startPosition) {
    warnings.push("No start line found in track");
  }

  if (!track.finishPosition) {
    warnings.push("No finish line found in track");
  }

  if (track.walls.length === 0) {
    warnings.push("No walls found in track");
  }

  if (track.obstacles.length === 0) {
    warnings.push("No obstacles found in track");
  }

  if (track.bounds.width > 10000 || track.bounds.height > 10000) {
    warnings.push("Track is very large and may impact performance");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function addTrackToScene(
  track: ImportedTrack,
  scene: Phaser.Scene,
): void {
  if (!scene.matter || !scene.matter.world) {
    throw new Error("Scene does not have Matter.js physics enabled");
  }

  // Add visual elements first (background)
  createTrackVisuals(track, scene);

  // Then add physics bodies
  addBodiesWithPhysics(scene, track.walls);
  addBodiesWithPhysics(scene, track.obstacles);
  addBodiesWithPhysics(scene, track.boundaries);

  console.log("Track added to scene:", {
    walls: track.walls.length,
    obstacles: track.obstacles.length,
    boundaries: track.boundaries.length,
    bounds: track.bounds,
    startPosition: track.startPosition,
    finishPosition: track.finishPosition,
  });
}

function createTrackVisuals(track: ImportedTrack, scene: Phaser.Scene): void {
  // Calculate world bounds for background with extra padding
  const worldBounds = calculateWorldBounds(track.bounds, 500);

  // Create out-of-bounds background (sky blue) covering entire world
  const outOfBoundsGraphics = scene.add.graphics();
  outOfBoundsGraphics.fillStyle(0x87ceeb); // Sky blue
  outOfBoundsGraphics.fillRect(
    worldBounds.x,
    worldBounds.y,
    worldBounds.width,
    worldBounds.height,
  );
  outOfBoundsGraphics.setDepth(-2);

  // Create track area background (white)
  const trackGraphics = scene.add.graphics();
  trackGraphics.fillStyle(0xffffff); // White
  trackGraphics.fillRect(
    track.bounds.x,
    track.bounds.y,
    track.bounds.width,
    track.bounds.height,
  );
  trackGraphics.setDepth(-1);

  // Create wall visuals (black rectangles)
  track.walls.forEach((wall) => {
    const wallGraphics = scene.add.graphics();
    wallGraphics.fillStyle(0x000000); // Black
    // Extract position and size from Matter.js body
    const bounds = wall.bounds;
    wallGraphics.fillRect(
      bounds.min.x,
      bounds.min.y,
      bounds.max.x - bounds.min.x,
      bounds.max.y - bounds.min.y,
    );
    wallGraphics.setDepth(1);
  });

  // Create obstacle visuals (purple)
  track.obstacles.forEach((obstacle) => {
    const obstacleGraphics = scene.add.graphics();
    obstacleGraphics.fillStyle(0x800080); // Purple

    // Use type assertion since we know obstacle is a Matter.js Body
    const body = obstacle as any;

    if (body.circleRadius) {
      // Circle obstacle
      obstacleGraphics.fillCircle(
        body.position.x,
        body.position.y,
        body.circleRadius,
      );
    } else {
      // Rectangle obstacle
      const bounds = body.bounds;
      obstacleGraphics.fillRect(
        bounds.min.x,
        bounds.min.y,
        bounds.max.x - bounds.min.x,
        bounds.max.y - bounds.min.y,
      );
    }
    obstacleGraphics.setDepth(1);
  });

  // Create start/finish line visuals
  if (track.startPosition) {
    const startGraphics = scene.add.graphics();
    startGraphics.lineStyle(10, 0x0000ff); // Blue
    // Draw horizontal line for vertical tracks
    startGraphics.lineBetween(
      track.bounds.x,
      track.startPosition.y,
      track.bounds.x + track.bounds.width,
      track.startPosition.y,
    );
    startGraphics.setDepth(2);
  }

  if (track.finishPosition) {
    const finishGraphics = scene.add.graphics();
    finishGraphics.lineStyle(10, 0xffd700); // Gold
    // Draw horizontal line for vertical tracks
    finishGraphics.lineBetween(
      track.bounds.x,
      track.finishPosition.y,
      track.bounds.x + track.bounds.width,
      track.finishPosition.y,
    );
    finishGraphics.setDepth(2);
  }
}

export function removeTrackFromScene(
  track: ImportedTrack,
  scene: Phaser.Scene,
): void {
  if (!scene.matter || !scene.matter.world) {
    return;
  }

  removeBodiesFromPhysics(scene, track.walls);
  removeBodiesFromPhysics(scene, track.obstacles);
  removeBodiesFromPhysics(scene, track.boundaries);

  console.log("Track removed from scene");
}

export function createGameConfig(scene: Phaser.Scene): GameConfig {
  return {
    worldWidth: scene.cameras.main.width,
    worldHeight: scene.cameras.main.height,
  };
}

export async function loadTrackFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === "string") {
        resolve(result);
      } else {
        reject(new Error("Failed to read file as text"));
      }
    };

    reader.onerror = () => {
      reject(new Error("File reading failed"));
    };

    reader.readAsText(file);
  });
}

export async function importTrackFromFile(
  file: File,
  gameConfig: GameConfig,
): Promise<ImportedTrack> {
  const svgText = await loadTrackFromFile(file);
  return importTrack(svgText, gameConfig);
}
