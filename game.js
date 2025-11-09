// ゲーム状態管理
const gameState = {
    currentScreen: 'login',
    currentClassroom: null,
    player: {
        name: '',
        role: '',  // 'host', 'selector', 'general'
        character: '',  // 'male', 'female', 'cat'
        x: 400,
        y: 500,
        direction: 'down',
        frame: 0,
        animationCounter: 0
    },
    classrooms: {
        'A': { occupied: false, hostId: null },
        'B': { occupied: false, hostId: null },
        'C': { occupied: false, hostId: null }
    },
    keys: {}
};

// ローカルストレージ管理
const storage = {
    save(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },
    load(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    },
    append(key, item) {
        const data = this.load(key) || [];
        data.push(item);
        this.save(key, data);
    }
};

// ログイン画面の初期化
function initLoginScreen() {
    const roleButtons = document.querySelectorAll('.role-btn');
    const charButtons = document.querySelectorAll('.char-btn');
    const nameInput = document.getElementById('nameInput');
    const enterGardenBtn = document.getElementById('enterGardenBtn');
    const characterSection = document.getElementById('characterSection');
    const nameSection = document.getElementById('nameSection');

    // ロールボタンのイベント
    roleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const role = btn.dataset.role;

            // 主催者の場合、満室チェック
            if (role === 'host') {
                const occupiedCount = Object.values(gameState.classrooms)
                    .filter(c => c.occupied).length;
                if (occupiedCount >= 3) {
                    alert('現在、全ての教室が使用中です。');
                    return;
                }
            }

            roleButtons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            gameState.player.role = role;
            characterSection.style.display = 'block';
        });
    });

    // キャラクタープレビュー描画
    document.querySelectorAll('.char-preview').forEach(canvas => {
        const ctx = canvas.getContext('2d');
        const charType = canvas.dataset.char;
        canvas.width = 48;
        canvas.height = 48;
        drawSprite(ctx, SPRITES[charType].down[0], 0, 0, 3);
    });

    // キャラクターボタンのイベント
    charButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            charButtons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            gameState.player.character = btn.dataset.char;
            nameSection.style.display = 'block';
        });
    });

    // 名前入力のイベント
    nameInput.addEventListener('input', () => {
        enterGardenBtn.disabled = nameInput.value.trim().length === 0;
    });

    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && nameInput.value.trim().length > 0) {
            enterGarden();
        }
    });

    // お庭へ入るボタン
    enterGardenBtn.addEventListener('click', enterGarden);
}

function enterGarden() {
    const nameInput = document.getElementById('nameInput');
    gameState.player.name = nameInput.value.trim();

    if (!gameState.player.role || !gameState.player.character || !gameState.player.name) {
        alert('役割、キャラクター、名前を全て選択してください。');
        return;
    }

    // 画面切り替え
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('gardenScreen').style.display = 'flex';
    gameState.currentScreen = 'garden';

    // お庭の初期化
    initGarden();
}

// お庭画面の初期化
function initGarden() {
    const canvas = document.getElementById('gardenCanvas');
    const ctx = canvas.getContext('2d');

    // プレイヤー初期位置
    gameState.player.x = 400;
    gameState.player.y = 500;

    // キー入力
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // ログアウトボタン
    document.getElementById('logoutFromGardenBtn').addEventListener('click', logout);

    // ゲームループ開始
    gardenGameLoop();
}

function gardenGameLoop() {
    if (gameState.currentScreen !== 'garden') return;

    const canvas = document.getElementById('gardenCanvas');
    const ctx = canvas.getContext('2d');

    // 移動処理
    const speed = 3;
    if (gameState.keys['ArrowUp']) {
        gameState.player.y -= speed;
        gameState.player.direction = 'up';
        gameState.player.animationCounter++;
    }
    if (gameState.keys['ArrowDown']) {
        gameState.player.y += speed;
        gameState.player.direction = 'down';
        gameState.player.animationCounter++;
    }
    if (gameState.keys['ArrowLeft']) {
        gameState.player.x -= speed;
        gameState.player.direction = 'left';
        gameState.player.animationCounter++;
    }
    if (gameState.keys['ArrowRight']) {
        gameState.player.x += speed;
        gameState.player.direction = 'right';
        gameState.player.animationCounter++;
    }

    // 画面境界チェック
    gameState.player.x = Math.max(20, Math.min(780, gameState.player.x));
    gameState.player.y = Math.max(20, Math.min(580, gameState.player.y));

    // アニメーションフレーム更新
    if (gameState.player.animationCounter > 10) {
        gameState.player.frame = (gameState.player.frame + 1) % 2;
        gameState.player.animationCounter = 0;
    }

    // 描画
    drawGarden(ctx);

    // ドア衝突チェック
    checkDoorCollision();

    requestAnimationFrame(gardenGameLoop);
}

function drawGarden(ctx) {
    // 背景（芝生）
    ctx.fillStyle = '#7CFC00';
    ctx.fillRect(0, 0, 800, 600);

    // 道
    ctx.fillStyle = '#D2B48C';
    ctx.fillRect(350, 450, 100, 150);
    ctx.fillRect(150, 250, 100, 200);
    ctx.fillRect(550, 250, 100, 200);
    ctx.fillRect(350, 250, 100, 200);
    ctx.fillRect(150, 250, 500, 50);

    // 建物3つ
    drawBuilding(ctx, 100, 50, 'A', gameState.classrooms['A'].occupied);
    drawBuilding(ctx, 325, 50, 'B', gameState.classrooms['B'].occupied);
    drawBuilding(ctx, 550, 50, 'C', gameState.classrooms['C'].occupied);

    // プレイヤー描画
    const sprite = SPRITES[gameState.player.character][gameState.player.direction][gameState.player.frame];
    drawSprite(ctx, sprite, gameState.player.x - 8, gameState.player.y - 8, 1);
}

function drawBuilding(ctx, x, y, label, occupied) {
    // 建物本体
    ctx.fillStyle = occupied ? '#999' : '#8B4513';
    ctx.fillRect(x, y, 150, 180);

    // 屋根
    ctx.fillStyle = occupied ? '#666' : '#A0522D';
    ctx.beginPath();
    ctx.moveTo(x - 10, y);
    ctx.lineTo(x + 75, y - 30);
    ctx.lineTo(x + 160, y);
    ctx.closePath();
    ctx.fill();

    // 窓
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(x + 20, y + 30, 30, 30);
    ctx.fillRect(x + 100, y + 30, 30, 30);
    ctx.fillRect(x + 20, y + 80, 30, 30);
    ctx.fillRect(x + 100, y + 80, 30, 30);

    // ドア（大きめ）
    ctx.fillStyle = occupied ? '#555' : '#654321';
    ctx.fillRect(x + 55, y + 130, 40, 50);

    // ドアノブ
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(x + 85, y + 155, 5, 5);

    // ラベル
    ctx.fillStyle = 'white';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`教室${label}`, x + 75, y + 20);

    if (occupied) {
        ctx.fillStyle = 'red';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('使用中', x + 75, y + 40);
    }
}

function checkDoorCollision() {
    const doors = [
        { x: 155, y: 180, width: 40, height: 50, room: 'A' },
        { x: 380, y: 180, width: 40, height: 50, room: 'B' },
        { x: 605, y: 180, width: 40, height: 50, room: 'C' }
    ];

    doors.forEach(door => {
        if (Math.abs(gameState.player.x - (door.x + 20)) < 25 &&
            Math.abs(gameState.player.y - (door.y + 25)) < 25) {

            // 主催者の場合、占有していない教室のみ入れる
            if (gameState.player.role === 'host' && gameState.classrooms[door.room].occupied) {
                return;
            }

            // 教室に入る
            enterClassroom(door.room);
        }
    });
}

function enterClassroom(roomId) {
    gameState.currentClassroom = roomId;

    // 主催者の場合、教室を占有
    if (gameState.player.role === 'host') {
        gameState.classrooms[roomId].occupied = true;
        gameState.classrooms[roomId].hostId = gameState.player.name;
    }

    // 画面切り替え
    document.getElementById('gardenScreen').style.display = 'none';
    document.getElementById('classroomScreen').style.display = 'block';
    gameState.currentScreen = 'classroom';

    // 教室初期化
    initClassroom(roomId);
}

// 教室画面の初期化
function initClassroom(roomId) {
    const canvas = document.getElementById('classroomCanvas');
    const ctx = canvas.getContext('2d');

    // タイトル更新
    document.getElementById('classroomTitle').textContent = `教室${roomId}`;

    // プレイヤー初期位置
    gameState.player.x = 300;
    gameState.player.y = 400;

    // 主催者の場合、句会終了ボタンを表示
    const endSessionBtn = document.getElementById('endSessionBtn');
    if (gameState.player.role === 'host') {
        endSessionBtn.style.display = 'inline-block';
    } else {
        endSessionBtn.style.display = 'none';
    }

    // ボタンイベント
    document.getElementById('exitClassroomBtn').addEventListener('click', exitClassroom);
    document.getElementById('logoutFromClassBtn').addEventListener('click', logout);
    document.getElementById('endSessionBtn').addEventListener('click', endSession);

    // チャット機能
    document.getElementById('sendChatBtn').addEventListener('click', sendChat);
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChat();
    });

    // 投句機能
    document.getElementById('submitHaikuBtn').addEventListener('click', submitHaiku);
    const haikuInput = document.getElementById('haikuInput');
    haikuInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // 改行を防ぐ
            submitHaiku();
        }
    });

    // 改行を完全に防ぐ
    haikuInput.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text').replace(/[\r\n]+/g, '');
        document.execCommand('insertText', false, text);
    });

    // モバイルタブ切り替え
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (tab === 'classroom') {
                document.getElementById('classroomView').classList.add('active');
                document.getElementById('chatView').classList.remove('active');
            } else {
                document.getElementById('classroomView').classList.remove('active');
                document.getElementById('chatView').classList.add('active');
            }
        });
    });

    // 保存されたチャットと投句を読み込み
    loadClassroomData(roomId);

    // ゲームループ開始
    classroomGameLoop();
}

function classroomGameLoop() {
    if (gameState.currentScreen !== 'classroom') return;

    const canvas = document.getElementById('classroomCanvas');
    const ctx = canvas.getContext('2d');

    // 移動処理
    const speed = 2;
    if (gameState.keys['ArrowUp']) {
        gameState.player.y -= speed;
        gameState.player.direction = 'up';
        gameState.player.animationCounter++;
    }
    if (gameState.keys['ArrowDown']) {
        gameState.player.y += speed;
        gameState.player.direction = 'down';
        gameState.player.animationCounter++;
    }
    if (gameState.keys['ArrowLeft']) {
        gameState.player.x -= speed;
        gameState.player.direction = 'left';
        gameState.player.animationCounter++;
    }
    if (gameState.keys['ArrowRight']) {
        gameState.player.x += speed;
        gameState.player.direction = 'right';
        gameState.player.animationCounter++;
    }

    // 画面境界チェック
    gameState.player.x = Math.max(20, Math.min(580, gameState.player.x));
    gameState.player.y = Math.max(20, Math.min(430, gameState.player.y));

    // アニメーションフレーム更新
    if (gameState.player.animationCounter > 10) {
        gameState.player.frame = (gameState.player.frame + 1) % 2;
        gameState.player.animationCounter = 0;
    }

    // 描画
    drawClassroom(ctx);

    requestAnimationFrame(classroomGameLoop);
}

function drawClassroom(ctx) {
    // 床
    ctx.fillStyle = '#F5DEB3';
    ctx.fillRect(0, 0, 600, 450);

    // 床のタイル模様
    ctx.strokeStyle = '#DEB887';
    ctx.lineWidth = 1;
    for (let i = 0; i < 600; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 450);
        ctx.stroke();
    }
    for (let i = 0; i < 450; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(600, i);
        ctx.stroke();
    }

    // 壁（上部の装飾）
    ctx.fillStyle = '#8FBC8F';
    ctx.fillRect(0, 0, 600, 30);

    // 黒板
    ctx.fillStyle = '#2F4F2F';
    ctx.fillRect(200, 35, 200, 80);
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 3;
    ctx.strokeRect(200, 35, 200, 80);

    // 教壇
    drawFurniture(ctx, FURNITURE.podium, 250, 130, 2);

    // 机と椅子（3列）
    const deskPositions = [
        { x: 100, y: 200 }, { x: 250, y: 200 }, { x: 400, y: 200 },
        { x: 100, y: 280 }, { x: 250, y: 280 }, { x: 400, y: 280 },
        { x: 100, y: 360 }, { x: 250, y: 360 }, { x: 400, y: 360 }
    ];

    deskPositions.forEach(pos => {
        drawFurniture(ctx, FURNITURE.desk, pos.x, pos.y, 2);
        drawFurniture(ctx, FURNITURE.chair, pos.x + 5, pos.y - 15, 2);
    });

    // プレイヤー描画
    const sprite = SPRITES[gameState.player.character][gameState.player.direction][gameState.player.frame];
    drawSprite(ctx, sprite, gameState.player.x - 8, gameState.player.y - 8, 1);
}

function sendChat() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message) return;

    const chatData = {
        name: gameState.player.name,
        message: message,
        time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now()
    };

    // ローカルストレージに保存
    storage.append(`chat_${gameState.currentClassroom}`, chatData);

    // 表示
    addChatMessage(chatData);

    input.value = '';
}

function addChatMessage(data) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    messageDiv.innerHTML = `
        <span class="name">${data.name}</span>
        <span class="time">${data.time}</span>
        <div>${data.message}</div>
    `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function submitHaiku() {
    const input = document.getElementById('haikuInput');
    const haiku = input.value.trim().replace(/[\r\n]+/g, ''); // 改行を削除

    if (!haiku) return;

    const haikuData = {
        author: gameState.player.name,
        text: haiku,
        timestamp: Date.now()
    };

    // ローカルストレージに保存
    storage.append(`haiku_${gameState.currentClassroom}`, haikuData);

    // 表示
    addHaikuItem(haikuData);

    input.value = '';
}

function addHaikuItem(data) {
    const haikuList = document.getElementById('haikuList');
    const haikuDiv = document.createElement('div');
    haikuDiv.className = 'haiku-item';
    haikuDiv.innerHTML = `
        <div class="author">${data.author}</div>
        <div class="text">${data.text}</div>
    `;
    haikuList.appendChild(haikuDiv);
    haikuList.scrollTop = haikuList.scrollHeight;
}

function loadClassroomData(roomId) {
    // チャット履歴を読み込み
    const chatData = storage.load(`chat_${roomId}`) || [];
    chatData.forEach(data => addChatMessage(data));

    // 投句履歴を読み込み
    const haikuData = storage.load(`haiku_${roomId}`) || [];
    haikuData.forEach(data => addHaikuItem(data));
}

function exitClassroom() {
    // 画面切り替え
    document.getElementById('classroomScreen').style.display = 'none';
    document.getElementById('gardenScreen').style.display = 'flex';
    gameState.currentScreen = 'garden';
    gameState.currentClassroom = null;
}

function endSession() {
    if (!confirm('句会を終了してもよろしいですか？チャットはクリアされますが、全てのログは保存されています。')) {
        return;
    }

    const roomId = gameState.currentClassroom;

    // 教室を開放
    gameState.classrooms[roomId].occupied = false;
    gameState.classrooms[roomId].hostId = null;

    // チャットと投句をクリア（ローカルストレージには残る）
    document.getElementById('chatMessages').innerHTML = '';
    document.getElementById('haikuList').innerHTML = '';

    alert('句会が終了しました。教室が開放されました。');

    exitClassroom();
}

function logout() {
    if (!confirm('ログアウトしてもよろしいですか？')) {
        return;
    }

    // 主催者の場合、教室を開放
    if (gameState.player.role === 'host' && gameState.currentClassroom) {
        gameState.classrooms[gameState.currentClassroom].occupied = false;
        gameState.classrooms[gameState.currentClassroom].hostId = null;
    }

    // 画面リセット
    location.reload();
}

function handleKeyDown(e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        gameState.keys[e.key] = true;
    }
}

function handleKeyUp(e) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        gameState.keys[e.key] = false;
        gameState.player.animationCounter = 0;
        gameState.player.frame = 0;
    }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    initLoginScreen();
});
