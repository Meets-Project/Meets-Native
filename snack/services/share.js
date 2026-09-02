import { Alert, Platform, Share } from 'react-native';

export function getShareUrl(type, id) {
  let origin = 'http://localhost:8080';
  if (typeof window !== 'undefined' && window.location?.origin) {
    origin = window.location.origin;
  }
  return `${origin}/?${type}=${encodeURIComponent(id)}`;
}

export async function shareContent({ type = 'post', id = '', title = 'Meets', text = '' }) {
  const url = getShareUrl(type, id);
  const shareMessage = text ? `${text}\n\nConfira no Meets: ${url}` : `Confira no Meets: ${url}`;

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
      return;
    } catch (_) {}
  }

  if (copied) {
    Alert.alert('Link copiado!', `O link direto foi copiado para a área de transferência:\n\n${url}`);
  } else {
    Alert.alert('Compartilhar', `Link para compartilhar:\n\n${url}`);
  }
}
