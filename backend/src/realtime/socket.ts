import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/generateToken';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { setIO } from './io';

interface SocketData {
  userId: string;
  companyId: string | null;
}

/**
 * Room conventions used across the app:
 *  - `user:<userId>`                   — personal notifications
 *  - `company:<companyId>`             — company-wide broadcasts (rarely used directly)
 *  - `project:<companyId>:<projectId>` — Kanban board live updates
 *  - `channel:<companyId>:<channelId>` — chat messages (channelId is 'general' or a projectId)
 *
 * The companyId in project/channel room names always comes from the
 * socket's own authenticated session (set during the JWT handshake below),
 * never from what the client passes to `*:join` — otherwise two companies
 * both using the fixed channelId 'general' would land in the same literal
 * room and see each other's live messages. Project ids are globally unique
 * so that specific collision can't happen there, but every room in this
 * namespace is scoped the same way on principle: tenant isolation should
 * never depend on an id happening to be unique.
 *
 * Clients join project/channel rooms explicitly once they open that
 * screen, rather than being auto-subscribed to everything — keeps fan-out
 * bounded.
 */
export function initSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: env.clientOrigin,
      credentials: true,
    },
  });

  io.use((socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) {
        next(new Error('Authentication required'));
        return;
      }
      const payload = verifyToken(token);
      (socket.data as SocketData) = { userId: payload.userId, companyId: payload.companyId };
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const { userId, companyId } = socket.data as SocketData;

    socket.join(`user:${userId}`);
    if (companyId) socket.join(`company:${companyId}`);

    socket.on('project:join', (projectId: unknown) => {
      if (typeof projectId === 'string' && companyId) socket.join(`project:${companyId}:${projectId}`);
    });
    socket.on('project:leave', (projectId: unknown) => {
      if (typeof projectId === 'string' && companyId) socket.leave(`project:${companyId}:${projectId}`);
    });

    socket.on('channel:join', (channelId: unknown) => {
      if (typeof channelId === 'string' && companyId) socket.join(`channel:${companyId}:${channelId}`);
    });
    socket.on('channel:leave', (channelId: unknown) => {
      if (typeof channelId === 'string' && companyId) socket.leave(`channel:${companyId}:${channelId}`);
    });

    socket.on('disconnect', () => {
      logger.debug('Socket disconnected', { userId });
    });
  });

  setIO(io);
  logger.info('Socket.IO server initialized');
  return io;
}
