import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getDashboard } from '../services/api';
import { getCurrentUser, isAdmin } from '../services/session';
import { presentationSkills } from '../data/presentationRatings';
import { screenStyles } from '../styles/screenStyles';
import { colors } from '../styles/colors';
import { FilterChips } from '../components/FilterChips';

const PERIODS = [
  { id: '0', label: 'Tudo' },
  { id: '7', label: '7 dias' },
  { id: '30', label: '30 dias' },
  { id: '90', label: '90 dias' },
];
const SCOPES = [
  { id: 'me', label: 'Meu conteúdo' },
  { id: 'platform', label: 'Plataforma' },
];
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const monthLabel = (key) => MONTHS[Number(String(key).slice(5, 7)) - 1] || key;
const fmt = (n) => Number(n || 0).toLocaleString('pt-BR');

// Número de destaque (stat tile).
function Tile({ label, value, hint }) {
  return (
    <View style={{ flexGrow: 1, flexBasis: '45%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 12 }}>
      <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: '700' }}>{label}</Text>
      <Text style={{ fontSize: 24, fontWeight: '900', color: colors.text, marginTop: 4 }}>{value}</Text>
      {hint ? <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{hint}</Text> : null}
    </View>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <View style={[screenStyles.sectionCard, { marginTop: 12, gap: 10 }]}>
      <View>
        <Text style={screenStyles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={screenStyles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );
}

// Barras horizontais de uma única série (rótulo à esquerda, valor à direita).
function HBars({ rows, max }) {
  const top = Math.max(1, max ?? Math.max(...rows.map((r) => r.value)));
  return (
    <View style={{ gap: 6 }}>
      {rows.map((r) => (
        <View key={r.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} accessibilityLabel={`${r.label}: ${r.value}`}>
          <Text style={{ width: 92, fontSize: 12, color: colors.text }} numberOfLines={1}>{r.label}</Text>
          <View style={{ flex: 1, height: 10, backgroundColor: colors.primarySoft, borderRadius: 4, overflow: 'hidden' }}>
            <View style={{ width: `${(r.value / top) * 100}%`, height: '100%', backgroundColor: colors.primary, borderRadius: 4 }} />
          </View>
          <Text style={{ width: 34, textAlign: 'right', fontSize: 12, fontWeight: '700', color: colors.text }}>{r.display ?? r.value}</Text>
        </View>
      ))}
    </View>
  );
}

// Colunas por mês (uma série). O número fica acima da coluna; o rótulo extra (ex.: média) abaixo do mês.
function MonthColumns({ rows, valueKey, extraKey, extraFormat }) {
  const max = Math.max(1, ...rows.map((r) => Number(r[valueKey] || 0)));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 150 }}>
      {rows.map((r) => {
        const v = Number(r[valueKey] || 0);
        return (
          <View key={r.month} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' }} accessibilityLabel={`${monthLabel(r.month)}: ${v}`}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text, marginBottom: 2 }}>{v || ''}</Text>
            <View style={{ width: '70%', maxWidth: 26, height: `${(v / max) * 70}%`, minHeight: v ? 4 : 2, backgroundColor: v ? colors.primary : colors.border, borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />
            <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 4 }}>{monthLabel(r.month)}</Text>
            {extraKey ? <Text style={{ fontSize: 10, color: colors.textMuted }}>{r[extraKey] ? extraFormat(r[extraKey]) : '–'}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

function TopList({ items, render }) {
  if (!items?.length) return <Text style={screenStyles.rowSubtitle}>Ainda não há dados neste período.</Text>;
  return (
    <View>
      {items.map((it, i) => (
        <View key={it.id || i} style={{ flexDirection: 'row', gap: 8, paddingVertical: 6, borderTopWidth: i ? 1 : 0, borderTopColor: colors.border }}>
          <Text style={{ width: 18, fontWeight: '900', color: colors.textMuted }}>{i + 1}</Text>
          <View style={{ flex: 1 }}>{render(it)}</View>
        </View>
      ))}
    </View>
  );
}

// Caso de uso #008 Visualizar Dashboards: Posts, Eventos, Avaliações e Apresentadores, com dados reais.
export function DashboardScreen() {
  const [admin, setAdmin] = useState(false);
  const [scope, setScope] = useState('me');
  const [period, setPeriod] = useState('30');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { getCurrentUser().then((u) => setAdmin(isAdmin(u))).catch(() => {}); }, []);

  const load = useCallback(async () => {
    setError('');
    try { setData(await getDashboard({ scope, days: Number(period) })); }
    catch (e) { setError(e.message || 'Não foi possível carregar o dashboard.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [scope, period]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const p = data?.posts;
  const e = data?.events;
  const r = data?.ratings;
  const pr = data?.presenters;
  const isPlatform = data?.scope === 'platform';

  return (
    <ScrollView
      contentContainerStyle={[screenStyles.listContent, { paddingBottom: 140 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
    >
      <View style={[screenStyles.sectionCard, { gap: 8 }]}>
        <Text style={screenStyles.sectionTitle}>Dashboard</Text>
        <Text style={screenStyles.sectionText}>
          {isPlatform ? 'Indicadores de toda a comunidade.' : 'Indicadores das suas publicações, eventos e apresentações.'}
        </Text>
        {admin ? <FilterChips options={SCOPES} value={scope} onChange={setScope} /> : null}
        <FilterChips options={PERIODS} value={period} onChange={setPeriod} />
      </View>

      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} /> : null}
      {error ? <Text style={{ color: '#d93025', marginTop: 12 }}>{error}</Text> : null}

      {!loading && data ? (
        <>
          {isPlatform && data.community ? (
            <Section title="Comunidade">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <Tile label="Contas ativas" value={fmt(data.community.activeUsers)} />
                <Tile label="Novas no período" value={fmt(data.community.newUsers)} />
                <Tile label="Contas desativadas" value={fmt(data.community.deactivatedUsers)} />
                <Tile label="Denúncias abertas" value={fmt(data.community.openReports)} />
              </View>
            </Section>
          ) : null}

          <Section title="Posts" subtitle="Publicações criadas e interações recebidas no período">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Tile label="Posts" value={fmt(p.total)} hint={`${String(p.engagementPerPost).replace('.', ',')} interações por post`} />
              <Tile label="Curtidas" value={fmt(p.likes)} />
              <Tile label="Comentários" value={fmt(p.comments)} />
              <Tile label="Compartilhamentos" value={fmt(p.shares)} />
            </View>
            <Text style={screenStyles.rowTitle}>Posts com mais engajamento</Text>
            <TopList items={p.top} render={(it) => (
              <>
                <Text style={screenStyles.rowTitle} numberOfLines={1}>{it.title}</Text>
                <Text style={screenStyles.rowSubtitle}>{isPlatform ? `${it.author} · ` : ''}{it.likes} curtidas · {it.comments} comentários · {it.shares} compartilhamentos</Text>
              </>
            )} />
          </Section>

          <Section title="Eventos" subtitle="Eventos criados, adesão e satisfação no período">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Tile label="Eventos" value={fmt(e.total)} />
              <Tile label="Presenças confirmadas" value={fmt(e.participants)} />
              <Tile label="Avaliação média" value={e.ratingsCount ? `${String(e.averageRating).replace('.', ',')} ★` : '–'} hint={`${e.ratingsCount} avaliações`} />
              <Tile label="Curtidas · comentários · compart." value={`${fmt(e.likes)} · ${fmt(e.comments)} · ${fmt(e.shares)}`} />
            </View>
            <Text style={screenStyles.rowTitle}>Eventos com mais participantes</Text>
            <TopList items={e.top} render={(it) => (
              <>
                <Text style={screenStyles.rowTitle} numberOfLines={1}>{it.title}</Text>
                <Text style={screenStyles.rowSubtitle}>{isPlatform ? `${it.author} · ` : ''}{it.participants} participantes{it.rating ? ` · ${String(it.rating).replace('.', ',')} ★` : ''}</Text>
              </>
            )} />
          </Section>

          <Section title="Avaliações" subtitle="Notas de 1 a 5 estrelas dadas no período">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Tile label="Avaliações de eventos" value={fmt(r.events.count)} hint={r.events.count ? `média ${String(r.events.average).replace('.', ',')} ★` : undefined} />
              <Tile label="Avaliações de apresentações" value={fmt(r.presentations.count)} hint={r.presentations.count ? `média ${String(r.presentations.average).replace('.', ',')} ★` : undefined} />
            </View>
            <Text style={screenStyles.rowTitle}>Distribuição das notas · eventos</Text>
            <HBars rows={[...r.distribution].reverse().map((d) => ({ label: `${d.stars} estrela${d.stars > 1 ? 's' : ''}`, value: d.events }))} />
            <Text style={screenStyles.rowTitle}>Distribuição das notas · apresentações</Text>
            <HBars rows={[...r.distribution].reverse().map((d) => ({ label: `${d.stars} estrela${d.stars > 1 ? 's' : ''}`, value: d.presentations }))} />
            <Text style={screenStyles.rowTitle}>Avaliações por mês (eventos + apresentações) e média</Text>
            <MonthColumns
              rows={r.evolution.map((m) => ({ ...m, total: m.eventCount + m.presentationCount, mean: (m.eventCount + m.presentationCount) ? ((m.eventAverage * m.eventCount + m.presentationAverage * m.presentationCount) / (m.eventCount + m.presentationCount)) : 0 }))}
              valueKey="total"
              extraKey="mean"
              extraFormat={(v) => `${v.toFixed(1).replace('.', ',')}★`}
            />
          </Section>

          <Section title="Apresentadores" subtitle="Pontuação geral de 0 a 99, a mesma do ranking">
            {isPlatform ? (
              <>
                <Tile label="Apresentadores avaliados" value={fmt(pr.totalRanked)} />
                <TopList items={pr.top} render={(it) => (
                  <>
                    <Text style={screenStyles.rowTitle}>{it.speaker.name} · {it.overall}</Text>
                    <Text style={screenStyles.rowSubtitle}>{String(it.averageStars).replace('.', ',')} ★ · {it.totalRatings} avaliações</Text>
                  </>
                )} />
              </>
            ) : pr.mine ? (
              <>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <Tile label="Sua pontuação geral" value={pr.mine.overall} />
                  <Tile label="Posição no ranking" value={`${pr.mine.position}º`} hint={`de ${pr.totalRanked} apresentadores`} />
                </View>
                <Text style={screenStyles.rowTitle}>Média por atributo</Text>
                <HBars max={99} rows={presentationSkills.map((s) => ({ label: s.label, value: Number(pr.mine.averageSkills?.[s.id] || 0) }))} />
                <Text style={screenStyles.rowTitle}>Evolução da pontuação por mês</Text>
                <MonthColumns rows={pr.evolution} valueKey="overall" />
              </>
            ) : (
              <Text style={screenStyles.rowSubtitle}>Você ainda não recebeu avaliações como apresentador neste período.</Text>
            )}
          </Section>
        </>
      ) : null}
    </ScrollView>
  );
}
