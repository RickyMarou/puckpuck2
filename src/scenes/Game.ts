import { Scene, Physics } from "phaser";

export class Game extends Scene {
  camera: Phaser.Cameras.Scene2D.Camera;
  background: Phaser.GameObjects.Image;
  puck: Physics.Matter.Sprite;
  msg_text: Phaser.GameObjects.Text;
  sling: Phaser.GameObjects.Graphics;
  isDragging: boolean;
  startX: number;
  startY: number;
  diffX: number;
  diffY: number;

  constructor() {
    super("Game");
  }

  create() {
    this.camera = this.cameras.main;

    this.puck = this.matter.add.sprite(512, 384, "pinkstar", 0);
    this.puck.setCircle(16);
    this.puck.setBounce(0.8);
    this.puck.anims.play("idle");
    this.puck.setFrictionAir(0.05);
    this.puck.setInteractive();
    this.input.setDraggable(this.puck);

    this.camera.startFollow(this.puck);

    this.sling = this.add.graphics({
      lineStyle: { width: 4, color: 0xff0000 },
    });

    this.input.on("dragstart", (_, gameObject: any) => {
      console.log("dragstart", gameObject);
      if (gameObject === this.puck) {
        this.isDragging = true;
        this.startX = gameObject.x;
        this.startY = gameObject.y;
        console.log("dragstart", gameObject.x, gameObject.y);
      }
    });

    this.input.on("drag", (pointer, gameObject, dragX, dragY) => {
      if (gameObject === this.puck && this.isDragging) {
        this.diffX = this.startX - dragX;
        this.diffY = this.startY - dragY;
        this.camera.zoomTo(0.6, 800, Phaser.Math.Easing.Cubic.InOut, true);
      }
    });

    this.input.on("dragend", (_, gameObject: any) => {
      if (gameObject === this.puck) {
        this.sling.clear();
        this.isDragging = false;
        let velocityX = this.diffX * 0.1;
        let velocityY = this.diffY * 0.1;
        this.puck.setVelocity(velocityX, velocityY);
        console.log("dragend");
        this.camera.zoomTo(1, 400, Phaser.Math.Easing.Cubic.Out, true);
      }
    });

    this.matter.add
      .image(300, 568, "pinkwall")
      .setScale(500, 32)
      .setStatic(true)
      .setBounce(2)
      .setAngle(20);

    this.matter.add
      .image(800, 690, "pinkwall")
      .setScale(500, 32)
      .setBounce(0.1)
      .setStatic(true);
  }

  update() {
    if (this.isDragging) {
      this.sling.clear();
      this.sling.lineBetween(
        Math.round(this.puck.x),
        Math.round(this.puck.y),
        Math.round(this.camera.scrollX + this.input.activePointer.x),
        Math.round(this.camera.scrollY + this.input.activePointer.y)
      );
    }
  }
}
