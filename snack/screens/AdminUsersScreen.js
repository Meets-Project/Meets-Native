import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { adminListUsers } from '../services/api';
import { screenStyles } from '../styles/screenStyles';
import { colors } from '../styles/colors';
import { AvatarImage } from '../components/AvatarImage';
import { FilterChips } from '../components/FilterChips';

const STATUS_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'active', label: 'Ativos' },
  { id: 'deactivated', label: 'Desativados' },
];

const TYPE_FILTERS = [
  { id: 'all', label: 'Qualquer tipo' },
  { id: 'user', label: 'Usuários' },
  { id: 'admin', label: 'Administradores' },
];

// Caso de uso #012 Manter Usuários: lista, busca e acesso a criar/editar.
export function AdminUsersScreen() {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setUsers(await adminListUsers({ q: query.trim(), status, type }));
    } catch (e) {
      setError(e.message || 'Não foi possível carregar os usuários.');
    } finally {
      setLoading(false);
    }
  }, [query, status, type]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <FlatList
      data={loading ? [] : users}
      keyExtractor={(item) => item.id}
      contentContainerStyle={screenStyles.listContent}
      ListHeaderComponent={
        <View style={{ gap: 10, marginBottom: 12 }}>
          <TouchableOpacity
            style={[screenStyles.createButton, { flexDirection: 'row', gap: 6, justifyContent: 'center' }]}
            onPress={() => navigation.navigate('AdminUserForm', {})}
          >
            <MaterialCommunityIcons name="account-plus" size={18} color="#ffffff" />
            <Text style={screenStyles.createButtonText}>Novo usuário</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12 }}>
            <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={load}
              placeholder="Buscar por nome ou e-mail"
              placeholderTextColor={colors.textMuted}
              returnKeyType="search"
              autoCapitalize="none"
              style={{ flex: 1, paddingVertical: 10, color: colors.text }}
            />
          </View>
          <FilterChips options={STATUS_FILTERS} value={status} onChange={setStatus} />
          <FilterChips options={TYPE_FILTERS} value={type} onChange={setType} />
          {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} /> : null}
          {error ? <Text style={{ color: '#d93025' }}>{error}</Text> : null}
        </View>
      }
      ListEmptyComponent={!loading && !error ? (
        <View style={screenStyles.sectionCard}>
          <Text style={screenStyles.sectionText}>Nenhum usuário encontrado com esses filtros.</Text>
        </View>
      ) : null}
      ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[screenStyles.sectionCard, { flexDirection: 'row', alignItems: 'center', gap: 12, opacity: item.status === 'active' ? 1 : 0.6 }]}
          onPress={() => navigation.navigate('AdminUserForm', { userId: item.id })}
        >
          <AvatarImage value={item.avatar} size={42} />
          <View style={{ flex: 1 }}>
            <Text style={screenStyles.rowTitle}>{item.name}</Text>
            <Text style={screenStyles.rowSubtitle}>{item.email}</Text>
            <Text style={screenStyles.rowSubtitle}>{item.posts_count} posts · {item.events_count} eventos</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            {item.account_type === 'admin' ? <Badge label="Admin" color={colors.primary} /> : null}
            {item.status !== 'active' ? <Badge label="Desativado" color="#6b6b6b" /> : null}
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

function Badge({ label, color }) {
  return (
    <View style={{ borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: color }}>
      <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '800' }}>{label}</Text>
    </View>
  );
}
