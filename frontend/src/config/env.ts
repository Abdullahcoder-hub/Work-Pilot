const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const config = {
  apiBaseUrl,
  // Socket.IO connects to the server root, not the /api prefix.
  socketUrl: import.meta.env.VITE_SOCKET_URL || apiBaseUrl.replace(/\/api\/?$/, ''),
};
