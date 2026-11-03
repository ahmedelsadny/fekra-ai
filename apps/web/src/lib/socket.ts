'use client';

import { io, Socket } from 'socket.io-client';
import { getToken, getBaseUrl } from './api';

/**
 * Singleton Socket.IO client for real-time chat & notifications.
 * Connects lazily — only when a JWT token exists (live mode).
 */
let socket: Socket | null = null;
let connecting: Socket | null = null;

export function getSocket(): Socket | null {
  const token = getToken();
  if (!token) return null;
  if (socket?.connected) return socket;
  if (socket) return socket;
  if (connecting) return connecting;

  const base = getBaseUrl().replace(/\/api\/v1\/?$/, '');
  connecting = io(base, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
  });

  connecting.on('connect', () => {
    socket = connecting;
  });
  connecting.on('disconnect', () => {
    /* auto-reconnect handled by socket.io */
  });
  connecting.on('connect_error', () => {
    /* server offline — UI falls back gracefully */
  });

  return connecting;
}

export function closeSocket(): void {
  socket?.disconnect();
  connecting?.disconnect();
  socket = null;
  connecting = null;
}
