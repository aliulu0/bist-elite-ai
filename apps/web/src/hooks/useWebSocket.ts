import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAuthToken, getApiKey } from '@/lib/auth';

const WS_NAMESPACE = '/pipeline';

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const listenersRef = useRef<Map<string, Set<(...args: unknown[]) => void>>>(new Map());

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;
    const auth: Record<string, string> = {};
    const token = getAuthToken();
    if (token) auth.token = token;
    const apiKey = getApiKey();
    if (apiKey) auth.apiKey = apiKey;
    socketRef.current = io(WS_NAMESPACE, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      auth,
    });

    socketRef.current.on('connect', () => setIsConnected(true));
    socketRef.current.on('disconnect', () => setIsConnected(false));
    socketRef.current.on('connect_error', () => setIsConnected(false));
    socketRef.current.on('reconnect', () => setIsConnected(true));
    socketRef.current.on('reconnect_error', () => setIsConnected(false));

    listenersRef.current.forEach((callbacks, event) => {
      callbacks.forEach((cb) => socketRef.current?.on(event, cb));
    });
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setIsConnected(false);
  }, []);

  const subscribe = useCallback((event: string, callback: (...args: unknown[]) => void) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(callback);
    socketRef.current?.on(event, callback);

    return () => {
      listenersRef.current.get(event)?.delete(callback);
      socketRef.current?.off(event, callback);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { isConnected, connect, disconnect, subscribe, socket: socketRef };
}
