import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { User, ChatMessage, Haiku } from '../types';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [haikus, setHaikus] = useState<Haiku[]>([]);
  const [roomName, setRoomName] = useState<string>('');
  const [currentHaikuDisplay, setCurrentHaikuDisplay] = useState<string>('');

  useEffect(() => {
    const newSocket = io('http://localhost:3001');

    newSocket.on('connect', () => {
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('users_update', (updatedUsers: User[]) => {
      setUsers(updatedUsers);
    });

    newSocket.on('chat_message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('haiku_submitted', (haiku: Haiku) => {
      setHaikus(prev => [...prev, haiku]);
    });

    newSocket.on('room_name_updated', (name: string) => {
      setRoomName(name);
    });

    newSocket.on('haiku_displayed', (content: string) => {
      setCurrentHaikuDisplay(content);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const joinSession = (user: User) => {
    socket?.emit('join_session', user);
  };

  const sendMessage = (message: string, type: 'normal' | 'announcement' | 'callout' = 'normal') => {
    socket?.emit('send_message', { message, type });
  };

  const submitHaiku = (content: string) => {
    socket?.emit('submit_haiku', content);
  };

  const updatePosition = (x: number, y: number, location: 'garden' | 'classroom') => {
    socket?.emit('update_position', { x, y, location });
  };

  const updateRoomName = (name: string) => {
    socket?.emit('update_room_name', name);
  };

  const displayHaiku = (content: string) => {
    socket?.emit('display_haiku', content);
  };

  const leaveSession = () => {
    socket?.emit('leave_session');
  };

  const endSession = () => {
    socket?.emit('end_session');
  };

  return {
    socket,
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
    endSession
  };
};
