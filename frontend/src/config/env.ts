const defaultApiBaseUrl = 'https://work-pilot-api.onrender.com';

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl;

export const config = {
  apiBaseUrl,

  socketUrl:
    import.meta.env.VITE_SOCKET_URL ||
    apiBaseUrl.replace(/\/api\/?$/, ''),
};