'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function useSocket(): Socket | null {
  const { isAuthenticated, token } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    // Avoid double-connect in React Strict Mode
    if (socketRef.current?.connected) return;

    const socket = io(`${API_URL}/messages`, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token]);

  return socketRef.current;
}
