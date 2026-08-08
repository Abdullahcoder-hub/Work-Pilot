import { io, Socket } from 'socket.io-client';
import { config } from '../config/env';

let socket: Socket | null = null;
let readyCallbacks: ((socket: Socket) => void)[] = [];

/** Opens (or reuses) the authenticated socket connection. Call after login/session bootstrap. */
export function connectSocket(token: string): Socket {
  if (socket && socket.connected) return socket;

  if (socket) {
    socket.auth = { token };
    socket.connect();
    return socket;
  }

  socket = io(config.socketUrl, {
    auth: { token },
    withCredentials: true,
    autoConnect: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });

  readyCallbacks.forEach((cb) => cb(socket as Socket));
  readyCallbacks = [];

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

/** Returns the current socket, or null if nobody has connected yet (e.g. logged out). */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Runs `callback` with the socket as soon as one exists — immediately if
 * `connectSocket` already ran, or once it eventually does. Use this instead
 * of `getSocket()` in any effect that might mount before AuthContext has
 * had a chance to connect (component mount order isn't guaranteed relative
 * to a parent's own effects).
 */
export function onSocketReady(callback: (socket: Socket) => void): () => void {
  if (socket) {
    callback(socket);
    return () => {};
  }
  readyCallbacks.push(callback);
  return () => {
    readyCallbacks = readyCallbacks.filter((cb) => cb !== callback);
  };
}
