import React, { useEffect, useState } from 'react';
import { FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../styles/colors';
import { screenStyles } from '../styles/screenStyles';
import { search as searchApi } from '../services/api';

export function SearchScreen() {
  const navigation = useNavigation();
  const [q, setQ] = useState('');
  const [data, setData] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (q.trim()) {
        searchApi(q).then(setData).catch(() => setData([]));
      } else {
        setData([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  function handleItemPress(item) {
    if (item.type === 'user') {
      navigation.navigate('SpeakerProfile', {
        speakerId: item.id,
        speakerName: item.title,
        speakerAvatar: item.avatar || '👤',
      });
    }
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(i) => `${i.type}-${i.id}`}
      contentContainerStyle={screenStyles.listContent}
      ItemSeparatorComponent={() => <View style={screenStyles.separator} />}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={screenStyles.sectionCard}
          onPress={() => handleItemPress(item)}
          activeOpacity={item.type === 'user' ? 0.7 : 1}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={screenStyles.rowLeft}>
              {item.type === 'user' ? (
                <Text style={{ fontSize: 24, marginRight: 10 }}>{item.avatar || '👤'}</Text>
              ) : (
                <MaterialCommunityIcons name="text-box-outline" size={22} color={colors.primary} style={{ marginRight: 10 }} />
              )}
              <View>
                <Text style={screenStyles.rowTitle}>{item.title}</Text>
                <Text style={screenStyles.rowSubtitle}>{item.subtitle || ''}</Text>
              </View>
            </View>
            {item.type === 'user' ? (
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
            ) : null}
          </View>
        </TouchableOpacity>
      )}
      ListHeaderComponent={
        <View style={screenStyles.sectionCard}>
          <Text style={screenStyles.sectionTitle}>Buscar na rede Meets</Text>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Pesquise por membros, cargos ou publicações"
            placeholderTextColor="#9a9a9a"
            style={{
              borderWidth: 1,
              borderColor: '#ddd',
              borderRadius: 10,
              padding: 12,
              marginTop: 10,
              fontSize: 14,
            }}
          />
        </View>
      }
      ListEmptyComponent={
        q ? (
          <View style={screenStyles.sectionCard}>
            <Text style={screenStyles.sectionText}>Nenhum resultado encontrado para "{q}".</Text>
          </View>
        ) : (
          <View style={screenStyles.sectionCard}>
            <Text style={screenStyles.sectionText}>Digite o nome de uma pessoa ou tema para pesquisar.</Text>
          </View>
        )
      }
    />
  );
}
