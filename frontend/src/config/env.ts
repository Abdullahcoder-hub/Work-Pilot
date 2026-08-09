const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Defensive normalization: every route on the backend is mounted under
// /api (e.g. /api/auth/login), so a base URL that's missing that suffix
// silently 404s on every single request — this exact mistake has
// happened twice already (once in a hand-typed .env, once in a deployed
// Vercel env var). Rather than rely on everyone remembering to type
// "/api" correctly, strip any trailing slash and append /api if it's not
// already there, so VITE_API_BASE_URL works whether it's set to
// "https://api.example.com" or "https://api.example.com/api".
function normalizeApiBaseUrl(url: string): string {
  const trimmed = url.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

const apiBaseUrl = normalizeApiBaseUrl(rawApiBaseUrl);

export const config = {
  apiBaseUrl,
  // Socket.IO connects to the server root, not the /api prefix.
  socketUrl: import.meta.env.VITE_SOCKET_URL || apiBaseUrl.replace(/\/api\/?$/, ''),
};
