class GardenScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GardenScene' });
        this.player = null;
        this.otherPlayers = new Map();
        this.cursors = null;
        this.currentUserId = null;
        this.onPositionUpdate = null;
    }

    init(data) {
        this.currentUserId = data.userId;
        this.onPositionUpdate = data.onPositionUpdate;
    }

    create() {
        // 背景（庭の緑）
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x90EE90).setOrigin(0, 0);

        // 池
        this.add.ellipse(this.scale.width / 2, this.scale.height / 2, 200, 150, 0x4682B4);

        // 木々
        this.add.circle(100, 100, 40, 0x228B22);
        this.add.circle(this.scale.width - 100, 100, 40, 0x228B22);
        this.add.circle(100, this.scale.height - 100, 40, 0x228B22);
        this.add.circle(this.scale.width - 100, this.scale.height - 100, 40, 0x228B22);

        // 花壇
        this.add.rectangle(this.scale.width / 2, 100, 150, 60, 0xFF69B4);

        // プレイヤー（サイズ4倍）
        this.player = this.add.rectangle(
            this.scale.width / 2,
            this.scale.height - 100,
            64,
            64,
            0x4CAF50
        );

        // キーボード入力
        this.cursors = this.input.keyboard.createCursorKeys();

        // クリック/タップで移動
        this.input.on('pointerdown', (pointer) => {
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

    updateOtherPlayers(users) {
        // 既存のプレイヤーをクリア
        this.otherPlayers.forEach((playerData) => {
            if (playerData.sprite) playerData.sprite.destroy();
            if (playerData.nameText) playerData.nameText.destroy();
        });
        this.otherPlayers.clear();

        // 他のプレイヤーを表示
        users.forEach((user) => {
            if (user.id !== this.currentUserId && user.location === 'garden' && user.x && user.y) {
                const otherPlayer = this.add.rectangle(user.x, user.y, 64, 64, 0xFF5722);
                const nameText = this.add.text(user.x, user.y - 40, user.characterName, {
                    fontSize: '12px',
                    color: '#000000',
                    backgroundColor: '#ffffff',
                    padding: { x: 4, y: 2 }
                }).setOrigin(0.5);

                this.otherPlayers.set(user.id, {
                    sprite: otherPlayer,
                    nameText: nameText
                });
            }
        });
    }
}
