export type UserRole = 'host' | 'judge' | 'participant';

export interface User {
  id: string;
  socketId: string;
  name: string;
  characterName: string;
  role: UserRole;
  x?: number;
  y?: number;
  location: 'garden' | 'classroom';
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
  type: 'normal' | 'announcement' | 'callout';
}

export interface Haiku {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
}

export interface Session {
  id: string;
  roomName: string;
  hostId: string;
  users: Map<string, User>;
  messages: ChatMessage[];
  haikus: Haiku[];
  currentHaikuDisplay: string;
  isActive: boolean;
}
