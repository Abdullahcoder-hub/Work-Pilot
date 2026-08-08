const defaultApiBaseUrl = 'https://work-pilot-production.up.railway.app/api';
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl;

export const config = {
  apiBaseUrl,
  // Socket.IO connects to the server root, not the /api prefix.
  socketUrl: import.meta.env.VITE_SOCKET_URL || apiBaseUrl.replace(/\/api\/?$/, ''),
};
