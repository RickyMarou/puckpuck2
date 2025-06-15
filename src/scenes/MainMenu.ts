import { Scene, GameObjects } from "phaser";

export class MainMenu extends Scene {
  background: GameObjects.Image;
  logo: GameObjects.Image;
  title: GameObjects.Text;
  private fileInput: HTMLInputElement;

  constructor() {
    super("MainMenu");
  }

  create() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    this.title = this.add
      .text(centerX, centerY - 150, "PuckPuck2", {
        fontFamily: "Arial Black",
        fontSize: 48,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 8,
        align: "center",
      })
      .setOrigin(0.5);

    const playButton = this.add
      .text(centerX, centerY, "Play Game", {
        fontFamily: "Arial Black",
        fontSize: 32,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 6,
        align: "center",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => playButton.setColor("#ffff00"))
      .on("pointerout", () => playButton.setColor("#ffffff"))
      .on("pointerdown", () => {
        this.loadDefaultTrack();
      });

    const importButton = this.add
      .text(centerX, centerY + 80, "Import SVG Track", {
        fontFamily: "Arial Black",
        fontSize: 32,
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 6,
        align: "center",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => importButton.setColor("#ffff00"))
      .on("pointerout", () => importButton.setColor("#ffffff"))
      .on("pointerdown", () => {
        this.openFileDialog();
      });

    this.createFileInput();
  }

  private createFileInput() {
    this.fileInput = document.createElement("input");
    this.fileInput.type = "file";
    this.fileInput.accept = ".svg";
    this.fileInput.style.display = "none";

    this.fileInput.addEventListener("change", (event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];

      if (file && file.type === "image/svg+xml") {
        this.handleSVGFile(file);
      }
    });

    document.body.appendChild(this.fileInput);
  }

  private openFileDialog() {
    this.fileInput.click();
  }

  private async handleSVGFile(file: File) {
    try {
      const { importTrackFromFile, createGameConfig, validateTrackData } =
        await import("../utils/track-importer");

      const gameConfig = createGameConfig(this);
      const importedTrack = await importTrackFromFile(file, gameConfig);

      const validation = validateTrackData(importedTrack);

      if (!validation.isValid) {
        console.error("Track validation failed:", validation.errors);
        this.showMessage(
          `Track invalid: ${validation.errors.join(", ")}`,
          "#ff0000",
        );
        return;
      }

      if (validation.warnings.length > 0) {
        console.warn("Track warnings:", validation.warnings);
      }

      console.log("Track imported successfully:", importedTrack);

      // Store the imported track data for launching the game
      this.registry.set("importedTrack", importedTrack);

      // Show success message with option to play
      this.showMessage(`Track loaded: ${file.name}`, "#00ff00");
      this.showPlayImportedTrackButton();
    } catch (error) {
      console.error("Error importing SVG track:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.showMessage(`Import failed: ${errorMessage}`, "#ff0000");
    }
  }

  private showMessage(text: string, color: string) {
    const messageText = this.add
      .text(this.cameras.main.width / 2, this.cameras.main.height - 100, text, {
        fontFamily: "Arial",
        fontSize: 18,
        color: color,
        stroke: "#000000",
        strokeThickness: 3,
        align: "center",
        wordWrap: { width: 600 },
      })
      .setOrigin(0.5);

    // Remove message after 5 seconds
    this.time.delayedCall(5000, () => {
      messageText.destroy();
    });
  }

  private async loadDefaultTrack() {
    try {
      const response = await fetch("assets/tracks/track_straight_test.svg");
      if (!response.ok) {
        throw new Error(`Failed to load default track: ${response.statusText}`);
      }

      const svgText = await response.text();

      const { importTrack, createGameConfig, validateTrackData } = await import(
        "../utils/track-importer"
      );

      const gameConfig = createGameConfig(this);
      const importedTrack = await importTrack(svgText, gameConfig);

      const validation = validateTrackData(importedTrack);

      if (!validation.isValid) {
        console.error("Default track validation failed:", validation.errors);
        this.showMessage(
          `Default track invalid: ${validation.errors.join(", ")}`,
          "#ff0000",
        );
        return;
      }

      if (validation.warnings.length > 0) {
        console.warn("Default track warnings:", validation.warnings);
      }

      console.log("Default track loaded successfully:", importedTrack);

      // Store the track data for launching the game
      this.registry.set("importedTrack", importedTrack);

      // Start the game immediately
      this.scene.start("Game");
    } catch (error) {
      console.error("Error loading default track:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.showMessage(
        `Failed to load default track: ${errorMessage}`,
        "#ff0000",
      );
    }
  }

  private showPlayImportedTrackButton() {
    // Remove existing button if any
    const existingButton = this.children.getByName("playImportedButton");
    if (existingButton) {
      existingButton.destroy();
    }

    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    const playImportedButton = this.add
      .text(centerX, centerY + 160, "Play Imported Track", {
        fontFamily: "Arial Black",
        fontSize: 28,
        color: "#00ff00",
        stroke: "#000000",
        strokeThickness: 5,
        align: "center",
      })
      .setOrigin(0.5)
      .setName("playImportedButton")
      .setInteractive({ useHandCursor: true })
      .on("pointerover", () => playImportedButton.setColor("#ffff00"))
      .on("pointerout", () => playImportedButton.setColor("#00ff00"))
      .on("pointerdown", () => {
        this.scene.start("Game");
      });
  }
}
