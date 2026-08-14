import React, { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FeedCard } from '../components/FeedCard';
import { getBackendBaseUrl } from '../data/apiConfig';
import { feedItems } from '../data/feedItems';
import { screenStyles } from '../styles/screenStyles';
import { fetchCurrentUser, fetchPosts } from '../services/userApi';

function toRelativeTime(isoDate) {
  if (!isoDate) {
    return 'agora';
  }

  const createdAt = new Date(isoDate);
  const diffMs = Date.now() - createdAt.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} min atrás`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} h atrás`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} d atrás`;
}

function getAttachmentEmoji(attachmentType) {
  if (attachmentType === 'video') return '🎥';
  if (attachmentType === 'music') return '🎵';
  if (attachmentType === 'image') return '🖼️';
  return undefined;
}

function buildCreationFeedItem(creation, profile) {
  const textParts = [];

  if (creation.title) {
    textParts.push(creation.title);
  }

  const bodyText = creation.content || creation.details || creation.summary || creation.description;
  if (bodyText && bodyText !== creation.title) {
    textParts.push(bodyText);
  }

  if (creation.attachment?.uri) {
    textParts.push(`Anexo ${creation.attachment.type}: ${creation.attachment.name || 'arquivo'}`);
  }

  return {
    id: creation.id,
    author: profile?.name || 'Você',
    avatar: profile?.avatar || '👤',
    content: textParts.join('\n\n'),
    likes: 0,
    image: getAttachmentEmoji(creation.attachment?.type),
    attachment: creation.attachment || null,
    timestamp: toRelativeTime(creation.createdAt),
  };
}

export function HomeScreen() {
  const [backendStatus, setBackendStatus] = useState('Conectando backend...');
  const [dynamicFeedItems, setDynamicFeedItems] = useState([]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadUserFeed() {
        try {
          const profile = await fetchCurrentUser();
          const backendPosts = await fetchPosts();
          const creations = Array.isArray(profile?.creations) ? profile.creations : [];

          const postCreations = [...backendPosts, ...creations]
            .filter((item) => item && (item.mode === 'post' || item.title || item.content))
            .filter((item) => item.mode === 'post' || !item.mode || item.mode === 'post')
            .sort((left, right) => new Date(right.createdAt || right.createdAt || 0).getTime() - new Date(left.createdAt || left.createdAt || 0).getTime())
            .map((creation) => buildCreationFeedItem(creation, profile));

          if (isActive) {
            setDynamicFeedItems(postCreations);
          }
        } catch (_error) {
          if (isActive) {
            setDynamicFeedItems([]);
          }
        }
      }

      loadUserFeed();

      return () => {
        isActive = false;
      };
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
    async function checkBackend() {
      try {
        const baseUrl = getBackendBaseUrl();
        const response = await fetch(`${baseUrl}/health`);

        if (!response.ok) {
          setBackendStatus('Backend respondeu com erro');
          return;
        }

        setBackendStatus(`Backend online em ${baseUrl}`);
      } catch (error) {
        setBackendStatus('Backend offline. Inicie o serviço ou confira o proxy interno.');
      }
    }

    checkBackend();
  }, []),
  );

  const feedData = [...dynamicFeedItems, ...feedItems];

  return (
    <FlatList
      data={feedData}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <FeedCard item={item} />}
      contentContainerStyle={screenStyles.listContent}
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => <View style={screenStyles.separator} />}
      ListHeaderComponent={
        <View style={screenStyles.backendStatusCard}>
          <Text style={screenStyles.backendStatusTitle}>Status do Backend</Text>
          <Text style={screenStyles.backendStatusText}>{backendStatus}</Text>
        </View>
      }
    />
  );
}
