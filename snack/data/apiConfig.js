import { Platform } from 'react-native';

function getDefaultHost() {
  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }

  return 'localhost';
}

function shouldUseInternalApi() {
  return process.env.EXPO_PUBLIC_USE_INTERNAL_API === 'true';
}

function normalizeBackendBaseUrl(url) {
  return url.replace(/\/api\/?$/, '').replace(/\/$/, '');
}

export function getBackendBaseUrl() {
  if (shouldUseInternalApi()) {
    return '/api';
  }

  const publicApiUrl = process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

  if (publicApiUrl && publicApiUrl.trim().length > 0) {
    return normalizeBackendBaseUrl(publicApiUrl.trim());
  }

  const host = getDefaultHost();
  const port = '3333';
  return `http://${host}:${port}`;
}
