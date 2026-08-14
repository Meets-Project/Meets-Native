import React from 'react';
import { FlatList, Text, View } from 'react-native';
import { screenStyles } from '../styles/screenStyles';

const sample = [
  { id: '1', title: 'Participou: Meetup React', subtitle: '2 dias atrás' },
  { id: '2', title: 'Criou: Resenha sobre React Native', subtitle: '1 semana' },
];

export function HistoryScreen() {
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
