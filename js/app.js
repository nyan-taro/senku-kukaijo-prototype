// グローバル変数
let currentUser = null;
let currentLocation = 'garden';
let currentRoomIndex = 0;
let game = null;
let broadcastChannel = null;

// ローカルストレージキー
const STORAGE_KEYS = {
    USER_DATA: 'senku_kukaijo_user_data',
    ROOMS_DATA: 'senku_kukaijo_rooms_data'
};

// ユーティリティ関数
function generateId() {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function saveToLocalStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function loadFromLocalStorage(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

// ユーザーデータの保存・読み込み
function saveUserData(name, characterName, role, gender) {
    const userData = {
        name,
        characterName,
        role,
        gender,
        timestamp: Date.now()
    };
    saveToLocalStorage(STORAGE_KEYS.USER_DATA, userData);
}

function loadUserData() {
    const data = loadFromLocalStorage(STORAGE_KEYS.USER_DATA);
    if (!data) return null;

    // 24時間以内のデータのみ有効
    if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
        return data;
    }
    return null;
}

// 句会場データ管理（3つまで）
function getRoomsData() {
    const data = loadFromLocalStorage(STORAGE_KEYS.ROOMS_DATA);
    if (!data) {
        return [
            { name: '句会場1', hasHost: false, hostId: null, users: [], messages: [], haikus: [], currentHaikuDisplay: '' },
            { name: '句会場2', hasHost: false, hostId: null, users: [], messages: [], haikus: [], currentHaikuDisplay: '' },
            { name: '句会場3', hasHost: false, hostId: null, users: [], messages: [], haikus: [], currentHaikuDisplay: '' }
        ];
    }
    return data;
}

function saveRoomsData(rooms) {
    saveToLocalStorage(STORAGE_KEYS.ROOMS_DATA, rooms);
    broadcastMessage({ type: 'rooms_update', rooms });
}

function getCurrentRoom() {
    const rooms = getRoomsData();
    return rooms[currentRoomIndex];
}

// BroadcastChannel設定
function setupBroadcastChannel() {
    broadcastChannel = new BroadcastChannel('senku_kukaijo_channel');

    broadcastChannel.onmessage = (event) => {
        const data = event.data;

        switch (data.type) {
            case 'rooms_update':
                updateUI();
                updateGameScene();
                break;
            case 'chat_message':
                displayMessage(data.message, data.roomIndex);
                break;
            case 'haiku_submitted':
                displayHaiku(data.haiku, data.roomIndex);
                break;
        }
    };
}

function broadcastMessage(data) {
    if (broadcastChannel) {
        broadcastChannel.postMessage(data);
    }
}

// Phaser.jsゲーム初期化
function initGame() {
    const gameContainer = document.getElementById('game-container');
    const width = Math.min(gameContainer.clientWidth, 600);
    const height = Math.min(gameContainer.clientHeight, 600);

    const config = {
        type: Phaser.AUTO,
        parent: 'game-container',
        width: width,
        height: height,
        backgroundColor: '#f0f0f0',
        scene: [ClassroomScene, GardenScene],
    };

    game = new Phaser.Game(config);
}

function switchToGarden() {
    if (!game) return;

    currentLocation = 'garden';
    const rooms = getRoomsData();

    game.scene.stop('ClassroomScene');
    game.scene.stop('GardenScene');
    game.scene.start('GardenScene', {
        userId: currentUser.id,
        gender: currentUser.gender,
        nickname: currentUser.characterName,
        rooms: rooms,
        onPositionUpdate: (x, y) => {
            updateUserPosition(x, y, 'garden');
        },
        onEnterRoom: (roomIndex) => {
            enterRoom(roomIndex);
        }
    });

    document.getElementById('location-title').textContent = 'お庭';
    document.getElementById('enter-classroom-btn').style.display = 'none';
}

function switchToClassroom() {
    if (!game) return;

    currentLocation = 'classroom';
    const room = getCurrentRoom();

    game.scene.stop('ClassroomScene');
    game.scene.stop('GardenScene');
    game.scene.start('ClassroomScene', {
        userId: currentUser.id,
        gender: currentUser.gender,
        nickname: currentUser.characterName,
        onPositionUpdate: (x, y) => {
            updateUserPosition(x, y, 'classroom');
        }
    });

    document.getElementById('location-title').textContent = `教室: ${room.name}`;
    document.getElementById('enter-classroom-btn').style.display = 'none';

    // 黒板の内容を復元
    if (room.currentHaikuDisplay) {
        setTimeout(() => updateBlackboard(room.currentHaikuDisplay), 100);
    }

    updateOtherPlayersInGame();
}

function enterRoom(roomIndex) {
    const rooms = getRoomsData();
    const room = rooms[roomIndex];

    if (!room.hasHost) {
        alert('この句会場は使用できません。');
        return;
    }

    currentRoomIndex = roomIndex;

    // ユーザーを句会場に追加
    const userInRoom = room.users.find(u => u.id === currentUser.id);
    if (!userInRoom) {
        room.users.push({
            ...currentUser,
            location: 'classroom',
            x: 300,
            y: 300
        });
        saveRoomsData(rooms);
    }

    switchToClassroom();
    loadRoomData(roomIndex);
}

function updateUserPosition(x, y, location) {
    const rooms = getRoomsData();
    const room = rooms[currentRoomIndex];

    const user = room.users.find(u => u.id === currentUser.id);
    if (user) {
        user.x = x;
        user.y = y;
        user.location = location;
        saveRoomsData(rooms);
    }
}

function updateGameScene() {
    if (!game) return;

    const gardenScene = game.scene.getScene('GardenScene');
    if (gardenScene && gardenScene.scene.isActive()) {
        const rooms = getRoomsData();
        gardenScene.updateBuildings(rooms);
    }

    updateOtherPlayersInGame();
}

function updateOtherPlayersInGame() {
    if (!game) return;

    const rooms = getRoomsData();
    const room = rooms[currentRoomIndex];

    const classroomScene = game.scene.getScene('ClassroomScene');
    const gardenScene = game.scene.getScene('GardenScene');

    if (classroomScene && classroomScene.scene.isActive()) {
        classroomScene.updateOtherPlayers(room.users);
    }

    if (gardenScene && gardenScene.scene.isActive()) {
        gardenScene.updateOtherPlayers(room.users);
    }
}

function updateBlackboard(content) {
    if (game && currentLocation === 'classroom') {
        const classroomScene = game.scene.getScene('ClassroomScene');
        if (classroomScene && classroomScene.scene.isActive()) {
            if (content) {
                classroomScene.displayHaiku(content);
            } else {
                classroomScene.clearBlackboard();
            }
        }
    }
}

// UI更新
function updateUI() {
    const rooms = getRoomsData();
    const room = rooms[currentRoomIndex];

    // メッセージ表示
    const messagesContainer = document.getElementById('messages-container');
    messagesContainer.innerHTML = '';
    room.messages.forEach(msg => {
        displayMessage(msg, currentRoomIndex);
    });

    // 俳句一覧表示
    const haikuList = document.getElementById('haiku-list');
    if (haikuList) {
        haikuList.innerHTML = '';
        room.haikus.forEach(haiku => {
            displayHaiku(haiku, currentRoomIndex);
        });
    }
}

function displayMessage(message, roomIndex) {
    if (roomIndex !== currentRoomIndex) return;

    const messagesContainer = document.getElementById('messages-container');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';

    if (message.type === 'announcement') {
        messageDiv.classList.add('message-announcement');
    } else if (message.type === 'callout') {
        messageDiv.classList.add('message-callout');
    }

    messageDiv.innerHTML = `
        <span class="message-name">${message.userName}:</span>
        <span>${message.message}</span>
    `;

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function displayHaiku(haiku, roomIndex) {
    if (roomIndex !== currentRoomIndex) return;

    const haikuList = document.getElementById('haiku-list');
    if (!haikuList) return;

    const haikuDiv = document.createElement('div');
    haikuDiv.className = 'haiku-item';
    haikuDiv.innerHTML = `
        <div class="haiku-content">${haiku.content}</div>
        <div class="haiku-author">- ${haiku.userName}</div>
        ${currentUser && (currentUser.role === 'host' || currentUser.role === 'judge') ?
            `<button class="display-button" onclick="displayHaikuOnBlackboard('${haiku.content.replace(/'/g, "\\'")}')">黒板に表示</button>` :
            ''}
    `;
    haikuList.appendChild(haikuDiv);
}

function displayHaikuOnBlackboard(content) {
    const rooms = getRoomsData();
    const room = rooms[currentRoomIndex];
    room.currentHaikuDisplay = content;
    saveRoomsData(rooms);
    updateBlackboard(content);

    // チャットにも表示
    const message = {
        id: `msg_${Date.now()}_${Math.random()}`,
        userId: currentUser.id,
        userName: currentUser.characterName,
        message: content,
        timestamp: Date.now(),
        type: 'announcement'
    };
    addMessage(message);
}

function addMessage(message) {
    const rooms = getRoomsData();
    const room = rooms[currentRoomIndex];
    room.messages.push(message);
    saveRoomsData(rooms);
    broadcastMessage({ type: 'chat_message', message, roomIndex: currentRoomIndex });
    displayMessage(message, currentRoomIndex);
}

function addHaiku(haiku) {
    const rooms = getRoomsData();
    const room = rooms[currentRoomIndex];
    room.haikus.push(haiku);
    saveRoomsData(rooms);
    broadcastMessage({ type: 'haiku_submitted', haiku, roomIndex: currentRoomIndex });
    displayHaiku(haiku, currentRoomIndex);
}

function loadRoomData(roomIndex) {
    const rooms = getRoomsData();
    const room = rooms[roomIndex];

    // メッセージをロード
    const messagesContainer = document.getElementById('messages-container');
    messagesContainer.innerHTML = '';
    room.messages.forEach(msg => displayMessage(msg, roomIndex));

    // 俳句をロード
    const haikuList = document.getElementById('haiku-list');
    if (haikuList) {
        haikuList.innerHTML = '';
        room.haikus.forEach(haiku => displayHaiku(haiku, roomIndex));
    }
}

function setupUIForRole(role) {
    const chatArea = document.getElementById('chat-area');
    const hikikouArea = document.getElementById('hikikou-area');
    const haikuArea = document.getElementById('haiku-area');
    const haikuListArea = document.getElementById('haiku-list-area');
    const calloutBtn = document.getElementById('callout-btn');
    const endSessionBtn = document.getElementById('end-session-btn');

    if (role === 'participant') {
        chatArea.classList.add('participant');
        haikuArea.style.display = 'block';
        hikikouArea.style.display = 'none';
        haikuListArea.style.display = 'none';
        calloutBtn.style.display = 'block';
        endSessionBtn.style.display = 'none';
    } else {
        chatArea.classList.add('host-judge');
        haikuArea.style.display = 'none';
        hikikouArea.style.display = 'block';
        haikuListArea.style.display = 'block';
        calloutBtn.style.display = 'none';

        if (role === 'host') {
            endSessionBtn.style.display = 'block';
        }
    }
}

function getRoleName(role) {
    switch (role) {
        case 'host': return '主催者';
        case 'judge': return '選者';
        case 'participant': return '一般';
        default: return '';
    }
}

// ログイン処理
document.addEventListener('DOMContentLoaded', () => {
    const loginScreen = document.getElementById('login-screen');
    const mainScreen = document.getElementById('main-screen');
    const loginForm = document.getElementById('login-form');
    const roleSelect = document.getElementById('role-select');
    const genderSelect = document.getElementById('gender-select');
    const roomNameGroup = document.getElementById('room-name-group');
    const continueSection = document.getElementById('continue-section');
    const continueBtn = document.getElementById('continue-btn');
    const savedInfo = document.getElementById('saved-info');

    // BroadcastChannel設定
    setupBroadcastChannel();

    // 前回のつづきボタン
    const savedUserData = loadUserData();
    if (savedUserData) {
        continueSection.style.display = 'block';
        savedInfo.textContent = `(${savedUserData.name} / ${savedUserData.characterName} / ${getRoleName(savedUserData.role)})`;

        continueBtn.addEventListener('click', () => {
            const roomNameInput = document.getElementById('room-name-input').value;
            loginWithData(
                savedUserData.name,
                savedUserData.characterName,
                savedUserData.role,
                savedUserData.gender || 'male',
                savedUserData.role === 'host' ? roomNameInput : null
            );
        });
    }

    // 役割選択で教室名入力欄の表示切替
    roleSelect.addEventListener('change', () => {
        if (roleSelect.value === 'host') {
            roomNameGroup.style.display = 'block';
        } else {
            roomNameGroup.style.display = 'none';
        }
    });

    // ログインフォーム送信
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('name-input').value;
        const characterName = document.getElementById('character-name-input').value;
        const role = roleSelect.value;
        const gender = genderSelect.value;
        const roomName = document.getElementById('room-name-input').value;

        if (!name || !characterName) return;

        loginWithData(name, characterName, role, gender, role === 'host' ? roomName : null);
    });

    function loginWithData(name, characterName, role, gender, roomName) {
        // ユーザーデータ保存
        saveUserData(name, characterName, role, gender);

        // 現在のユーザーを設定
        currentUser = {
            id: generateId(),
            name,
            characterName,
            role,
            gender,
            location: 'garden',
            x: 300,
            y: 300
        };

        // 主催者の場合、句会場を作成または更新
        if (role === 'host' && roomName) {
            const rooms = getRoomsData();
            let roomIndex = rooms.findIndex(r => !r.hasHost);

            if (roomIndex === -1) {
                alert('句会場がいっぱいです。');
                return;
            }

            rooms[roomIndex].name = roomName;
            rooms[roomIndex].hasHost = true;
            rooms[roomIndex].hostId = currentUser.id;
            rooms[roomIndex].users.push(currentUser);
            currentRoomIndex = roomIndex;
            saveRoomsData(rooms);
        }

        // UI設定
        setupUIForRole(role);

        // ログイン情報表示
        document.getElementById('login-info').textContent = `${getRoleName(role)}：${characterName} ログイン中`;

        // 画面切替
        loginScreen.style.display = 'none';
        mainScreen.style.display = 'flex';

        // ゲーム初期化
        initGame();
        setTimeout(() => {
            switchToGarden();
        }, 100);

        setupEventListeners();
    }

    function setupEventListeners() {
        // チャット送信
        document.getElementById('chat-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const chatInput = document.getElementById('chat-input');
            const messageText = chatInput.value.trim();
            if (!messageText) return;

            const message = {
                id: `msg_${Date.now()}_${Math.random()}`,
                userId: currentUser.id,
                userName: currentUser.characterName,
                message: messageText,
                timestamp: Date.now(),
                type: 'normal'
            };

            addMessage(message);
            chatInput.value = '';
        });

        // 俳句投稿
        const haikuForm = document.getElementById('haiku-form');
        if (haikuForm) {
            haikuForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const haikuInput = document.getElementById('haiku-input');
                const haikuText = haikuInput.value.trim();
                if (!haikuText) return;

                const haiku = {
                    id: `haiku_${Date.now()}_${Math.random()}`,
                    userId: currentUser.id,
                    userName: currentUser.characterName,
                    content: haikuText,
                    timestamp: Date.now()
                };

                addHaiku(haiku);
                haikuInput.value = '';
            });
        }

        // 披講ボタン
        const hikikouBtn = document.getElementById('hikikou-btn');
        if (hikikouBtn) {
            hikikouBtn.addEventListener('click', () => {
                const hikikouInput = document.getElementById('hikikou-input');
                const content = hikikouInput.value.trim();
                if (!content) return;

                displayHaikuOnBlackboard(content);
                hikikouInput.value = '';
            });
        }

        // 呼名ボタン
        const calloutBtn = document.getElementById('callout-btn');
        if (calloutBtn) {
            calloutBtn.addEventListener('click', () => {
                const message = {
                    id: `msg_${Date.now()}_${Math.random()}`,
                    userId: currentUser.id,
                    userName: currentUser.characterName,
                    message: `${currentUser.characterName}！`,
                    timestamp: Date.now(),
                    type: 'callout'
                };
                addMessage(message);
            });
        }

        // お庭に行くボタン
        document.getElementById('go-garden-btn').addEventListener('click', () => {
            switchToGarden();
        });

        // 教室から出るボタン
        document.getElementById('leave-btn').addEventListener('click', () => {
            if (confirm('本当に退出しますか？')) {
                const rooms = getRoomsData();
                const room = rooms[currentRoomIndex];

                // ユーザーを削除
                room.users = room.users.filter(u => u.id !== currentUser.id);

                // 主催者の場合、句会場をクリア
                if (currentUser.role === 'host' && room.hostId === currentUser.id) {
                    room.hasHost = false;
                    room.hostId = null;
                }

                saveRoomsData(rooms);
                location.reload();
            }
        });

        // 句会を終了するボタン
        const endSessionBtn = document.getElementById('end-session-btn');
        if (endSessionBtn) {
            endSessionBtn.addEventListener('click', () => {
                if (confirm('句会を終了しますか？データは保存されます。')) {
                    const rooms = getRoomsData();
                    const room = rooms[currentRoomIndex];

                    // ユーザーをクリア（データは残す）
                    room.users = [];
                    room.hasHost = false;
                    room.hostId = null;

                    saveRoomsData(rooms);
                    location.reload();
                }
            });
        }
    }
});

// グローバル関数としてエクスポート
window.displayHaikuOnBlackboard = displayHaikuOnBlackboard;
