import React from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../styles/colors';
import { screenStyles } from '../styles/screenStyles';
import { createOptions } from '../data/createOptions';

export function CreateScreen() {
  const navigation = useNavigation();

  const routeMap = {
    1: { screen: 'CreateFlow', params: { mode: 'event', title: 'Criar Evento' } },
    2: { screen: 'CreateFlow', params: { mode: 'live', title: 'Abrir Sala Ao Vivo' } },
    3: { screen: 'CreateFlow', params: { mode: 'post', title: 'Publicar Atualização' } },
    4: { screen: 'CreateFlow', params: { mode: 'presentation', title: 'Criar Apresentação' } },
    5: { screen: 'PresentationRating', params: {} },
  };

  return (
    <FlatList
      data={createOptions}
      keyExtractor={(item) => item.id}
      contentContainerStyle={screenStyles.listContent}
      ItemSeparatorComponent={() => <View style={screenStyles.separator} />}
      renderItem={({ item, index }) => (
        <View style={screenStyles.sectionCard}>
          <View style={[screenStyles.rowItem, index === createOptions.length - 1 && screenStyles.rowItemLast]}>
            <View style={screenStyles.rowLeft}>
              <MaterialCommunityIcons name={item.icon} size={22} color={colors.primary} />
              <View>
                <Text style={screenStyles.rowTitle}>{item.title}</Text>
                <Text style={screenStyles.rowSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={screenStyles.createButton}
            onPress={() => {
              const target = routeMap[item.id];
              if (target) navigation.navigate(target.screen, target.params);
            }}
          >
            <Text style={screenStyles.createButtonText}>Começar</Text>
          </TouchableOpacity>
        </View>
      )}
      ListHeaderComponent={
        <View style={screenStyles.sectionCard}>
          <Text style={screenStyles.sectionTitle}>Ferramentas de criação</Text>
          <Text style={screenStyles.sectionText}>
            Escolha o formato ideal para organizar encontros e manter sua comunidade ativa.
          </Text>
        </View>
      }
      showsVerticalScrollIndicator={false}
    />
  );
}
