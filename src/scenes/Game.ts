import { Scene, Physics } from "phaser";
import { ImportedTrack } from "../utils/track-types";
import { addTrackToScene } from "../utils/track-importer";
import { calculateWorldBounds } from "../utils/track-transformer";
import { isOutOfBounds, getDefaultRespawnPosition } from "../utils/game-logic";

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
          "pinkstar",
          0,
        );
      } else {
        // Default to track center
        const centerX = track.bounds.x + track.bounds.width / 2;
        const centerY = track.bounds.y + track.bounds.height / 2;
        this.puck = this.matter.add.sprite(centerX, centerY, "pinkstar", 0);
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
    }

    this.puck.setCircle(16);
    this.puck.setBounce(0.8);
    this.puck.anims.play("idle");
    this.puck.setFrictionAir(0.05);
    this.puck.setInteractive();
    this.input.setDraggable(this.puck);
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
        if (gameObject === this.puck) {
          this.isDragging = true;
          this.startX = (gameObject as any).x;
          this.startY = (gameObject as any).y;
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
        if (gameObject === this.puck && this.isDragging) {
          this.diffX = this.startX - dragX;
          this.diffY = this.startY - dragY;
          this.camera.zoomTo(0.6, 800, Phaser.Math.Easing.Cubic.InOut, true);
        }
      },
    );

    this.input.on(
      "dragend",
      (
        _pointer: Phaser.Input.Pointer,
        gameObject: Phaser.GameObjects.GameObject,
      ) => {
        if (gameObject === this.puck) {
          this.sling.clear();
          this.isDragging = false;
          const velocityX = this.diffX * 0.1;
          const velocityY = this.diffY * 0.1;
          this.puck.setVelocity(velocityX, velocityY);
          this.camera.zoomTo(1, 400, Phaser.Math.Easing.Cubic.Out, true);
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
        const zoomSpeed = 0.1;
        const minZoom = 0.3;
        const maxZoom = 3.0;

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
          200,
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

  private respawnPuck() {
    if (!this.currentTrack || !this.puck) return;

    // Determine respawn position
    let respawnX: number;
    let respawnY: number;

    if (this.currentTrack.startPosition) {
      // Respawn at start position if available
      respawnX = this.currentTrack.startPosition.x;
      respawnY = this.currentTrack.startPosition.y;
    } else {
      // Otherwise respawn at center of track bounds
      const defaultPos = getDefaultRespawnPosition(this.currentTrack.bounds);
      respawnX = defaultPos.x;
      respawnY = defaultPos.y;
    }

    // Set position and zero velocity
    this.puck.setPosition(respawnX, respawnY);
    this.puck.setVelocity(0, 0);

    // Clear any angular velocity as well
    this.puck.setAngularVelocity(0);

    // Clear slingshot graphics if dragging
    if (this.isDragging) {
      this.isDragging = false;
      this.sling.clear();
    }
  }

  update() {
    // Update FPS counter
    if (this.fpsText) {
      const fps = Math.round(this.game.loop.actualFps);
      this.fpsText.setText(`FPS: ${fps}`);
    }

    // Check if puck is out of bounds
    if (this.currentTrack && this.puck) {
      const puckPosition = { x: this.puck.x, y: this.puck.y };

      if (isOutOfBounds(puckPosition, this.currentTrack.bounds)) {
        // Respawn the puck
        this.respawnPuck();
      }
    }

    if (this.isDragging) {
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
