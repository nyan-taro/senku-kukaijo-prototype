import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { loadUserData, saveUserData } from '../utils/localStorage';

interface LoginScreenProps {
  onLogin: (name: string, characterName: string, role: UserRole, roomName?: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [role, setRole] = useState<UserRole>('participant');
  const [roomName, setRoomName] = useState('');
  const [savedData, setSavedData] = useState(loadUserData());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !characterName) return;

    // データを保存
    saveUserData({ name, characterName, role });

    onLogin(name, characterName, role, role === 'host' ? roomName : undefined);
  };

  const handleContinue = () => {
    if (!savedData) return;

    const useRoomName = savedData.role === 'host' ? roomName : undefined;
    onLogin(savedData.name, savedData.characterName, savedData.role, useRoomName);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>俳句句会へようこそ</h1>

        {savedData && (
          <div style={styles.continueSection}>
            <button onClick={handleContinue} style={styles.continueButton}>
              前回のつづき
            </button>
            <p style={styles.savedInfo}>
              ({savedData.name} / {savedData.characterName} / {getRoleName(savedData.role)})
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>役割を選択</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              style={styles.select}
            >
              <option value="participant">一般参加者</option>
              <option value="judge">選者</option>
              <option value="host">主催者</option>
            </select>
          </div>

          {role === 'host' && (
            <div style={styles.formGroup}>
              <label style={styles.label}>教室名</label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                style={styles.input}
                placeholder="例: 春の句会"
              />
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>お名前</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              placeholder="本名を入力"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>キャラクター名</label>
            <input
              type="text"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              style={styles.input}
              placeholder="ニックネームを入力"
              required
            />
          </div>

          <button type="submit" style={styles.submitButton}>
            入室する
          </button>
        </form>
      </div>
    </div>
  );
};

const getRoleName = (role: UserRole): string => {
  switch (role) {
    case 'host': return '主催者';
    case 'judge': return '選者';
    case 'participant': return '一般参加者';
  }
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f0f4f8',
    padding: '20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '40px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    maxWidth: '500px',
    width: '100%',
  },
  title: {
    fontSize: '28px',
    marginBottom: '30px',
    textAlign: 'center',
    color: '#333',
  },
  continueSection: {
    marginBottom: '30px',
    textAlign: 'center',
    paddingBottom: '20px',
    borderBottom: '1px solid #e0e0e0',
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 30px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  savedInfo: {
    marginTop: '10px',
    fontSize: '14px',
    color: '#666',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#555',
  },
  input: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '16px',
  },
  select: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '16px',
    backgroundColor: 'white',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '14px',
    fontSize: '18px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginTop: '10px',
  },
};
