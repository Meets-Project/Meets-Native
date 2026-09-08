import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { screenStyles } from '../styles/screenStyles';
import { colors } from '../styles/colors';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { createEventRating, getEventRatingSummary } from '../services/api';

export function EventRatingScreen() {
  const route = useRoute();
  const eventId = route.params?.eventId;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [visibility, setVisibility] = useState('public');
  const [summary, setSummary] = useState(null);

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      Alert.alert('Avaliação inválida', 'Escolha uma nota entre 1 e 5 estrelas.');
      return;
    }

    if (!eventId) return Alert.alert('Evento não encontrado', 'Abra a avaliação pela notificação do evento.');
    setBusy(true);
    try {
      const updated = await createEventRating({ eventId, stars: rating, comment, visibility });
      setSummary(updated);
      const fresh = await getEventRatingSummary(eventId).catch(() => null);
      if (fresh) setSummary(fresh);
      Alert.alert('Avaliação enviada', `Você avaliou este evento com ${rating} estrela(s).`);
      setComment('');
      setRating(0);
    } catch (error) {
      Alert.alert('Não foi possível avaliar', error?.message || 'Tente novamente.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={screenStyles.listContent} showsVerticalScrollIndicator={false}>
      <View style={screenStyles.sectionCard}>
        <Text style={screenStyles.sectionTitle}>Avaliar evento</Text>
        <Text style={screenStyles.sectionText}>Como foi sua experiência neste evento?</Text>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 18, gap: 10 }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <AnimatedPressable key={star} onPress={() => setRating(star)} style={{}}>
              <Text
                style={{
                  fontSize: 32,
                  color: star <= rating ? '#f4b942' : '#d9d9d9',
                }}
              >
                ★
              </Text>
            </AnimatedPressable>
          ))}
        </View>

        <Text style={{ textAlign: 'center', marginTop: 10, color: colors.textMuted, fontWeight: '700' }}>
          {rating > 0 ? `${rating} de 5 estrelas` : 'Selecione uma nota'}
        </Text>


        <View style={{ marginTop: 18 }}>
          <Text style={{ fontWeight: '800', color: colors.text }}>Visibilidade da avaliação</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            {['public', 'anonymous'].map((option) => {
              const active = visibility === option;
              return (
                <AnimatedPressable key={option} onPress={() => setVisibility(option)} style={{ flex: 1, padding: 11, borderRadius: 10, borderWidth: 1, borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primarySoft : colors.surface }}>
                  <Text style={{ textAlign: 'center', fontWeight: '800', color: active ? colors.primary : colors.text }}>{option === 'public' ? '👁️ Pública' : '🕵️ Anônima'}</Text>
                </AnimatedPressable>
              );
            })}
          </View>
        </View>

        <TextInput
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={5}
          placeholder="Conte sua experiência no evento..."
          style={{
            minHeight: 110,
            marginTop: 18,
            padding: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surfaceSoft,
            color: colors.text,
            textAlignVertical: 'top',
          }}
        />

        {summary ? (
          <View style={{ marginTop: 14, padding: 12, borderRadius: 10, backgroundColor: colors.surfaceSoft }}>
            <Text style={{ fontWeight: '800', color: colors.text }}>Média atual: ⭐ {Number(summary.averageStars || 0).toFixed(1)} ({summary.totalRatings || 0})</Text>
          </View>
        ) : null}

        <AnimatedPressable
          style={{
            marginTop: 18,
            backgroundColor: colors.primary,
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: 'center',
          }}
          onPress={handleSubmit}
          disabled={busy}
        >
          <Text style={{ color: '#ffffff', fontWeight: '800' }}>Enviar avaliação</Text>
        </AnimatedPressable>
      </View>
    </ScrollView>
  );
}
