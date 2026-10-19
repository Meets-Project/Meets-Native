import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { adminListReports } from '../services/api';
import { screenStyles } from '../styles/screenStyles';
import { colors } from '../styles/colors';
import { FilterChips } from '../components/FilterChips';
import { REPORT_REASONS } from '../components/ReportModal';

const FILTERS = [
  { id: 'open', label: 'Abertas' },
  { id: 'pending', label: 'Pendentes' },
  { id: 'in_review', label: 'Em análise' },
  { id: 'closed', label: 'Analisadas' },
  { id: 'all', label: 'Todas' },
];

export const REPORT_STATUS = {
  pending: { label: 'Pendente', color: '#b26a00' },
  in_review: { label: 'Em análise', color: '#1565c0' },
  dismissed: { label: 'Improcedente', color: '#6b6b6b' },
  upheld: { label: 'Procedente', color: '#1e7e34' },
};

export const TARGET_TYPES = { post: 'Publicação', event: 'Evento', user: 'Usuário' };
export const reasonLabel = (id) => REPORT_REASONS.find((r) => r.id === id)?.label || id;

// Caso de uso #013 Analisar Denúncias: fila de denúncias.
export function AdminReportsScreen() {
  const navigation = useNavigation();
  const [filter, setFilter] = useState('open');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try { setItems(await adminListReports(filter)); }
    catch (e) { setError(e.message || 'Não foi possível carregar as denúncias.'); }
    finally { setLoading(false); }
  }, [filter]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <FlatList
      data={loading ? [] : items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={screenStyles.listContent}
      ListHeaderComponent={
        <View style={{ gap: 10, marginBottom: 12 }}>
          <FilterChips options={FILTERS} value={filter} onChange={setFilter} />
          {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} /> : null}
          {error ? <Text style={{ color: '#d93025' }}>{error}</Text> : null}
        </View>
      }
      ListEmptyComponent={!loading && !error ? (
        <View style={[screenStyles.sectionCard, { alignItems: 'center', gap: 6 }]}>
          <MaterialCommunityIcons name="shield-check-outline" size={36} color={colors.primary} />
          <Text style={screenStyles.sectionText}>Nenhuma denúncia nesta lista.</Text>
        </View>
      ) : null}
      ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      renderItem={({ item }) => {
        const st = REPORT_STATUS[item.status] || REPORT_STATUS.pending;
        return (
          <TouchableOpacity style={[screenStyles.sectionCard, { gap: 4 }]} onPress={() => navigation.navigate('AdminReportDetail', { reportId: item.id })}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={screenStyles.rowTitle}>{reasonLabel(item.reason)} · {TARGET_TYPES[item.target_type]}</Text>
              <View style={{ borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: st.color }}>
                <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '800' }}>{st.label}</Text>
              </View>
            </View>
            <Text style={screenStyles.rowSubtitle} numberOfLines={2}>"{item.target_preview}"</Text>
            <Text style={screenStyles.rowSubtitle}>
              Autor: {item.target_owner_name} · por {item.reporter_name} · {new Date(item.created_at).toLocaleString('pt-BR')}
              {item.reports_on_target > 1 ? ` · ${item.reports_on_target} denúncias sobre este alvo` : ''}
            </Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}
