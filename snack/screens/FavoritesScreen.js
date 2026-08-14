import React from 'react';
import { FlatList, Text, View } from 'react-native';
import { screenStyles } from '../styles/screenStyles';

const sample = [
  { id: '1', title: 'Resenha: Matrix', subtitle: 'Ótima análise' },
  { id: '2', title: 'Resenha: Inception', subtitle: 'Complexa e rica' },
];

export function FavoritesScreen() {
  return (
    <FlatList
      data={sample}
      keyExtractor={(i) => i.id}
      contentContainerStyle={screenStyles.listContent}
      ItemSeparatorComponent={() => <View style={screenStyles.separator} />}
      renderItem={({ item }) => (
        <View style={screenStyles.sectionCard}>
          <Text style={screenStyles.rowTitle}>{item.title}</Text>
          <Text style={screenStyles.rowSubtitle}>{item.subtitle}</Text>
        </View>
      )}
      showsVerticalScrollIndicator={false}
    />
  );
}
