import { Platform } from 'react-native';

function getDefaultHost() {
  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }

  return 'localhost';
}

function normalizeBackendBaseUrl(url) {
  return url
    .replace(/\/api\/?$/, '')
    .replace(/\/$/, '');
}

export function getBackendBaseUrl() {
  /*
   * Primeiro tenta usar a URL pública configurada
   * no ambiente do Expo/Render.
   *
   * No Render deve existir:
   *
   * EXPO_PUBLIC_API_URL=
   * https://meets-api-nw0w.onrender.com
   */
  const publicApiUrl =
    process.env.EXPO_PUBLIC_API_URL ||
    process.env.EXPO_PUBLIC_BACKEND_URL;

  if (
    publicApiUrl &&
    publicApiUrl.trim().length > 0
  ) {
    return normalizeBackendBaseUrl(
      publicApiUrl.trim()
    );
  }

  /*
   * Desenvolvimento Web local.
   *
   * Isso mantém o funcionamento antigo quando
   * o projeto estiver rodando localmente atrás
   * do proxy /api.
   */
  if (Platform.OS === 'web') {
    // Em produção (Vercel/Render Static Site), não existe o proxy
    // /api do nginx usado pelo Docker local. Por isso usamos a API
    // pública do Render quando o frontend não está em localhost.
    if (typeof window !== 'undefined') {
      const hostname = window.location?.hostname || '';
      const isLocalhost =
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '0.0.0.0';

      if (!isLocalhost) {
        return 'https://meets-api-nw0w.onrender.com';
      }
    }

    return '/api';
  }

  /*
   * Android Emulator local.
   */
  const host = getDefaultHost();
  const port = '3334';

  return `http://${host}:${port}`;
}
