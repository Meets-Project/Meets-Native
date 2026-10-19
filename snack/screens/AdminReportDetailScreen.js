import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { adminDecideReport, adminGetReport, adminStartReport } from '../services/api';
import { screenStyles } from '../styles/screenStyles';
import { colors } from '../styles/colors';
import { confirmAction } from '../utils/confirm';
import { REPORT_STATUS, TARGET_TYPES, reasonLabel } from './AdminReportsScreen';

const ACTIONS = {
  remove_content: { label: 'Remover o conteúdo', icon: 'delete-outline', help: 'Apaga a publicação ou o evento e avisa o autor.' },
  warn_author: { label: 'Advertir o autor', icon: 'alert-outline', help: 'Envia uma advertência ao autor; o conteúdo continua.' },
  deactivate_user: { label: 'Desativar a conta do autor', icon: 'account-off-outline', help: 'Bloqueia o login e oculta todo o conteúdo da conta.' },
};

// Caso de uso #013 Analisar Denúncias: detalhe, iniciar análise e decidir.
export function AdminReportDetailScreen() {
  const route = useRoute();
  const reportId = route.params?.reportId;
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [action, setAction] = useState(null);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setReport(await adminGetReport(reportId)); setError(''); }
    catch (e) { setError(e.message || 'Denúncia não encontrada.'); }
    finally { setLoading(false); }
  }, [reportId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function start() {
    setBusy(true);
    try { await adminStartReport(reportId); await load(); }
    catch (e) { setError(e.message || 'Não foi possível iniciar a análise.'); }
    finally { setBusy(false); }
  }

  async function decide(decision) {
    setError('');
    if (decision === 'upheld' && !action) return setError('Escolha a ação de moderação.');
    const text = decision === 'upheld'
      ? `Marcar como procedente e ${ACTIONS[action].label.toLowerCase()}?`
      : 'Marcar como improcedente? O conteúdo continua no Meets.';
    if (!(await confirmAction(decision === 'upheld' ? 'Denúncia procedente' : 'Denúncia improcedente', text, 'Confirmar'))) return;
    setBusy(true);
    try {
      await adminDecideReport(reportId, { decision, action: decision === 'upheld' ? action : undefined, note: note.trim() || undefined });
      await load();
    } catch (e) {
      setError(e.message || 'Não foi possível registrar a decisão.');
    } finally {
      setBusy(false);
    }
  }

  if (loading && !report) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View>;
  if (!report) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}><Text>{error}</Text></View>;

  const st = REPORT_STATUS[report.status];
  const open = report.status === 'pending' || report.status === 'in_review';
  const availableActions = Object.entries(ACTIONS).filter(([id]) => !(id === 'remove_content' && (report.target_type === 'user' || !report.target_exists)));

  return (
    <ScrollView contentContainerStyle={[screenStyles.listContent, { paddingBottom: 140 }]} keyboardShouldPersistTaps="handled">
      <View style={[screenStyles.sectionCard, { gap: 6 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={screenStyles.sectionTitle}>{reasonLabel(report.reason)}</Text>
          <View style={{ borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: st.color }}>
            <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '800' }}>{st.label}</Text>
          </View>
        </View>
        <Text style={screenStyles.rowSubtitle}>Denunciado por {report.reporter_name} em {new Date(report.created_at).toLocaleString('pt-BR')}</Text>
        {report.details ? <Text style={screenStyles.sectionText}>"{report.details}"</Text> : null}
      </View>

      <View style={[screenStyles.sectionCard, { marginTop: 12, gap: 6 }]}>
        <Text style={screenStyles.sectionTitle}>{TARGET_TYPES[report.target_type]} denunciado(a)</Text>
        <Text style={screenStyles.sectionText}>{report.target_current_preview || report.target_preview}</Text>
        <Text style={screenStyles.rowSubtitle}>
          Autor: {report.target_owner_name}{report.target_owner_status === 'deactivated' ? ' (conta desativada)' : ''}
        </Text>
        {!report.target_exists ? <Text style={{ color: '#b26a00', fontWeight: '700' }}>Este conteúdo já foi removido.</Text> : null}
        {report.other_reports?.length ? (
          <Text style={screenStyles.rowSubtitle}>Há mais {report.other_reports.length} denúncia(s) sobre este alvo.</Text>
        ) : null}
      </View>

      {open ? (
        <View style={[screenStyles.sectionCard, { marginTop: 12, gap: 10 }]}>
          {report.status === 'pending' ? (
            <TouchableOpacity style={[screenStyles.createButton, { backgroundColor: '#1565c0' }]} onPress={start} disabled={busy}>
              <Text style={screenStyles.createButtonText}>Iniciar análise</Text>
            </TouchableOpacity>
          ) : (
            <Text style={screenStyles.rowSubtitle}>Em análise por {report.reviewer_name || 'um administrador'}.</Text>
          )}

          <Text style={screenStyles.sectionTitle}>Decisão</Text>
          <Text style={screenStyles.rowSubtitle}>Se for procedente, escolha a ação:</Text>
          {availableActions.map(([id, a]) => {
            const active = action === id;
            return (
              <TouchableOpacity key={id} onPress={() => setAction(id)} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primarySoft : colors.surface }}>
                <MaterialCommunityIcons name={active ? 'radiobox-marked' : 'radiobox-blank'} size={20} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={screenStyles.rowTitle}>{a.label}</Text>
                  <Text style={screenStyles.rowSubtitle}>{a.help}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Justificativa da decisão (opcional, vai para o registro e para o autor)"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={1000}
            style={{ minHeight: 60, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 10, color: colors.text, textAlignVertical: 'top' }}
          />
          {error ? <Text style={{ color: '#d93025' }}>{error}</Text> : null}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={[screenStyles.createButton, { flex: 1, backgroundColor: '#6b6b6b' }]} onPress={() => decide('dismissed')} disabled={busy}>
              <Text style={screenStyles.createButtonText}>Improcedente</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[screenStyles.createButton, { flex: 1, backgroundColor: '#1e7e34' }]} onPress={() => decide('upheld')} disabled={busy}>
              <Text style={screenStyles.createButtonText}>Procedente</Text>
            </TouchableOpacity>
          </View>
          {busy ? <ActivityIndicator color={colors.primary} /> : null}
        </View>
      ) : (
        <View style={[screenStyles.sectionCard, { marginTop: 12, gap: 6 }]}>
          <Text style={screenStyles.sectionTitle}>Resultado da análise</Text>
          <Text style={screenStyles.sectionText}>
            {report.status === 'upheld' ? `Procedente · ${ACTIONS[report.action]?.label || ''}` : 'Improcedente · nenhum conteúdo foi alterado'}
          </Text>
          {report.decision_note ? <Text style={screenStyles.rowSubtitle}>"{report.decision_note}"</Text> : null}
          <Text style={screenStyles.rowSubtitle}>
            Por {report.reviewer_name || 'administrador'}{report.decided_at ? ` em ${new Date(report.decided_at).toLocaleString('pt-BR')}` : ''}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
