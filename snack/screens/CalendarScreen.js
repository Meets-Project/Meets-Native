import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getCalendar } from '../services/api';
import { colors } from '../styles/colors';
import { formatLocalDate } from '../utils/masks';

export function CalendarScreen() {
  const navigation = useNavigation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getCalendar();
      const sorted = Array.isArray(data) ? data : [];
      setItems(sorted);
      setSelectedDate((current) => current || sorted[0]?.event_date || '');
    } catch (e) {
      setError(e?.message || 'Não foi possível carregar o calendário.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const dates = useMemo(() => [...new Set(items.map((i) => String(i.event_date).slice(0, 10)))], [items]);
  const visibleItems = selectedDate ? items.filter((i) => String(i.event_date).slice(0, 10) === selectedDate) : items;

  return (
    <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 100 }}>
      <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <MaterialCommunityIcons name="calendar-month-outline" size={28} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 21, fontWeight: '900', color: colors.text }}>Calendário</Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 3 }}>Eventos e apresentações da sua agenda.</Text>
          </View>
          <TouchableOpacity onPress={load} accessibilityLabel="Atualizar calendário">
            <MaterialCommunityIcons name="refresh" size={23} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {error ? <Text style={{ color: '#d93025', padding: 12 }}>{error}</Text> : null}
      {loading ? (
        <View style={{ alignItems: 'center', padding: 40 }}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : items.length === 0 ? (
        <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 28, marginTop: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
          <MaterialCommunityIcons name="calendar-blank-outline" size={52} color={colors.textMuted} />
          <Text style={{ fontWeight: '800', color: colors.text, marginTop: 12 }}>Nenhum compromisso no calendário</Text>
          <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 5 }}>Eventos que você criou ou confirmou aparecerão aqui.</Text>
        </View>
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 12 }}>
            {dates.map((date) => {
              const active = date === selectedDate;
              return (
                <TouchableOpacity key={date} onPress={() => setSelectedDate(date)} style={{ minWidth: 92, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary : '#fff', alignItems: 'center' }}>
                  <Text style={{ color: active ? '#fff' : colors.textMuted, fontSize: 11, fontWeight: '700' }}>{formatLocalDate(date, { weekday: 'short' })}</Text>
                  <Text style={{ color: active ? '#fff' : colors.text, fontSize: 16, fontWeight: '900', marginTop: 2 }}>{formatLocalDate(date)}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {visibleItems.map((item) => {
            const ended = item.event_date && item.event_end_time
              ? new Date(`${String(item.event_date).slice(0, 10)}T${String(item.event_end_time).slice(0, 5)}:00`) <= new Date()
              : false;
            return (
              <TouchableOpacity
                key={`${item.type}-${item.id}`}
                onPress={() => ended ? (item.type === 'event' ? navigation.navigate('EventRating', { eventId: item.id }) : navigation.navigate('PresentationRating', { postId: item.id, presentationId: item.presentation_id || `presentation-${item.id}`, presentationTitle: item.title })) : (item.type === 'event' ? navigation.navigate('EventDetail', { eventId: item.id }) : navigation.navigate('PostDetail', { postId: item.id }))}
                style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border }}
              >
                <View style={{ flexDirection: 'row', gap: 11, alignItems: 'flex-start' }}>
                  <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialCommunityIcons name={item.type === 'event' ? 'calendar-star' : 'presentation'} size={22} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>{item.type === 'event' ? 'Evento' : 'Apresentação'}</Text>
                    <Text style={{ color: colors.text, fontSize: 15, fontWeight: '900', marginTop: 2 }}>{item.title}</Text>
                    <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700', marginTop: 4 }}>
                      {formatLocalDate(item.event_date)}{item.event_time ? ` · ${String(item.event_time).slice(0, 5)}` : ''}{item.event_end_time ? `–${String(item.event_end_time).slice(0, 5)}` : ''}
                    </Text>
                    {item.location ? <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 3 }}>📍 {item.location}</Text> : null}
                  </View>
                  {ended ? <Text style={{ fontSize: 10, fontWeight: '800', color: colors.secondary }}>ENCERRADO</Text> : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}
