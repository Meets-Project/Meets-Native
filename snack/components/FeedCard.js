import React, { useState } from 'react';
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../styles/colors';
import { feedCardStyles } from '../styles/feedCardStyles';
import { getEventParticipants, participateEvent, toggleConnection, toggleLike, toggleSave } from '../services/api';
import { CommentsModal } from './CommentsModal';
import { shareContent } from '../services/share';

export function FeedCard({ item, onRefresh }) {
  const navigation = useNavigation();
  const [likes, setLikes] = useState(Number(item.likes || 0));
  const [isLiked, setIsLiked] = useState(Boolean(item.is_liked));
  const [saved, setSaved] = useState(Boolean(item.is_saved));
  const [isConnected, setIsConnected] = useState(Boolean(item.is_connected));
  const [isConnecting, setIsConnecting] = useState(false);
  const [isParticipating, setIsParticipating] = useState(Boolean(item.is_participating));
  const [participantsCount, setParticipantsCount] = useState(Number(item.participants_count || 0));
  const [showParticipants, setShowParticipants] = useState(false);
  const [participantsList, setParticipantsList] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(Number(item.comments_count || 0));

  const isPresentation = item.type === 'presentation';
  const isEvent = item.type === 'event';
  const speakers = Array.isArray(item.speakers) ? item.speakers : [];
  const authorId = item.author_id || item.author?.id || item.authorId;
  const authorName = item.author_name || item.author?.name || (typeof item.author === 'string' ? item.author : 'Membro');
  const authorAvatar = item.author_avatar || item.author?.avatar || item.avatar || '👤';
  const mentionedEvent = item.mentioned_event;

  async function like() {
    try {
      const r = await toggleLike(item.id);
      setLikes(Number(r.likes || 0));
      setIsLiked((prev) => !prev);
    } catch (e) {
      console.error('Erro ao curtir:', e);
    }
  }

  async function save() {
    try {
      const r = await toggleSave(item.id);
      setSaved(Boolean(r.saved));
    } catch (e) {
      console.error('Erro ao salvar:', e);
    }
  }

  async function handleToggleConnect() {
    if (!authorId || isConnecting) return;
    setIsConnecting(true);
    try {
      const res = await toggleConnection(authorId);
      setIsConnected(Boolean(res.connected));
      onRefresh?.();
    } catch (e) {
      console.error('Erro ao alternar conexão:', e);
    } finally {
      setIsConnecting(false);
    }
  }

  async function handleToggleParticipate() {
    try {
      const res = await participateEvent(item.id);
      setIsParticipating(Boolean(res.participating));
      setParticipantsCount(Number(res.participantsCount || 0));
      onRefresh?.();
    } catch (e) {
      console.error('Erro ao participar do evento:', e);
    }
  }

  async function handleLoadParticipants() {
    if (showParticipants) {
      setShowParticipants(false);
      return;
    }
    setShowParticipants(true);
    setLoadingParticipants(true);
    try {
      const list = await getEventParticipants(item.id);
      setParticipantsList(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Erro ao listar participantes:', e);
    } finally {
      setLoadingParticipants(false);
    }
  }

  function handleOpenAuthorProfile() {
    if (authorId) {
      navigation.navigate('SpeakerProfile', {
        speakerId: authorId,
        speakerName: authorName,
        speakerAvatar: authorAvatar,
      });
    }
  }

  function handleOpenEventChat() {
    if (authorId) {
      navigation.navigate('MainTabs', {
        screen: 'chat',
        params: {
          recipientId: authorId,
          recipientName: `${item.title || 'Evento'} (Host: ${authorName})`,
          recipientAvatar: '📅',
        },
      });
    } else {
      navigation.navigate('MainTabs', { screen: 'chat' });
    }
  }

  function handleShare() {
    shareContent({
      type: isEvent ? 'event' : 'post',
      id: item.id,
      title: item.title || item.content || 'Publicação no Meets',
      text: item.title ? `${item.title} - ${item.content || ''}` : item.content,
    });
  }

  function handleOpenMentionedEvent() {
    if (mentionedEvent?.id) {
      navigation.navigate('EventDetail', {
        eventId: mentionedEvent.id,
        event: mentionedEvent,
      });
    }
  }

  return (
    <View style={feedCardStyles.card}>
      {/* Card Header */}
      <View style={feedCardStyles.cardHeader}>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}
          onPress={handleOpenAuthorProfile}
        >
          <Text style={feedCardStyles.avatarEmoji}>{authorAvatar}</Text>
          <View style={feedCardStyles.authorInfo}>
            <Text style={feedCardStyles.authorName}>{authorName}</Text>
            <Text style={feedCardStyles.timestamp}>{item.timestamp || ''}</Text>
          </View>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {authorId ? (
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isConnected ? colors.primarySoft : colors.background,
                borderWidth: 1,
                borderColor: isConnected ? colors.primary : colors.border,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 14,
                gap: 4,
              }}
              onPress={handleToggleConnect}
              disabled={isConnecting}
            >
              <MaterialCommunityIcons
                name={isConnected ? 'account-check' : 'account-plus-outline'}
                size={14}
                color={isConnected ? colors.primary : colors.textMuted}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: isConnected ? colors.primary : colors.textMuted,
                }}
              >
                {isConnected ? 'Conectado' : 'Conectar'}
              </Text>
            </TouchableOpacity>
          ) : null}

          {isPresentation || isEvent ? (
            <View style={feedCardStyles.presentationBadge}>
              <Text style={feedCardStyles.presentationBadgeText}>
                {isEvent ? '📅 Evento' : '🎤 Apresentação'}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {(isPresentation || isEvent) && item.title ? (
        <Text style={feedCardStyles.presentationTitle}>{item.title}</Text>
      ) : null}

      {/* Event Details and Participant Controls */}
      {isEvent ? (
        <View style={{ backgroundColor: colors.background, padding: 12, borderRadius: 10, marginBottom: 12, gap: 6 }}>
          <View style={feedCardStyles.eventMeta}>
            <Text style={feedCardStyles.eventMetaText}>
              📅 {item.event_date ? new Date(`${item.event_date}T00:00:00`).toLocaleDateString('pt-BR') : 'Data não informada'}
              {item.event_time ? ` às ${String(item.event_time).slice(0, 5)}` : ''}
            </Text>
            <Text style={feedCardStyles.eventMetaText}>📍 {item.location || 'Local não informado'}</Text>
          </View>

          {/* Participants Bar */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              onPress={handleLoadParticipants}
            >
              <MaterialCommunityIcons name="account-group" size={18} color={colors.primary} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                {participantsCount} participante{participantsCount !== 1 ? 's' : ''}
              </Text>
              <MaterialCommunityIcons
                name={showParticipants ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isParticipating ? colors.secondarySoft : colors.primary,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                gap: 4,
              }}
              onPress={handleToggleParticipate}
            >
              <MaterialCommunityIcons
                name={isParticipating ? 'check-circle' : 'plus-circle-outline'}
                size={16}
                color={isParticipating ? colors.secondary : '#ffffff'}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '800',
                  color: isParticipating ? colors.secondary : '#ffffff',
                }}
              >
                {isParticipating ? 'Presença confirmada' : 'Participar'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Expandable Participants List */}
          {showParticipants ? (
            <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
              {loadingParticipants ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : participantsList.length > 0 ? (
                <View style={{ gap: 6 }}>
                  {participantsList.map((p) => (
                    <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 16 }}>{p.avatar || '👤'}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }}>{p.name}</Text>
                      {p.status === 'host' ? (
                        <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '800', backgroundColor: colors.primarySoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                          Host
                        </Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={{ fontSize: 12, color: colors.textMuted }}>Nenhum participante confirmado ainda.</Text>
              )}
            </View>
          ) : null}
        </View>
      ) : null}

      <Text style={feedCardStyles.cardContent}>{item.content}</Text>

      {/* Mentioned Event Card inside Post */}
      {!isEvent && mentionedEvent ? (
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.primarySoft,
            borderWidth: 1,
            borderColor: colors.primary,
            borderRadius: 10,
            padding: 10,
            marginVertical: 8,
            gap: 10,
          }}
          onPress={handleOpenMentionedEvent}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="calendar-star" size={24} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary, textTransform: 'uppercase' }}>
              Evento Mencionado
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
              {mentionedEvent.title}
            </Text>
            {mentionedEvent.event_date ? (
              <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                📅 {new Date(`${mentionedEvent.event_date}T00:00:00`).toLocaleDateString('pt-BR')}
                {mentionedEvent.event_time ? ` às ${String(mentionedEvent.event_time).slice(0, 5)}` : ''}
                {mentionedEvent.location ? ` · 📍 ${mentionedEvent.location}` : ''}
              </Text>
            ) : null}
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.primary} />
        </TouchableOpacity>
      ) : null}

      {/* Speakers Block */}
      {isPresentation && speakers.length > 0 ? (
        <View style={feedCardStyles.speakersBlock}>
          <Text style={feedCardStyles.speakersTitle}>Apresentadores</Text>
          {speakers.map((speaker) => (
            <View key={speaker.id} style={feedCardStyles.speakerRow}>
              <View style={feedCardStyles.speakerInfo}>
                <Text style={feedCardStyles.speakerAvatar}>{speaker.avatar || '🎤'}</Text>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('SpeakerProfile', {
                      speakerId: speaker.id,
                      speakerName: speaker.name,
                      speakerAvatar: speaker.avatar || '🎤',
                    })
                  }
                >
                  <Text style={feedCardStyles.speakerName}>{speaker.name}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={feedCardStyles.speakerRateButton}
                onPress={() =>
                  navigation.navigate('PresentationRating', {
                    postId: item.id,
                    presentationId: item.presentation_id,
                    presentationTitle: item.title || item.content,
                    speakers,
                    selectedSpeakerId: speaker.id,
                    speakerId: speaker.id,
                    speakerName: speaker.name,
                  })
                }
              >
                <Text style={feedCardStyles.speakerRateButtonText}>Avaliar</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}

      {/* Image */}
      {item.image ? (
        <View style={feedCardStyles.cardImage}>
          <Image source={{ uri: item.image }} style={feedCardStyles.cardImageImage} resizeMode="cover" />
        </View>
      ) : null}

      {/* Card Footer Actions */}
      <View style={feedCardStyles.cardFooter}>
        <TouchableOpacity style={feedCardStyles.actionButton} onPress={like}>
          <MaterialCommunityIcons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={isLiked ? '#e0245e' : colors.primary}
          />
          <Text style={feedCardStyles.actionText}>{likes}</Text>
        </TouchableOpacity>

        {/* COMENTAR: Opens Comments Modal */}
        <TouchableOpacity style={feedCardStyles.actionButton} onPress={() => setShowComments(true)}>
          <MaterialCommunityIcons name="comment-outline" size={20} color={colors.primary} />
          <Text style={feedCardStyles.actionText}>
            {commentsCount > 0 ? commentsCount : 'Comentar'}
          </Text>
        </TouchableOpacity>

        {/* CHAT DO EVENTO: Only on Events */}
        {isEvent ? (
          <TouchableOpacity style={feedCardStyles.actionButton} onPress={handleOpenEventChat}>
            <MaterialCommunityIcons name="forum-outline" size={20} color={colors.secondary} />
            <Text style={[feedCardStyles.actionText, { color: colors.secondary, fontWeight: '700' }]}>
              Chat
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* COMPARTILHAR */}
        <TouchableOpacity style={feedCardStyles.actionButton} onPress={handleShare}>
          <MaterialCommunityIcons name="share-variant-outline" size={20} color={colors.textMuted} />
          <Text style={feedCardStyles.actionText}>Compartilhar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={feedCardStyles.actionButton} onPress={save}>
          <MaterialCommunityIcons
            name={saved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={saved ? colors.primary : colors.textMuted}
          />
          <Text style={feedCardStyles.actionText}>{saved ? 'Salvo' : 'Salvar'}</Text>
        </TouchableOpacity>

        {isPresentation ? (
          <TouchableOpacity
            style={feedCardStyles.actionButton}
            onPress={() =>
              navigation.navigate('PresentationRating', {
                postId: item.id,
                presentationId: item.presentation_id || `presentation-${item.id}`,
                presentationTitle: item.title || item.content,
                speakers,
                speakerId: speakers[0]?.id || authorId,
                speakerName: speakers[0]?.name || authorName,
              })
            }
          >
            <MaterialCommunityIcons name="star-outline" size={20} color={colors.secondary} />
            <Text style={[feedCardStyles.actionText, { color: colors.secondary, fontWeight: '700' }]}>
              Avaliar
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Comments Modal */}
      <CommentsModal
        visible={showComments}
        onClose={() => setShowComments(false)}
        targetId={item.id}
        targetTitle={item.title || item.content || 'Publicação'}
        isEvent={isEvent}
        onCommentAdded={() => setCommentsCount((c) => c + 1)}
      />
    </View>
  );
}
