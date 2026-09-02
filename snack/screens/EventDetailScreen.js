import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { screenStyles } from '../styles/screenStyles';
import { colors } from '../styles/colors';
import { addComment, deleteComment, getComments, getEvent, getMe, participateEvent, toggleSaveEvent } from '../services/api';
import { shareContent } from '../services/share';

export function EventDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const eventId = route.params?.eventId || route.params?.event?.id;

  const [event, setEvent] = useState(route.params?.event || null);
  const [loading, setLoading] = useState(true);
  const [isParticipating, setIsParticipating] = useState(Boolean(route.params?.event?.is_participating));
  const [participantsCount, setParticipantsCount] = useState(Number(route.params?.event?.participants_count || 0));
  const [isSaved, setIsSaved] = useState(Boolean(route.params?.event?.is_saved));
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    getMe().then((u) => setCurrentUserId(u?.id)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      getEvent(eventId).catch(() => null),
      getComments(eventId, true).catch(() => []),
    ])
      .then(([evData, commData]) => {
        if (evData) {
          setEvent(evData);
          setIsParticipating(Boolean(evData.is_participating));
          setParticipantsCount(Number(evData.participants_count || 0));
          setIsSaved(Boolean(evData.is_saved));
        }
        setComments(Array.isArray(commData) ? commData : []);
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  async function handleToggleParticipate() {
    if (!eventId) return;
    try {
      const res = await participateEvent(eventId);
      setIsParticipating(Boolean(res.participating));
      setParticipantsCount(Number(res.participantsCount || 0));
    } catch (e) {
      console.error('Erro ao alternar presença:', e);
    }
  }

  async function handleToggleSave() {
    if (!eventId) return;
    try {
      const res = await toggleSaveEvent(eventId);
      setIsSaved(Boolean(res.saved));
    } catch (e) {
      console.error('Erro ao salvar evento:', e);
    }
  }

  function handleOpenEventChat() {
    const authorId = event?.author?.id || event?.author_id;
    const authorName = event?.author?.name || event?.author_name || 'Host';
    if (authorId) {
      navigation.navigate('MainTabs', {
        screen: 'chat',
        params: {
          recipientId: authorId,
          recipientName: `${event?.title || 'Evento'} (Host: ${authorName})`,
          recipientAvatar: '📅',
        },
      });
    } else {
      navigation.navigate('MainTabs', { screen: 'chat' });
    }
  }

  function handleShare() {
    if (!eventId) return;
    shareContent({
      type: 'event',
      id: eventId,
      title: event?.title || 'Evento no Meets',
      text: event?.title ? `${event.title} - ${event.description || ''}` : event?.description,
    });
  }

  async function handleSendComment() {
    const text = commentText.trim();
    if (!text || !eventId || submittingComment) return;
    setSubmittingComment(true);
    try {
      const newComm = await addComment(eventId, text, true);
      setComments((prev) => [...prev, newComm]);
      setCommentText('');
    } catch (e) {
      console.error('Erro ao adicionar comentário:', e);
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleDeleteComment(id) {
    try {
      await deleteComment(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      console.error('Erro ao deletar comentário:', e);
    }
  }

  if (loading) {
    return (
      <View style={[screenStyles.listContent, { justifyContent: 'center', alignItems: 'center', minHeight: 360 }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[screenStyles.sectionTitle, { marginTop: 16 }]}>Carregando evento...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[screenStyles.listContent, { justifyContent: 'center', alignItems: 'center', minHeight: 360 }]}>
        <MaterialCommunityIcons name="calendar-remove" size={48} color={colors.textMuted} />
        <Text style={[screenStyles.sectionTitle, { marginTop: 12 }]}>Evento não encontrado.</Text>
      </View>
    );
  }

  const dateStr = event.event_date
    ? new Date(`${event.event_date}T00:00:00`).toLocaleDateString('pt-BR', { dateStyle: 'full' })
    : 'Data não informada';
  const timeStr = event.event_time ? ` às ${String(event.event_time).slice(0, 5)}` : '';
  const authorName = event.author?.name || event.author_name || 'Organizador';

  return (
    <ScrollView contentContainerStyle={screenStyles.listContent} showsVerticalScrollIndicator={false}>
      {/* Header Card */}
      <View style={screenStyles.sectionCard}>
        <Text style={screenStyles.sectionTitle}>{event.title}</Text>
        <Text style={[screenStyles.sectionText, { fontWeight: '700', color: colors.primary, marginTop: 4 }]}>
          📅 {dateStr}{timeStr}
        </Text>
        <Text style={[screenStyles.sectionText, { marginTop: 4 }]}>
          📍 {event.location || 'Local a definir'}
        </Text>
        <Text style={[screenStyles.rowSubtitle, { marginTop: 6 }]}>
          Organizado por: <Text style={{ fontWeight: '700', color: colors.text }}>{authorName}</Text>
        </Text>

        {/* Stats Row */}
        <View style={{ marginTop: 18, flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ ...screenStyles.sectionTitle, marginBottom: 0 }}>{participantsCount}</Text>
            <Text style={screenStyles.rowSubtitle}>Participantes</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ ...screenStyles.sectionTitle, marginBottom: 0 }}>{comments.length}</Text>
            <Text style={screenStyles.rowSubtitle}>Comentários</Text>
          </View>
        </View>
      </View>

      {/* Description */}
      <View style={screenStyles.sectionCard}>
        <Text style={screenStyles.sectionTitle}>Sobre o evento</Text>
        <Text style={screenStyles.sectionText}>{event.description || event.content || 'Sem descrição.'}</Text>
      </View>

      {/* Action Buttons */}
      <View style={screenStyles.sectionCard}>
        <Text style={screenStyles.sectionTitle}>Ações</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          {/* Participar */}
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: isParticipating ? colors.secondarySoft : colors.primary,
              borderWidth: 1,
              borderColor: isParticipating ? colors.secondary : colors.primary,
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
              gap: 4,
            }}
            onPress={handleToggleParticipate}
          >
            <MaterialCommunityIcons
              name={isParticipating ? 'check-circle' : 'plus-circle-outline'}
              size={20}
              color={isParticipating ? colors.secondary : '#ffffff'}
            />
            <Text style={{ color: isParticipating ? colors.secondary : '#ffffff', fontWeight: '800' }}>
              {isParticipating ? 'Confirmado' : 'Participar'}
            </Text>
          </TouchableOpacity>

          {/* Chat do Evento */}
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: colors.surfaceSoft,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
              gap: 4,
            }}
            onPress={handleOpenEventChat}
          >
            <MaterialCommunityIcons name="forum-outline" size={20} color={colors.primary} />
            <Text style={{ color: colors.text, fontWeight: '800' }}>Chat do Evento</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          {/* Compartilhar */}
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: colors.surfaceSoft,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 6,
            }}
            onPress={handleShare}
          >
            <MaterialCommunityIcons name="share-variant-outline" size={18} color={colors.text} />
            <Text style={{ color: colors.text, fontWeight: '700' }}>Compartilhar</Text>
          </TouchableOpacity>

          {/* Salvar */}
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: colors.surfaceSoft,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 6,
            }}
            onPress={handleToggleSave}
          >
            <MaterialCommunityIcons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={isSaved ? colors.primary : colors.text}
            />
            <Text style={{ color: colors.text, fontWeight: '700' }}>
              {isSaved ? 'Salvo' : 'Salvar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Comments Section */}
      <View style={screenStyles.sectionCard}>
        <Text style={screenStyles.sectionTitle}>Comentários ({comments.length})</Text>

        {comments.length > 0 ? (
          <View style={{ gap: 10, marginVertical: 10 }}>
            {comments.map((item) => {
              const isMine = currentUserId && item.user_id === currentUserId;
              const timeStr = item.created_at
                ? new Date(item.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                : '';

              return (
                <View key={item.id} style={styles.commentItem}>
                  <Text style={{ fontSize: 18 }}>{item.user_avatar || '👤'}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>{item.user_name}</Text>
                      <Text style={{ fontSize: 11, color: colors.textMuted }}>{timeStr}</Text>
                    </View>
                    <Text style={{ fontSize: 13, color: colors.text, marginTop: 2 }}>{item.content}</Text>
                  </View>
                  {isMine ? (
                    <TouchableOpacity onPress={() => handleDeleteComment(item.id)} style={{ padding: 4 }}>
                      <MaterialCommunityIcons name="trash-can-outline" size={16} color="#e0245e" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={[screenStyles.sectionText, { marginVertical: 8 }]}>
            Nenhum comentário ainda. Deixe o primeiro comentário!
          </Text>
        )}

        {/* Add comment bar */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <TextInput
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Escreva um comentário..."
            placeholderTextColor={colors.textSubtle}
            style={{
              flex: 1,
              backgroundColor: colors.surfaceSoft,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              color: colors.text,
              fontSize: 13,
            }}
          />
          <TouchableOpacity
            style={{
              backgroundColor: commentText.trim() ? colors.primary : colors.surfaceSoft,
              borderRadius: 12,
              paddingHorizontal: 16,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={handleSendComment}
            disabled={!commentText.trim() || submittingComment}
          >
            {submittingComment ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <MaterialCommunityIcons name="send" size={18} color={commentText.trim() ? '#ffffff' : colors.textMuted} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceSoft,
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
});
