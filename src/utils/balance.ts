/**
 * Game Balance Configuration
 *
 * Centralized configuration for all gameplay parameters.
 * Adjust these values to fine-tune game feel and balance.
 */

// ===== CAMERA CONFIGURATION =====

/**
 * Camera zoom levels
 * Higher values = closer to action, lower values = wider view
 */
export const CAMERA_ZOOM = {
  /** Minimum zoom level (maximum zoom out) */
  MIN: 0.3,
  /** Maximum zoom level (maximum zoom in) - achieved when character is stationary */
  MAX: 0.8,
  /** Default starting zoom level - positioned to allow smooth scaling in both directions */
  DEFAULT: 0.55, // Midpoint between MIN and MAX for smooth linear scaling
} as const;

// ===== SLINGSHOT CONFIGURATION =====

/**
 * Slingshot mechanics parameters
 * These directly affect game speed and difficulty
 */
export const SLINGSHOT = {
  /** Maximum slingshot extension length in pixels - higher = more power potential */
  MAX_LENGTH: 500,
  /** Velocity multiplier when releasing slingshot - higher = faster gameplay */
  VELOCITY_MULTIPLIER: 0.1,
} as const;

// ===== PHYSICS CONFIGURATION =====

/**
 * Physics and movement parameters
 */
export const PHYSICS = {
  /** Maximum expected velocity for zoom calculations */
  MAX_VELOCITY: 50,
  /** Air friction coefficient - higher = faster deceleration */
  AIR_FRICTION: 0.05,
  /** Bounce coefficient for puck - higher = more bouncy */
  BOUNCE: 0.8,
} as const;

// ===== MOUSE CONTROLS =====

/**
 * Mouse interaction parameters
 */
export const MOUSE = {
  /** Mouse wheel zoom speed increment */
  ZOOM_SPEED: 0.2,
} as const;

// ===== ANIMATION TIMING =====

/**
 * Animation and transition durations in milliseconds
 */
export const TIMING = {
  /** Sling zoom transition duration */
  SLING_ZOOM_DURATION: 400,
  /** Speed-based zoom transition duration */
  SPEED_ZOOM_DURATION: 600,
  /** Mouse wheel zoom transition duration */
  MOUSE_ZOOM_DURATION: 200,
  /** Respawn animation total duration */
  RESPAWN_DURATION: 800,
} as const;

// ===== DERIVED VALUES =====

/**
 * Calculated values based on the above constants
 * These are computed automatically - don't modify directly
 */
export const DERIVED = {
  /** Zoom range for calculations */
  ZOOM_RANGE: CAMERA_ZOOM.MAX - CAMERA_ZOOM.MIN,
  /** Half respawn duration for fade out/in */
  RESPAWN_FADE_DURATION: TIMING.RESPAWN_DURATION / 2,
} as const;
