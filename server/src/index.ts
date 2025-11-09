import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { User, ChatMessage, Haiku, Session } from './types.js';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// セッション管理
const session: Session = {
  id: 'main_session',
  roomName: '俳句句会',
  hostId: '',
  users: new Map(),
  messages: [],
  haikus: [],
  currentHaikuDisplay: '',
  isActive: true,
};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // セッション参加
  socket.on('join_session', (userData: Omit<User, 'socketId'>) => {
    const user: User = {
      ...userData,
      socketId: socket.id,
    };

    session.users.set(socket.id, user);

    // 主催者が最初に入った場合
    if (user.role === 'host' && !session.hostId) {
      session.hostId = user.id;
    }

    console.log(`${user.characterName} (${user.role}) joined`);

    // 全員に更新を通知
    io.emit('users_update', Array.from(session.users.values()));

    // 既存のメッセージと俳句を送信
    session.messages.forEach((msg) => {
      socket.emit('chat_message', msg);
    });

    session.haikus.forEach((haiku) => {
      socket.emit('haiku_submitted', haiku);
    });

    // 教室名を送信
    socket.emit('room_name_updated', session.roomName);

    // 現在の黒板表示を送信
    if (session.currentHaikuDisplay) {
      socket.emit('haiku_displayed', session.currentHaikuDisplay);
    }
  });

  // メッセージ送信
  socket.on('send_message', (data: { message: string; type?: 'normal' | 'announcement' | 'callout' }) => {
    const user = session.users.get(socket.id);
    if (!user) return;

    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random()}`,
      userId: user.id,
      userName: user.characterName,
      message: data.message,
      timestamp: Date.now(),
      type: data.type || 'normal',
    };

    session.messages.push(message);
    io.emit('chat_message', message);

    console.log(`Message from ${user.characterName}: ${data.message}`);
  });

  // 俳句投句
  socket.on('submit_haiku', (content: string) => {
    const user = session.users.get(socket.id);
    if (!user) return;

    const haiku: Haiku = {
      id: `haiku_${Date.now()}_${Math.random()}`,
      userId: user.id,
      userName: user.characterName,
      content,
      timestamp: Date.now(),
    };

    session.haikus.push(haiku);
    io.emit('haiku_submitted', haiku);

    console.log(`Haiku from ${user.characterName}: ${content}`);
  });

  // 位置更新
  socket.on('update_position', (data: { x: number; y: number; location: 'garden' | 'classroom' }) => {
    const user = session.users.get(socket.id);
    if (!user) return;

    user.x = data.x;
    user.y = data.y;
    user.location = data.location;

    io.emit('users_update', Array.from(session.users.values()));
  });

  // 教室名更新（主催者のみ）
  socket.on('update_room_name', (name: string) => {
    const user = session.users.get(socket.id);
    if (!user || user.role !== 'host') return;

    session.roomName = name;
    io.emit('room_name_updated', name);

    console.log(`Room name updated to: ${name}`);
  });

  // 黒板に句を表示（主催者・選者のみ）
  socket.on('display_haiku', (content: string) => {
    const user = session.users.get(socket.id);
    if (!user || (user.role !== 'host' && user.role !== 'judge')) return;

    session.currentHaikuDisplay = content;
    io.emit('haiku_displayed', content);

    console.log(`Haiku displayed on blackboard: ${content}`);
  });

  // セッション退出
  socket.on('leave_session', () => {
    const user = session.users.get(socket.id);
    if (user) {
      console.log(`${user.characterName} left`);
      session.users.delete(socket.id);
      io.emit('users_update', Array.from(session.users.values()));
    }
  });

  // 句会終了（主催者のみ）
  socket.on('end_session', () => {
    const user = session.users.get(socket.id);
    if (!user || user.role !== 'host') return;

    console.log('Session ended by host');

    // 全員を退出させる
    io.emit('session_ended');
    session.users.clear();
    session.messages = [];
    session.haikus = [];
    session.currentHaikuDisplay = '';
  });

  // 切断
  socket.on('disconnect', () => {
    const user = session.users.get(socket.id);
    if (user) {
      console.log(`${user.characterName} disconnected`);
      session.users.delete(socket.id);
      io.emit('users_update', Array.from(session.users.values()));
    }
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
