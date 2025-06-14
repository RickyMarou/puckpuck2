# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Phaser 3 game project called "puckpuck2" - a single-player top-down racing game with slingshot movement mechanics. See `PLAN.md` for detailed game design and roadmap.

### Game Concept

- Top-down racing game with Quake3-inspired acceleration mechanics
- Character controlled via slingshot with complex speed multipliers
- SVG-based track import system
- Ghost replay functionality for speedrunning

## Development Commands

```bash
# Install dependencies (using pnpm)
pnpm install

# Build for production (outputs to dist/)
pnpm build

# Start development server (runs on http://localhost:8080)
# NOTE: Running the dev server is NOT necessary to test your changes
# Use 'pnpm build' to check for build errors instead
pnpm dev

# Static code quality checks
pnpm run types     # TypeScript type checking
pnpm run format    # Prettier code formatting check
pnpm run lint      # ESLint code linting
pnpm run test:run  # Run unit tests once

# Comprehensive quality check (runs all static checks + tests)
pnpm run check     # IMPORTANT: Run this after completing any coding task
```

## Code Quality Standards

This project maintains high code quality through automated static analysis:

- **TypeScript**: Strict type checking with no errors allowed
- **Prettier**: Consistent code formatting across all files
- **ESLint**: Comprehensive linting with TypeScript support
- **Unit Tests**: 60+ tests covering core functionality

**⚠️ IMPORTANT**: Always run `pnpm run check` when finished with any coding task to ensure all quality checks pass before considering the work complete.

**⚠️ IMPORTANT**: After completing any coding task, always create a git commit with an explicit commit message and detailed description of the changes made.

**⚠️ IMPORTANT**: Always extract logic into small, pure functions and create comprehensive unit tests for them. This follows functional programming patterns and ensures code reliability.

## Architecture

### Core Structure

- **Phaser Game Engine**: The game uses Phaser 3.80.1 with Matter.js physics engine
- **Scene System**: Game states are managed through Phaser scenes located in `/src/scenes/`
  - `Preloader.ts`: Loads game assets
  - `MainMenu.ts`: Menu screen (currently bypassed)
  - `Game.ts`: Main gameplay scene with physics and slingshot mechanics
  - `GameOver.ts`: Game over screen

### Key Game Components in Game.ts

- **Puck**: Draggable pink star sprite with Matter.js physics body
- **Slingshot Mechanics**: Drag to pull back and release to launch
- **Camera System**: Follows puck with smooth transitions and zoom effects during drag
- **Walls**: Pink obstacles with different bounce properties (some static, some with high restitution)
- **Out-of-Bounds System**: Automatic respawn when puck leaves the green track area
- **Respawn Animation**: Smooth fade out/fade in transitions for better visual feedback

### Build Configuration

- Development and production configs are in `/vite/`
- Production builds use Terser for minification
- Phaser is separated into its own chunk for better caching

## Tech Stack Rationale

**Phaser 3 + Matter.js** are well-suited for this project because:

- Matter.js provides robust 2D collision physics for wall bouncing without speed loss
- Phaser's camera system supports the required dynamic zoom based on speed
- Built-in SVG path utilities can be leveraged for track import
- Consistent game loop enables accurate ghost replay recording
- WebGL rendering ensures smooth performance for fast-paced racing

### Key Technical Challenges

1. **Acceleration Mechanics**: Implementing Quake3-style multipliers based on deceleration timing and movement angle
2. **SVG to Physics**: Converting imported SVG paths to Matter.js collision bodies
3. **Precise Timing**: Achieving 0.01s accuracy for competitive speedrunning

## Important Implementation Details

1. **Physics**: Matter.js engine with gravity disabled (`gravity: { x: 0, y: 0 }`)
2. **Drag System**: Custom drag implementation with visual feedback (drag line and trajectory preview)
3. **Camera**: Dynamic zoom and follow behavior based on drag state
4. **Asset Loading**: All game assets are loaded in the Preloader scene from `/public/assets/`
5. **World Boundaries**:
   - Default track uses Phaser's built-in world bounds (`setBounds: true`)
   - Imported tracks disable world bounds and use custom boundary bodies for proper collision detection
6. **Track System**: SVG track import system with automatic scaling and physics body generation

## Out-of-Bounds and Respawn System

The game features a sophisticated out-of-bounds detection and respawn system that provides smooth gameplay experience:

### Out-of-Bounds Detection

- **Green Zone (In-Bounds)**: Defined by the SVG track area (`#00FF00` color)
- **Red Zone (Out-of-Bounds)**: Any area outside the green track bounds
- **Detection**: Performed every frame using `isOutOfBounds()` utility function in `src/utils/game-logic.ts`

### Last Valid Position Tracking

- **Continuous Tracking**: Every frame when puck is in-bounds, position is stored as `lastValidPosition`
- **Memory**: Maintains the exact exit point where puck left the track
- **Priority**: Used as primary respawn location to prevent respawning in obstacle-filled areas

### Respawn Animation System

- **Total Duration**: 800ms (400ms fade out + 400ms fade in)
- **Fade Out**: Puck becomes transparent when out-of-bounds detected
- **Repositioning**: While invisible, puck is moved to respawn position
- **Fade In**: Puck becomes visible at new location
- **Control Lock**: Player input is disabled during entire animation (`isRespawning` flag)

### Respawn Position Priority

1. **Primary**: `lastValidPosition` - Where puck last exited track bounds
2. **Secondary**: `startPosition` - Blue start line from SVG track
3. **Fallback**: Center of track bounds (only if no start line exists)

### Technical Implementation

- **Game Logic**: `src/utils/game-logic.ts` - Core detection and position calculation functions
- **Animation**: Phaser tweens with `Power2.easeInOut` easing for smooth transitions
- **Input Handling**: All drag events check `!this.isRespawning` to prevent control during animation
- **Physics**: Velocity and angular velocity reset to zero on respawn

## Dynamic Camera System

The game features an advanced camera system that provides intuitive zoom behavior based on player actions and character movement:

### Sling-Based Zoom Out

- **Linear Scaling**: Zoom level scales linearly with sling extension length
- **Maximum Zoom Out**: Capped at minimum zoom level (0.4x) when sling reaches maximum length (300px)
- **No Zoom In During Drag**: Camera only zooms out while dragging, never zooms back in
- **Zoom Persistence**: Camera maintains maximum reached zoom during entire drag operation

### Speed-Based Zoom In

- **Post-Release Behavior**: After sling release, zoom is controlled by character speed
- **Maximum Zoom**: When character is stationary (velocity = 0), camera zooms to maximum (2.0x)
- **Linear Speed Scaling**: Zoom level inversely proportional to velocity magnitude
- **Real-Time Updates**: Camera continuously adjusts zoom based on current speed

### Camera Logic Functions

All camera behavior is implemented through pure, testable functions in `src/utils/camera-logic.ts`:

- **`calculateSlingZoom()`**: Computes zoom level based on sling extension
- **`calculateSpeedZoom()`**: Computes zoom level based on character velocity
- **`calculateSlingLength()`**: Calculates distance between two points
- **`calculateVelocityMagnitude()`**: Computes velocity magnitude from components
- **`shouldUpdateZoomDuringDrag()`**: Determines if zoom should update during drag

### Zoom Configuration

- **Minimum Zoom**: 0.4x (maximum zoom out)
- **Maximum Zoom**: 2.0x (maximum zoom in)
- **Default Zoom**: 1.0x (normal view)
- **Maximum Sling Length**: 300px
- **Maximum Expected Velocity**: 50 units/second

### Technical Implementation

- **State Tracking**: `currentZoom` and `maxReachedZoomDuringDrag` properties
- **Smooth Transitions**: Phaser camera tweens with easing for all zoom changes
- **Performance**: Zoom calculations performed only when needed (drag events, speed changes)
- **Error Handling**: Null checks for physics body and proper fallbacks

## SVG Track Format Conventions

Tracks are defined using SVG files with specific color codes for different elements:

### Color Codes

- **Track Area**: `#00FF00` (green) - Defines in-bounds playable area
- **Walls**: `#000000` (black) - Physical barriers that bounce the player
- **Start Line**: `#0000FF` (blue) - 10px wide line or rect
- **Finish Line**: `#FFD700` (gold) - 10px wide line or rect
- **Obstacles**: `#800080` (purple) - Solid elements within the track
- **Out-of-bounds**: `#FF0000` (red) or absence of track color - Respawn trigger areas

### Implementation Notes

- Track files location: `/public/assets/tracks/track_[name].svg`
- Elements can use `id` attributes for parsing: `track-area`, `start-line`, `finish-line`, etc.
- Layer order (bottom to top): Background → Track → Walls → Obstacles → Start/Finish lines
- Out-of-bounds behavior: Player respawns at exit point with zero velocity
- **World Size Control**: Use `data-size="8000"` attribute on root `<svg>` element to define target world size in pixels (creates 8000x8000 square world). Without this attribute, tracks scale to 90% of screen size.

## File References

- Entry point: `src/main.ts:1`
- Main game logic: `src/scenes/Game.ts:1`
- Menu with SVG import: `src/scenes/MainMenu.ts:1`
- Vite configs: `vite/config.dev.mjs:1` and `vite/config.prod.mjs:1`
