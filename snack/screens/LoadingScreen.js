import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { authStyles } from '../styles/authStyles';
import { colors } from '../styles/colors';
import { hasToken, getMe } from '../services/api';
import { getBackendBaseUrl } from '../data/apiConfig';

const WAKE_UP_LABELS = [
  'Conectando ao servidor...',
  'Aguardando o servidor acordar...',
  'Isso pode levar alguns segundos...',
  'Quase lá...',
];

export function LoadingScreen() {
  const navigation = useNavigation();
  const [statusLabel, setStatusLabel] = useState('Conectando ao PostgreSQL...');

  useEffect(() => {
    let alive = true;
    let labelTimer = null;
    let labelIndex = 0;

    // Fire a /health ping immediately so Render wakes up in background
    const wakeTimer = setTimeout(() => {
      fetch(`${getBackendBaseUrl()}/health`, { method: 'GET' }).catch(() => {});
    }, 0);

    // Cycle through waiting labels if startup takes a while
    labelTimer = setInterval(() => {
      labelIndex = Math.min(labelIndex + 1, WAKE_UP_LABELS.length - 1);
      if (alive) setStatusLabel(WAKE_UP_LABELS[labelIndex]);
    }, 4000);

    (async () => {
      try {
        const logged = await hasToken();
        if (!alive) return;
        const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const shareType = params?.get('share');
        const shareId = params?.get('id');
        const shareToken = params?.get('token') || '';
        const legacyType = params?.keys().next().value;
        const legacyId = legacyType ? params.get(legacyType) : '';
        if (shareType && shareId) {
          navigation.replace('SharedContent', { type: shareType, id: shareId, token: shareToken });
        } else if (legacyId && ['event', 'user', 'post'].includes(legacyType)) {
          navigation.replace('SharedContent', { type: legacyType, id: legacyId, token: '' });
        } else if (logged) {
          const me = await getMe();
          navigation.replace(
            me?.email_verified === false ? 'EmailVerification' : 'MainTabs',
            me?.email_verified === false ? { email: me?.email || '' } : { screen: 'home' },
          );
        } else {
          navigation.replace('Login');
        }
      } catch {
        if (alive) navigation.replace('Login');
      }
    })();

    return () => {
      alive = false;
      clearTimeout(wakeTimer);
      clearInterval(labelTimer);
    };
  }, [navigation]);

  return (
    <View style={[authStyles.screen, authStyles.loadingWrap]}>
      <View style={authStyles.logoMark}>
        <MaterialCommunityIcons name="movie-open-star-outline" size={42} color="#fff" />
      </View>
      <Text style={authStyles.loadingTitle}>Meets</Text>
      <Text style={authStyles.loadingSubtitle}>{statusLabel}</Text>
      <ActivityIndicator style={authStyles.loadingSpinner} size="large" color={colors.primary} />
    </View>
  );
}
