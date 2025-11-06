// ドラクエ風川柳句会システム

// グローバル状態
const state = {
    currentUser: null,
    users: [],
    senryuList: [],
    chatMessages: [],
    characters: {},
    chairs: [],
    selectedAwards: {}
};

// 定数
const TILE_SIZE = 32;
const MAP_WIDTH = 20;
const MAP_HEIGHT = 18;
const MOVE_SPEED = TILE_SIZE;

// 賞の種類
const AWARDS = [
    { id: 'ten', label: '天' },
    { id: 'chi', label: '地' },
    { id: 'jin', label: '人' },
    { id: 'shu1', label: '秀1' },
    { id: 'shu2', label: '秀2' },
    { id: 'shu3', label: '秀3' },
    { id: 'shu4', label: '秀4' },
    { id: 'shu5', label: '秀5' },
    { id: 'ka1', label: '佳1' },
    { id: 'ka2', label: '佳2' },
    { id: 'ka3', label: '佳3' },
    { id: 'ka4', label: '佳4' },
    { id: 'ka5', label: '佳5' },
    { id: 'ka6', label: '佳6' },
    { id: 'ka7', label: '佳7' },
    { id: 'ka8', label: '佳8' },
    { id: 'ka9', label: '佳9' },
    { id: 'ka10', label: '佳10' },
    { id: 'ka11', label: '佳11' },
    { id: 'ka12', label: '佳12' },
    { id: 'ka13', label: '佳13' },
    { id: 'ka14', label: '佳14' },
    { id: 'ka15', label: '佳15' },
    { id: 'ka16', label: '佳16' },
    { id: 'ka17', label: '佳17' },
    { id: 'ka18', label: '佳18' },
    { id: 'ka19', label: '佳19' },
    { id: 'ka20', label: '佳20' },
    { id: 'ka21', label: '佳21' },
    { id: 'ka22', label: '佳22' },
    { id: 'ka23', label: '佳23' },
    { id: 'ka24', label: '佳24' },
    { id: 'ka25', label: '佳25' },
    { id: 'ka26', label: '佳26' },
    { id: 'ka27', label: '佳27' },
    { id: 'ka28', label: '佳28' },
    { id: 'ka29', label: '佳29' },
    { id: 'ka30', label: '佳30' }
];

// 初期化
function init() {
    loadFromStorage();
    setupEventListeners();

    // ログイン画面を表示
    if (!state.currentUser) {
        showScreen('login-screen');
    } else {
        showMainScreen();
    }
}

// ローカルストレージから読み込み
function loadFromStorage() {
    const saved = localStorage.getItem('senku-kukaijo');
    if (saved) {
        const data = JSON.parse(saved);
        state.senryuList = data.senryuList || [];
        state.chatMessages = data.chatMessages || [];
        state.selectedAwards = data.selectedAwards || {};
    }
}

// ローカルストレージに保存
function saveToStorage() {
    const data = {
        senryuList: state.senryuList,
        chatMessages: state.chatMessages,
        selectedAwards: state.selectedAwards
    };
    localStorage.setItem('senku-kukaijo', JSON.stringify(data));
}

// イベントリスナー設定
function setupEventListeners() {
    // ログインボタン
    document.getElementById('login-btn').addEventListener('click', handleLogin);

    // 投句ボタン
    document.getElementById('submit-senryu-btn').addEventListener('click', handleSubmitSenryu);

    // チャット送信（一般）
    document.getElementById('send-chat-btn').addEventListener('click', () => handleSendChat('chat-input', 'chat-log'));
    document.getElementById('chat-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSendChat('chat-input', 'chat-log');
    });

    // チャット送信（選者）
    document.getElementById('send-chat-selector-btn').addEventListener('click', () => handleSendChat('chat-input-selector', 'chat-log-selector'));
    document.getElementById('chat-input-selector').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSendChat('chat-input-selector', 'chat-log-selector');
    });

    // 披講ボタン
    document.getElementById('announce-btn').addEventListener('click', handleAnnouncement);

    // 披講画面を閉じる
    document.getElementById('close-announcement-btn').addEventListener('click', () => {
        showScreen('main-screen');
    });

    // 十字キー
    document.querySelectorAll('.d-pad-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const dir = btn.dataset.dir;
            moveCharacter(state.currentUser.name, dir);
        });
    });

    // キーボード操作
    document.addEventListener('keydown', handleKeyDown);
}

// ログイン処理
function handleLogin() {
    const username = document.getElementById('username-input').value.trim();
    const role = document.querySelector('input[name="role"]:checked').value;

    if (!username) {
        alert('なまえを いれてください');
        return;
    }

    state.currentUser = {
        name: username,
        role: role,
        x: MAP_WIDTH / 2 * TILE_SIZE,
        y: MAP_HEIGHT / 2 * TILE_SIZE,
        seated: false,
        seatIndex: null
    };

    showMainScreen();
}

// メイン画面表示
function showMainScreen() {
    showScreen('main-screen');

    // ユーザー情報表示
    document.getElementById('user-name-display').textContent = state.currentUser.name;
    document.getElementById('user-role-display').textContent =
        state.currentUser.role === 'selector' ? '[せんしゃ]' : '[いっぱん]';

    // UIの切り替え
    if (state.currentUser.role === 'selector') {
        document.getElementById('general-ui').style.display = 'none';
        document.getElementById('selector-ui').style.display = 'block';
        updateSenryuList();
    } else {
        document.getElementById('general-ui').style.display = 'block';
        document.getElementById('selector-ui').style.display = 'none';
    }

    // マップ初期化
    initMap();

    // チャット更新
    updateChatLog();
}

// 画面切り替え
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.style.display = 'none';
    });
    document.getElementById(screenId).style.display = 'flex';
}

// マップ初期化
function initMap() {
    const map = document.getElementById('classroom-map');
    map.innerHTML = '';

    // 教壇を追加
    const podium = document.createElement('div');
    podium.className = 'podium';
    podium.style.left = `${MAP_WIDTH / 2 * TILE_SIZE - 32}px`;
    podium.style.top = `${TILE_SIZE}px`;
    map.appendChild(podium);

    // 机と椅子を配置（8行5列 = 40個）
    state.chairs = [];
    let chairIndex = 0;

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 5; col++) {
            const x = (col * 3 + 2) * TILE_SIZE;
            const y = (row * 2 + 4) * TILE_SIZE;

            // 机
            const desk = document.createElement('div');
            desk.className = 'desk';
            desk.style.left = `${x}px`;
            desk.style.top = `${y}px`;
            map.appendChild(desk);

            // 椅子（机の前）
            const chair = document.createElement('div');
            chair.className = 'chair';
            chair.style.left = `${x}px`;
            chair.style.top = `${y + TILE_SIZE}px`;
            chair.dataset.index = chairIndex;
            chair.addEventListener('click', () => handleSitDown(chairIndex));
            map.appendChild(chair);

            state.chairs.push({
                index: chairIndex,
                x: x,
                y: y + TILE_SIZE,
                occupied: false,
                occupiedBy: null,
                element: chair
            });

            chairIndex++;
        }
    }

    // 自分のキャラクターを追加
    addCharacter(state.currentUser.name, state.currentUser.x, state.currentUser.y);

    // マップクリックで移動
    map.addEventListener('click', handleMapClick);
}

// キャラクター追加
function addCharacter(name, x, y) {
    const map = document.getElementById('classroom-map');

    // 既存のキャラクターを削除
    if (state.characters[name]) {
        state.characters[name].element.remove();
    }

    const char = document.createElement('div');
    char.className = 'character';
    char.style.left = `${x}px`;
    char.style.top = `${y}px`;

    const label = document.createElement('div');
    label.className = 'character-label';
    label.textContent = name;
    char.appendChild(label);

    map.appendChild(char);

    state.characters[name] = {
        element: char,
        x: x,
        y: y,
        seated: false
    };
}

// キャラクター移動
function moveCharacter(name, direction) {
    const char = state.characters[name];
    if (!char || char.seated) return;

    let newX = char.x;
    let newY = char.y;

    switch (direction) {
        case 'up':
            newY = Math.max(0, char.y - MOVE_SPEED);
            break;
        case 'down':
            newY = Math.min((MAP_HEIGHT - 1) * TILE_SIZE, char.y + MOVE_SPEED);
            break;
        case 'left':
            newX = Math.max(0, char.x - MOVE_SPEED);
            break;
        case 'right':
            newX = Math.min((MAP_WIDTH - 1) * TILE_SIZE, char.x + MOVE_SPEED);
            break;
    }

    // 衝突判定（簡易版）
    if (!checkCollision(newX, newY)) {
        char.x = newX;
        char.y = newY;
        char.element.style.left = `${newX}px`;
        char.element.style.top = `${newY}px`;

        // 現在のユーザーの場合は状態を更新
        if (name === state.currentUser.name) {
            state.currentUser.x = newX;
            state.currentUser.y = newY;
        }
    }
}

// 衝突判定
function checkCollision(x, y) {
    // 簡易版：マップの境界チェックのみ
    // 実際には机や他のキャラクターとの衝突も判定すべき
    return false;
}

// マップクリック処理
function handleMapClick(e) {
    if (state.currentUser.seated) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // タイルにスナップ
    const targetX = Math.floor(clickX / TILE_SIZE) * TILE_SIZE;
    const targetY = Math.floor(clickY / TILE_SIZE) * TILE_SIZE;

    // キャラクターを移動
    const char = state.characters[state.currentUser.name];
    if (char) {
        char.x = targetX;
        char.y = targetY;
        char.element.style.left = `${targetX}px`;
        char.element.style.top = `${targetY}px`;
        state.currentUser.x = targetX;
        state.currentUser.y = targetY;
    }
}

// 着席処理
function handleSitDown(chairIndex) {
    const chair = state.chairs[chairIndex];

    if (chair.occupied) {
        addChatMessage('システム', 'そのせきは ふさがっています');
        return;
    }

    // 現在座っている椅子から立つ
    if (state.currentUser.seated && state.currentUser.seatIndex !== null) {
        const oldChair = state.chairs[state.currentUser.seatIndex];
        oldChair.occupied = false;
        oldChair.occupiedBy = null;
        oldChair.element.classList.remove('occupied');
    }

    // 新しい椅子に座る
    chair.occupied = true;
    chair.occupiedBy = state.currentUser.name;
    chair.element.classList.add('occupied');

    state.currentUser.seated = true;
    state.currentUser.seatIndex = chairIndex;

    // キャラクターを椅子の位置に移動
    const char = state.characters[state.currentUser.name];
    if (char) {
        char.x = chair.x;
        char.y = chair.y;
        char.element.style.left = `${chair.x}px`;
        char.element.style.top = `${chair.y}px`;
        char.element.classList.add('seated');
        char.seated = true;
    }

    addChatMessage('システム', `${state.currentUser.name}が ${chairIndex + 1}ばんの せきに すわりました`);
}

// キーボード処理
function handleKeyDown(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }

    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            e.preventDefault();
            moveCharacter(state.currentUser.name, 'up');
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            e.preventDefault();
            moveCharacter(state.currentUser.name, 'down');
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            e.preventDefault();
            moveCharacter(state.currentUser.name, 'left');
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            e.preventDefault();
            moveCharacter(state.currentUser.name, 'right');
            break;
        case ' ':
            e.preventDefault();
            // 椅子から立つ
            if (state.currentUser.seated) {
                standUp();
            }
            break;
    }
}

// 立ち上がる
function standUp() {
    if (!state.currentUser.seated) return;

    const chair = state.chairs[state.currentUser.seatIndex];
    chair.occupied = false;
    chair.occupiedBy = null;
    chair.element.classList.remove('occupied');

    state.currentUser.seated = false;
    state.currentUser.seatIndex = null;

    const char = state.characters[state.currentUser.name];
    if (char) {
        char.element.classList.remove('seated');
        char.seated = false;
    }

    addChatMessage('システム', `${state.currentUser.name}が せきから たちあがりました`);
}

// 投句処理
function handleSubmitSenryu() {
    const input = document.getElementById('senryu-input');
    const text = input.value.trim();

    if (!text) {
        alert('せんりゅうを にゅうりょく してください');
        return;
    }

    const senryu = {
        id: Date.now(),
        text: text,
        author: state.currentUser.name,
        timestamp: new Date().toISOString()
    };

    state.senryuList.push(senryu);
    saveToStorage();

    input.value = '';
    addChatMessage('システム', 'とうくを うけつけました');
}

// チャット送信
function handleSendChat(inputId, logId) {
    const input = document.getElementById(inputId);
    const text = input.value.trim();

    if (!text) return;

    addChatMessage(state.currentUser.name, text);
    input.value = '';
}

// チャットメッセージ追加
function addChatMessage(username, message) {
    state.chatMessages.push({
        username: username,
        message: message,
        timestamp: new Date().toISOString()
    });
    saveToStorage();
    updateChatLog();
}

// チャットログ更新
function updateChatLog() {
    const logs = ['chat-log', 'chat-log-selector'];

    logs.forEach(logId => {
        const log = document.getElementById(logId);
        if (!log) return;

        log.innerHTML = '';

        state.chatMessages.forEach(msg => {
            const div = document.createElement('div');
            div.className = 'chat-message';
            div.innerHTML = `<strong>${msg.username}:</strong> ${msg.message}`;
            log.appendChild(div);
        });

        log.scrollTop = log.scrollHeight;
    });
}

// 川柳リスト更新（選者用）
function updateSenryuList() {
    const list = document.getElementById('senryu-list');
    list.innerHTML = '';

    if (state.senryuList.length === 0) {
        list.innerHTML = '<div style="padding: 8px;">とうくが ありません</div>';
        return;
    }

    state.senryuList.forEach(senryu => {
        const item = document.createElement('div');
        item.className = 'senryu-item';

        const text = document.createElement('div');
        text.className = 'senryu-text';
        text.textContent = senryu.text;
        item.appendChild(text);

        const controls = document.createElement('div');
        controls.className = 'senryu-controls';

        AWARDS.forEach(award => {
            const btn = document.createElement('button');
            btn.className = 'award-btn';
            btn.textContent = award.label;
            btn.dataset.senryuId = senryu.id;
            btn.dataset.awardId = award.id;

            // 既に選択されている場合
            if (state.selectedAwards[award.id] === senryu.id) {
                btn.classList.add('selected');
            }

            btn.addEventListener('click', () => handleAwardSelect(senryu.id, award.id, btn));
            controls.appendChild(btn);
        });

        item.appendChild(controls);
        list.appendChild(item);
    });
}

// 賞の選択
function handleAwardSelect(senryuId, awardId, btn) {
    // 既に選択されている場合は解除
    if (state.selectedAwards[awardId] === senryuId) {
        delete state.selectedAwards[awardId];
        btn.classList.remove('selected');
    } else {
        // 他の川柳から同じ賞を解除
        const oldSenryuId = state.selectedAwards[awardId];
        if (oldSenryuId) {
            const oldBtn = document.querySelector(`[data-senryu-id="${oldSenryuId}"][data-award-id="${awardId}"]`);
            if (oldBtn) oldBtn.classList.remove('selected');
        }

        // 新しく選択
        state.selectedAwards[awardId] = senryuId;
        btn.classList.add('selected');
    }

    saveToStorage();
}

// 披講（発表）
function handleAnnouncement() {
    const content = document.getElementById('announcement-content');
    content.innerHTML = '';

    // 賞の順序（佳30→天）
    const awardOrder = [...AWARDS].reverse();

    let hasAwards = false;

    awardOrder.forEach(award => {
        const senryuId = state.selectedAwards[award.id];
        if (senryuId) {
            const senryu = state.senryuList.find(s => s.id === senryuId);
            if (senryu) {
                hasAwards = true;

                const item = document.createElement('div');
                item.className = 'announcement-item';

                const awardDiv = document.createElement('div');
                awardDiv.className = 'announcement-award';
                awardDiv.textContent = `【${award.label}】`;
                item.appendChild(awardDiv);

                const senryuDiv = document.createElement('div');
                senryuDiv.className = 'announcement-senryu';
                senryuDiv.textContent = senryu.text;
                item.appendChild(senryuDiv);

                const authorDiv = document.createElement('div');
                authorDiv.className = 'announcement-author';
                authorDiv.textContent = `よみびと： ${senryu.author}`;
                item.appendChild(authorDiv);

                content.appendChild(item);
            }
        }
    });

    if (!hasAwards) {
        content.innerHTML = '<div style="padding: 16px; text-align: center;">にゅうせんくが せんたく されていません</div>';
    }

    showScreen('announcement-screen');

    // チャットにも通知
    addChatMessage('システム', 'にゅうせんくが はっぴょう されました！');
}

// 初期化実行
document.addEventListener('DOMContentLoaded', init);
