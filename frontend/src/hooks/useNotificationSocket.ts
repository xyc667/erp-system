import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { message } from 'antd';
import { useAuthStore } from '../store/useAuthStore';

const WS_BASE = import.meta.env.VITE_WS_URL || '';

export function useNotificationSocket(onNotification?: () => void) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const socket = io(`${WS_BASE}/ws`, {
      path: '/socket.io',
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('notification', (payload: { title: string; message: string }) => {
      message.info(`${payload.title}: ${payload.message}`);
      onNotification?.();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, onNotification]);
}
