// グローバル変数
let currentUser = null;
let currentLocation = 'garden';
let currentRoomIndex = 0;
let game = null;
let broadcastChannel = null;
let currentHaikuTab = 1; // 投句欄のタブ (1 or 2)
let currentListTab = 1; // 作品一覧のタブ (1 or 2)
let submittedHaikus = { 1: [false, false], 2: [false, false] }; // 課題ごとの投句状態

// ページタイプ判定
const IS_HOST_PAGE = window.IS_HOST_PAGE || false;
const REQUIRED_PASSWORD = window.REQUIRED_PASSWORD || '';

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
            { name: '句会場1', theme1: '課題①', theme2: '課題②', hasHost: false, hostId: null, users: [], messages: [], haikus: [], currentHaikuDisplay: '', displayedHaikuIds: [] },
            { name: '句会場2', theme1: '課題①', theme2: '課題②', hasHost: false, hostId: null, users: [], messages: [], haikus: [], currentHaikuDisplay: '', displayedHaikuIds: [] },
            { name: '句会場3', theme1: '課題①', theme2: '課題②', hasHost: false, hostId: null, users: [], messages: [], haikus: [], currentHaikuDisplay: '', displayedHaikuIds: [] }
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
                // 自分が送信したメッセージは既に表示済みなのでスキップ
                if (data.message.userId !== currentUser.id) {
                    displayMessage(data.message, data.roomIndex);
                }
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

        // ログイン通知
        const loginMessage = {
            id: `msg_${Date.now()}_${Math.random()}`,
            userId: 'system',
            userName: '',
            message: `${currentUser.characterName}さんがログインしました`,
            timestamp: Date.now(),
            type: 'login'
        };
        room.messages.push(loginMessage);

        saveRoomsData(rooms);
        broadcastMessage({ type: 'chat_message', message: loginMessage, roomIndex: currentRoomIndex });
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

    // 川柳一覧表示
    updateHaikuLists();
}

function displayMessage(message, roomIndex) {
    if (roomIndex !== currentRoomIndex) return;

    const messagesContainer = document.getElementById('messages-container');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';

    // 披講・呼名・ログインは全幅表示
    if (message.type === 'login') {
        messageDiv.classList.add('message-login', 'message-fullwidth');
        messageDiv.textContent = message.message;
    } else if (message.type === 'announcement') {
        messageDiv.classList.add('message-announcement', 'message-fullwidth');
        messageDiv.innerHTML = `主催者: ${message.message}`;
    } else if (message.type === 'callout') {
        messageDiv.classList.add('message-callout', 'message-fullwidth');
        messageDiv.textContent = message.message;
    } else if (message.userId === currentUser.id) {
        // 通常のチャット：自分のメッセージは左寄せ
        messageDiv.classList.add('message-self');
        messageDiv.innerHTML = `
            <span class="message-name">${message.userName}:</span>
            <span>${message.message}</span>
        `;
    } else {
        // 通常のチャット：他人のメッセージは右寄せ
        messageDiv.classList.add('message-other');
        messageDiv.innerHTML = `
            <span class="message-name">${message.userName}:</span>
            <span>${message.message}</span>
        `;
    }

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function displayHaiku(haiku, roomIndex) {
    if (roomIndex !== currentRoomIndex) return;
    updateHaikuLists();
}

function updateHaikuLists() {
    const rooms = getRoomsData();
    const room = rooms[currentRoomIndex];

    const haikuList1 = document.getElementById('haiku-list-1');
    const haikuList2 = document.getElementById('haiku-list-2');

    if (!haikuList1 || !haikuList2) return;

    haikuList1.innerHTML = '';
    haikuList2.innerHTML = '';

    room.haikus.forEach(haiku => {
        const targetList = haiku.theme === 1 ? haikuList1 : haikuList2;
        const haikuDiv = document.createElement('div');
        haikuDiv.className = 'haiku-item';

        const isDisplayed = room.displayedHaikuIds.includes(haiku.id);

        haikuDiv.innerHTML = `
            <div class="haiku-content">${haiku.content}</div>
            ${currentUser && currentUser.role === 'host' ?
                `<button class="display-button ${isDisplayed ? 'disabled' : ''}"
                    ${isDisplayed ? 'disabled' : ''}
                    onclick="displayHaikuOnBlackboard('${haiku.id}', '${haiku.content.replace(/'/g, "\\'")}')">黒板に表示</button>` :
                ''}
        `;
        targetList.appendChild(haikuDiv);
    });
}

function displayHaikuOnBlackboard(haikuId, content) {
    const rooms = getRoomsData();
    const room = rooms[currentRoomIndex];

    room.currentHaikuDisplay = content;
    if (!room.displayedHaikuIds.includes(haikuId)) {
        room.displayedHaikuIds.push(haikuId);
    }

    saveRoomsData(rooms);
    updateBlackboard(content);
    updateHaikuLists(); // ボタンを無効化

    // チャットにも表示（主催者として）- 自分だけに表示
    const message = {
        id: `msg_${Date.now()}_${Math.random()}`,
        userId: currentUser.id,
        userName: currentUser.characterName,
        message: content,
        timestamp: Date.now(),
        type: 'announcement'
    };
    room.messages.push(message);
    saveRoomsData(rooms);
    displayMessage(message, currentRoomIndex);

    // 他のユーザーに通知
    broadcastMessage({ type: 'chat_message', message, roomIndex: currentRoomIndex });
}

function addMessage(message) {
    const rooms = getRoomsData();
    const room = rooms[currentRoomIndex];
    room.messages.push(message);
    saveRoomsData(rooms);

    // 自分の画面に表示
    displayMessage(message, currentRoomIndex);

    // 他のユーザーに通知
    broadcastMessage({ type: 'chat_message', message, roomIndex: currentRoomIndex });
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

    // 川柳をロード
    updateHaikuLists();

    // 課題を表示
    updateThemeDisplay(room.theme1, room.theme2);
}

function updateThemeDisplay(theme1, theme2) {
    const theme1Displays = document.querySelectorAll('#theme1-display, #tab-theme1, #haiku-tab-theme1');
    const theme2Displays = document.querySelectorAll('#theme2-display, #tab-theme2, #haiku-tab-theme2');

    theme1Displays.forEach(el => {
        if (el) el.textContent = theme1 || '①';
    });
    theme2Displays.forEach(el => {
        if (el) el.textContent = theme2 || '②';
    });
}

function setupUIForRole(role) {
    const chatArea = document.getElementById('chat-area');
    const hikikouArea = document.getElementById('hikikou-area');
    const haikuArea = document.getElementById('haiku-area');
    const haikuListArea = document.getElementById('haiku-list-area');
    const calloutBtn = document.getElementById('callout-btn');
    const downloadLogBtn = document.getElementById('download-log-btn');
    const downloadHaikuBtn = document.getElementById('download-haiku-btn');
    const endSessionBtn = document.getElementById('end-session-btn');

    if (role === 'participant') {
        chatArea.classList.add('participant');
        haikuArea.style.display = 'block';
        hikikouArea.style.display = 'none';
        haikuListArea.style.display = 'none';
        calloutBtn.style.display = 'block';
        downloadLogBtn.style.display = 'none';
        downloadHaikuBtn.style.display = 'none';
        endSessionBtn.style.display = 'none';
    } else if (role === 'host') {
        chatArea.classList.add('host-judge');
        haikuArea.style.display = 'none';
        hikikouArea.style.display = 'block';
        haikuListArea.style.display = 'block';
        calloutBtn.style.display = 'none';
        downloadLogBtn.style.display = 'block';
        downloadHaikuBtn.style.display = 'block';
        endSessionBtn.style.display = 'block';
    }
}

function getRoleName(role) {
    switch (role) {
        case 'host': return '主催者';
        case 'participant': return '一般';
        default: return '';
    }
}

// CSV ダウンロード機能
function downloadLog() {
    const rooms = getRoomsData();
    const room = rooms[currentRoomIndex];

    let csvContent = '\uFEFF'; // BOM for UTF-8
    csvContent += '時刻,送信者,種別,メッセージ\n';

    room.messages.forEach(msg => {
        const date = new Date(msg.timestamp);
        const time = date.toLocaleTimeString('ja-JP');
        const type = msg.type === 'announcement' ? '披講' : msg.type === 'callout' ? '呼名' : msg.type === 'login' ? 'ログイン' : 'チャット';
        const sender = msg.userName || 'システム';
        const message = msg.message.replace(/"/g, '""');
        csvContent += `${time},"${sender}",${type},"${message}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${room.name}_ログ_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
}

function downloadHaiku() {
    const rooms = getRoomsData();
    const room = rooms[currentRoomIndex];

    let csvContent = '\uFEFF'; // BOM for UTF-8
    csvContent += '課題,川柳,投稿者,時刻\n';

    room.haikus.forEach(haiku => {
        const date = new Date(haiku.timestamp);
        const time = date.toLocaleString('ja-JP');
        const theme = haiku.theme === 1 ? room.theme1 : room.theme2;
        const content = haiku.content.replace(/"/g, '""');
        const author = haiku.userName;
        csvContent += `${theme},"${content}","${author}",${time}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${room.name}_投句一覧_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
}

// ログイン処理
document.addEventListener('DOMContentLoaded', () => {
    const loginScreen = document.getElementById('login-screen');
    const mainScreen = document.getElementById('main-screen');
    const loginForm = document.getElementById('login-form');
    const continueSection = document.getElementById('continue-section');
    const continueBtn = document.getElementById('continue-btn');
    const savedInfo = document.getElementById('saved-info');

    // BroadcastChannel設定
    setupBroadcastChannel();

    // 主催者ページの場合の処理
    const passwordInput = document.getElementById('password-input');
    const roleSelect = document.getElementById('role-select');
    const genderSelect = document.getElementById('gender-select');

    // 前回のつづきボタン
    const savedUserData = loadUserData();
    if (savedUserData) {
        continueSection.style.display = 'block';
        savedInfo.textContent = `(${savedUserData.name} / ${savedUserData.characterName} / ${getRoleName(savedUserData.role)})`;

        continueBtn.addEventListener('click', () => {
            if (IS_HOST_PAGE) {
                const password = document.getElementById('password-input').value;
                if (password !== REQUIRED_PASSWORD) {
                    alert('パスワードが正しくありません。');
                    return;
                }
                const roomName = document.getElementById('room-name-input').value;
                const theme1 = document.getElementById('theme1-input').value || '課題①';
                const theme2 = document.getElementById('theme2-input').value || '課題②';
                loginWithData(
                    savedUserData.name,
                    savedUserData.characterName,
                    'host',
                    savedUserData.gender || 'human',
                    roomName,
                    theme1,
                    theme2
                );
            } else {
                loginWithData(
                    savedUserData.name,
                    savedUserData.characterName,
                    'participant',
                    savedUserData.gender || 'human',
                    null,
                    null,
                    null
                );
            }
        });
    }

    // ニックネーム文字数検証
    function validateNickname(nickname) {
        // 日本語文字（ひらがな、カタカナ、漢字）を含むかチェック
        const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(nickname);

        if (hasJapanese) {
            // 日本語が含まれる場合は6文字まで
            if (nickname.length > 6) {
                return { valid: false, message: 'ニックネームは日本語6文字までです。' };
            }
        } else {
            // ローマ字のみの場合は12文字まで
            if (nickname.length > 12) {
                return { valid: false, message: 'ニックネームはローマ字12文字までです。' };
            }
        }

        return { valid: true };
    }

    // ログインフォーム送信
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('name-input').value;
        const characterName = document.getElementById('character-name-input').value;
        const gender = genderSelect.value;

        if (!name || !characterName) return;

        // ニックネーム検証
        const nicknameValidation = validateNickname(characterName);
        if (!nicknameValidation.valid) {
            alert(nicknameValidation.message);
            return;
        }

        if (IS_HOST_PAGE) {
            // 主催者ページの処理
            const password = passwordInput.value;
            if (password !== REQUIRED_PASSWORD) {
                alert('パスワードが正しくありません。');
                return;
            }

            const roomName = document.getElementById('room-name-input').value;
            const theme1 = document.getElementById('theme1-input').value || '課題①';
            const theme2 = document.getElementById('theme2-input').value || '課題②';

            if (!roomName) {
                alert('教室名を入力してください。');
                return;
            }

            loginWithData(name, characterName, 'host', gender, roomName, theme1, theme2);
        } else {
            // 一般参加ページの処理
            loginWithData(name, characterName, 'participant', gender, null, null, null);
        }
    });

    function loginWithData(name, characterName, role, gender, roomName, theme1, theme2) {
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
            rooms[roomIndex].theme1 = theme1;
            rooms[roomIndex].theme2 = theme2;
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

        // 投句欄のタブ切り替え
        const haikuTabBtns = document.querySelectorAll('.haiku-tab-btn');
        haikuTabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabNum = parseInt(btn.dataset.tab);
                haikuTabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                document.getElementById('haiku-inputs-1').style.display = tabNum === 1 ? 'block' : 'none';
                document.getElementById('haiku-inputs-2').style.display = tabNum === 2 ? 'block' : 'none';

                currentHaikuTab = tabNum;
            });
        });

        // 投句ボタン（4つ）
        const submitBtn11 = document.getElementById('haiku-submit-1-1');
        const submitBtn12 = document.getElementById('haiku-submit-1-2');
        const submitBtn21 = document.getElementById('haiku-submit-2-1');
        const submitBtn22 = document.getElementById('haiku-submit-2-2');
        const haikuInput11 = document.getElementById('haiku-input-1-1');
        const haikuInput12 = document.getElementById('haiku-input-1-2');
        const haikuInput21 = document.getElementById('haiku-input-2-1');
        const haikuInput22 = document.getElementById('haiku-input-2-2');

        if (submitBtn11 && haikuInput11) {
            submitBtn11.addEventListener('click', () => {
                submitHaiku(haikuInput11, submitBtn11, 1);
                submittedHaikus[1][0] = true;
            });
        }

        if (submitBtn12 && haikuInput12) {
            submitBtn12.addEventListener('click', () => {
                submitHaiku(haikuInput12, submitBtn12, 1);
                submittedHaikus[1][1] = true;
            });
        }

        if (submitBtn21 && haikuInput21) {
            submitBtn21.addEventListener('click', () => {
                submitHaiku(haikuInput21, submitBtn21, 2);
                submittedHaikus[2][0] = true;
            });
        }

        if (submitBtn22 && haikuInput22) {
            submitBtn22.addEventListener('click', () => {
                submitHaiku(haikuInput22, submitBtn22, 2);
                submittedHaikus[2][1] = true;
            });
        }

        function submitHaiku(input, button, theme) {
            const haikuText = input.value.trim();
            if (!haikuText) return;

            const haiku = {
                id: `haiku_${Date.now()}_${Math.random()}`,
                userId: currentUser.id,
                userName: currentUser.characterName,
                content: haikuText,
                theme: theme,
                timestamp: Date.now()
            };

            addHaiku(haiku);

            // 入力欄を無効化（テキストは残す）
            input.disabled = true;
            button.disabled = true;
        }

        // 披講ボタン
        const hikikouBtn = document.getElementById('hikikou-btn');
        if (hikikouBtn) {
            hikikouBtn.addEventListener('click', () => {
                const hikikouInput = document.getElementById('hikikou-input');
                const content = hikikouInput.value.trim();
                if (!content) return;

                // 一時的なIDを生成（披講は黒板のみ表示で、作品一覧には追加しない）
                const tempId = `hikikou_${Date.now()}_${Math.random()}`;
                displayHaikuOnBlackboard(tempId, content);
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

        // タブ切り替え（作品一覧）
        const tabBtns = document.querySelectorAll('.theme-tab');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabNum = parseInt(btn.dataset.tab);
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                document.getElementById('haiku-list-1').style.display = tabNum === 1 ? 'block' : 'none';
                document.getElementById('haiku-list-2').style.display = tabNum === 2 ? 'block' : 'none';

                currentListTab = tabNum;
            });
        });

        // ログダウンロードボタン
        const downloadLogBtn = document.getElementById('download-log-btn');
        if (downloadLogBtn) {
            downloadLogBtn.addEventListener('click', downloadLog);
        }

        // 投句一覧ダウンロードボタン
        const downloadHaikuBtn = document.getElementById('download-haiku-btn');
        if (downloadHaikuBtn) {
            downloadHaikuBtn.addEventListener('click', downloadHaiku);
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
window.switchToGarden = switchToGarden;
