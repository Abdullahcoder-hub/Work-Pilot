import dns from 'dns';
import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

// Use reliable public DNS servers for Atlas SRV lookups when local DNS blocks _mongodb._tcp resolution.
dns.setServers(['8.8.8.8', '8.8.4.4']);

mongoose.set('strictQuery', true);

export async function connectDB(): Promise<void> {
  mongoose.connection.on('connected', () => {
    logger.info(`MongoDB connected → ${mongoose.connection.name}`);
  });

  mongoose.connection.on('error', (err) => {
    logger.error(`MongoDB connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  try {
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
  } catch (error) {
    logger.warn('MongoDB not available at startup; continuing without database connection', {
      err: error instanceof Error ? error.message : error,
    });
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
