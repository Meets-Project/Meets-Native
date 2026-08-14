import React from 'react';
import { FlatList, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { screenStyles } from '../styles/screenStyles';

const chats = [
  { id: '1', name: 'Equipe Cavalo Produto', preview: 'Fechamos pauta do meetup!', unread: 3 },
  { id: '2', name: 'Mentoria Mobile', preview: 'Pode revisar meu PR?', unread: 1 },
  { id: '3', name: 'Design Guild', preview: 'Slides enviados no grupo.', unread: 0 },
];

export function ChatScreen() {
  return (
    <FlatList
      data={chats}
      keyExtractor={(item) => item.id}
      contentContainerStyle={screenStyles.listContent}
      ItemSeparatorComponent={() => <View style={screenStyles.separator} />}
      renderItem={({ item, index }) => (
        <View style={screenStyles.sectionCard}>
          <View style={[screenStyles.rowItem, index === chats.length - 1 && screenStyles.rowItemLast]}>
            <View style={screenStyles.rowLeft}>
              <MaterialCommunityIcons name="message-processing-outline" size={22} color={colors.primary} />
              <View>
                <Text style={screenStyles.rowTitle}>{item.name}</Text>
                <Text style={screenStyles.rowSubtitle}>{item.preview}</Text>
              </View>
            </View>
            {item.unread > 0 ? <Text style={screenStyles.badge}>{item.unread}</Text> : null}
          </View>
        </View>
      )}
      ListHeaderComponent={
        <View style={screenStyles.sectionCard}>
          <Text style={screenStyles.sectionTitle}>Mensagens recentes</Text>
          <Text style={screenStyles.sectionText}>
            Converse com participantes dos seus grupos e organize próximos encontros.
          </Text>
        </View>
      }
      showsVerticalScrollIndicator={false}
    />
  );
}
