import { api } from './api';

const HEALTH_PATH = 'health';
const PING_INTERVAL_MS = 4 * 60 * 1000; // 4 minutes

export function initializeKeepAlive(): void {
  if (typeof window === 'undefined') return;

  const ping = async (): Promise<void> => {
    try {
      await api.get(HEALTH_PATH, { timeout: 5000 });
    } catch {
      // Ignore failures. This is only a soft keep-alive.
    }
  };

  ping();
  window.setInterval(ping, PING_INTERVAL_MS);
}
