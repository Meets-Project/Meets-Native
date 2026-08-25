import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { screenStyles } from '../styles/screenStyles';
import { colors } from '../styles/colors';
import { fetchCurrentUser } from '../services/userApi';
import { getMyEvents, getMyPosts } from '../services/api';

/**
 * Converte qualquer valor recebido da API em um número seguro.
 *
 * O PostgreSQL pode retornar alguns valores como string.
 * Exemplo:
 *   "4.5" -> 4.5
 *   4.5   -> 4.5
 *   null  -> 0
 *   ""    -> 0
 *   "abc" -> 0
 */
function toSafeNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

/**
 * Formata a avaliação do usuário sem permitir que
 * um valor inválido cause erro no React.
 */
function formatRating(value) {
  return toSafeNumber(value, 0).toFixed(1);
}

/**
 * Converte valores de contagem para inteiros seguros.
 */
function formatCount(value) {
  return Math.max(0, Math.floor(toSafeNumber(value, 0)));
}

function buildAchievements(user) {
  const eventsCount = formatCount(user?.eventsCount);
  const connections = formatCount(user?.connections);
  const rating = formatRating(user?.rating);

  return [
    {
      id: 'events',
      title: 'Host em destaque',
      subtitle: `${eventsCount} eventos criados este mês`,
    },
    {
      id: 'connections',
      title: 'Conector da comunidade',
      subtitle: `${connections} conexões ativas`,
    },
    {
      id: 'rating',
      title: 'Mentor ativo',
      subtitle: `${rating} de avaliação média`,
    },
  ];
}

export function ProfileScreen() {
  const navigation = useNavigation();

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [events, setEvents] = useState([]);
  const [posts, setPosts] = useState([]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadUser() {
        try {
          setErrorMessage('');

          const [profile, myEvents, myPosts] = await Promise.all([fetchCurrentUser(), getMyEvents(), getMyPosts()]);

          if (!isActive) {
            return;
          }

          // Garante que nunca teremos null/undefined inesperadamente.
          setUser(profile || {});
          setEvents(Array.isArray(myEvents) ? myEvents : []);
          setPosts(Array.isArray(myPosts) ? myPosts : []);
        } catch (error) {
          if (!isActive) {
            return;
          }

          console.error('Erro ao carregar perfil:', error);

          const message =
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar o perfil.';

          setErrorMessage(message);
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      }

      setIsLoading(true);
      loadUser();

      return () => {
        isActive = false;
      };
    }, []),
  );

  if (isLoading) {
    return (
      <View
        style={[
          screenStyles.listContent,
          {
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 360,
          },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />

        <Text
          style={[
            screenStyles.sectionTitle,
            {
              marginTop: 16,
            },
          ]}
        >
          Carregando perfil...
        </Text>
      </View>
    );
  }

  /**
   * Valores padrão.
   *
   * Isso evita que a interface quebre caso o backend
   * não retorne algum campo.
   */
  const profile = {
    name: user?.name || 'Meu perfil',
    role: user?.role || 'Perfil indisponível',
    city: user?.city || 'Cidade não informada',
    avatar: user?.avatar || '👤',
    connections: formatCount(user?.connections),
    eventsCount: formatCount(user?.eventsCount),
    rating: toSafeNumber(user?.rating, 0),
    ratingsCount: formatCount(user?.ratingsCount),
    bio: user?.bio || '',
  };

  const achievements = buildAchievements(profile);

  return (
    <ScrollView
      contentContainerStyle={screenStyles.listContent}
      showsVerticalScrollIndicator={false}
    >
      {/* PERFIL */}
      <View style={screenStyles.profileHeroCard}>
        <View style={screenStyles.profileAvatarWrap}>
          <Text style={screenStyles.profileAvatar}>
            {profile.avatar}
          </Text>
        </View>

        <Text style={screenStyles.profileName}>
          {profile.name}
        </Text>

        <Text style={screenStyles.profileRole}>
          {profile.role}
        </Text>

        <View style={screenStyles.profileMetaRow}>
          <View style={screenStyles.profileMetaPill}>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={16}
              color="#ffffff"
            />

            <Text style={screenStyles.profileMetaText}>
              {profile.city}
            </Text>
          </View>

          <View style={screenStyles.profileMetaPill}>
            <MaterialCommunityIcons
              name="account-group-outline"
              size={16}
              color="#ffffff"
            />

            <Text style={screenStyles.profileMetaText}>
              {profile.connections} conexões
            </Text>
          </View>
        </View>

        <View style={screenStyles.profileActionsRow}>
          <TouchableOpacity
            style={screenStyles.profileActionPrimary}
            onPress={() => navigation.navigate('EditProfile')}
            activeOpacity={0.8}
          >
            <Text style={screenStyles.profileActionPrimaryText}>
              Editar perfil
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={screenStyles.profileActionSecondary}
            onPress={() => navigation.navigate('ShareProfile')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="share-variant-outline"
              size={18}
              color={screenStyles.shareIcon.color}
            />

            <Text style={screenStyles.profileActionSecondaryText}>
              Compartilhar
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* RESUMO */}
      <View style={screenStyles.sectionCard}>
        <Text style={screenStyles.sectionTitle}>
          Resumo
        </Text>

        <View style={screenStyles.statsRow}>
          <View style={screenStyles.statBlock}>
            <Text style={screenStyles.statValue}>
              {profile.eventsCount}
            </Text>

            <Text style={screenStyles.statLabel}>
              Eventos
            </Text>
          </View>

          <View style={screenStyles.statDivider} />

          <View style={screenStyles.statBlock}>
            <Text style={screenStyles.statValue}>
              {profile.connections}
            </Text>

            <Text style={screenStyles.statLabel}>
              Conexões
            </Text>
          </View>

          <View style={screenStyles.statDivider} />

          <View style={screenStyles.statBlock}>
            <Text style={screenStyles.statValue}>
              {formatRating(profile.rating)}
            </Text>

            <Text style={screenStyles.statLabel}>
              Avaliação média
            </Text>
          </View>
        </View>
      </View>

      {/* ERRO DE SINCRONIZAÇÃO */}
      {errorMessage ? (
        <View style={screenStyles.sectionCard}>
          <Text style={screenStyles.sectionTitle}>
            Sincronização
          </Text>

          <Text style={screenStyles.rowSubtitle}>
            {errorMessage}
          </Text>
        </View>
      ) : null}

      {/* ATALHOS */}
      <View style={screenStyles.sectionCard}>
        <Text style={screenStyles.sectionTitle}>
          Atalhos
        </Text>

        <View style={screenStyles.quickActionRow}>
          <TouchableOpacity
            style={screenStyles.quickActionCard}
            onPress={() => navigation.navigate('saves')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="bookmark-outline"
              size={20}
              color="#ffffff"
            />

            <Text style={screenStyles.quickActionText}>
              Salvos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={screenStyles.quickActionCard}
            onPress={() => navigation.navigate('history')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="history"
              size={20}
              color="#ffffff"
            />

            <Text style={screenStyles.quickActionText}>
              Histórico
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={screenStyles.sectionCard}>
        <Text style={screenStyles.sectionTitle}>Minhas publicações</Text>
        {posts.length ? posts.slice(0, 10).map((post) => (
          <View key={post.id} style={screenStyles.achievementItem}>
            <View style={screenStyles.achievementIconWrap}>
              <MaterialCommunityIcons name={post.type === 'presentation' ? 'presentation' : 'post-outline'} size={18} color="#ffffff" />
            </View>
            <View style={screenStyles.achievementTextWrap}>
              <Text style={screenStyles.rowTitle}>{post.title || 'Publicação'}</Text>
              <Text style={screenStyles.rowSubtitle}>{post.content}</Text>
            </View>
          </View>
        )) : (
          <Text style={screenStyles.sectionText}>Você ainda não publicou nada.</Text>
        )}
      </View>

      <View style={screenStyles.sectionCard}>
        <Text style={screenStyles.sectionTitle}>Meus eventos</Text>
        {events.length ? events.slice(0, 10).map((event) => (
          <View key={event.id} style={screenStyles.achievementItem}>
            <View style={screenStyles.achievementIconWrap}>
              <MaterialCommunityIcons name="calendar" size={18} color="#ffffff" />
            </View>
            <View style={screenStyles.achievementTextWrap}>
              <Text style={screenStyles.rowTitle}>{event.title}</Text>
              <Text style={screenStyles.rowSubtitle}>
                {event.event_date ? new Date(`${event.event_date}T00:00:00`).toLocaleDateString('pt-BR') : 'Data não informada'}
                {event.event_time ? ` às ${String(event.event_time).slice(0,5)}` : ''}
                {event.location ? ` · ${event.location}` : ''}
              </Text>
            </View>
          </View>
        )) : (
          <Text style={screenStyles.sectionText}>Você ainda não criou eventos.</Text>
        )}
      </View>

      {/* CONQUISTAS */}
      <View style={screenStyles.sectionCard}>
        <Text style={screenStyles.sectionTitle}>
          Conquistas
        </Text>

        {achievements.map((item, index) => (
          <View
            key={item.id}
            style={[
              screenStyles.achievementItem,
              index === achievements.length - 1 &&
                screenStyles.achievementItemLast,
            ]}
          >
            <View style={screenStyles.achievementIconWrap}>
              <MaterialCommunityIcons
                name="star-outline"
                size={18}
                color="#ffffff"
              />
            </View>

            <View style={screenStyles.achievementTextWrap}>
              <Text style={screenStyles.rowTitle}>
                {item.title}
              </Text>

              <Text style={screenStyles.rowSubtitle}>
                {item.subtitle}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}