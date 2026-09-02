import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
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
    connections: 0,
    eventsCount: 0,
    rating: 0,
    bio: '',
  };
  const achievements = buildAchievements(profile);

  return (
    <ScrollView contentContainerStyle={screenStyles.listContent} showsVerticalScrollIndicator={false}>
      <View style={screenStyles.profileHeroCard}>
        <View style={screenStyles.profileAvatarWrap}>
          <Text style={screenStyles.profileAvatar}>{profile.avatar || '👤'}</Text>
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
