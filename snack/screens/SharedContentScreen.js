import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getSharedContent, hasToken, participateEvent } from '../services/api';
import { colors } from '../styles/colors';
import { AvatarImage, isImageUri } from '../components/AvatarImage';
import { formatLocalDate } from '../utils/masks';

export function SharedContentScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { type, id, token } = route.params || {};
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isParticipating, setIsParticipating] = useState(false);
  const [participating, setParticipating] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    hasToken().then(setIsLoggedIn).catch(() => setIsLoggedIn(false));
    getSharedContent(type, id, token)
      .then((result) => {
        if (active) {
          setData(result);
          setIsParticipating(Boolean(result?.is_participating));
        }
      })
      .catch((e) => { if (active) setError(e?.message || 'Este conteúdo não está disponível para você.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [type, id, token]);

  if (loading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color={colors.primary} /><Text style={{ marginTop: 12, color: colors.textMuted }}>Abrindo link...</Text></View>;
  if (error || !data) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 }}><MaterialCommunityIcons name="link-off" size={54} color={colors.textMuted} /><Text style={{ fontSize: 18, fontWeight: '900', color: colors.text, marginTop: 12, textAlign: 'center' }}>Conteúdo indisponível</Text><Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 6 }}>{error || 'Link inválido ou sem permissão.'}</Text></View>;

  if (data.type === 'user') {
    const u = data.user;
    return <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 50 }}>
      <View style={{ backgroundColor: '#fff', borderRadius: 18, padding: 22, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
        <AvatarImage value={u.avatar} size={92} />
        <Text style={{ fontSize: 24, fontWeight: '900', color: colors.text, marginTop: 12 }}>{u.name}</Text>
        <Text style={{ color: colors.primary, fontWeight: '700', marginTop: 3 }}>{u.role || 'Membro do Meets'}</Text>
        {u.city ? <Text style={{ color: colors.textMuted, marginTop: 5 }}>{u.city}</Text> : null}
        {u.bio ? <Text style={{ color: colors.text, textAlign: 'center', marginTop: 14, lineHeight: 20 }}>{u.bio}</Text> : null}
        <View style={{ flexDirection: 'row', marginTop: 18, gap: 24 }}>
          <View style={{ alignItems: 'center' }}><Text style={{ fontWeight: '900', fontSize: 18 }}>{u.connections || 0}</Text><Text style={{ color: colors.textMuted, fontSize: 11 }}>Conexões</Text></View>
          <View style={{ alignItems: 'center' }}><Text style={{ fontWeight: '900', fontSize: 18 }}>{Number(u.rating || 0).toFixed(1)}</Text><Text style={{ color: colors.textMuted, fontSize: 11 }}>Média</Text></View>
        </View>
      </View>
    </ScrollView>;
  }

  const item = data;
  const isEvent = item.type === 'event';
  const isPresentation = item.type === 'presentation';
  const participationEventId = isEvent ? item.id : item.mentioned_event?.id;

  async function handleParticipation() {
    if (!participationEventId) return;
    if (!isLoggedIn) {
      navigation.navigate('Login');
      return;
    }
    setParticipating(true);
    try {
      const result = await participateEvent(participationEventId);
      setIsParticipating(Boolean(result.participating));
    } catch (e) {
      setError(e?.message || 'Não foi possível confirmar sua participação.');
    } finally {
      setParticipating(false);
    }
  }

  return <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 50 }}>
    <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
      <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <AvatarImage value={item.author?.avatar} size={46} />
        <View style={{ flex: 1 }}><Text style={{ fontWeight: '900', color: colors.text }}>{item.author?.name || 'Membro'}</Text><Text style={{ color: colors.textMuted, fontSize: 11 }}>{isEvent ? 'Evento' : isPresentation ? 'Apresentação' : 'Publicação'}</Text></View>
        <MaterialCommunityIcons name={isEvent ? 'calendar-star' : isPresentation ? 'presentation' : 'post-outline'} size={24} color={colors.primary} />
      </View>
      {item.image && isImageUri(item.image) ? <Image source={{ uri: item.image }} style={{ width: '100%', height: 250, backgroundColor: '#111' }} resizeMode="contain" /> : null}
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '900', color: colors.text }}>{item.title || 'Publicação'}</Text>
        {item.content ? <Text style={{ color: colors.text, lineHeight: 21, marginTop: 10 }}>{item.content}</Text> : null}
        {(isEvent || isPresentation) && item.event_date ? <Text style={{ color: colors.primary, fontWeight: '800', marginTop: 12 }}>📅 {formatLocalDate(item.event_date)}{item.event_time ? ` às ${String(item.event_time).slice(0, 5)}` : ''}{item.event_end_time ? ` – ${String(item.event_end_time).slice(0, 5)}` : ''}</Text> : null}
        {isEvent && item.location ? <Text style={{ color: colors.textMuted, marginTop: 5 }}>📍 {item.location}</Text> : null}
        {isPresentation && Array.isArray(item.speakers) && item.speakers.length ? <View style={{ marginTop: 15 }}><Text style={{ fontWeight: '900', color: colors.text, marginBottom: 6 }}>Apresentadores</Text>{item.speakers.map((s) => <Text key={s.id} style={{ color: colors.textMuted, paddingVertical: 3 }}>• {s.name}</Text>)}</View> : null}
        {participationEventId ? <TouchableOpacity
          onPress={handleParticipation}
          disabled={participating}
          style={{ marginTop: 18, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: isParticipating ? colors.secondarySoft : colors.primary, borderWidth: 1, borderColor: isParticipating ? colors.secondary : colors.primary }}
        >
          <Text style={{ color: isParticipating ? colors.secondary : '#fff', fontWeight: '900' }}>
            {participating ? 'Confirmando...' : isParticipating ? 'Participação confirmada' : 'Participar deste evento'}
          </Text>
        </TouchableOpacity> : null}
      </View>
    </View>
  </ScrollView>;
}
