import { Platform } from 'react-native';

function getDefaultHost() {
  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }

  return 'localhost';
}

function normalizeBackendBaseUrl(url) {
  return url.replace(/\/api\/?$/, '').replace(/\/$/, '');
}

export function getBackendBaseUrl() {
  // Aplicação Web dentro do Docker/Nginx
  if (Platform.OS === 'web') {
    return '/api';
  }

  // URL definida explicitamente
  const publicApiUrl =
    process.env.EXPO_PUBLIC_API_URL ||
    process.env.EXPO_PUBLIC_BACKEND_URL;

  if (publicApiUrl && publicApiUrl.trim().length > 0) {
    return normalizeBackendBaseUrl(publicApiUrl.trim());
  }

  // Android Emulator
  const host = getDefaultHost();
  const port = '3334';

  return `http://${host}:${port}`;
}