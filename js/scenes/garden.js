class GardenScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GardenScene' });
        this.player = null;
        this.playerSprite = null;
        this.playerBubble = null;
        this.otherPlayers = new Map();
        this.cursors = null;
        this.currentUserId = null;
        this.currentGender = null;
        this.currentNickname = null;
        this.onPositionUpdate = null;
        this.onEnterRoom = null;
        this.buildings = [];
        this.rooms = [];
        this.walkFrame = 0;
        this.walkTimer = 0;
    }

    init(data) {
        this.currentUserId = data.userId;
        this.currentGender = data.gender || 'male';
        this.currentNickname = data.nickname || 'Player';
        this.onPositionUpdate = data.onPositionUpdate;
        this.onEnterRoom = data.onEnterRoom;
        this.rooms = data.rooms || [];
    }

    create() {
        // 背景（緑の草地）
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x7CFC00).setOrigin(0, 0);

        // 噴水（中央）
        const fountain = createFountain(this, this.scale.width / 2, this.scale.height / 2);

        // 花壇（複数配置）
        createFlowerBed(this, 150, this.scale.height - 80);
        createFlowerBed(this, this.scale.width - 150, this.scale.height - 80);
        createFlowerBed(this, this.scale.width / 2, 80);

        // 建物を3つ配置
        const buildingY = 200;
        const buildingSpacing = this.scale.width / 4;

        for (let i = 0; i < 3; i++) {
            const x = buildingSpacing * (i + 1);
            const roomData = this.rooms[i] || { name: `句会場${i + 1}`, hasHost: false };

            // 主催者がいる場合は教室名を表示、いない場合はグレー表示
            const displayName = roomData.hasHost ? roomData.name : `(空き)`;
            const building = createBuilding(this, x, buildingY, 120, 120, displayName);

            // 主催者がいない場合はグレーアウト
            if (!roomData.hasHost) {
                building.setAlpha(0.5);
            }

            this.buildings.push({
                container: building,
                x: x,
                y: buildingY,
                roomIndex: i,
                bounds: {
                    left: x - 60,
                    right: x + 60,
                    top: buildingY - 120,
                    bottom: buildingY
                },
                doorBounds: {
                    left: x - 20,
                    right: x + 20,
                    top: buildingY - 60,
                    bottom: buildingY
                },
                hasHost: roomData.hasHost
            });
        }

        // プレイヤー作成（ドット絵）
        this.createPlayer(this.scale.width / 2, this.scale.height - 100);

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
        if (this.currentGender === 'male') {
            this.playerSprite = createMaleSprite(this, x, y, 0);
        } else if (this.currentGender === 'female') {
            this.playerSprite = createFemaleSprite(this, x, y, 0);
        } else {
            this.playerSprite = createCatSprite(this, x, y, 0);
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
            },
            onComplete: () => {
                // ドア判定
                this.checkDoorCollision();
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

            // ドア判定
            this.checkDoorCollision();
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

    updatePlayerSprite() {
        if (this.playerSprite) {
            this.playerSprite.destroy();
        }

        if (this.currentGender === 'male') {
            this.playerSprite = createMaleSprite(this, this.player.x, this.player.y, this.walkFrame);
        } else if (this.currentGender === 'female') {
            this.playerSprite = createFemaleSprite(this, this.player.x, this.player.y, this.walkFrame);
        } else {
            this.playerSprite = createCatSprite(this, this.player.x, this.player.y, this.walkFrame);
        }
    }

    checkDoorCollision() {
        const px = this.player.x;
        const py = this.player.y;

        for (const building of this.buildings) {
            if (!building.hasHost) continue; // 主催者がいない建物はスキップ

            const door = building.doorBounds;
            if (px >= door.left && px <= door.right &&
                py >= door.top && py <= door.bottom) {
                // ドアに触れた
                if (this.onEnterRoom) {
                    this.onEnterRoom(building.roomIndex);
                }
                break;
            }
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
            if (user.id !== this.currentUserId && user.location === 'garden' && user.x && user.y) {
                let sprite;
                if (user.gender === 'male') {
                    sprite = createMaleSprite(this, user.x, user.y, 0);
                } else if (user.gender === 'female') {
                    sprite = createFemaleSprite(this, user.x, user.y, 0);
                } else {
                    sprite = createCatSprite(this, user.x, user.y, 0);
                }

                const bubble = createSpeechBubble(this, user.x, user.y - 40, user.characterName);

                this.otherPlayers.set(user.id, {
                    sprite: sprite,
                    bubble: bubble
                });
            }
        });
    }

    updateBuildings(rooms) {
        this.rooms = rooms;
        this.buildings.forEach((building, index) => {
            const roomData = rooms[index] || { name: `句会場${index + 1}`, hasHost: false };
            building.hasHost = roomData.hasHost;

            // 建物のアルファ値を更新
            building.container.setAlpha(roomData.hasHost ? 1 : 0.5);

            // 看板のテキストを更新（Containerの子要素を探す）
            const children = building.container.list;
            for (let child of children) {
                if (child instanceof Phaser.GameObjects.Text) {
                    child.setText(roomData.hasHost ? roomData.name : '(空き)');
                }
            }
        });
    }
}
