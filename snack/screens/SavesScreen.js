import React from 'react';
import { FlatList, Text, View } from 'react-native';
import { screenStyles } from '../styles/screenStyles';

const sample = [
  { id: '1', title: 'Salvo: Guia de Meetup', subtitle: 'Marcado para ler' },
  { id: '2', title: 'Salvo: Checklist de evento', subtitle: 'Importante' },
];

export function SavesScreen() {
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
