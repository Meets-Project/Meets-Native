import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { presentationSkills } from '../data/presentationRatings';
import { getPublicSpeakerRatingSummary } from '../services/ratingsStorage';
import { getConnectionStatus, toggleConnection } from '../services/api';
import { colors } from '../styles/colors';
import { screenStyles } from '../styles/screenStyles';

export function SpeakerProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { speakerId = '', speakerName = 'Apresentador', speakerAvatar = '🎤' } = route.params || {};

  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadData() {
        setIsLoading(true);
        try {
          const [result, connStatus] = await Promise.all([
            getPublicSpeakerRatingSummary(speakerId),
            speakerId ? getConnectionStatus(speakerId) : { connected: false },
          ]);
          if (!isActive) return;
          setSummary(result);
          setIsConnected(Boolean(connStatus?.connected));
        } catch (e) {
          console.error('Erro ao carregar dados do apresentador:', e);
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      }

      loadData();

      return () => {
        isActive = false;
      };
    }, [speakerId]),
  );

  async function handleToggleConnect() {
    if (!speakerId || isConnecting) return;
    setIsConnecting(true);
    try {
      const res = await toggleConnection(speakerId);
      setIsConnected(Boolean(res.connected));
    } catch (e) {
      console.error('Erro ao alternar conexão:', e);
    } finally {
      setIsConnecting(false);
    }
  }

  function handleOpenChat() {
    if (speakerId) {
      navigation.navigate('MainTabs', {
        screen: 'chat',
        params: {
          recipientId: speakerId,
          recipientName: speakerName,
          recipientAvatar: speakerAvatar,
        },
      });
    }
  }

  if (isLoading) {
    return (
      <View style={[screenStyles.listContent, { justifyContent: 'center', alignItems: 'center', minHeight: 360 }]}> 
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[screenStyles.sectionTitle, { marginTop: 16 }]}>Carregando perfil público...</Text>
      </View>
    );
  }

  const publicData = summary || {
    totalRatings: 0,
    overall: 0,
    averageSkills: {},
    recentRatings: [],
  };

  return (
    <ScrollView contentContainerStyle={screenStyles.listContent} showsVerticalScrollIndicator={false}>
      <View style={screenStyles.profileHeroCard}>
        <View style={screenStyles.profileAvatarWrap}>
          <Text style={screenStyles.profileAvatar}>{speakerAvatar}</Text>
        </View>
        <Text style={screenStyles.profileName}>{speakerName}</Text>
        <Text style={screenStyles.profileRole}>Perfil público no Meets</Text>

        {/* Actions Row */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: isConnected ? colors.primarySoft : colors.primary,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: isConnected ? colors.primary : 'transparent',
              gap: 6,
            }}
            onPress={handleToggleConnect}
            disabled={isConnecting}
          >
            <MaterialCommunityIcons
              name={isConnected ? 'account-check' : 'account-plus'}
              size={18}
              color={isConnected ? colors.primary : '#ffffff'}
            />
            <Text
              style={{
                color: isConnected ? colors.primary : '#ffffff',
                fontWeight: '800',
                fontSize: 13,
              }}
            >
              {isConnected ? 'Desconectar' : 'Conectar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#ffffff',
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 12,
              gap: 6,
            }}
            onPress={handleOpenChat}
          >
            <MaterialCommunityIcons name="chat-outline" size={18} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 13 }}>Conversar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={screenStyles.sectionCard}>
        <Text style={screenStyles.sectionTitle}>Score publico</Text>
        <View style={screenStyles.statsRow}>
          <View style={screenStyles.statBlock}>
            <Text style={screenStyles.statValue}>{publicData.overall}</Text>
            <Text style={screenStyles.statLabel}>Geral</Text>
          </View>
          <View style={screenStyles.statDivider} />
          <View style={screenStyles.statBlock}>
            <Text style={screenStyles.statValue}>{Number(publicData.averageStars || 0).toFixed(1)}</Text>
            <Text style={screenStyles.statLabel}>Média (5)</Text>
          </View>
          <View style={screenStyles.statDivider} />
          <View style={screenStyles.statBlock}>
            <Text style={screenStyles.statValue}>{publicData.totalRatings}</Text>
            <Text style={screenStyles.statLabel}>Avaliações</Text>
          </View>
        </View>
      </View>

      <View style={screenStyles.sectionCard}>
        <Text style={screenStyles.sectionTitle}>Habilidades</Text>
        {presentationSkills.map((skill, index) => (
          <View
            key={skill.id}
            style={[
              screenStyles.skillRow,
              index === presentationSkills.length - 1 && screenStyles.skillRowLast,
            ]}
          >
            <Text style={screenStyles.rowTitle}>{skill.label}</Text>
            <Text style={screenStyles.skillValueText}>{publicData.averageSkills?.[skill.id] || 0}</Text>
          </View>
        ))}
      </View>

      <View style={screenStyles.sectionCard}>
        <Text style={screenStyles.sectionTitle}>Ultimas avaliacoes</Text>
        {publicData.recentRatings.length ? (
          publicData.recentRatings.map((item, index) => (
            <View
              key={item.id}
              style={[
                screenStyles.achievementItem,
                index === publicData.recentRatings.length - 1 && screenStyles.achievementItemLast,
              ]}
            >
              <View style={screenStyles.achievementTextWrap}>
                <Text style={screenStyles.rowTitle}>{item.presentationTitle || 'Apresentacao'}</Text>
                <Text style={screenStyles.rowSubtitle}>{item.stars} estrela{item.stars > 1 ? 's' : ''}</Text>
                {item.comment ? <Text style={screenStyles.rowSubtitle}>{item.comment}</Text> : null}
              </View>
            </View>
          ))
        ) : (
          <Text style={screenStyles.sectionText}>Ainda nao ha avaliacoes publicas para este apresentador.</Text>
        )}
      </View>
    </ScrollView>
  );
}
