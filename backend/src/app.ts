import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';

import { env } from './config/env';
import { notFound, errorHandler } from './middleware/errorHandler';

import authRoutes from './modules/auth/auth.routes';
import taskRoutes from './modules/task/task.routes';
import platformRoutes from './modules/platform/platform.routes';
import userRoutes from './modules/user/user.routes';
import departmentRoutes from './modules/department/department.routes';
import projectRoutes from './modules/project/project.routes';
import notificationRoutes from './modules/notification/notification.routes';
import activityLogRoutes from './modules/activity/activityLog.routes';
import meetingRoutes from './modules/meeting/meeting.routes';
import chatRoutes from './modules/chat/chat.routes';
import calendarRoutes from './modules/calendar/calendar.routes';
import attendanceRoutes from './modules/attendance/attendance.routes';
import leaveRoutes from './modules/leave/leave.routes';
import aiRoutes from './modules/ai/ai.routes';
import reportsRoutes from './modules/reports/reports.routes';
import fileRoutes from './modules/files/file.routes';
import companyRoutes from './modules/company/company.routes';

export function createApp(): Application {
  const app = express();

  app.set('trust proxy', 1);

  app.use(helmet());
  const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.trim();
      if (env.clientOrigin.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      const vercelOriginRegex = /^https:\/\/[\w-]+\.vercel\.app$/;
      if (vercelOriginRegex.test(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${normalizedOrigin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    optionsSuccessStatus: 204,
  };

  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(mongoSanitize());

  if (env.nodeEnv !== 'test') {
    app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
  }

  app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    service: 'workpilot-backend',
    version: '2.0.0',
    env: env.nodeEnv
  });
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    service: 'workpilot-backend',
    version: '2.0.0',
    env: env.nodeEnv
  });
});

  app.use('/api/auth', authRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/platform', platformRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/departments', departmentRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/activity', activityLogRoutes);
  app.use('/api/meetings', meetingRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/calendar', calendarRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/leave', leaveRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/reports', reportsRoutes);
  app.use('/api/files', fileRoutes);
  app.use('/api/company', companyRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
