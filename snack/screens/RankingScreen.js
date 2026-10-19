import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getRanking } from '../services/api';
import { presentationSkills } from '../data/presentationRatings';
import { screenStyles } from '../styles/screenStyles';
import { colors } from '../styles/colors';
import { AvatarImage } from '../components/AvatarImage';
import { FilterChips } from '../components/FilterChips';

const PERIODS = [
  { id: '0', label: 'Desde o início' },
  { id: '90', label: 'Últimos 90 dias' },
  { id: '30', label: 'Últimos 30 dias' },
];
const MEDALS = ['🥇', '🥈', '🥉'];

// Três atributos com maior média, para mostrar em que o apresentador se destaca.
function topSkills(averageSkills = {}) {
  return presentationSkills
    .map((s) => ({ label: s.label, value: Number(averageSkills[s.id] || 0) }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);
}

// Caso de uso #007 Visualizar Ranking de Apresentadores (dados reais das avaliações).
export function RankingScreen() {
  const navigation = useNavigation();
  const [period, setPeriod] = useState('0');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try { setItems(await getRanking(Number(period))); }
    catch (e) { setError(e.message || 'Não foi possível carregar o ranking.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [period]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  function openSpeaker(item) {
    navigation.navigate('SpeakerProfile', { speakerId: item.speaker.id, speakerName: item.speaker.name, speakerAvatar: item.speaker.avatar });
  }

  return (
    <ScrollView
      contentContainerStyle={[screenStyles.listContent, { paddingBottom: 140 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
    >
      <View style={screenStyles.sectionCard}>
        <Text style={screenStyles.sectionTitle}>Ranking de apresentadores</Text>
        <Text style={screenStyles.sectionText}>
          A pontuação geral (0 a 99) é a média dos atributos avaliados pelo público: clareza, domínio do conteúdo, engajamento, storytelling, gestão de tempo e recursos visuais.
        </Text>
        <FilterChips options={PERIODS} value={period} onChange={setPeriod} style={{ marginTop: 10 }} />
      </View>

      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} /> : null}
      {error ? <Text style={{ color: '#d93025', marginTop: 12 }}>{error}</Text> : null}

      {!loading && !error && items.length === 0 ? (
        <View style={[screenStyles.sectionCard, { alignItems: 'center', gap: 8 }]}>
          <MaterialCommunityIcons name="trophy-outline" size={40} color={colors.primary} />
          <Text style={screenStyles.rowTitle}>O ranking ainda não tem dados suficientes</Text>
          <Text style={[screenStyles.sectionText, { textAlign: 'center' }]}>
            Ele aparece quando os participantes avaliarem as primeiras apresentações.
          </Text>
        </View>
      ) : null}

      {!loading && items.map((item) => (
        <TouchableOpacity key={item.speaker.id} style={screenStyles.sectionCard} onPress={() => openSpeaker(item)} accessibilityLabel={`${item.position}º ${item.speaker.name}, ${item.overall} pontos`}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ fontSize: item.position <= 3 ? 26 : 16, width: 34, textAlign: 'center', fontWeight: '900', color: colors.textMuted }}>
              {MEDALS[item.position - 1] || `${item.position}º`}
            </Text>
            <AvatarImage value={item.speaker.avatar} size={42} />
            <View style={{ flex: 1 }}>
              <Text style={screenStyles.rowTitle}>{item.speaker.name}</Text>
              <Text style={screenStyles.rowSubtitle}>
                {item.averageStars.toFixed(1)} ★ · {item.totalRatings} avaliaç{item.totalRatings === 1 ? 'ão' : 'ões'}
              </Text>
            </View>
            <Text style={{ fontSize: 22, fontWeight: '900', color: colors.primary }}>{item.overall}</Text>
          </View>

          {topSkills(item.averageSkills).length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {topSkills(item.averageSkills).map((skill) => (
                <View key={skill.label} style={{ backgroundColor: colors.primarySoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}>
                  <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700' }}>{skill.label} {skill.value}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
