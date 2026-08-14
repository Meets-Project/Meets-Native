import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../styles/colors';
import { screenStyles } from '../styles/screenStyles';
import { fetchCurrentUser, fetchMeets, fetchRooms, updateCurrentUser } from '../services/userApi';

export function SearchScreen() {
  const [items, setItems] = useState([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadItems() {
        try {
          const [meets, rooms] = await Promise.all([fetchMeets(), fetchRooms()]);
          const combined = [...(Array.isArray(meets) ? meets : []), ...(Array.isArray(rooms) ? rooms : [])].map((item) => ({
            id: item.id,
            title: item.title || item.name || 'Item',
            subtitle: item.details || item.summary || item.topic || item.location || item.duration || 'Sem descrição',
            tag: item.mode === 'virtual-room' ? 'Sala' : 'Meet',
            creation: item,
          }));

          if (active) setItems(combined);
        } catch (_error) {
          if (active) setItems([]);
        }
      }

      loadItems();
      return () => { active = false; };
    }, []),
  );

  async function handleSave(item) {
    try {
      const user = await fetchCurrentUser();
      const savedItems = Array.isArray(user.savedItems) ? user.savedItems : [];
      const alreadyAdded = savedItems.some((entry) => entry.creationId === item.id || entry.id === item.id);
      if (alreadyAdded) {
        Alert.alert('Item já salvo');
        return;
      }

      const savedEntry = {
        id: `saved-${Date.now()}`,
        creationId: item.id,
        creation: item.creation,
        folderName: 'Salvos',
        savedAt: new Date().toISOString(),
      };

      await updateCurrentUser({
        ...user,
        savedItems: [savedEntry, ...savedItems],
      });
      Alert.alert('Salvo com sucesso');
    } catch (_error) {
      Alert.alert('Não foi possível salvar o item');
    }
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={screenStyles.listContent}
      ItemSeparatorComponent={() => <View style={screenStyles.separator} />}
      renderItem={({ item, index }) => (
        <View style={screenStyles.sectionCard}>
          <View style={[screenStyles.rowItem, index === items.length - 1 && screenStyles.rowItemLast]}>
            <View style={screenStyles.rowLeft}>
              <MaterialCommunityIcons name="compass-outline" size={22} color={colors.primary} />
              <View>
                <Text style={screenStyles.rowTitle}>{item.title}</Text>
                <Text style={screenStyles.rowSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={screenStyles.badge}>{item.tag}</Text>
              <TouchableOpacity onPress={() => handleSave(item)} style={{ marginTop: 8 }}>
                <Text style={{ color: colors.primary, fontWeight: '700' }}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      ListHeaderComponent={
        <View style={screenStyles.sectionCard}>
          <Text style={screenStyles.sectionTitle}>Meets e salas disponíveis</Text>
          <Text style={screenStyles.sectionText}>
            Explore eventos e salas criadas pela comunidade e salve os que te interessarem.
          </Text>
        </View>
      }
      ListEmptyComponent={
        <View style={screenStyles.sectionCard}>
          <Text style={screenStyles.rowTitle}>Nenhum meet ou sala encontrado</Text>
          <Text style={screenStyles.rowSubtitle}>Crie o primeiro item para aparecer aqui.</Text>
        </View>
      }
      showsVerticalScrollIndicator={false}
    />
  );
}
