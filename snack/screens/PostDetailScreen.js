import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { FeedCard } from '../components/FeedCard';
import { getFeed } from '../services/api';
import { colors } from '../styles/colors';

export function PostDetailScreen() {
  const route = useRoute();
  const postId = route.params?.postId;
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getFeed('all').then((items) => {
      if (!active) return;
      const found = (items || []).find((item) => item.type !== 'event' && item.id === postId);
      if (found) setPost(found);
      else setError('Publicação não encontrada.');
    }).catch(() => {
      if (active) setError('Não foi possível carregar a publicação.');
    });
    return () => { active = false; };
  }, [postId]);

  if (!post && !error) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View>;
  if (error) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}><Text>{error}</Text></View>;
  return <View style={{ flex: 1, padding: 14 }}><FeedCard item={post} onRefresh={() => {}} /></View>;
}
