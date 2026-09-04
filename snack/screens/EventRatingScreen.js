import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { screenStyles } from '../styles/screenStyles';
import { colors } from '../styles/colors';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { createEventRating } from '../services/api';

export function EventRatingScreen() {
  const route = useRoute();
  const eventId = route.params?.eventId;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      Alert.alert('Avaliação inválida', 'Escolha uma nota entre 1 e 5 estrelas.');
      return;
    }

    if (!eventId) return Alert.alert('Evento não encontrado', 'Abra a avaliação pela notificação do evento.');
    setBusy(true);
    try {
      await createEventRating({ eventId, stars: rating, comment });
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
