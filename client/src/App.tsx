import React, { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { ChatPane } from './components/ChatPane';
import { GameView } from './components/GameView';
import { useSocket } from './hooks/useSocket';
import { UserRole } from './types';
import './App.css';

type AppState = 'login' | 'session';

function App() {
  const [appState, setAppState] = useState<AppState>('login');
  const [userId] = useState(() => `user_${Date.now()}_${Math.random()}`);
  const [userName, setUserName] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('participant');
  const [currentLocation, setCurrentLocation] = useState<'garden' | 'classroom'>('garden');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);

  const {
    connected,
    users,
    messages,
    haikus,
    roomName,
    currentHaikuDisplay,
    joinSession,
    sendMessage,
    submitHaiku,
    updatePosition,
    updateRoomName,
    displayHaiku,
    leaveSession,
    endSession,
  } = useSocket();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 600);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogin = (name: string, charName: string, role: UserRole, roomNameInput?: string) => {
    setUserName(name);
    setCharacterName(charName);
    setUserRole(role);

    joinSession({
      id: userId,
      name,
      characterName: charName,
      role,
      location: 'garden',
    });

    if (role === 'host' && roomNameInput) {
      updateRoomName(roomNameInput);
    }

    setAppState('session');
  };

  const handleLeaveSession = () => {
    leaveSession();
    setAppState('login');
  };

  const handleGoToGarden = () => {
    setCurrentLocation('garden');
    updatePosition(300, 300, 'garden');
  };

  const handleGoToClassroom = () => {
    setCurrentLocation('classroom');
    updatePosition(300, 300, 'classroom');
  };

  const handlePositionUpdate = (x: number, y: number, location: 'garden' | 'classroom') => {
    updatePosition(x, y, location);
  };

  const handleEndSession = () => {
    if (window.confirm('句会を終了しますか？')) {
      endSession();
      setAppState('login');
    }
  };

  if (appState === 'login') {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // スマホ対応：横置きで3:7比率
  const containerStyle = isMobile ? styles.mobileContainer : styles.desktopContainer;
  const gameStyle = isMobile ? styles.mobileGame : styles.desktopGame;
  const chatStyle = isMobile ? styles.mobileChat : styles.desktopChat;

  return (
    <div style={containerStyle}>
      {/* 教室/お庭ペイン */}
      <div style={gameStyle}>
        <div style={styles.gameHeader}>
          <h2 style={styles.gameTitle}>
            {currentLocation === 'classroom' ? `教室: ${roomName || '俳句句会'}` : 'お庭'}
          </h2>
          {currentLocation === 'garden' && (
            <button onClick={handleGoToClassroom} style={styles.enterButton}>
              教室に入る
            </button>
          )}
        </div>
        <GameView
          userId={userId}
          location={currentLocation}
          users={users}
          currentHaikuDisplay={currentHaikuDisplay}
          onPositionUpdate={handlePositionUpdate}
        />
      </div>

      {/* チャットペイン */}
      <div style={chatStyle}>
        <ChatPane
          role={userRole}
          userName={userName}
          messages={messages}
          haikus={haikus}
          currentUserName={characterName}
          onSendMessage={sendMessage}
          onSubmitHaiku={submitHaiku}
          onDisplayHaiku={displayHaiku}
          onLeaveSession={handleLeaveSession}
          onGoToGarden={handleGoToGarden}
          onEndSession={userRole === 'host' ? handleEndSession : undefined}
        />
      </div>

      {!connected && (
        <div style={styles.connectionWarning}>
          サーバーに接続中...
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  // デスクトップレイアウト（PC）
  desktopContainer: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
  },
  desktopGame: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  desktopChat: {
    width: '400px',
    borderLeft: '2px solid #ccc',
    display: 'flex',
    flexDirection: 'column',
  },

  // モバイルレイアウト（スマホ：横置き固定、3:7比率）
  mobileContainer: {
    display: 'flex',
    flexDirection: 'row',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
  },
  mobileGame: {
    width: '30%',  // 3割
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  mobileChat: {
    width: '70%',  // 7割
    borderLeft: '2px solid #ccc',
    display: 'flex',
    flexDirection: 'column',
  },

  // 共通スタイル
  gameHeader: {
    padding: '10px',
    backgroundColor: '#3f51b5',
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameTitle: {
    margin: 0,
    fontSize: '18px',
  },
  enterButton: {
    padding: '8px 16px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  connectionWarning: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '20px 40px',
    borderRadius: '10px',
    fontSize: '18px',
    fontWeight: 'bold',
  },
};

export default App;
