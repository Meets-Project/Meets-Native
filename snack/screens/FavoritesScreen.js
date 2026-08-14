import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchCurrentUser } from '../services/userApi';
import { screenStyles } from '../styles/screenStyles';

export function FavoritesScreen() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadFavorites() {
        try {
          const user = await fetchCurrentUser();
          if (!active) return;
          const favorites = Array.isArray(user?.savedItems)
            ? user.savedItems.filter((item) => item.folderName === 'Favoritos' || item.creation?.favorite || item.favorite)
            : [];
          setItems(favorites);
        } catch (_error) {
          if (active) setItems([]);
        } finally {
          if (active) setIsLoading(false);
        }
      }

      setIsLoading(true);
      loadFavorites();

      return () => { active = false; };
    }, []),
  );

  if (isLoading) {
    return (
      <View style={[screenStyles.listContent, { alignItems: 'center', justifyContent: 'center', minHeight: 240 }]}> 
        <ActivityIndicator size="large" color="#2f80ed" />
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.id || `${i.creationId || i.folderName || 'favorite'}-${Math.random()}`}
      contentContainerStyle={screenStyles.listContent}
      ItemSeparatorComponent={() => <View style={screenStyles.separator} />}
      ListEmptyComponent={
        <View style={screenStyles.sectionCard}>
          <Text style={screenStyles.rowTitle}>Nenhum favorito ainda</Text>
          <Text style={screenStyles.rowSubtitle}>Use a estrela nos posts para salvá-los aqui.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={screenStyles.sectionCard}>
          <Text style={screenStyles.rowTitle}>{item.creation?.title || item.title || item.folderName || 'Favorito'}</Text>
          <Text style={screenStyles.rowSubtitle}>{item.creation?.content || item.creation?.details || item.creation?.summary || 'Item marcado com estrela'}</Text>
        </View>
      )}
      showsVerticalScrollIndicator={false}
    />
  );
}
