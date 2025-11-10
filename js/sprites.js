// ドット絵スプライト描画ユーティリティ

// ピクセル単位の大きさ
const PIXEL_SIZE = 4;

// 男性キャラのドット絵（16x16）
function createMaleSprite(scene, x, y, frame = 0) {
    const graphics = scene.add.graphics();
    graphics.setPosition(x - 32, y - 32);

    // フレーム0: 正面
    // フレーム1: 歩行
    const pattern = frame === 0 ? [
        '                ',
        '    111111      ',
        '   11111111     ',
        '   11111111     ',
        '    111111      ',
        '     1111       ',
        '    111111      ',
        '   11111111     ',
        '  1111111111    ',
        '   11111111     ',
        '    222222      ',
        '   22222222     ',
        '   22    22     ',
        '   22    22     ',
        '  222    222    ',
        ' 2222    2222   '
    ] : [
        '                ',
        '    111111      ',
        '   11111111     ',
        '   11111111     ',
        '    111111      ',
        '     1111       ',
        '    111111      ',
        '   11111111     ',
        '  1111111111    ',
        '   11111111     ',
        '    222222      ',
        '   22222222     ',
        '  222    22     ',
        '   22    222    ',
        '   222  2222    ',
        ' 2222    222    '
    ];

    for (let row = 0; row < pattern.length; row++) {
        for (let col = 0; col < pattern[row].length; col++) {
            const char = pattern[row][col];
            if (char === '1') { // 頭・体
                graphics.fillStyle(0x8B4513, 1);
                graphics.fillRect(col * PIXEL_SIZE, row * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
            } else if (char === '2') { // 足
                graphics.fillStyle(0x4169E1, 1);
                graphics.fillRect(col * PIXEL_SIZE, row * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
            }
        }
    }

    return graphics;
}

// 女性キャラのドット絵（16x16）
function createFemaleSprite(scene, x, y, frame = 0) {
    const graphics = scene.add.graphics();
    graphics.setPosition(x - 32, y - 32);

    const pattern = frame === 0 ? [
        '                ',
        '    111111      ',
        '   11111111     ',
        '   11111111     ',
        '    111111      ',
        '     1111       ',
        '    222222      ',
        '   22222222     ',
        '  2222222222    ',
        '   22222222     ',
        '    333333      ',
        '   33333333     ',
        '   33    33     ',
        '   33    33     ',
        '  333    333    ',
        ' 3333    3333   '
    ] : [
        '                ',
        '    111111      ',
        '   11111111     ',
        '   11111111     ',
        '    111111      ',
        '     1111       ',
        '    222222      ',
        '   22222222     ',
        '  2222222222    ',
        '   22222222     ',
        '    333333      ',
        '   33333333     ',
        '  333    33     ',
        '   33    333    ',
        '   333  3333    ',
        ' 3333    333    '
    ];

    for (let row = 0; row < pattern.length; row++) {
        for (let col = 0; col < pattern[row].length; col++) {
            const char = pattern[row][col];
            if (char === '1') { // 頭
                graphics.fillStyle(0xFFB6C1, 1);
                graphics.fillRect(col * PIXEL_SIZE, row * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
            } else if (char === '2') { // 体
                graphics.fillStyle(0xFF69B4, 1);
                graphics.fillRect(col * PIXEL_SIZE, row * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
            } else if (char === '3') { // 足
                graphics.fillStyle(0xFF1493, 1);
                graphics.fillRect(col * PIXEL_SIZE, row * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
            }
        }
    }

    return graphics;
}

// ねこキャラのドット絵（16x16）
function createCatSprite(scene, x, y, frame = 0) {
    const graphics = scene.add.graphics();
    graphics.setPosition(x - 32, y - 32);

    const pattern = frame === 0 ? [
        '                ',
        '   11    11     ',
        '  111    111    ',
        '  1111111111    ',
        ' 111111111111   ',
        ' 111111111111   ',
        ' 121111111121   ',
        ' 111111111111   ',
        ' 111122221111   ',
        '  1111111111    ',
        '   11111111     ',
        '   11111111     ',
        '   11    11     ',
        '   11    11     ',
        '  111    111    ',
        ' 1111    1111   '
    ] : [
        '                ',
        '   11    11     ',
        '  111    111    ',
        '  1111111111    ',
        ' 111111111111   ',
        ' 111111111111   ',
        ' 121111111121   ',
        ' 111111111111   ',
        ' 111122221111   ',
        '  1111111111    ',
        '   11111111     ',
        '   11111111     ',
        '  111    11     ',
        '   11    111    ',
        '   111  1111    ',
        ' 1111    111    '
    ];

    for (let row = 0; row < pattern.length; row++) {
        for (let col = 0; col < pattern[row].length; col++) {
            const char = pattern[row][col];
            if (char === '1') { // 体
                graphics.fillStyle(0xFFA500, 1);
                graphics.fillRect(col * PIXEL_SIZE, row * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
            } else if (char === '2') { // 顔パーツ
                graphics.fillStyle(0x000000, 1);
                graphics.fillRect(col * PIXEL_SIZE, row * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
            }
        }
    }

    return graphics;
}

// 机のドット絵
function createDesk(scene, x, y) {
    const graphics = scene.add.graphics();
    graphics.setPosition(x - 40, y - 30);

    const pattern = [
        '11111111111111111111',
        '11111111111111111111',
        '11111111111111111111',
        '11111111111111111111',
        '22 222222222222 2222',
        '22 222222222222 2222',
        '22 222222222222 2222',
        '22 222222222222 2222',
        '22 222222222222 2222',
        '22 2          2 2  2',
        '22 2          2 2  2',
        '22 2          2 2  2',
        '22 2          2 2  2',
        '22 2          2 2  2',
        '22 2          2 2  2'
    ];

    for (let row = 0; row < pattern.length; row++) {
        for (let col = 0; col < pattern[row].length; col++) {
            const char = pattern[row][col];
            if (char === '1') { // 天板
                graphics.fillStyle(0x8B4513, 1);
                graphics.fillRect(col * PIXEL_SIZE, row * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
            } else if (char === '2') { // 脚
                graphics.fillStyle(0x654321, 1);
                graphics.fillRect(col * PIXEL_SIZE, row * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
            }
        }
    }

    return graphics;
}

// 教壇のドット絵
function createPodium(scene, x, y) {
    const graphics = scene.add.graphics();
    graphics.setPosition(x - 80, y - 40);

    const pattern = [
        '111111111111111111111111111111111111111111',
        '111111111111111111111111111111111111111111',
        '111111111111111111111111111111111111111111',
        '111111111111111111111111111111111111111111',
        '222222222222222222222222222222222222222222',
        '222222222222222222222222222222222222222222',
        '222222222222222222222222222222222222222222',
        '222222222222222222222222222222222222222222',
        '22                                      22',
        '22                                      22',
        '22                                      22',
        '22                                      22',
        '22                                      22',
        '22                                      22',
        '22                                      22',
        '22                                      22',
        '22                                      22',
        '22                                      22',
        '22                                      22',
        '22                                      22'
    ];

    for (let row = 0; row < pattern.length; row++) {
        for (let col = 0; col < pattern[row].length; col++) {
            const char = pattern[row][col];
            if (char === '1') { // 天板
                graphics.fillStyle(0xA0522D, 1);
                graphics.fillRect(col * PIXEL_SIZE, row * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
            } else if (char === '2') { // 側面
                graphics.fillStyle(0x8B4513, 1);
                graphics.fillRect(col * PIXEL_SIZE, row * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
            }
        }
    }

    return graphics;
}

// 建物のドット絵
function createBuilding(scene, x, y, width, height, name) {
    const container = scene.add.container(x, y);

    // 建物本体
    const graphics = scene.add.graphics();
    graphics.fillStyle(0xDEB887, 1);
    graphics.fillRect(-width/2, -height, width, height);

    // 屋根
    graphics.fillStyle(0x8B4513, 1);
    graphics.fillTriangle(
        -width/2 - 20, -height,
        width/2 + 20, -height,
        0, -height - 40
    );

    // ドア
    graphics.fillStyle(0x654321, 1);
    graphics.fillRect(-20, -60, 40, 60);

    // ドアノブ
    graphics.fillStyle(0xFFD700, 1);
    graphics.fillCircle(15, -30, 3);

    container.add(graphics);

    // 看板（教室名）
    const signBg = scene.add.rectangle(0, -height - 60, name.length * 16 + 20, 30, 0xFFFFFF);
    signBg.setStrokeStyle(2, 0x000000);
    container.add(signBg);

    const nameText = scene.add.text(0, -height - 60, name, {
        fontSize: '16px',
        color: '#000000',
        fontWeight: 'bold'
    }).setOrigin(0.5);
    container.add(nameText);

    return container;
}

// 噴水のドット絵
function createFountain(scene, x, y) {
    const graphics = scene.add.graphics();
    graphics.setPosition(x, y);

    // 台座
    graphics.fillStyle(0x808080, 1);
    graphics.fillCircle(0, 0, 40);

    // 水
    graphics.fillStyle(0x4682B4, 1);
    graphics.fillCircle(0, 0, 30);

    // 噴水の柱
    graphics.fillStyle(0x696969, 1);
    graphics.fillRect(-5, -30, 10, 30);

    // 水しぶき（アニメーション用に複数の円）
    graphics.fillStyle(0x87CEEB, 0.6);
    graphics.fillCircle(-10, -35, 5);
    graphics.fillCircle(10, -35, 5);
    graphics.fillCircle(0, -40, 6);

    return graphics;
}

// 花壇のドット絵
function createFlowerBed(scene, x, y) {
    const graphics = scene.add.graphics();
    graphics.setPosition(x, y);

    // 土台
    graphics.fillStyle(0x8B4513, 1);
    graphics.fillRect(-60, -20, 120, 40);

    // 花（複数）
    const flowerColors = [0xFF69B4, 0xFF1493, 0xFF6347, 0xFFD700, 0xFF4500];
    for (let i = 0; i < 5; i++) {
        const fx = -50 + i * 25;
        const fy = -10 + (Math.random() - 0.5) * 10;

        // 茎
        graphics.fillStyle(0x228B22, 1);
        graphics.fillRect(fx - 2, fy - 20, 4, 20);

        // 花びら
        graphics.fillStyle(flowerColors[i], 1);
        graphics.fillCircle(fx, fy - 20, 8);
    }

    return graphics;
}

// 吹き出し付きテキスト（ニックネーム用）
function createSpeechBubble(scene, x, y, text) {
    const container = scene.add.container(x, y);

    // 背景
    const padding = 8;
    const textObj = scene.add.text(0, 0, text, {
        fontSize: '12px',
        color: '#000000',
        backgroundColor: '#ffffff',
        padding: { x: padding, y: padding }
    }).setOrigin(0.5);

    const bounds = textObj.getBounds();
    const bg = scene.add.rectangle(
        0, 0,
        bounds.width + 4,
        bounds.height + 4,
        0xffffff
    );
    bg.setStrokeStyle(2, 0x000000);

    container.add(bg);
    container.add(textObj);

    // 吹き出しの尻尾
    const tail = scene.add.triangle(0, bounds.height/2 + 2, -6, 0, 6, 0, 0, 8, 0xffffff);
    tail.setStrokeStyle(2, 0x000000);
    container.add(tail);

    return container;
}
