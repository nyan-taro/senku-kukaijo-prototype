// ユーザー役割
export type UserRole = 'host' | 'judge' | 'participant';

// ユーザー情報
export interface User {
  id: string;
  name: string;          // 本名
  characterName: string;  // キャラ名
  role: UserRole;
  x?: number;
  y?: number;
  location: 'garden' | 'classroom';
}

// チャットメッセージ
export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
  type: 'normal' | 'announcement' | 'callout';  // 呼名用
}

// 投句
export interface Haiku {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
}

// 句会セッション
export interface Session {
  id: string;
  roomName: string;      // 教室名
  hostId: string;
  users: User[];
  haikus: Haiku[];
  currentHaikuDisplay?: string;  // 黒板に表示中の句
  isActive: boolean;
}

// ローカルストレージ保存用
export interface SavedUserData {
  name: string;
  characterName: string;
  role: UserRole;
  timestamp: number;
}
