import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { fetchHistory } from '../services/userApi';
import { screenStyles } from '../styles/screenStyles';

export function HistoryScreen() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadHistory() {
        try {
          const history = await fetchHistory();
          if (!active) return;
          setItems(history);
        } catch (_error) {
          if (active) setItems([]);
        } finally {
          if (active) setIsLoading(false);
        }
      }

      setIsLoading(true);
      loadHistory();
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
      keyExtractor={(i) => i.id || `${i.type || 'history'}-${i.createdAt || Date.now()}`}
      contentContainerStyle={screenStyles.listContent}
      ItemSeparatorComponent={() => <View style={screenStyles.separator} />}
      ListEmptyComponent={
        <View style={screenStyles.sectionCard}>
          <Text style={screenStyles.rowTitle}>Nenhuma atividade no histórico</Text>
          <Text style={screenStyles.rowSubtitle}>Crie posts, meets e salas para registrar ações aqui.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={screenStyles.sectionCard}>
          <Text style={screenStyles.rowTitle}>{item.title || item.type || 'Atividade'}</Text>
          <Text style={screenStyles.rowSubtitle}>{item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Ação recente'}</Text>
        </View>
      )}
      showsVerticalScrollIndicator={false}
    />
  );
}
