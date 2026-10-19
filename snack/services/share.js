import { Alert, Platform, Share } from 'react-native';
import { registerShare } from './api';

export function getShareUrl(type, id, token = '') {
  let origin = process.env.EXPO_PUBLIC_WEB_URL || 'http://localhost:8080';
  if (typeof window !== 'undefined' && window.location?.origin) {
    origin = window.location.origin;
  }
  const query = `?share=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
  return `${origin}/${query}`;
}

export async function shareContent({ type = 'post', id = '', token = '', title = 'Meets', text = '' }) {
  const url = getShareUrl(type, id, token);

  // Registra o compartilhamento para as estatísticas (não impede o compartilhamento se falhar).
  let registered = null;
  if (id) {
    try { registered = await registerShare(type, id); } catch (_) {}
  }
  const shareMessage = `Confira no Meets: ${url}`;

  // Tenta copiar para o Clipboard
  let copied = false;
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      copied = true;
    } catch (_) {}
  }

  // Se tiver Web Share API ou for Mobile, chama o compartilhamento nativo
  if (Platform.OS !== 'web') {
    try {
      await Share.share({
        title,
        message: shareMessage,
        url,
      });
      return registered;
    } catch (_) {}
  }

  if (copied) {
    Alert.alert('Link copiado!', `O link direto foi copiado para a área de transferência:\n\n${url}`);
  } else {
    Alert.alert('Compartilhar', `Link para compartilhar:\n\n${url}`);
  }
  return registered;
}
