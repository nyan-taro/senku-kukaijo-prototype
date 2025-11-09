import Phaser from 'phaser';
import { User } from '../types';

export class ClassroomScene extends Phaser.Scene {
  private player?: Phaser.GameObjects.Rectangle;
  private otherPlayers: Map<string, Phaser.GameObjects.Rectangle> = new Map();
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private currentUserId?: string;
  private onPositionUpdate?: (x: number, y: number) => void;
  private blackboard?: Phaser.GameObjects.Rectangle;
  private blackboardText?: Phaser.GameObjects.Text;
  private desks: Phaser.GameObjects.Rectangle[] = [];
  private podium?: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: 'ClassroomScene' });
  }

  init(data: {
    userId: string;
    onPositionUpdate: (x: number, y: number) => void;
  }) {
    this.currentUserId = data.userId;
    this.onPositionUpdate = data.onPositionUpdate;
  }

  create() {
    // 背景
    this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0xf5e6d3).setOrigin(0, 0);

    // 黒板（横長に拡大）
    this.blackboard = this.add.rectangle(
      this.scale.width / 2,
      80,
      480,  // 横幅を大きく
      120,
      0x2d5016
    );
    this.blackboardText = this.add.text(
      this.scale.width / 2,
      80,
      '',
      {
        fontSize: '24px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: 440 }
      }
    ).setOrigin(0.5);

    // 教壇（サイズ4倍）
    this.podium = this.add.rectangle(
      this.scale.width / 2,
      180,
      160,  // 4倍
      80,   // 4倍
      0x8b4513
    );

    // 机を配置（サイズ4倍）
    const deskWidth = 80;  // 4倍
    const deskHeight = 60; // 4倍
    const rows = 3;
    const cols = 4;
    const startX = 100;
    const startY = 280;
    const gapX = 140;
    const gapY = 120;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const desk = this.add.rectangle(
          startX + col * gapX,
          startY + row * gapY,
          deskWidth,
          deskHeight,
          0x654321
        );
        this.desks.push(desk);
      }
    }

    // プレイヤー（サイズ4倍）
    this.player = this.add.rectangle(
      this.scale.width / 2,
      this.scale.height - 100,
      64,  // 4倍
      64,  // 4倍
      0x4CAF50
    );

    // キーボード入力
    this.cursors = this.input.keyboard?.createCursorKeys();

    // クリック/タップで移動
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.player) {
        this.tweens.add({
          targets: this.player,
          x: pointer.x,
          y: pointer.y,
          duration: 500,
          ease: 'Power2',
          onUpdate: () => {
            if (this.player && this.onPositionUpdate) {
              this.onPositionUpdate(this.player.x, this.player.y);
            }
          }
        });
      }
    });
  }

  update() {
    if (!this.player || !this.cursors) return;

    const speed = 5;
    let moved = false;

    if (this.cursors.left.isDown) {
      this.player.x -= speed;
      moved = true;
    } else if (this.cursors.right.isDown) {
      this.player.x += speed;
      moved = true;
    }

    if (this.cursors.up.isDown) {
      this.player.y -= speed;
      moved = true;
    } else if (this.cursors.down.isDown) {
      this.player.y += speed;
      moved = true;
    }

    if (moved && this.onPositionUpdate) {
      this.onPositionUpdate(this.player.x, this.player.y);
    }

    // 画面外に出ないように
    this.player.x = Phaser.Math.Clamp(this.player.x, 32, this.scale.width - 32);
    this.player.y = Phaser.Math.Clamp(this.player.y, 32, this.scale.height - 32);
  }

  updateOtherPlayers(users: User[]) {
    // 既存のプレイヤーをクリア
    this.otherPlayers.forEach((player) => player.destroy());
    this.otherPlayers.clear();

    // 他のプレイヤーを表示
    users.forEach((user) => {
      if (user.id !== this.currentUserId && user.location === 'classroom' && user.x && user.y) {
        const otherPlayer = this.add.rectangle(user.x, user.y, 64, 64, 0xFF5722);
        const nameText = this.add.text(user.x, user.y - 40, user.characterName, {
          fontSize: '12px',
          color: '#000000',
          backgroundColor: '#ffffff',
          padding: { x: 4, y: 2 }
        }).setOrigin(0.5);

        this.otherPlayers.set(user.id, otherPlayer);
      }
    });
  }

  displayHaiku(content: string) {
    if (this.blackboardText) {
      this.blackboardText.setText(content);
    }
  }

  clearBlackboard() {
    if (this.blackboardText) {
      this.blackboardText.setText('');
    }
  }
}
