import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchCurrentUser } from '../services/userApi';
import { screenStyles } from '../styles/screenStyles';

export function SavesScreen() {
  const [savedItems, setSavedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadSaves() {
        try {
          const profile = await fetchCurrentUser();
          if (!isActive) return;
          setSavedItems(Array.isArray(profile?.savedItems) ? profile.savedItems : []);
        } catch (_error) {
          if (isActive) {
            setSavedItems([]);
          }
        } finally {
          if (isActive) setIsLoading(false);
        }
      }

      setIsLoading(true);
      loadSaves();

      return () => {
        isActive = false;
      };
    }, []),
  );

  if (isLoading) {
    return (
      <View style={[screenStyles.listContent, { alignItems: 'center', justifyContent: 'center', minHeight: 320 }]}> 
        <ActivityIndicator size="large" color="#2f80ed" />
      </View>
    );
  }

  return (
    <FlatList
      data={savedItems}
      keyExtractor={(i) => i.id}
      contentContainerStyle={screenStyles.listContent}
      ItemSeparatorComponent={() => <View style={screenStyles.separator} />}
      renderItem={({ item }) => (
        <View style={screenStyles.sectionCard}>
          <Text style={screenStyles.rowTitle}>{item.folderName || item.creation?.title || 'Salvo'}</Text>
          <Text style={screenStyles.rowSubtitle} numberOfLines={2}>
            {item.creation?.content || item.creation?.details || item.creation?.summary || 'Item salvo'}
          </Text>
        </View>
      )}
      ListEmptyComponent={
        <View style={screenStyles.sectionCard}>
          <Text style={screenStyles.rowTitle}>Nenhum item salvo ainda</Text>
          <Text style={screenStyles.rowSubtitle}>Use a estrela em qualquer post para salvar.</Text>
        </View>
      }
      showsVerticalScrollIndicator={false}
    />
  );
}
