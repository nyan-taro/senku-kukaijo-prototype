// グローバル変数
let currentUser = null;
let currentLocation = 'garden';
let game = null;
let broadcastChannel = null;

// ローカルストレージキー
const STORAGE_KEYS = {
    USER_DATA: 'senku_kukaijo_user_data',
    SESSION_DATA: 'senku_kukaijo_session_data',
    MESSAGES: 'senku_kukaijo_messages',
    HAIKUS: 'senku_kukaijo_haikus',
    ROOM_NAME: 'senku_kukaijo_room_name',
    CURRENT_HAIKU_DISPLAY: 'senku_kukaijo_current_haiku_display'
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
function saveUserData(name, characterName, role) {
    const userData = {
        name,
        characterName,
        role,
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

// セッションデータ管理
function getSessionData() {
    return loadFromLocalStorage(STORAGE_KEYS.SESSION_DATA) || {
        users: [],
        roomName: '俳句句会'
    };
}

function updateSessionData(updates) {
    const sessionData = getSessionData();
    const updatedData = { ...sessionData, ...updates };
    saveToLocalStorage(STORAGE_KEYS.SESSION_DATA, updatedData);
    return updatedData;
}

function addUser(user) {
    const sessionData = getSessionData();
    const existingUserIndex = sessionData.users.findIndex(u => u.id === user.id);

    if (existingUserIndex !== -1) {
        sessionData.users[existingUserIndex] = user;
    } else {
        sessionData.users.push(user);
    }

    saveToLocalStorage(STORAGE_KEYS.SESSION_DATA, sessionData);
    broadcastMessage({ type: 'users_update', users: sessionData.users });
}

function removeUser(userId) {
    const sessionData = getSessionData();
    sessionData.users = sessionData.users.filter(u => u.id !== userId);
    saveToLocalStorage(STORAGE_KEYS.SESSION_DATA, sessionData);
    broadcastMessage({ type: 'users_update', users: sessionData.users });
}

function updateUserPosition(userId, x, y, location) {
    const sessionData = getSessionData();
    const user = sessionData.users.find(u => u.id === userId);
    if (user) {
        user.x = x;
        user.y = y;
        user.location = location;
        saveToLocalStorage(STORAGE_KEYS.SESSION_DATA, sessionData);
        broadcastMessage({ type: 'users_update', users: sessionData.users });
    }
}

// メッセージ管理
function getMessages() {
    return loadFromLocalStorage(STORAGE_KEYS.MESSAGES) || [];
}

function addMessage(message) {
    const messages = getMessages();
    messages.push(message);
    saveToLocalStorage(STORAGE_KEYS.MESSAGES, messages);
    broadcastMessage({ type: 'chat_message', message });
    displayMessage(message);
}

function displayMessage(message) {
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

// 俳句管理
function getHaikus() {
    return loadFromLocalStorage(STORAGE_KEYS.HAIKUS) || [];
}

function addHaiku(haiku) {
    const haikus = getHaikus();
    haikus.push(haiku);
    saveToLocalStorage(STORAGE_KEYS.HAIKUS, haikus);
    broadcastMessage({ type: 'haiku_submitted', haiku });
    displayHaiku(haiku);
}

function displayHaiku(haiku) {
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
    saveToLocalStorage(STORAGE_KEYS.CURRENT_HAIKU_DISPLAY, content);
    broadcastMessage({ type: 'haiku_displayed', content });
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

// BroadcastChannel設定
function setupBroadcastChannel() {
    broadcastChannel = new BroadcastChannel('senku_kukaijo_channel');

    broadcastChannel.onmessage = (event) => {
        const data = event.data;

        switch (data.type) {
            case 'users_update':
                updateOtherPlayersInGame(data.users);
                break;
            case 'chat_message':
                displayMessage(data.message);
                break;
            case 'haiku_submitted':
                displayHaiku(data.haiku);
                break;
            case 'haiku_displayed':
                updateBlackboard(data.content);
                break;
            case 'room_name_updated':
                updateRoomNameDisplay(data.roomName);
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
    const width = gameContainer.clientWidth;
    const height = gameContainer.clientHeight;

    const config = {
        type: Phaser.AUTO,
        parent: 'game-container',
        width: width || 600,
        height: height || 600,
        backgroundColor: '#f0f0f0',
        scene: [ClassroomScene, GardenScene],
    };

    game = new Phaser.Game(config);
}

function switchScene(sceneName) {
    if (!game) return;

    game.scene.stop('ClassroomScene');
    game.scene.stop('GardenScene');
    game.scene.start(sceneName, {
        userId: currentUser.id,
        onPositionUpdate: (x, y) => {
            updateUserPosition(currentUser.id, x, y, currentLocation);
        }
    });

    // 既存ユーザーを表示
    updateOtherPlayersInGame(getSessionData().users);

    // 黒板の内容を復元
    if (sceneName === 'ClassroomScene') {
        const currentHaikuDisplay = loadFromLocalStorage(STORAGE_KEYS.CURRENT_HAIKU_DISPLAY);
        if (currentHaikuDisplay) {
            setTimeout(() => updateBlackboard(currentHaikuDisplay), 100);
        }
    }
}

function updateOtherPlayersInGame(users) {
    if (!game) return;

    const classroomScene = game.scene.getScene('ClassroomScene');
    const gardenScene = game.scene.getScene('GardenScene');

    if (classroomScene && classroomScene.scene.isActive()) {
        classroomScene.updateOtherPlayers(users);
    }

    if (gardenScene && gardenScene.scene.isActive()) {
        gardenScene.updateOtherPlayers(users);
    }
}

// UI更新
function updateRoomNameDisplay(roomName) {
    const sessionData = updateSessionData({ roomName });
    const locationTitle = document.getElementById('location-title');
    if (currentLocation === 'classroom') {
        locationTitle.textContent = `教室: ${roomName}`;
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

// ログイン処理
document.addEventListener('DOMContentLoaded', () => {
    const loginScreen = document.getElementById('login-screen');
    const mainScreen = document.getElementById('main-screen');
    const loginForm = document.getElementById('login-form');
    const roleSelect = document.getElementById('role-select');
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
            loginWithData(
                savedUserData.name,
                savedUserData.characterName,
                savedUserData.role,
                savedUserData.role === 'host' ? (getSessionData().roomName || '俳句句会') : null
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
        const roomName = document.getElementById('room-name-input').value;

        if (!name || !characterName) return;

        loginWithData(name, characterName, role, role === 'host' ? roomName : null);
    });

    function loginWithData(name, characterName, role, roomName) {
        // ユーザーデータ保存
        saveUserData(name, characterName, role);

        // 現在のユーザーを設定
        currentUser = {
            id: generateId(),
            name,
            characterName,
            role,
            location: 'garden',
            x: 300,
            y: 300
        };

        // セッションに追加
        addUser(currentUser);

        // 教室名を更新
        if (role === 'host' && roomName) {
            updateRoomNameDisplay(roomName);
        }

        // UI設定
        setupUIForRole(role);

        // ログイン情報表示
        document.getElementById('login-info').textContent = `${characterName} でログイン中`;

        // 画面切替
        loginScreen.style.display = 'none';
        mainScreen.style.display = 'flex';

        // ゲーム初期化
        initGame();
        setTimeout(() => {
            switchScene('GardenScene');
        }, 100);

        // 既存のメッセージ・俳句を表示
        getMessages().forEach(displayMessage);
        getHaikus().forEach(displayHaiku);

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

        // 教室に入るボタン
        document.getElementById('enter-classroom-btn').addEventListener('click', () => {
            currentLocation = 'classroom';
            switchScene('ClassroomScene');
            updateUserPosition(currentUser.id, 300, 300, 'classroom');

            document.getElementById('location-title').textContent = `教室: ${getSessionData().roomName}`;
            document.getElementById('enter-classroom-btn').style.display = 'none';
        });

        // お庭に行くボタン
        document.getElementById('go-garden-btn').addEventListener('click', () => {
            currentLocation = 'garden';
            switchScene('GardenScene');
            updateUserPosition(currentUser.id, 300, 300, 'garden');

            document.getElementById('location-title').textContent = 'お庭';
            document.getElementById('enter-classroom-btn').style.display = 'block';
        });

        // 教室から出るボタン
        document.getElementById('leave-btn').addEventListener('click', () => {
            if (confirm('本当に退出しますか？')) {
                removeUser(currentUser.id);
                location.reload();
            }
        });

        // 句会を終了するボタン
        const endSessionBtn = document.getElementById('end-session-btn');
        if (endSessionBtn) {
            endSessionBtn.addEventListener('click', () => {
                if (confirm('句会を終了しますか？全員のデータがクリアされます。')) {
                    // 全データをクリア
                    localStorage.removeItem(STORAGE_KEYS.SESSION_DATA);
                    localStorage.removeItem(STORAGE_KEYS.MESSAGES);
                    localStorage.removeItem(STORAGE_KEYS.HAIKUS);
                    localStorage.removeItem(STORAGE_KEYS.CURRENT_HAIKU_DISPLAY);

                    broadcastMessage({ type: 'session_ended' });
                    location.reload();
                }
            });
        }
    }

    function getRoleName(role) {
        switch (role) {
            case 'host': return '主催者';
            case 'judge': return '選者';
            case 'participant': return '一般参加者';
            default: return '';
        }
    }
});

// グローバル関数としてエクスポート
window.displayHaikuOnBlackboard = displayHaikuOnBlackboard;
