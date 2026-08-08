import { Server } from 'socket.io';

let io: Server | null = null;

export function setIO(instance: Server): void {
  io = instance;
}

/** Returns null before the server has started — callers must handle that gracefully. */
export function getIO(): Server | null {
  return io;
}
