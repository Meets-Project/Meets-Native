import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { presentationSkills } from '../data/presentationRatings';
import { getPublicSpeakerRatingSummary } from '../services/ratingsStorage';
import { colors } from '../styles/colors';
import { screenStyles } from '../styles/screenStyles';

export function SpeakerProfileScreen() {
  const route = useRoute();
  const { speakerId = '', speakerName = 'Apresentador', speakerAvatar = '🎤' } = route.params || {};

  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadSummary() {
        setIsLoading(true);

        try {
          const result = await getPublicSpeakerRatingSummary(speakerId);
          if (!isActive) return;
          setSummary(result);
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      }

      loadSummary();

      return () => {
        isActive = false;
      };
    }, [speakerId]),
  );

  if (isLoading) {
    return (
      <View style={[screenStyles.listContent, { justifyContent: 'center', alignItems: 'center', minHeight: 360 }]}> 
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[screenStyles.sectionTitle, { marginTop: 16 }]}>Carregando perfil publico...</Text>
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
        <Text style={screenStyles.profileRole}>Perfil publico de apresentador</Text>
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
