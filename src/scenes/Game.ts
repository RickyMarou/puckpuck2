import { Scene, Physics } from "phaser";

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;
  puck: Physics.Arcade.Sprite;
  msg_text: Phaser.GameObjects.Text;

  constructor() {
    super("Game");
  }

  create() {
    console.log("physics", this.physics);
    this.camera = this.cameras.main;
    this.puck = this.physics.add.sprite(512, 384, "pinkstar");
    this.puck.anims.play("idle");
  }
}
