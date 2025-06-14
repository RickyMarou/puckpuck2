// Using Phaser's exposed Matter.js Body type
type Body = MatterJS.BodyType;

// @ts-ignore - Access Phaser globally since it's loaded by the game engine
const Bodies = (globalThis as any).Phaser.Physics.Matter.Matter.Bodies;
import {
  Wall,
  Obstacle,
  GameRect,
  TrackBounds,
  isGameCircle,
} from "./track-types";

export function getWallBodyConfig(): Phaser.Types.Physics.Matter.MatterBodyConfig {
  return {
    isStatic: true,
    restitution: 0.8,
    friction: 0.1,
    frictionStatic: 0.5,
    label: "wall",
  };
}

export function getObstacleBodyConfig(): Phaser.Types.Physics.Matter.MatterBodyConfig {
  return {
    isStatic: true,
    restitution: 0.9,
    friction: 0.1,
    frictionStatic: 0.5,
    label: "obstacle",
  };
}

export function getBoundaryBodyConfig(): Phaser.Types.Physics.Matter.MatterBodyConfig {
  return {
    isStatic: true,
    restitution: 0,
    friction: 1,
    frictionStatic: 1,
    label: "boundary",
    isSensor: false,
  };
}

export function createRectangleBody(
  rect: GameRect,
  options?: Phaser.Types.Physics.Matter.MatterBodyConfig,
): Body {
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;

  return Bodies.rectangle(centerX, centerY, rect.width, rect.height, options);
}

export function createCircleBody(
  x: number,
  y: number,
  radius: number,
  options?: Phaser.Types.Physics.Matter.MatterBodyConfig,
): Body {
  return Bodies.circle(x, y, radius, options);
}

export function createWallBodies(walls: Wall[]): Body[] {
  const config = getWallBodyConfig();

  return walls.map((wall) => {
    const body = createRectangleBody(wall.shape, config);

    if (wall.id) {
      body.label = `wall-${wall.id}`;
    }

    return body;
  });
}

export function createObstacleBodies(obstacles: Obstacle[]): Body[] {
  const config = getObstacleBodyConfig();

  return obstacles.map((obstacle) => {
    let body: Body;

    if (isGameCircle(obstacle.shape)) {
      body = createCircleBody(
        obstacle.shape.x,
        obstacle.shape.y,
        obstacle.shape.radius,
        config,
      );
    } else {
      body = createRectangleBody(obstacle.shape, config);
    }

    if (obstacle.id) {
      body.label = `obstacle-${obstacle.id}`;
    }

    return body;
  });
}

export function createBoundaryBodies(boundaries: GameRect[]): Body[] {
  const config = getBoundaryBodyConfig();

  return boundaries.map((boundary, index) => {
    const body = createRectangleBody(boundary, config);
    body.label = `boundary-${index}`;
    return body;
  });
}

export function createInvisibleBoundary(
  _trackBounds: TrackBounds,
  _thickness: number = 50,
): Body[] {
  // Don't create any boundaries - let walls define the track edges
  // This allows gaps in walls to function as intended passages
  return [];
}

export function addBodiesWithPhysics(
  scene: Phaser.Scene,
  bodies: Body[],
): void {
  if (!scene.matter || !scene.matter.world) {
    throw new Error("Matter.js physics not initialized in scene");
  }

  bodies.forEach((body) => {
    scene.matter.world.add(body);
  });
}

export function removeBodiesFromPhysics(
  scene: Phaser.Scene,
  bodies: Body[],
): void {
  if (!scene.matter || !scene.matter.world) {
    return;
  }

  bodies.forEach((body) => {
    scene.matter.world.remove(body);
  });
}
