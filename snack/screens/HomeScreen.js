import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FeedCard } from '../components/FeedCard';
import { screenStyles } from '../styles/screenStyles';
import { getFeed } from '../services/api';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors } from '../styles/colors';

const filterTabs = [
  { id: 'all', label: 'Todos', icon: 'view-dashboard-outline' },
  { id: 'connections', label: 'Minhas Conexões', icon: 'account-group-outline' },
  { id: 'events', label: 'Eventos / Reuniões', icon: 'calendar-outline' },
  { id: 'presentations', label: 'Apresentações', icon: 'presentation' },
];

export function HomeScreen() {
  const navigation = useNavigation();
  const [activeFilter, setActiveFilter] = useState('all');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFeed = useCallback(async (filter = activeFilter) => {
    setLoading(true);
    setError('');
    try {
      const data = await getFeed(filter === 'connections' ? 'connections' : 'all');
      let filtered = Array.isArray(data) ? data : [];
      if (filter === 'events') {
        filtered = filtered.filter((i) => i.type === 'event');
      } else if (filter === 'presentations') {
        filtered = filtered.filter((i) => i.type === 'presentation' || i.presentation_id);
      }
      setItems(filtered);
    } catch (e) {
      setError(e.message || 'Não foi possível carregar o feed.');
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useFocusEffect(
    useCallback(() => {
      loadFeed(activeFilter);
    }, [loadFeed, activeFilter]),
  );

  function handleFilterChange(filterId) {
    setActiveFilter(filterId);
    loadFeed(filterId);
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(i) => `${i.type}-${i.id}`}
      renderItem={({ item }) => (
        <FeedCard
          item={{
            ...item,
            author_id: item.author?.id || item.author_id,
            author_name: item.author?.name || item.author_name || 'Membro',
            author_avatar: item.author?.avatar || item.author_avatar || '👤',
            timestamp: new Date(item.created_at).toLocaleString('pt-BR'),
          }}
          onRefresh={() => loadFeed(activeFilter)}
        />
      )}
      contentContainerStyle={screenStyles.listContent}
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => <View style={screenStyles.separator} />}
      ListHeaderComponent={
        <View style={{ marginBottom: 12 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
          >
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: isActive ? colors.primary : '#ffffff',
                    borderWidth: 1.5,
                    borderColor: isActive ? colors.primary : colors.border,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    gap: 6,
                  }}
                  onPress={() => handleFilterChange(tab.id)}
                >
                  <MaterialCommunityIcons
                    name={tab.icon}
                    size={16}
                    color={isActive ? '#ffffff' : colors.primary}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: isActive ? '#ffffff' : colors.text,
                    }}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {error ? (
            <View style={[screenStyles.sectionCard, { marginTop: 10 }]}>
              <Text style={screenStyles.sectionText}>{error}</Text>
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        loading ? (
          <View style={[screenStyles.sectionCard, { alignItems: 'center', paddingVertical: 32 }]}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[screenStyles.sectionTitle, { marginTop: 12 }]}>Carregando publicações...</Text>
          </View>
        ) : (
          <View style={[screenStyles.sectionCard, { alignItems: 'center', paddingVertical: 28 }]}>
            <MaterialCommunityIcons
              name={activeFilter === 'connections' ? 'account-search-outline' : 'folder-open-outline'}
              size={48}
              color={colors.textMuted}
            />
            <Text style={[screenStyles.sectionTitle, { marginTop: 12, textAlign: 'center' }]}>
              {activeFilter === 'connections'
                ? 'Nenhuma publicação de conexões'
                : 'Nenhuma publicação encontrada'}
            </Text>
            <Text style={[screenStyles.sectionText, { textAlign: 'center', marginTop: 6, marginBottom: 16 }]}>
              {activeFilter === 'connections'
                ? 'Conecte-se com palestrantes e membros no feed ou na aba de busca para ver novidades aqui.'
                : 'Seja o primeiro a compartilhar um evento, atualização ou apresentação!'}
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 10,
              }}
              onPress={() => {
                if (activeFilter === 'connections') {
                  navigation.navigate('Search');
                } else {
                  handleFilterChange('all');
                }
              }}
            >
              <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 14 }}>
                {activeFilter === 'connections' ? 'Explorar membros na Busca' : 'Ver todas as publicações'}
              </Text>
            </TouchableOpacity>
          </View>
        )
      }
    />
  );
}
