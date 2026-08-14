import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { screenStyles } from '../styles/screenStyles';
import { colors } from '../styles/colors';
import { fetchCurrentUser } from '../services/userApi';

function buildAchievements(user) {
  return [
    { id: 'events', title: 'Host em destaque', subtitle: `${user.eventsCount || 0} eventos criados este mês` },
    { id: 'connections', title: 'Conector da comunidade', subtitle: `${user.connections || 0} conexões ativas` },
    { id: 'rating', title: 'Mentor ativo', subtitle: `${(user.rating || 0).toFixed(1)} de avaliação média` },
  ];
}

function isRenderableImageUri(uri) {
  return typeof uri === 'string' && (uri.startsWith('data:') || uri.startsWith('http://') || uri.startsWith('https://'));
}

function profileItemLabel(item) {
  if (!item) return 'Item';
  return item.title || item.name || item.folderName || item.creation?.title || item.creation?.name || 'Item';
}

function profileItemSubtitle(item) {
  if (!item) return '';
  return item.subtitle || item.content || item.role || item.creation?.content || item.creation?.details || item.creation?.summary || item.creation?.description || '';
}

function ProfileContentCard({ item, accentColor }) {
  return (
    <View style={[screenStyles.sectionCard, { borderLeftWidth: 4, borderLeftColor: accentColor, marginBottom: 10 }]}> 
      <Text style={screenStyles.rowTitle}>{profileItemLabel(item)}</Text>
      {profileItemSubtitle(item) ? <Text style={screenStyles.rowSubtitle}>{profileItemSubtitle(item)}</Text> : null}
    </View>
  );
}

function ProfileSection({ title, accentColor, created, tagged, createdLabel, taggedLabel, emptyText }) {
  const hasCreated = Array.isArray(created) && created.length > 0;
  const hasTagged = Array.isArray(tagged) && tagged.length > 0;

  return (
    <View style={screenStyles.sectionCard}>
      <Text style={screenStyles.sectionTitle}>{title}</Text>

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <View style={{ backgroundColor: accentColor, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{createdLabel}</Text>
        </View>
        <View style={{ backgroundColor: '#f1f1f1', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}>
          <Text style={{ color: '#444', fontWeight: '700', fontSize: 12 }}>{taggedLabel}</Text>
        </View>
      </View>

      {hasCreated ? created.map((item) => <ProfileContentCard key={`created-${item.id}`} item={item} accentColor={accentColor} />) : null}
      {hasTagged ? tagged.map((item) => <ProfileContentCard key={`tagged-${item.id}`} item={item} accentColor="#6c63ff" />) : null}
      {!hasCreated && !hasTagged ? <Text style={screenStyles.rowSubtitle}>{emptyText}</Text> : null}
    </View>
  );
}

export function ProfileScreen() {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadUser() {
        try {
          const profile = await fetchCurrentUser();

          if (!isActive) {
            return;
          }

          setUser(profile);
          setErrorMessage('');
        } catch (error) {
          if (!isActive) {
            return;
          }

          setErrorMessage(error.message);
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
      <View style={[screenStyles.listContent, { justifyContent: 'center', alignItems: 'center', minHeight: 360 }]}> 
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[screenStyles.sectionTitle, { marginTop: 16 }]}>Carregando perfil...</Text>
      </View>
    );
  }

  const profile = user || {
    name: 'Meu perfil',
    role: 'Perfil indisponível',
    city: 'Cidade não informada',
    avatar: '👤',
    avatarUri: '',
    connections: 0,
    eventsCount: 0,
    rating: 0,
    bio: '',
  };
  const profileCreations = Array.isArray(profile.creations) ? profile.creations : [];
  const postsCreated = profileCreations.filter((creation) => creation?.mode === 'post');
  const meetsCreated = profileCreations.filter((creation) => creation?.mode === 'meet');
  const roomsCreated = profileCreations.filter((creation) => creation?.mode === 'virtual-room');
  const taggedPosts = Array.isArray(profile.taggedPosts) ? profile.taggedPosts : Array.isArray(profile.taggedCreations) ? profile.taggedCreations.filter((item) => item?.mode === 'post') : [];
  const meetsParticipated = Array.isArray(profile.participatedMeets) ? profile.participatedMeets : [];
  const roomsParticipated = Array.isArray(profile.participatedRooms) ? profile.participatedRooms : Array.isArray(profile.participatedVirtualRooms) ? profile.participatedVirtualRooms : [];
  const savedItems = Array.isArray(profile.savedItems) ? profile.savedItems : [];
  const achievements = buildAchievements(profile);

  return (
    <ScrollView contentContainerStyle={screenStyles.listContent} showsVerticalScrollIndicator={false}>
      <View style={screenStyles.profileHeroCard}>
        <View style={screenStyles.profileAvatarWrap}>
          {isRenderableImageUri(profile.avatarUri) ? (
            <Image source={{ uri: profile.avatarUri }} style={{ width: 92, height: 92, borderRadius: 46 }} />
          ) : (
            <Text style={screenStyles.profileAvatar}>{profile.avatar || '👤'}</Text>
          )}
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
          <TouchableOpacity style={screenStyles.profileActionPrimary} onPress={() => navigation.navigate('EditProfile')}>
            <Text style={screenStyles.profileActionPrimaryText}>Editar perfil</Text>
          </TouchableOpacity>
          <TouchableOpacity style={screenStyles.profileActionSecondary} onPress={() => navigation.navigate('ShareProfile')}>
            <MaterialCommunityIcons name="share-variant-outline" size={18} color={screenStyles.shareIcon.color} />
            <Text style={screenStyles.profileActionSecondaryText}>Compartilhar</Text>
          </TouchableOpacity>
        </View>
      </View>

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
            <Text style={screenStyles.statValue}>{Number(profile.rating || 0).toFixed(1)}</Text>
            <Text style={screenStyles.statLabel}>Avaliação</Text>
          </View>
        </View>
      </View>

      {errorMessage ? (
        <View style={screenStyles.sectionCard}>
          <Text style={screenStyles.sectionTitle}>Sincronização</Text>
          <Text style={screenStyles.rowSubtitle}>{errorMessage}</Text>
        </View>
      ) : null}

      <View style={screenStyles.sectionCard}>
        <Text style={screenStyles.sectionTitle}>Atalhos</Text>
        <View style={screenStyles.quickActionRow}>
          <TouchableOpacity style={screenStyles.quickActionCard} onPress={() => navigation.navigate('saves')}>
            <MaterialCommunityIcons name="bookmark-outline" size={20} color="#ffffff" />
            <Text style={screenStyles.quickActionText}>Salvos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={screenStyles.quickActionCard} onPress={() => navigation.navigate('history')}>
            <MaterialCommunityIcons name="history" size={20} color="#ffffff" />
            <Text style={screenStyles.quickActionText}>Histórico</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ProfileSection
        title="Posts"
        accentColor="#2f80ed"
        created={postsCreated}
        tagged={taggedPosts}
        createdLabel="Criei"
        taggedLabel="Fui marcado"
        emptyText="Nenhum post criado ou marcado ainda."
      />

      <ProfileSection
        title="Meets"
        accentColor="#27ae60"
        created={meetsCreated}
        tagged={meetsParticipated}
        createdLabel="Criei"
        taggedLabel="Participei"
        emptyText="Nenhum meet criado ou participado ainda."
      />

      <ProfileSection
        title="Salas virtuais"
        accentColor="#9b51e0"
        created={roomsCreated}
        tagged={roomsParticipated}
        createdLabel="Criei"
        taggedLabel="Participei"
        emptyText="Nenhuma sala virtual criada ou participada ainda."
      />

      <View style={screenStyles.sectionCard}>
        <Text style={screenStyles.sectionTitle}>Salvos</Text>
        {savedItems.length > 0 ? (
          savedItems.map((item) => (
            <View key={item.id} style={{ marginBottom: 10 }}>
              <ProfileContentCard item={item} accentColor="#f2c94c" />
            </View>
          ))
        ) : (
          <Text style={screenStyles.rowSubtitle}>Nenhum item salvo ainda.</Text>
        )}
      </View>

      <View style={screenStyles.sectionCard}>
        <Text style={screenStyles.sectionTitle}>Conquistas</Text>
        {achievements.map((item, index) => (
          <View
            key={item.id}
            style={[
              screenStyles.achievementItem,
              index === achievements.length - 1 && screenStyles.achievementItemLast,
            ]}
          >
            <View style={screenStyles.achievementIconWrap}>
              <MaterialCommunityIcons name="star-outline" size={18} color="#ffffff" />
            </View>
            <View style={screenStyles.achievementTextWrap}>
              <Text style={screenStyles.rowTitle}>{item.title}</Text>
              <Text style={screenStyles.rowSubtitle}>{item.subtitle}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
