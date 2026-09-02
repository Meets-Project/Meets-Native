import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { screenStyles } from '../styles/screenStyles';
import { getSaves, toggleSave } from '../services/api';

export function SavesScreen() {
  const navigation = useNavigation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all'); // 'all', 'posts', 'events'

  const loadSaves = useCallback(async () => {
    try {
      const data = await getSaves();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Erro ao carregar itens salvos:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const data = await getSaves();
          if (active) setItems(Array.isArray(data) ? data : []);
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  async function handleRemoveSave(id) {
    try {
      await toggleSave(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      console.error('Erro ao remover item dos salvos:', e);
    }
  }

  const filteredItems = items.filter((item) => {
    if (selectedTab === 'posts') return item.type !== 'event';
    if (selectedTab === 'events') return item.type === 'event';
    return true;
  });

  if (loading) {
    return (
      <View style={[screenStyles.listContent, { alignItems: 'center', justifyContent: 'center', minHeight: 250 }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Tabs Filter */}
      <View
        style={{
          flexDirection: 'row',
          padding: 12,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          gap: 8,
        }}
      >
        {[
          { key: 'all', label: 'Todos' },
          { key: 'posts', label: 'Publicações' },
          { key: 'events', label: 'Eventos' },
        ].map((tab) => {
          const isActive = selectedTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: isActive ? colors.primary : colors.surfaceSoft,
              }}
              onPress={() => setSelectedTab(tab.key)}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: isActive ? '#ffffff' : colors.textMuted,
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        contentContainerStyle={screenStyles.listContent}
        ItemSeparatorComponent={() => <View style={screenStyles.separator} />}
        renderItem={({ item }) => {
          const isEvent = item.type === 'event';

          return (
            <View style={screenStyles.sectionCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 20 }}>{item.author_avatar || (isEvent ? '📅' : '👤')}</Text>
                  <View>
                    <Text style={[screenStyles.rowTitle, { fontSize: 13 }]}>{item.author_name || 'Membro'}</Text>
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      Salvo em {item.saved_at ? new Date(item.saved_at).toLocaleDateString('pt-BR') : 'recente'}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 12,
                      backgroundColor: isEvent ? colors.primarySoft : colors.secondarySoft,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '800',
                        color: isEvent ? colors.primary : colors.secondary,
                      }}
                    >
                      {isEvent ? 'Evento' : 'Publicação'}
                    </Text>
                  </View>

                  <TouchableOpacity onPress={() => handleRemoveSave(item.id)}>
                    <MaterialCommunityIcons name="bookmark-remove" size={22} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              {item.title ? (
                <Text style={[screenStyles.rowTitle, { fontSize: 16, marginBottom: 6 }]}>{item.title}</Text>
              ) : null}

              {isEvent && (item.event_date || item.location) ? (
                <View style={{ backgroundColor: colors.background, padding: 10, borderRadius: 8, marginBottom: 8, gap: 4 }}>
                  {item.event_date ? (
                    <Text style={{ fontSize: 12, color: colors.text, fontWeight: '600' }}>
                      📅 {new Date(`${item.event_date}T00:00:00`).toLocaleDateString('pt-BR')}
                      {item.event_time ? ` às ${String(item.event_time).slice(0, 5)}` : ''}
                    </Text>
                  ) : null}
                  {item.location ? (
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>📍 {item.location}</Text>
                  ) : null}
                </View>
              ) : null}

              <Text style={[screenStyles.sectionText, { marginBottom: item.image ? 10 : 0 }]}>
                {item.content}
              </Text>

              {item.image ? (
                <View style={{ borderRadius: 8, overflow: 'hidden', backgroundColor: colors.primarySoft, marginTop: 6 }}>
                  <Image source={{ uri: item.image }} style={{ width: '100%', height: 180 }} resizeMode="cover" />
                </View>
              ) : null}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={screenStyles.sectionCard}>
            <Text style={screenStyles.sectionTitle}>Nenhum item salvo</Text>
            <Text style={screenStyles.sectionText}>
              Você pode salvar publicações e eventos no feed para consultar quando quiser.
            </Text>
          </View>
        }
      />
    </View>
  );
}
