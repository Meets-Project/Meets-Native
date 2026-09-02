import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { dashboardStats, dashboardTrend } from '../data/useCaseData';
import { screenStyles } from '../styles/screenStyles';
import { colors } from '../styles/colors';

export function DashboardScreen() {
  const maxTrend = Math.max(...dashboardTrend.map((item) => item.value));

  return (
    <ScrollView contentContainerStyle={screenStyles.listContent} showsVerticalScrollIndicator={false}>
      <View style={screenStyles.sectionCard}>
        <Text style={screenStyles.sectionTitle}>Dashboard geral</Text>
        <Text style={screenStyles.sectionText}>Indicadores de performance dos posts, eventos e engajamento da comunidade.</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={[screenStyles.sectionCard, { flex: 1, minHeight: 120 }]}>
          <Text style={screenStyles.rowSubtitle}>Posts</Text>
          <Text style={{ fontSize: 26, fontWeight: '800', color: colors.primary, marginTop: 8 }}>{dashboardStats.posts.total}</Text>
          <Text style={{ color: colors.textMuted, marginTop: 6 }}>Curtidas: {dashboardStats.posts.likes}</Text>
          <Text style={{ color: colors.textMuted }}>Comentários: {dashboardStats.posts.comments}</Text>
        </View>

        <View style={[screenStyles.sectionCard, { flex: 1, minHeight: 120 }]}>
          <Text style={screenStyles.rowSubtitle}>Eventos</Text>
          <Text style={{ fontSize: 26, fontWeight: '800', color: colors.primary, marginTop: 8 }}>{dashboardStats.events.total}</Text>
          <Text style={{ color: colors.textMuted, marginTop: 6 }}>Participantes: {dashboardStats.events.participants}</Text>
          <Text style={{ color: colors.textMuted }}>Média: {dashboardStats.events.averageRating.toFixed(1)}</Text>
        </View>
      </View>

      <View style={screenStyles.sectionCard}>
        <Text style={screenStyles.sectionTitle}>Indicadores principais</Text>
        <View style={{ gap: 12 }}>
          {[
            { label: 'Engajamento de posts', value: dashboardStats.posts.engagement },
            { label: 'Compartilhamentos', value: Math.round((dashboardStats.posts.shares / dashboardStats.posts.total) * 10) },
            { label: 'Média de eventos', value: Math.round(dashboardStats.events.averageRating * 20) },
          ].map((metric) => (
            <View key={metric.label}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={screenStyles.rowSubtitle}>{metric.label}</Text>
                <Text style={{ fontWeight: '700', color: colors.text }}>{metric.value}%</Text>
              </View>
              <View style={{ height: 10, backgroundColor: colors.primarySoft, borderRadius: 999, overflow: 'hidden' }}>
                <View
                  style={{
                    height: '100%',
                    width: `${metric.value}%`,
                    backgroundColor: colors.primary,
                    borderRadius: 999,
                  }}
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={screenStyles.sectionCard}>
        <Text style={screenStyles.sectionTitle}>Evolução mensal</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 8 }}>
          {dashboardTrend.map((item) => (
            <View key={item.label} style={{ flex: 1, alignItems: 'center' }}>
              <View
                style={{
                  width: '100%',
                  maxWidth: 28,
                  height: `${(item.value / maxTrend) * 100}%`,
                  backgroundColor: colors.primary,
                  borderRadius: 10,
                  minHeight: 12,
                }}
              />
              <Text style={{ marginTop: 6, fontSize: 10, color: colors.textMuted }}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
