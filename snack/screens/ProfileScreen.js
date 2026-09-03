import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AvatarImage } from '../components/AvatarImage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { screenStyles } from '../styles/screenStyles';
import { colors } from '../styles/colors';
import { fetchCurrentUser } from '../services/userApi';
import { deleteEvent, deletePost, getMyEvents, getMyPosts, getSpeakerRatingSummary } from '../services/api';
import { CommentsModal } from '../components/CommentsModal';
import { EditContentModal } from '../components/EditContentModal';
import { shareContent } from '../services/share';
import { formatLocalDate } from '../utils/masks';

function toSafeNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function formatRating(value) {
  return toSafeNumber(value, 0).toFixed(1);
}

function formatCount(value) {
  return Math.max(0, Math.floor(toSafeNumber(value, 0)));
}

export function ProfileScreen() {
  const navigation = useNavigation();

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [events, setEvents] = useState([]);
  const [posts, setPosts] = useState([]);
  const [ratingSummary, setRatingSummary] = useState(null);

  // Modals state
  const [editingItem, setEditingItem] = useState(null);
  const [commentTarget, setCommentTarget] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setErrorMessage('');
      const [profile, myEvents, myPosts] = await Promise.all([
        fetchCurrentUser(),
        getMyEvents(),
        getMyPosts(),
      ]);

      setUser(profile || {});
      setEvents(Array.isArray(myEvents) ? myEvents : []);
      setPosts(Array.isArray(myPosts) ? myPosts : []);

      if (profile?.id) {
        try {
          const summary = await getSpeakerRatingSummary(profile.id);
          setRatingSummary(summary);
        } catch (_) {}
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Não foi possível carregar o perfil.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadData();
    }, [loadData]),
  );

  async function handleDeletePost(postId) {
    Alert.alert('Excluir Publicação', 'Deseja realmente excluir esta publicação?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePost(postId);
            setPosts((prev) => prev.filter((p) => p.id !== postId));
          } catch (e) {
            Alert.alert('Erro', e.message || 'Não foi possível excluir o post.');
          }
        },
      },
    ]);
  }

  async function handleDeleteEvent(eventId) {
    Alert.alert('Excluir Evento', 'Deseja realmente excluir este evento?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEvent(eventId);
            setEvents((prev) => prev.filter((e) => e.id !== eventId));
          } catch (e) {
            Alert.alert('Erro', e.message || 'Não foi possível excluir o evento.');
          }
        },
      },
    ]);
  }

  function handleShareProfile() {
    if (user?.id) {
      shareContent({
        type: 'user',
        id: user.id,
        title: user.name || 'Perfil no Meets',
        text: `Conheça o perfil de ${user.name || 'um membro'} no Meets!`,
      });
    }
  }

  if (isLoading) {
    return (
      <View style={[screenStyles.listContent, { justifyContent: 'center', alignItems: 'center', minHeight: 360 }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[screenStyles.sectionTitle, { marginTop: 16 }]}>Carregando perfil...</Text>
      </View>
    );
  }

  const profile = {
    id: user?.id,
    name: user?.name || 'Meu perfil',
    role: user?.role || 'Perfil indisponível',
    city: user?.city || 'Cidade não informada',
    avatar: user?.avatar || '👤',
    connections: formatCount(user?.connections),
    eventsCount: formatCount(user?.eventsCount || events.length),
    rating: ratingSummary?.averageStars ?? toSafeNumber(user?.rating, 0),
    ratingsCount: ratingSummary?.totalRatings ?? formatCount(user?.ratingsCount),
    bio: user?.bio || '',
  };

  const skills = ratingSummary?.skills || {};

  return (
    <ScrollView contentContainerStyle={screenStyles.listContent} showsVerticalScrollIndicator={false}>
      {/* HERO PERFIL */}
      <View style={screenStyles.profileHeroCard}>
        <View style={screenStyles.profileAvatarWrap}>
          <AvatarImage value={profile.avatar} size={92} style={{ backgroundColor: colors.primarySoft }} />
        </View>

        <Text style={screenStyles.profileName}>{profile.name}</Text>
        <Text style={screenStyles.profileRole}>{profile.role}</Text>

        <View style={screenStyles.profileMetaRow}>
          <View style={screenStyles.profileMetaPill}>
            <MaterialCommunityIcons name="map-marker-outline" size={16} color="#ffffff" />
            <Text style={screenStyles.profileMetaText}>{profile.city}</Text>
          </View>

          <View style={screenStyles.profileMetaPill}>
            <MaterialCommunityIcons name="account-group-outline" size={16} color="#ffffff" />
            <Text style={screenStyles.profileMetaText}>{profile.connections} conexões</Text>
          </View>
        </View>

        <View style={screenStyles.profileActionsRow}>
          <TouchableOpacity
            style={screenStyles.profileActionPrimary}
            onPress={() => navigation.navigate('EditProfile')}
            activeOpacity={0.8}
          >
            <Text style={screenStyles.profileActionPrimaryText}>Editar perfil</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={screenStyles.profileActionSecondary}
            onPress={handleShareProfile}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="share-variant-outline" size={18} color="#ffffff" />
            <Text style={screenStyles.profileActionSecondaryText}>Compartilhar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* RESUMO DE ESTATÍSTICAS */}
      <View style={screenStyles.sectionCard}>
        <Text style={screenStyles.sectionTitle}>Resumo</Text>
        <View style={screenStyles.statsRow}>
          <View style={screenStyles.statBlock}>
            <Text style={screenStyles.statValue}>{profile.eventsCount}</Text>
            <Text style={screenStyles.statLabel}>Eventos</Text>
          </View>

          <View style={screenStyles.statDivider} />

          <View style={screenStyles.statBlock}>
            <Text style={screenStyles.statValue}>{profile.connections}</Text>
            <Text style={screenStyles.statLabel}>Conexões</Text>
          </View>

          <View style={screenStyles.statDivider} />

          <View style={screenStyles.statBlock}>
            <Text style={screenStyles.statValue}>⭐ {formatRating(profile.rating)}</Text>
            <Text style={screenStyles.statLabel}>Média ({profile.ratingsCount})</Text>
          </View>
        </View>
      </View>

      {/* MINHA MÉDIA & HABILIDADES */}
      <View style={screenStyles.sectionCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={screenStyles.sectionTitle}>Minha Média de Avaliações</Text>
          <View style={localStyles.ratingBadge}>
            <MaterialCommunityIcons name="star" size={16} color="#ffb800" />
            <Text style={localStyles.ratingBadgeText}>{formatRating(profile.rating)} / 5.0</Text>
          </View>
        </View>

        {profile.ratingsCount > 0 ? (
          <View style={{ gap: 8 }}>
            <View style={localStyles.skillRow}>
              <Text style={localStyles.skillLabel}>🎯 Clareza</Text>
              <Text style={localStyles.skillScore}>{toSafeNumber(skills.clarity, 0).toFixed(1)} / 5</Text>
            </View>
            <View style={localStyles.skillRow}>
              <Text style={localStyles.skillLabel}>📚 Conteúdo</Text>
              <Text style={localStyles.skillScore}>{toSafeNumber(skills.content, 0).toFixed(1)} / 5</Text>
            </View>
            <View style={localStyles.skillRow}>
              <Text style={localStyles.skillLabel}>🔥 Engajamento</Text>
              <Text style={localStyles.skillScore}>{toSafeNumber(skills.engagement, 0).toFixed(1)} / 5</Text>
            </View>
            <View style={localStyles.skillRow}>
              <Text style={localStyles.skillLabel}>📖 Storytelling</Text>
              <Text style={localStyles.skillScore}>{toSafeNumber(skills.storytelling, 0).toFixed(1)} / 5</Text>
            </View>
            <View style={localStyles.skillRow}>
              <Text style={localStyles.skillLabel}>⏰ Pontualidade</Text>
              <Text style={localStyles.skillScore}>{toSafeNumber(skills.punctuality, 0).toFixed(1)} / 5</Text>
            </View>
            <View style={localStyles.skillRow}>
              <Text style={localStyles.skillLabel}>🎨 Visual e Slides</Text>
              <Text style={localStyles.skillScore}>{toSafeNumber(skills.visuals, 0).toFixed(1)} / 5</Text>
            </View>
          </View>
        ) : (
          <Text style={screenStyles.sectionText}>
            Você ainda não recebeu avaliações da comunidade. Crie apresentações e compartilhe com outros membros!
          </Text>
        )}
      </View>

      {/* ERRO DE SINCRONIZAÇÃO */}
      {errorMessage ? (
        <View style={screenStyles.sectionCard}>
          <Text style={screenStyles.sectionTitle}>Sincronização</Text>
          <Text style={screenStyles.rowSubtitle}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* MINHAS PUBLICAÇÕES */}
      <View style={screenStyles.sectionCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Text style={screenStyles.sectionTitle}>Minhas Publicações ({posts.length})</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CreateFlow', { mode: 'post' })}>
            <MaterialCommunityIcons name="plus-circle" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {posts.length ? (
          posts.map((post) => (
            <View key={post.id} style={localStyles.contentItemCard}>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => setCommentTarget({ id: post.id, title: post.title || post.content, isEvent: false })}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <MaterialCommunityIcons
                    name={post.type === 'presentation' ? 'presentation' : 'post-outline'}
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={screenStyles.rowTitle}>{post.title || 'Publicação'}</Text>
                </View>
                <Text style={screenStyles.rowSubtitle} numberOfLines={2}>{post.content}</Text>
                {post.mentioned_event ? (
                  <View style={localStyles.eventMentionTag}>
                    <Text style={localStyles.eventMentionText}>📌 {post.mentioned_event.title}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>

              <View style={localStyles.itemActionsCol}>
                <TouchableOpacity
                  style={localStyles.editBtn}
                  onPress={() => setEditingItem({ ...post, type: post.type || 'post' })}
                >
                  <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={localStyles.deleteBtn}
                  onPress={() => handleDeletePost(post.id)}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color="#e0245e" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text style={screenStyles.sectionText}>Você ainda não publicou nada.</Text>
        )}
      </View>

      {/* MEUS EVENTOS */}
      <View style={screenStyles.sectionCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Text style={screenStyles.sectionTitle}>Meus Eventos ({events.length})</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CreateFlow', { mode: 'event' })}>
            <MaterialCommunityIcons name="plus-circle" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {events.length ? (
          events.map((event) => (
            <View key={event.id} style={localStyles.contentItemCard}>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => navigation.navigate('EventDetail', { eventId: event.id, event })}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <MaterialCommunityIcons name="calendar" size={16} color={colors.secondary} />
                  <Text style={screenStyles.rowTitle}>{event.title}</Text>
                </View>
                <Text style={screenStyles.rowSubtitle}>
                  {formatLocalDate(event.event_date)}
                  {event.event_time ? ` às ${String(event.event_time).slice(0, 5)}` : ''}
                  {event.location ? ` · ${event.location}` : ''}
                </Text>
              </TouchableOpacity>

              <View style={localStyles.itemActionsCol}>
                <TouchableOpacity
                  style={localStyles.editBtn}
                  onPress={() => setEditingItem({ ...event, type: 'event' })}
                >
                  <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={localStyles.deleteBtn}
                  onPress={() => handleDeleteEvent(event.id)}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color="#e0245e" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text style={screenStyles.sectionText}>Você ainda não criou eventos.</Text>
        )}
      </View>

      {/* ATALHOS */}
      <View style={screenStyles.sectionCard}>
        <Text style={screenStyles.sectionTitle}>Atalhos</Text>
        <View style={screenStyles.quickActionRow}>
          <TouchableOpacity
            style={screenStyles.quickActionCard}
            onPress={() => navigation.navigate('saves')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="bookmark-outline" size={20} color="#ffffff" />
            <Text style={screenStyles.quickActionText}>Salvos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={screenStyles.quickActionCard}
            onPress={() => navigation.navigate('history')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="history" size={20} color="#ffffff" />
            <Text style={screenStyles.quickActionText}>Histórico</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* MODAL DE EDIÇÃO */}
      <EditContentModal
        visible={Boolean(editingItem)}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSaved={loadData}
      />

      {/* MODAL DE COMENTÁRIOS */}
      {commentTarget ? (
        <CommentsModal
          visible={Boolean(commentTarget)}
          targetId={commentTarget.id}
          targetTitle={commentTarget.title}
          isEvent={commentTarget.isEvent}
          onClose={() => setCommentTarget(null)}
          onCommentAdded={loadData}
        />
      ) : null}
    </ScrollView>
  );
}

const localStyles = StyleSheet.create({
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 4,
  },
  ratingBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  skillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  skillLabel: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
  skillScore: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
  },
  contentItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSoft,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  itemActionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editBtn: {
    padding: 6,
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
  },
  deleteBtn: {
    padding: 6,
    backgroundColor: '#ffebee',
    borderRadius: 8,
  },
  eventMentionTag: {
    marginTop: 4,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  eventMentionText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
  },
});