import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
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
    // Cada apresentador mantém sua própria trilha de skills durante a sessão de avaliação.
    map[speaker.id] = buildInitialSkillScores();
  });
  return map;
}

export function PresentationRatingScreen() {
  const route = useRoute();
  const { postId, presentationId, presentationTitle, speakers = [], selectedSpeakerId: initialSpeakerId } = route.params || {};

  const defaultSpeakerId = initialSpeakerId || speakers[0]?.id || '';
  const [stars, setStars] = useState(1);
  const [includeSpeakerSkills, setIncludeSpeakerSkills] = useState(false);
  const [selectedSpeakerId, setSelectedSpeakerId] = useState(defaultSpeakerId);
  const [skillScoresBySpeaker, setSkillScoresBySpeaker] = useState(() => buildSkillMap(speakers));
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const selectedSpeaker = useMemo(
    () => speakers.find((speaker) => speaker.id === selectedSpeakerId) || null,
    [speakers, selectedSpeakerId],
  );

  const selectedSkills = skillScoresBySpeaker[selectedSpeakerId] || buildInitialSkillScores();

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
    if (!selectedSpeakerId) {
      return;
    }

    setSkillScoresBySpeaker((current) => {
      const currentSpeaker = current[selectedSpeakerId] || buildInitialSkillScores();
      const nextValue = Math.max(0, Math.min(99, Number(value) || 0));

      return {
        ...current,
        [selectedSpeakerId]: {
          ...currentSpeaker,
          [skillId]: nextValue,
        },
      };
    });
  }

  function handleSkillAdjust(skillId, delta) {
    if (!selectedSpeakerId) {
      return;
    }

    setSkillScoresBySpeaker((current) => {
      const currentSpeaker = current[selectedSpeakerId] || buildInitialSkillScores();
      // Mantém a escala no padrão de cards de atributo (0-99).
      const nextValue = Math.max(0, Math.min(99, (currentSpeaker[skillId] || 0) + delta));

      return {
        ...current,
        [selectedSpeakerId]: {
          ...currentSpeaker,
          [skillId]: nextValue,
        },
      };
    });
  }

  async function handleSubmit() {
    if (stars < 1 || stars > 5) {
      setFeedback('A avaliacao da apresentacao deve ficar entre 1 e 5 estrelas.');
      return;
    }

    if (includeSpeakerSkills && !selectedSpeaker) {
      setFeedback('Selecione um apresentador para avaliar as habilidades.');
      return;
    }

    setIsSubmitting(true);
    setFeedback('');

    try {
      // A nota da apresentação é sempre enviada; skills só contam quando a opção estiver ativa.
      await savePresentationRating({
        postId,
        presentationId,
        presentationTitle,
        stars,
        includeSpeakerSkills,
        speakerId: selectedSpeaker?.id || '',
        speakerName: selectedSpeaker?.name || '',
        skills: selectedSkills,
        comment,
      });

      setFeedback('Avaliacao enviada com sucesso.');
    } catch (_error) {
      setFeedback('Nao foi possivel salvar a avaliacao no momento.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={screenStyles.listContent} showsVerticalScrollIndicator={false}>
      <View style={screenStyles.sectionCard}>
        <Text style={screenStyles.sectionTitle}>{presentationTitle || 'Avaliacao de apresentacao'}</Text>
        <Text style={screenStyles.sectionText}>A avaliacao sempre comeca com 1 estrela e pode ir ate 5.</Text>
      </View>

      <View style={screenStyles.sectionCard}>
        <Text style={screenStyles.sectionTitle}>Avaliacao da apresentacao</Text>
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
                size={30}
                color={value <= stars ? colors.secondary : colors.textSubtle}
              />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={screenStyles.rowSubtitle}>Nota selecionada: {stars} estrela{stars > 1 ? 's' : ''}</Text>
      </View>

      <View style={screenStyles.sectionCard}>
        <Text style={screenStyles.sectionTitle}>Apresentadores</Text>
        <Text style={screenStyles.sectionText}>Selecione quem voce quer avaliar individualmente.</Text>

        <View style={screenStyles.speakersWrap}>
          {speakers.map((speaker) => {
            const isActive = selectedSpeakerId === speaker.id;

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
          <Text style={screenStyles.rowTitle}>Avaliar este apresentador tambem</Text>
        </TouchableOpacity>
      </View>

      {includeSpeakerSkills ? (
        <View style={screenStyles.sectionCard}>
          <Text style={screenStyles.sectionTitle}>Habilidades do apresentador</Text>
          <Text style={screenStyles.rowSubtitle}>Score geral: {speakerOverall}</Text>

          <View style={screenStyles.radarChartCard}>
            <Text style={screenStyles.sectionTitle}>Skills</Text>
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

                <Text style={screenStyles.skillValueText}>{selectedSkills[skill.id]}</Text>

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
                  const isActive = selectedSkills[skill.id] >= level.value;

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
        <Text style={screenStyles.sectionTitle}>Comentario (opcional)</Text>
        <TextInput
          style={screenStyles.ratingCommentInput}
          value={comment}
          onChangeText={setComment}
          placeholder="Conte como foi sua experiencia na apresentacao"
          placeholderTextColor={colors.textSubtle}
          multiline
        />

        <TouchableOpacity
          style={screenStyles.createButton}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={screenStyles.createButtonText}>
            {isSubmitting ? 'Enviando...' : 'Enviar avaliacao'}
          </Text>
        </TouchableOpacity>

        {feedback ? <Text style={[screenStyles.rowSubtitle, { marginTop: 10 }]}>{feedback}</Text> : null}
      </View>
    </ScrollView>
  );
}
