import { Scene, Physics } from "phaser";
import { ImportedTrack } from "../utils/track-types";
import { addTrackToScene } from "../utils/track-importer";
import { calculateWorldBounds } from "../utils/track-transformer";
import {
  isOutOfBounds,
  getRespawnPosition,
  isControlAllowed,
  isDragAllowed,
} from "../utils/game-logic";
import {
  calculateSlingZoom,
  calculateSpeedZoom,
  calculateSlingLength,
  calculateVelocityMagnitude,
  shouldUpdateZoomDuringDrag,
  getZoomConfig,
} from "../utils/camera-logic";
import {
  CAMERA_ZOOM,
  SLINGSHOT,
  PHYSICS,
  MOUSE,
  TIMING,
  DERIVED,
} from "../utils/balance";

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;
  puck: Physics.Matter.Sprite;
  msg_text: Phaser.GameObjects.Text;
  sling: Phaser.GameObjects.Graphics;
  fpsText: Phaser.GameObjects.Text;
  isDragging: boolean;
  startX: number;
  startY: number;
  diffX: number;
  diffY: number;
  currentTrack: ImportedTrack | null = null;
  lastValidPosition: { x: number; y: number } | null = null;
  isRespawning: boolean = false;
  currentZoom: number = CAMERA_ZOOM.DEFAULT;
  maxReachedZoomDuringDrag: number = CAMERA_ZOOM.DEFAULT;

  constructor() {
    super("Game");
  }

  create() {
    this.camera = this.cameras.main;

    // Check if we have an imported track
    const importedTrack = this.registry.get("importedTrack") as
      | ImportedTrack
      | undefined;

    if (!importedTrack) {
      this.showErrorMessage(
        "No SVG track provided.\nPlease import an SVG track file.",
      );
      return;
    }

    try {
      this.setupImportedTrack(importedTrack);
      this.setupPuck();
      this.setupCamera();
      this.setupSlingshot();
      this.setupInput();
      this.setupFPS();
    } catch (error) {
      console.error("Failed to setup game:", error);
      this.showErrorMessage(
        `Failed to load track:\n${error}\n\nPlease try importing a different SVG file.`,
      );
    }
  }

  private setupImportedTrack(track: ImportedTrack) {
    this.currentTrack = track;

    try {
      // Calculate world bounds to be slightly larger than track size
      const worldBounds = calculateWorldBounds(track.bounds, 100);

      // Disable Matter.js built-in world bounds since we use custom boundaries
      // Note: Calling without parameters or with specific values, not false
      // this.matter.world.setBounds(); // This might use defaults

      // Instead, we'll let our custom boundaries handle collisions

      addTrackToScene(track, this);

      // Set camera bounds to match world bounds
      this.cameras.main.setBounds(
        worldBounds.x,
        worldBounds.y,
        worldBounds.width,
        worldBounds.height,
      );

      // Position puck at start line if available
      if (track.startPosition) {
        this.puck = this.matter.add.sprite(
          track.startPosition.x,
          track.startPosition.y,
          "star",
          0,
        );
        this.lastValidPosition = {
          x: track.startPosition.x,
          y: track.startPosition.y,
        };
      } else {
        // Default to track center
        const centerX = track.bounds.x + track.bounds.width / 2;
        const centerY = track.bounds.y + track.bounds.height / 2;
        this.puck = this.matter.add.sprite(centerX, centerY, "star", 0);
        this.lastValidPosition = { x: centerX, y: centerY };
      }

      console.log("Imported track loaded successfully");
    } catch (error) {
      console.error("Failed to load imported track:", error);
      // Re-throw to be caught by create() method
      throw error;
    }
  }

  private setupPuck() {
    if (!this.puck) {
      this.puck = this.matter.add.sprite(512, 384, "pinkstar", 0);
      // Initialize lastValidPosition if not already set
      if (!this.lastValidPosition) {
        this.lastValidPosition = { x: 512, y: 384 };
      }
    }

    this.puck.setScale(1.5); // Increase visual size by 50%
    this.puck.setCircle(24); // Increase physics radius by 50% (16 * 1.5 = 24)
    this.puck.setBounce(PHYSICS.BOUNCE);
    this.puck.anims.play("idle");
    this.puck.setFrictionAir(PHYSICS.AIR_FRICTION);
    this.puck.setInteractive();
    this.input.setDraggable(this.puck);
    this.puck.setAlpha(1); // Ensure puck starts fully visible
  }

  private setupCamera() {
    this.camera.startFollow(this.puck);
  }

  private setupSlingshot() {
    this.sling = this.add.graphics({
      lineStyle: { width: 4, color: 0xff0000 },
    });
  }

  private setupInput() {
    this.input.on(
      "dragstart",
      (
        _pointer: Phaser.Input.Pointer,
        gameObject: Phaser.GameObjects.GameObject,
      ) => {
        if (
          isControlAllowed(gameObject, this.puck, {
            isRespawning: this.isRespawning,
          })
        ) {
          this.isDragging = true;
          this.startX = (gameObject as Phaser.Physics.Matter.Sprite).x;
          this.startY = (gameObject as Phaser.Physics.Matter.Sprite).y;
          // Reset max zoom tracking for new drag
          this.maxReachedZoomDuringDrag = this.currentZoom;
        }
      },
    );

    this.input.on(
      "drag",
      (
        _pointer: Phaser.Input.Pointer,
        gameObject: Phaser.GameObjects.GameObject,
        dragX: number,
        dragY: number,
      ) => {
        if (
          isDragAllowed(gameObject, this.puck, {
            isRespawning: this.isRespawning,
            isDragging: this.isDragging,
          })
        ) {
          this.diffX = this.startX - dragX;
          this.diffY = this.startY - dragY;

          // Calculate sling-based zoom
          this.updateCameraZoomForSling();
        }
      },
    );

    this.input.on(
      "dragend",
      (
        _pointer: Phaser.Input.Pointer,
        gameObject: Phaser.GameObjects.GameObject,
      ) => {
        if (
          isControlAllowed(gameObject, this.puck, {
            isRespawning: this.isRespawning,
          })
        ) {
          this.sling.clear();
          this.isDragging = false;
          const velocityX = this.diffX * SLINGSHOT.VELOCITY_MULTIPLIER;
          const velocityY = this.diffY * SLINGSHOT.VELOCITY_MULTIPLIER;
          this.puck.setVelocity(velocityX, velocityY);

          // Start speed-based zoom after release
          this.startSpeedBasedZoom();
        }
      },
    );

    // Mouse wheel zoom functionality
    this.input.on(
      "wheel",
      (
        _pointer: Phaser.Input.Pointer,
        _gameObjects: Phaser.GameObjects.GameObject[],
        _deltaX: number,
        deltaY: number,
        _deltaZ: number,
      ) => {
        const currentZoom = this.camera.zoom;
        const zoomSpeed = MOUSE.ZOOM_SPEED;
        const minZoom = CAMERA_ZOOM.MIN;
        const maxZoom = CAMERA_ZOOM.MAX;

        let newZoom: number;
        if (deltaY > 0) {
          // Zoom out
          newZoom = Math.max(minZoom, currentZoom - zoomSpeed);
        } else {
          // Zoom in
          newZoom = Math.min(maxZoom, currentZoom + zoomSpeed);
        }

        // Apply zoom with smooth transition
        this.camera.zoomTo(
          newZoom,
          TIMING.MOUSE_ZOOM_DURATION,
          Phaser.Math.Easing.Quadratic.Out,
          true,
        );
      },
    );
  }

  private setupFPS() {
    // Create FPS counter text
    this.fpsText = this.add.text(10, 10, "FPS: 60", {
      fontSize: "16px",
      color: "#00ff00",
      fontFamily: "Arial, monospace",
      backgroundColor: "#000000",
      padding: { x: 8, y: 4 },
    });

    // Keep FPS counter fixed to camera
    this.fpsText.setScrollFactor(0);
    this.fpsText.setDepth(1000); // High depth to stay on top
  }

  private updateCameraZoomForSling() {
    const slingLength = calculateSlingLength(
      this.startX,
      this.startY,
      this.puck.x,
      this.puck.y,
    );

    const zoomConfig = getZoomConfig();

    const slingData = {
      length: slingLength,
      maxLength: SLINGSHOT.MAX_LENGTH,
    };

    const targetZoom = calculateSlingZoom(slingData, zoomConfig);

    // Only zoom out during drag, never zoom in
    if (shouldUpdateZoomDuringDrag(this.currentZoom, targetZoom)) {
      this.currentZoom = targetZoom;
      this.maxReachedZoomDuringDrag = Math.min(
        this.maxReachedZoomDuringDrag,
        targetZoom,
      );
      this.camera.zoomTo(
        targetZoom,
        TIMING.SLING_ZOOM_DURATION,
        Phaser.Math.Easing.Cubic.InOut,
        true,
      );
    }
  }

  private startSpeedBasedZoom() {
    // Start monitoring speed for zoom adjustments
    this.updateSpeedBasedZoom();
  }

  private updateSpeedBasedZoom() {
    if (this.isDragging || this.isRespawning || !this.puck || !this.puck.body)
      return;

    const velocityMagnitude = calculateVelocityMagnitude(
      this.puck.body.velocity.x,
      this.puck.body.velocity.y,
    );

    const zoomConfig = getZoomConfig();

    const speedData = {
      velocity: velocityMagnitude,
      maxVelocity: PHYSICS.MAX_VELOCITY,
    };

    const targetZoom = calculateSpeedZoom(speedData, zoomConfig);

    // Update current zoom and apply
    this.currentZoom = targetZoom;
    this.camera.zoomTo(
      targetZoom,
      TIMING.SPEED_ZOOM_DURATION,
      Phaser.Math.Easing.Cubic.Out,
      true,
    );
  }

  private startRespawnAnimation() {
    if (!this.currentTrack || !this.puck || this.isRespawning) return;

    this.isRespawning = true;

    // Stop the puck immediately
    this.puck.setVelocity(0, 0);
    this.puck.setAngularVelocity(0);

    // Clear slingshot graphics if dragging
    if (this.isDragging) {
      this.isDragging = false;
      this.sling.clear();
    }

    // Fade out animation
    this.tweens.add({
      targets: this.puck,
      alpha: 0,
      duration: DERIVED.RESPAWN_FADE_DURATION,
      ease: "Power2.easeInOut",
      onComplete: () => {
        this.repositionAndFadeIn();
      },
    });
  }

  private repositionAndFadeIn() {
    if (!this.currentTrack || !this.puck) return;

    // Determine respawn position using priority order
    const respawnPos = getRespawnPosition(
      this.lastValidPosition,
      this.currentTrack.startPosition,
      this.currentTrack.bounds,
    );

    // Set new position while invisible
    this.puck.setPosition(respawnPos.x, respawnPos.y);
    this.puck.setVelocity(0, 0);
    this.puck.setAngularVelocity(0);

    // Fade in animation
    this.tweens.add({
      targets: this.puck,
      alpha: 1,
      duration: DERIVED.RESPAWN_FADE_DURATION,
      ease: "Power2.easeInOut",
      onComplete: () => {
        this.isRespawning = false;
      },
    });
  }

  update() {
    // Update FPS counter
    if (this.fpsText) {
      const fps = Math.round(this.game.loop.actualFps);
      this.fpsText.setText(`FPS: ${fps}`);
    }

    // Check if puck is out of bounds and update last valid position
    if (this.currentTrack && this.puck && !this.isRespawning) {
      const puckPosition = { x: this.puck.x, y: this.puck.y };

      if (isOutOfBounds(puckPosition, this.currentTrack.bounds)) {
        // Start respawn animation
        this.startRespawnAnimation();
      } else {
        // Update last valid position when puck is in bounds
        this.lastValidPosition = { x: puckPosition.x, y: puckPosition.y };
      }
    }

    // Update speed-based zoom when not dragging
    if (!this.isDragging && !this.isRespawning) {
      this.updateSpeedBasedZoom();
    }

    if (
      isDragAllowed(this.puck, this.puck, {
        isRespawning: this.isRespawning,
        isDragging: this.isDragging,
      })
    ) {
      this.sling.clear();
      this.sling.lineBetween(
        Math.round(this.puck.x),
        Math.round(this.puck.y),
        Math.round(this.camera.scrollX + this.input.activePointer.x),
        Math.round(this.camera.scrollY + this.input.activePointer.y),
      );
    }
  }

  private showErrorMessage(message: string) {
    // Create a dark overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
    overlay.setScrollFactor(0); // Keep overlay fixed to camera

    // Create error message text
    const errorText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY - 50,
      message,
      {
        fontSize: "24px",
        color: "#ff4444",
        align: "center",
        fontFamily: "Arial",
        stroke: "#000000",
        strokeThickness: 2,
      },
    );
    errorText.setOrigin(0.5);
    errorText.setScrollFactor(0);

    // Create "Back to Menu" button
    const buttonText = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY + 100,
      "Back to Menu",
      {
        fontSize: "20px",
        color: "#ffffff",
        backgroundColor: "#4444ff",
        padding: { x: 20, y: 10 },
        align: "center",
        fontFamily: "Arial",
      },
    );
    buttonText.setOrigin(0.5);
    buttonText.setScrollFactor(0);
    buttonText.setInteractive({ useHandCursor: true });

    // Add button hover effects
    buttonText.on("pointerover", () => {
      buttonText.setStyle({ backgroundColor: "#6666ff" });
    });

    buttonText.on("pointerout", () => {
      buttonText.setStyle({ backgroundColor: "#4444ff" });
    });

    // Handle button click
    buttonText.on("pointerdown", () => {
      this.scene.start("MainMenu");
    });
  }
}
