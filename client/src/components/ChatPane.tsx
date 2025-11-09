import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Haiku, UserRole } from '../types';

interface ChatPaneProps {
  role: UserRole;
  userName: string;
  messages: ChatMessage[];
  haikus: Haiku[];
  currentUserName: string;
  onSendMessage: (message: string, type?: 'normal' | 'announcement' | 'callout') => void;
  onSubmitHaiku: (content: string) => void;
  onDisplayHaiku: (content: string) => void;
  onLeaveSession: () => void;
  onGoToGarden: () => void;
  onEndSession?: () => void;
}

export const ChatPane: React.FC<ChatPaneProps> = ({
  role,
  userName,
  messages,
  haikus,
  currentUserName,
  onSendMessage,
  onSubmitHaiku,
  onDisplayHaiku,
  onLeaveSession,
  onGoToGarden,
  onEndSession,
}) => {
  const [chatInput, setChatInput] = useState('');
  const [haikuInput, setHaikuInput] = useState('');
  const [hikikouInput, setHikikouInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput);
    setChatInput('');
  };

  const handleSubmitHaiku = (e: React.FormEvent) => {
    e.preventDefault();
    if (!haikuInput.trim()) return;
    onSubmitHaiku(haikuInput);
    setHaikuInput('');
  };

  const handleCallout = () => {
    onSendMessage(`${currentUserName}！`, 'callout');
  };

  const handleHikikou = () => {
    if (!hikikouInput.trim()) return;
    onDisplayHaiku(hikikouInput);
    onSendMessage(hikikouInput, 'announcement');
    setHikikouInput('');
  };

  const isHostOrJudge = role === 'host' || role === 'judge';

  return (
    <div style={styles.container}>
      {/* ログイン名表示 */}
      <div style={styles.header}>
        <span style={styles.loginInfo}>{currentUserName} でログイン中</span>
      </div>

      {/* チャット欄 */}
      <div style={{
        ...styles.chatArea,
        height: isHostOrJudge ? '40%' : '70%'
      }}>
        <h3 style={styles.sectionTitle}>チャット</h3>
        <div style={styles.messagesContainer}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                ...styles.message,
                ...(msg.type === 'announcement' ? styles.announcementMessage : {}),
                ...(msg.type === 'callout' ? styles.calloutMessage : {}),
              }}
            >
              <span style={styles.messageName}>{msg.userName}: </span>
              <span>{msg.message}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSendMessage} style={styles.inputForm}>
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            style={styles.input}
            placeholder="メッセージを入力..."
          />
          <button type="submit" style={styles.sendButton}>送信</button>
        </form>
      </div>

      {/* 披講欄（主催者・選者のみ） */}
      {isHostOrJudge && (
        <div style={styles.hikikouArea}>
          <h3 style={styles.sectionTitle}>披講</h3>
          <div style={styles.hikikouInputContainer}>
            <input
              type="text"
              value={hikikouInput}
              onChange={(e) => setHikikouInput(e.target.value)}
              style={styles.input}
              placeholder="披講する句を入力..."
            />
            <button onClick={handleHikikou} style={styles.hikikouButton}>
              披講ボタン
            </button>
          </div>
        </div>
      )}

      {/* 投句欄（一般のみ）または作品一覧（主催者・選者） */}
      {role === 'participant' ? (
        <div style={styles.haikuArea}>
          <h3 style={styles.sectionTitle}>投句</h3>
          <form onSubmit={handleSubmitHaiku} style={styles.haikuForm}>
            <textarea
              value={haikuInput}
              onChange={(e) => setHaikuInput(e.target.value)}
              style={styles.textarea}
              placeholder="俳句を入力..."
              rows={3}
            />
            <button type="submit" style={styles.submitButton}>投句する</button>
          </form>
        </div>
      ) : (
        <div style={styles.haikuListArea}>
          <h3 style={styles.sectionTitle}>投句作品一覧</h3>
          <div style={styles.haikuList}>
            {haikus.map((haiku) => (
              <div key={haiku.id} style={styles.haikuItem}>
                <div style={styles.haikuContent}>{haiku.content}</div>
                <div style={styles.haikuAuthor}>- {haiku.userName}</div>
                {isHostOrJudge && (
                  <button
                    onClick={() => onDisplayHaiku(haiku.content)}
                    style={styles.displayButton}
                  >
                    黒板に表示
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ボタンエリア */}
      <div style={styles.buttonArea}>
        {role === 'participant' && (
          <button onClick={handleCallout} style={styles.actionButton}>
            呼名する
          </button>
        )}
        <button onClick={onGoToGarden} style={styles.actionButton}>
          お庭にいく
        </button>
        <button onClick={onLeaveSession} style={styles.actionButton}>
          教室から出る
        </button>
        {role === 'host' && onEndSession && (
          <button onClick={onEndSession} style={styles.endButton}>
            句会を終了する
          </button>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
  },
  header: {
    padding: '10px 15px',
    backgroundColor: '#2196F3',
    color: 'white',
    fontWeight: 'bold',
  },
  loginInfo: {
    fontSize: '14px',
  },
  chatArea: {
    display: 'flex',
    flexDirection: 'column',
    padding: '10px',
    borderBottom: '2px solid #ddd',
    overflow: 'hidden',
  },
  sectionTitle: {
    margin: '0 0 10px 0',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    backgroundColor: 'white',
    borderRadius: '6px',
    padding: '10px',
    marginBottom: '10px',
  },
  message: {
    marginBottom: '8px',
    padding: '6px 10px',
    borderRadius: '4px',
    backgroundColor: '#f5f5f5',
  },
  announcementMessage: {
    backgroundColor: '#fff3cd',
    border: '2px solid #ffc107',
    fontWeight: 'bold',
    fontSize: '16px',
  },
  calloutMessage: {
    backgroundColor: '#d1ecf1',
    border: '2px solid #17a2b8',
    fontWeight: 'bold',
  },
  messageName: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  inputForm: {
    display: 'flex',
    gap: '5px',
  },
  input: {
    flex: 1,
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  sendButton: {
    padding: '8px 16px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  hikikouArea: {
    padding: '10px',
    borderBottom: '2px solid #ddd',
    height: '10%',
  },
  hikikouInputContainer: {
    display: 'flex',
    gap: '5px',
  },
  hikikouButton: {
    padding: '8px 16px',
    backgroundColor: '#ff9800',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
  },
  haikuArea: {
    padding: '10px',
    height: '20%',
    borderBottom: '2px solid #ddd',
  },
  haikuForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    height: 'calc(100% - 30px)',
  },
  textarea: {
    flex: 1,
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    resize: 'none',
  },
  submitButton: {
    padding: '8px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  haikuListArea: {
    padding: '10px',
    height: '40%',
    borderBottom: '2px solid #ddd',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  haikuList: {
    flex: 1,
    overflowY: 'auto',
    backgroundColor: 'white',
    borderRadius: '6px',
    padding: '10px',
  },
  haikuItem: {
    marginBottom: '12px',
    padding: '10px',
    backgroundColor: '#f5f5f5',
    borderRadius: '6px',
    borderLeft: '4px solid #4CAF50',
  },
  haikuContent: {
    fontSize: '14px',
    marginBottom: '5px',
    whiteSpace: 'pre-wrap',
  },
  haikuAuthor: {
    fontSize: '12px',
    color: '#666',
    textAlign: 'right',
    marginBottom: '5px',
  },
  displayButton: {
    padding: '4px 12px',
    backgroundColor: '#ff9800',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  buttonArea: {
    padding: '10px',
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    height: '10%',
    alignItems: 'center',
  },
  actionButton: {
    padding: '10px 15px',
    backgroundColor: '#607D8B',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '12px',
  },
  endButton: {
    padding: '10px 15px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '12px',
  },
};
