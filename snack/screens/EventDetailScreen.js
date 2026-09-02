import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { screenStyles } from '../styles/screenStyles';
import { colors } from '../styles/colors';
import { AnimatedPressable } from '../components/AnimatedPressable';

export function EventDetailScreen() {
  const navigation = useNavigation();
  const [liked, setLiked] = useState(false);
  const [marked, setMarked] = useState(false);
  const [comment, setComment] = useState('');

  const event = useMemo(
    () => ({
      title: 'Meetup de Product Design',
      date: '12 de março • 18h30',
      local: 'São Paulo • Centro de Inovação',
      participants: 164,
      rating: 4.8,
      description:
        'Sessão prática com estudos de caso sobre experiência do usuário, prototipação e melhoria de jornadas em produtos digitais.',
      tags: ['Design', 'UX', 'Produto'],
    }),
    [],
  );

  const handleShare = () => {
    Alert.alert('Compartilhar evento', 'Link do evento copiado para a área de transferência.');
  };

  const handleComment = () => {
    if (!comment.trim()) {
      Alert.alert('Comentário vazio', 'Escreva algo antes de publicar seu comentário.');
      return;
    }

    Alert.alert('Comentário enviado', 'Sua contribuição foi registrada no evento.');
    setComment('');
  };

  return (
    <ScrollView contentContainerStyle={screenStyles.listContent} showsVerticalScrollIndicator={false}>
      <View style={screenStyles.sectionCard}>
        <Text style={screenStyles.sectionTitle}>{event.title}</Text>
        <Text style={screenStyles.sectionText}>{event.date}</Text>
        <Text style={screenStyles.sectionText}>{event.local}</Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
          {event.tags.map((tag) => (
            <View
              key={tag}
              style={{
                backgroundColor: colors.primarySoft,
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 6,
              }}
            >
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>{tag}</Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 18, flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ ...screenStyles.sectionTitle, marginBottom: 0 }}>{event.participants}</Text>
            <Text style={screenStyles.rowSubtitle}>Participantes</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ ...screenStyles.sectionTitle, marginBottom: 0 }}>{event.rating.toFixed(1)}</Text>
            <Text style={screenStyles.rowSubtitle}>Avaliação</Text>
          </View>
        </View>
      </View>

      <View style={screenStyles.sectionCard}>
        <Text style={screenStyles.sectionTitle}>Sobre o evento</Text>
        <Text style={screenStyles.sectionText}>{event.description}</Text>
      </View>

      <View style={screenStyles.sectionCard}>
        <Text style={screenStyles.sectionTitle}>Interações</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <AnimatedPressable
            style={{
              flex: 1,
              backgroundColor: liked ? colors.primary : colors.surfaceSoft,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
            }}
            onPress={() => setLiked((value) => !value)}
          >
            <MaterialCommunityIcons name={liked ? 'heart' : 'heart-outline'} size={18} color={liked ? '#ffffff' : colors.primary} />
            <Text style={{ color: liked ? '#ffffff' : colors.text, fontWeight: '700', marginTop: 6 }}>Curtir</Text>
          </AnimatedPressable>

          <AnimatedPressable
            style={{
              flex: 1,
              backgroundColor: marked ? colors.secondary : colors.surfaceSoft,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
            }}
            onPress={() => setMarked((value) => !value)}
          >
            <MaterialCommunityIcons name={marked ? 'calendar-check' : 'calendar-plus'} size={18} color={marked ? '#ffffff' : colors.primary} />
            <Text style={{ color: marked ? '#ffffff' : colors.text, fontWeight: '700', marginTop: 6 }}>
              {marked ? 'Presente' : 'Marcar presença'}
            </Text>
          </AnimatedPressable>
        </View>

        <AnimatedPressable
          style={{
            marginTop: 12,
            backgroundColor: colors.surfaceSoft,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: 'center',
          }}
          onPress={handleShare}
        >
          <Text style={{ color: colors.text, fontWeight: '700' }}>Compartilhar evento</Text>
        </AnimatedPressable>
      </View>

      <View style={screenStyles.sectionCard}>
        <Text style={screenStyles.sectionTitle}>Comentar</Text>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Escreva sua opinião sobre o evento..."
          multiline
          numberOfLines={4}
          style={{
            minHeight: 96,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 12,
            padding: 12,
            textAlignVertical: 'top',
            color: colors.text,
            backgroundColor: colors.surfaceSoft,
          }}
        />
        <AnimatedPressable
          style={{
            marginTop: 12,
            backgroundColor: colors.primary,
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: 'center',
          }}
          onPress={handleComment}
        >
          <Text style={{ color: '#ffffff', fontWeight: '800' }}>Enviar comentário</Text>
        </AnimatedPressable>
      </View>

      <AnimatedPressable
        style={{
          backgroundColor: colors.primary,
          borderRadius: 12,
          paddingVertical: 14,
          alignItems: 'center',
          marginTop: 6,
        }}
        onPress={() => navigation.navigate('EventRating')}
      >
        <Text style={{ color: '#ffffff', fontWeight: '800' }}>Avaliar evento</Text>
      </AnimatedPressable>
    </ScrollView>
  );
}
