import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { presentationSkills } from '../data/presentationRatings';
import { savePresentationRating, buildInitialSkillScores } from '../services/ratingsStorage';
import { colors } from '../styles/colors';
import { screenStyles } from '../styles/screenStyles';

const skillPresets = [
  { label: 'Base', value: 50 },
  { label: 'Bom', value: 70 },
  { label: 'Elite', value: 90 },
];

const visualLevels = [
  { label: 'Nivel 1', value: 20 },
  { label: 'Nivel 2', value: 40 },
  { label: 'Nivel 3', value: 60 },
  { label: 'Nivel 4', value: 80 },
  { label: 'Nivel 5', value: 99 },
];

function buildSkillMap(speakers = []) {
  const map = {};
  speakers.forEach((speaker) => {
    map[speaker.id] = buildInitialSkillScores();
  });
  return map;
}

export function PresentationRatingScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params || {};
  const availableList = [];
  const loadingAvailable = false;

  const [selectedPostId, setSelectedPostId] = useState(params.postId || '');
  const [selectedPresId, setSelectedPresId] = useState(params.presentationId || '');
  const [selectedTitle, setSelectedTitle] = useState(params.presentationTitle || '');
  const [rawSpeakers, setRawSpeakers] = useState(params.speakers || []);

  // Build normalized speakers list
  const speakers = useMemo(() => {
    if (Array.isArray(rawSpeakers) && rawSpeakers.length > 0) {
      return rawSpeakers;
    }
    if (params.fallbackSpeakerId || params.speakerId) {
      return [{
        id: params.fallbackSpeakerId || params.speakerId,
        name: params.fallbackSpeakerName || params.speakerName || 'Apresentador',
        avatar: '🎤',
      }];
    }
    return [];
  }, [rawSpeakers, params]);

  const defaultSpeakerId = params.selectedSpeakerId || params.speakerId || speakers[0]?.id || '';
  const [stars, setStars] = useState(1);
  const [includeSpeakerSkills, setIncludeSpeakerSkills] = useState(false);
  const [selectedSpeakerId, setSelectedSpeakerId] = useState(defaultSpeakerId);
  const [skillScoresBySpeaker, setSkillScoresBySpeaker] = useState(() => buildSkillMap(speakers));
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const selectedSpeaker = useMemo(
    () => speakers.find((speaker) => speaker.id === selectedSpeakerId) || (speakers.length ? speakers[0] : null),
    [speakers, selectedSpeakerId],
  );

  const selectedSkills = (selectedSpeaker?.id && skillScoresBySpeaker[selectedSpeaker.id])
    ? skillScoresBySpeaker[selectedSpeaker.id]
    : buildInitialSkillScores();

  const speakerOverall = useMemo(() => {
    const values = Object.values(selectedSkills);
    if (!values.length) return 0;
    const sum = values.reduce((acc, value) => acc + value, 0);
    return Math.round(sum / values.length);
  }, [selectedSkills]);

  const radarData = useMemo(() => {
    const centerX = 150;
    const centerY = 120;
    const outerRadius = 90;

    return presentationSkills.map((skill, index) => {
      const angle = (-Math.PI / 2) + (index / presentationSkills.length) * Math.PI * 2;
      const valueRadius = (selectedSkills[skill.id] / 100) * outerRadius;
      const pointX = centerX + Math.cos(angle) * valueRadius;
      const pointY = centerY + Math.sin(angle) * valueRadius;
      const labelX = centerX + Math.cos(angle) * (outerRadius + 28);
      const labelY = centerY + Math.sin(angle) * (outerRadius + 28);

      return {
        ...skill,
        angle,
        pointX,
        pointY,
        labelX,
        labelY,
      };
    });
  }, [selectedSkills]);

  const radarPolygon = useMemo(() => {
    return radarData.map((item) => `${item.pointX},${item.pointY}`).join(' ');
  }, [radarData]);

  const radarGridLevels = Array.from({ length: 4 }, (_, levelIndex) => {
    const levelFactor = (levelIndex + 1) / 4;
    return radarData
      .map((item) => {
        const x = 150 + Math.cos(item.angle) * (90 * levelFactor);
        const y = 120 + Math.sin(item.angle) * (90 * levelFactor);
        return `${x},${y}`;
      })
      .join(' ');
  });

  function handleSkillSet(skillId, value) {
    const targetId = selectedSpeaker?.id;
    if (!targetId) return;

    setSkillScoresBySpeaker((current) => {
      const currentSpeaker = current[targetId] || buildInitialSkillScores();
      const nextValue = Math.max(0, Math.min(99, Number(value) || 0));

      return {
        ...current,
        [targetId]: {
          ...currentSpeaker,
          [skillId]: nextValue,
        },
      };
    });
  }

  function handleSkillAdjust(skillId, delta) {
    const targetId = selectedSpeaker?.id;
    if (!targetId) return;

    setSkillScoresBySpeaker((current) => {
      const currentSpeaker = current[targetId] || buildInitialSkillScores();
      const nextValue = Math.max(0, Math.min(99, (currentSpeaker[skillId] || 0) + delta));

      return {
        ...current,
        [targetId]: {
          ...currentSpeaker,
          [skillId]: nextValue,
        },
      };
    });
  }

  async function handleSubmit() {
    if (stars < 1 || stars > 5) {
      setFeedback('A avaliação da apresentação deve ficar entre 1 e 5 estrelas.');
      setIsSuccess(false);
      return;
    }

    const finalPresId = selectedPresId || (selectedPostId ? `presentation-${selectedPostId}` : '');
    if (!finalPresId && !selectedPostId) {
      setFeedback('Abra esta tela pelo botão de avaliação do item concluído.');
      setIsSuccess(false);
      return;
    }

    if (includeSpeakerSkills && !selectedSpeaker) {
      setFeedback('Selecione um apresentador para avaliar as habilidades.');
      setIsSuccess(false);
      return;
    }

    setIsSubmitting(true);
    setFeedback('');
    setIsSuccess(false);

    try {
      await savePresentationRating({
        postId: selectedPostId || undefined,
        presentationId: finalPresId || undefined,
        presentationTitle: selectedTitle || 'Apresentação',
        stars,
        includeSpeakerSkills,
        speakerId: selectedSpeaker?.id || undefined,
        speakerName: selectedSpeaker?.name || '',
        skills: selectedSkills,
        comment,
      });

      setIsSuccess(true);
      setFeedback('Avaliação salva com sucesso!');
      setTimeout(() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      }, 1200);
    } catch (error) {
      setIsSuccess(false);
      setFeedback(error?.message || 'Não foi possível salvar a avaliação no momento.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={screenStyles.listContent} showsVerticalScrollIndicator={false}>
      <View style={screenStyles.sectionCard}>
        <Text style={screenStyles.sectionTitle}>{selectedTitle || 'Avaliação de apresentação'}</Text>
        <Text style={screenStyles.sectionText}>A sua avaliação ajuda a comunidade e ranqueia as melhores palestras.</Text>
      </View>

      {availableList.length > 0 ? (
        <View style={screenStyles.sectionCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={screenStyles.sectionTitle}>Selecionar evento / apresentação</Text>
            {loadingAvailable ? <ActivityIndicator size="small" color={colors.primary} /> : null}
          </View>
          <Text style={[screenStyles.sectionText, { marginBottom: 10 }]}>
            Escolha abaixo o evento ou apresentação que você participou:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
            {availableList.map((item) => {
              const isSelected = item.presentationId === selectedPresId || (item.postId && item.postId === selectedPostId);
              return (
                <TouchableOpacity
                  key={item.presentationId || item.postId}
                  style={{
                    backgroundColor: isSelected ? colors.primary : '#ffffff',
                    borderWidth: 1.5,
                    borderColor: isSelected ? colors.primary : colors.border,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 12,
                    minWidth: 140,
                    maxWidth: 240,
                  }}
                  onPress={() => handleSelectPresentation(item)}
                >
                  <Text
                    style={{
                      color: isSelected ? '#ffffff' : colors.text,
                      fontWeight: '700',
                      fontSize: 13,
                    }}
                    numberOfLines={1}
                  >
                    {item.title || 'Apresentação'}
                  </Text>
                  <Text
                    style={{
                      color: isSelected ? 'rgba(255,255,255,0.85)' : colors.textMuted,
                      fontSize: 11,
                      marginTop: 2,
                    }}
                    numberOfLines={1}
                  >
                    {item.author?.name ? `por ${item.author.name}` : (item.type === 'event' ? 'Evento' : 'Palestra')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      <View style={screenStyles.sectionCard}>
        <Text style={screenStyles.sectionTitle}>Nota da apresentação</Text>
        <View style={screenStyles.ratingStarsRow}>
          {[1, 2, 3, 4, 5].map((value) => (
            <TouchableOpacity
              key={value}
              style={screenStyles.ratingStarButton}
              onPress={() => setStars(value)}
              accessibilityLabel={`Definir ${value} estrela${value > 1 ? 's' : ''}`}
            >
              <MaterialCommunityIcons
                name={value <= stars ? 'star' : 'star-outline'}
                size={32}
                color={value <= stars ? colors.secondary : colors.textSubtle}
              />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={screenStyles.rowSubtitle}>Nota selecionada: {stars} estrela{stars > 1 ? 's' : ''}</Text>
      </View>

      {speakers.length > 0 ? (
        <View style={screenStyles.sectionCard}>
          <Text style={screenStyles.sectionTitle}>Apresentadores</Text>
          <Text style={screenStyles.sectionText}>Selecione quem você quer avaliar individualmente.</Text>

          <View style={screenStyles.speakersWrap}>
            {speakers.map((speaker) => {
              const isActive = (selectedSpeaker?.id || selectedSpeakerId) === speaker.id;

              return (
                <TouchableOpacity
                  key={speaker.id}
                  style={[screenStyles.speakerPill, isActive && screenStyles.speakerPillActive]}
                  onPress={() => setSelectedSpeakerId(speaker.id)}
                >
                  <Text style={[screenStyles.speakerPillText, isActive && screenStyles.speakerPillTextActive]}>
                    {speaker.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={screenStyles.inlineToggle}
            onPress={() => setIncludeSpeakerSkills((current) => !current)}
          >
            <MaterialCommunityIcons
              name={includeSpeakerSkills ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={22}
              color={includeSpeakerSkills ? colors.primary : colors.textMuted}
            />
            <Text style={screenStyles.rowTitle}>Avaliar habilidades do apresentador também</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {includeSpeakerSkills && selectedSpeaker ? (
        <View style={screenStyles.sectionCard}>
          <Text style={screenStyles.sectionTitle}>Habilidades de {selectedSpeaker.name}</Text>
          <Text style={screenStyles.rowSubtitle}>Score geral: {speakerOverall} / 99</Text>

          <View style={screenStyles.radarChartCard}>
            <Text style={screenStyles.sectionTitle}>Radar de Skills</Text>
            <Svg width={300} height={250} viewBox="0 0 300 250">
              <Circle cx={150} cy={120} r={90} fill={colors.primarySoft} stroke={colors.border} />
              {radarGridLevels.map((polygon, index) => (
                <Polygon
                  key={`grid-${index}`}
                  points={polygon}
                  fill="none"
                  stroke={colors.border}
                  strokeWidth={1}
                />
              ))}

              {radarData.map((item) => {
                const x1 = 150;
                const y1 = 120;
                const x2 = 150 + Math.cos(item.angle) * 90;
                const y2 = 120 + Math.sin(item.angle) * 90;

                return (
                  <Line
                    key={`axis-${item.id}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={colors.border}
                    strokeWidth={1}
                  />
                );
              })}

              <Polygon points={radarPolygon} fill={colors.primarySoft} stroke={colors.primary} strokeWidth={2} />

              {radarData.map((item) => (
                <Circle
                  key={`point-${item.id}`}
                  cx={item.pointX}
                  cy={item.pointY}
                  r={4}
                  fill={colors.primary}
                />
              ))}

              {radarData.map((item) => (
                <SvgText
                  key={`label-${item.id}`}
                  x={item.labelX}
                  y={item.labelY}
                  textAnchor="middle"
                  fontSize="11"
                  fill={colors.text}
                  fontWeight="700"
                >
                  {item.label}
                </SvgText>
              ))}
            </Svg>
          </View>

          {presentationSkills.map((skill, index) => (
            <View
              key={skill.id}
              style={[
                screenStyles.skillRow,
                index === presentationSkills.length - 1 && screenStyles.skillRowLast,
              ]}
            >
              <View style={screenStyles.skillInfoWrap}>
                <Text style={screenStyles.rowTitle}>{skill.label}</Text>
                <Text style={screenStyles.rowSubtitle}>{skill.short}</Text>
              </View>

              <View style={screenStyles.skillActionsWrap}>
                <TouchableOpacity
                  style={screenStyles.skillAdjustButton}
                  onPress={() => handleSkillAdjust(skill.id, -1)}
                >
                  <MaterialCommunityIcons name="minus" size={16} color={colors.primary} />
                </TouchableOpacity>

                <Text style={screenStyles.skillValueText}>{selectedSkills[skill.id] || 0}</Text>

                <TouchableOpacity
                  style={screenStyles.skillAdjustButton}
                  onPress={() => handleSkillAdjust(skill.id, 1)}
                >
                  <MaterialCommunityIcons name="plus" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>

              <View style={screenStyles.skillPresetRow}>
                {skillPresets.map((preset) => {
                  const isPresetActive = selectedSkills[skill.id] === preset.value;

                  return (
                    <TouchableOpacity
                      key={`${skill.id}-${preset.label}`}
                      style={[
                        screenStyles.skillPresetChip,
                        isPresetActive && screenStyles.skillPresetChipActive,
                      ]}
                      onPress={() => handleSkillSet(skill.id, preset.value)}
                    >
                      <Text
                        style={[
                          screenStyles.skillPresetChipText,
                          isPresetActive && screenStyles.skillPresetChipTextActive,
                        ]}
                      >
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={screenStyles.skillLevelRow}>
                {visualLevels.map((level) => {
                  const isActive = (selectedSkills[skill.id] || 0) >= level.value;

                  return (
                    <TouchableOpacity
                      key={`${skill.id}-${level.value}`}
                      style={screenStyles.skillLevelButton}
                      onPress={() => handleSkillSet(skill.id, level.value)}
                      accessibilityLabel={`${skill.label} ${level.label}`}
                    >
                      <MaterialCommunityIcons
                        name={isActive ? 'circle' : 'circle-outline'}
                        size={14}
                        color={isActive ? colors.primary : colors.textSubtle}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <View style={screenStyles.sectionCard}>
        <Text style={screenStyles.sectionTitle}>Comentário (opcional)</Text>
        <TextInput
          style={screenStyles.ratingCommentInput}
          value={comment}
          onChangeText={setComment}
          placeholder="Conte como foi sua experiência na apresentação"
          placeholderTextColor={colors.textSubtle}
          multiline
        />

        <TouchableOpacity
          style={[screenStyles.createButton, isSubmitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={screenStyles.createButtonText}>
            {isSubmitting ? 'Salvando avaliação...' : 'Enviar avaliação'}
          </Text>
        </TouchableOpacity>

        {feedback ? (
          <View style={{ marginTop: 12, padding: 12, borderRadius: 8, backgroundColor: isSuccess ? '#e6f7eb' : '#fdeeed' }}>
            <Text style={{ color: isSuccess ? '#1e7e34' : '#d93025', fontWeight: '700', fontSize: 13 }}>
              {feedback}
            </Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
