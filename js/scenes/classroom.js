class ClassroomScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ClassroomScene' });
        this.player = null;
        this.playerSprite = null;
        this.playerBubble = null;
        this.otherPlayers = new Map();
        this.cursors = null;
        this.currentUserId = null;
        this.currentGender = null;
        this.currentNickname = null;
        this.onPositionUpdate = null;
        this.blackboard = null;
        this.blackboardText = null;
        this.desks = [];
        this.podium = null;
        this.exitDoor = null;
        this.walkFrame = 0;
        this.walkTimer = 0;
    }

    init(data) {
        this.currentUserId = data.userId;
        this.currentGender = data.gender || 'male';
        this.currentNickname = data.nickname || 'Player';
        this.onPositionUpdate = data.onPositionUpdate;
    }

    create() {
        // 背景
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0xf5e6d3).setOrigin(0, 0);

        // 黒板（横長に拡大）
        this.blackboard = this.add.rectangle(
            this.scale.width / 2,
            80,
            480,
            120,
            0x2d5016
        );
        this.blackboardText = this.add.text(
            this.scale.width / 2,
            80,
            '',
            {
                fontSize: '20px',
                color: '#ffffff',
                align: 'center',
                wordWrap: { width: 440 }
            }
        ).setOrigin(0.5);

        // 教壇（ドット絵）
        this.podium = createPodium(this, this.scale.width / 2, 180);

        // 机を配置（ドット絵）
        const rows = 3;
        const cols = 4;
        const startX = 100;
        const startY = 280;
        const gapX = 140;
        const gapY = 120;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const desk = createDesk(
                    this,
                    startX + col * gapX,
                    startY + row * gapY
                );
                this.desks.push(desk);
            }
        }

        // 出口ドア（下部中央）
        const doorX = this.scale.width / 2;
        const doorY = this.scale.height - 10;
        const doorWidth = 60;
        const doorHeight = 30;

        // ドア本体
        this.exitDoor = this.add.rectangle(doorX, doorY, doorWidth, doorHeight, 0x654321);
        this.exitDoor.setOrigin(0.5, 1);

        // ドアラベル
        this.add.text(doorX, doorY - doorHeight / 2, '出口', {
            fontSize: '12px',
            color: '#ffffff',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        // プレイヤー作成（ドット絵）
        this.createPlayer(this.scale.width / 2, this.scale.height - 150);

        // キーボード入力
        this.cursors = this.input.keyboard.createCursorKeys();

        // クリック/タップで移動
        this.input.on('pointerdown', (pointer) => {
            if (this.player) {
                this.movePlayerTo(pointer.x, pointer.y);
            }
        });
    }

    createPlayer(x, y) {
        // プレイヤーキャラクター
        switch (this.currentGender) {
            case 'human':
                this.playerSprite = createHumanSprite(this, x, y, 0);
                break;
            case 'cat':
                this.playerSprite = createCatSprite(this, x, y, 0);
                break;
            case 'dog':
                this.playerSprite = createDogSprite(this, x, y, 0);
                break;
            case 'rabbit':
                this.playerSprite = createRabbitSprite(this, x, y, 0);
                break;
            case 'lion':
                this.playerSprite = createLionSprite(this, x, y, 0);
                break;
            case 'elephant':
                this.playerSprite = createElephantSprite(this, x, y, 0);
                break;
            case 'panda':
                this.playerSprite = createPandaSprite(this, x, y, 0);
                break;
            case 'sparrow':
                this.playerSprite = createSparrowSprite(this, x, y, 0);
                break;
            default:
                this.playerSprite = createHumanSprite(this, x, y, 0);
        }

        // 当たり判定用の透明な矩形
        this.player = this.add.rectangle(x, y, 64, 64, 0x000000, 0);

        // ニックネーム吹き出し
        this.playerBubble = createSpeechBubble(this, x, y - 40, this.currentNickname);
    }

    movePlayerTo(targetX, targetY) {
        const duration = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            targetX, targetY
        ) * 2;

        this.tweens.add({
            targets: this.player,
            x: targetX,
            y: targetY,
            duration: duration,
            ease: 'Linear',
            onUpdate: () => {
                if (this.player && this.onPositionUpdate) {
                    this.onPositionUpdate(this.player.x, this.player.y);
                }
                // スプライトと吹き出しも追従
                if (this.playerSprite) {
                    this.playerSprite.setPosition(this.player.x - 32, this.player.y - 32);
                }
                if (this.playerBubble) {
                    this.playerBubble.setPosition(this.player.x, this.player.y - 40);
                }
            }
        });
    }

    update(time, delta) {
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

        if (moved) {
            // 歩行アニメーション
            this.walkTimer += delta;
            if (this.walkTimer > 200) {
                this.walkTimer = 0;
                this.walkFrame = (this.walkFrame + 1) % 2;
                this.updatePlayerSprite();
            }

            if (this.onPositionUpdate) {
                this.onPositionUpdate(this.player.x, this.player.y);
            }

            // 出口ドアの判定
            this.checkExitDoorCollision();
        }

        // 画面外に出ないように
        this.player.x = Phaser.Math.Clamp(this.player.x, 32, this.scale.width - 32);
        this.player.y = Phaser.Math.Clamp(this.player.y, 32, this.scale.height - 32);

        // スプライトと吹き出しを追従
        if (this.playerSprite) {
            this.playerSprite.setPosition(this.player.x - 32, this.player.y - 32);
        }
        if (this.playerBubble) {
            this.playerBubble.setPosition(this.player.x, this.player.y - 40);
        }
    }

    checkExitDoorCollision() {
        const px = this.player.x;
        const py = this.player.y;
        const doorX = this.scale.width / 2;
        const doorY = this.scale.height - 10;
        const doorWidth = 60;
        const doorHeight = 30;

        // ドアの当たり判定
        if (px >= doorX - doorWidth / 2 && px <= doorX + doorWidth / 2 &&
            py >= doorY - doorHeight && py <= doorY) {
            // お庭に戻る
            if (window.game && window.game.switchToGarden) {
                window.game.switchToGarden();
            } else {
                // グローバル関数を呼び出し
                if (typeof switchToGarden === 'function') {
                    switchToGarden();
                }
            }
        }
    }

    updatePlayerSprite() {
        if (this.playerSprite) {
            this.playerSprite.destroy();
        }

        switch (this.currentGender) {
            case 'human':
                this.playerSprite = createHumanSprite(this, this.player.x, this.player.y, this.walkFrame);
                break;
            case 'cat':
                this.playerSprite = createCatSprite(this, this.player.x, this.player.y, this.walkFrame);
                break;
            case 'dog':
                this.playerSprite = createDogSprite(this, this.player.x, this.player.y, this.walkFrame);
                break;
            case 'rabbit':
                this.playerSprite = createRabbitSprite(this, this.player.x, this.player.y, this.walkFrame);
                break;
            case 'lion':
                this.playerSprite = createLionSprite(this, this.player.x, this.player.y, this.walkFrame);
                break;
            case 'elephant':
                this.playerSprite = createElephantSprite(this, this.player.x, this.player.y, this.walkFrame);
                break;
            case 'panda':
                this.playerSprite = createPandaSprite(this, this.player.x, this.player.y, this.walkFrame);
                break;
            case 'sparrow':
                this.playerSprite = createSparrowSprite(this, this.player.x, this.player.y, this.walkFrame);
                break;
            default:
                this.playerSprite = createHumanSprite(this, this.player.x, this.player.y, this.walkFrame);
        }
    }

    updateOtherPlayers(users) {
        // 既存のプレイヤーをクリア
        this.otherPlayers.forEach((playerData) => {
            if (playerData.sprite) playerData.sprite.destroy();
            if (playerData.bubble) playerData.bubble.destroy();
        });
        this.otherPlayers.clear();

        // 他のプレイヤーを表示
        users.forEach((user) => {
            if (user.id !== this.currentUserId && user.location === 'classroom' && user.x && user.y) {
                let sprite;
                switch (user.gender) {
                    case 'human':
                        sprite = createHumanSprite(this, user.x, user.y, 0);
                        break;
                    case 'cat':
                        sprite = createCatSprite(this, user.x, user.y, 0);
                        break;
                    case 'dog':
                        sprite = createDogSprite(this, user.x, user.y, 0);
                        break;
                    case 'rabbit':
                        sprite = createRabbitSprite(this, user.x, user.y, 0);
                        break;
                    case 'lion':
                        sprite = createLionSprite(this, user.x, user.y, 0);
                        break;
                    case 'elephant':
                        sprite = createElephantSprite(this, user.x, user.y, 0);
                        break;
                    case 'panda':
                        sprite = createPandaSprite(this, user.x, user.y, 0);
                        break;
                    case 'sparrow':
                        sprite = createSparrowSprite(this, user.x, user.y, 0);
                        break;
                    default:
                        sprite = createHumanSprite(this, user.x, user.y, 0);
                }

                const bubble = createSpeechBubble(this, user.x, user.y - 40, user.characterName);

                this.otherPlayers.set(user.id, {
                    sprite: sprite,
                    bubble: bubble
                });
            }
        });
    }

    displayHaiku(content) {
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
