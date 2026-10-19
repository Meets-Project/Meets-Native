import React, { useState } from 'react';
import { ActivityIndicator, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createReport } from '../services/api';
import { colors } from '../styles/colors';

export const REPORT_REASONS = [
  { id: 'spam', label: 'Spam' },
  { id: 'ofensivo', label: 'Conteúdo ofensivo' },
  { id: 'assedio', label: 'Assédio' },
  { id: 'falso', label: 'Informação falsa' },
  { id: 'improprio', label: 'Conteúdo impróprio' },
  { id: 'outro', label: 'Outro motivo' },
];

const TARGET_LABEL = { post: 'esta publicação', event: 'este evento', user: 'este perfil' };

// Denunciar um post, evento ou usuário. A denúncia vai para a fila dos administradores.
export function ReportModal({ visible, onClose, targetType, targetId, targetTitle }) {
  const [reason, setReason] = useState(null);
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  function close() {
    setReason(null);
    setDetails('');
    setError('');
    setSent(false);
    onClose();
  }

  async function send() {
    if (!reason) return setError('Escolha o motivo da denúncia.');
    setBusy(true);
    setError('');
    try {
      await createReport({ targetType, targetId, reason, details: details.trim() || undefined });
      setSent(true);
    } catch (e) {
      setError(e.message || 'Não foi possível enviar a denúncia.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 18, paddingBottom: 30, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 17, fontWeight: '900', color: colors.text }}>Denunciar</Text>
            <TouchableOpacity onPress={close} accessibilityLabel="Fechar"><MaterialCommunityIcons name="close" size={24} color={colors.textMuted} /></TouchableOpacity>
          </View>

          {sent ? (
            <View style={{ alignItems: 'center', gap: 8, paddingVertical: 16 }}>
              <MaterialCommunityIcons name="check-circle" size={44} color="#1e7e34" />
              <Text style={{ fontWeight: '800', color: colors.text }}>Denúncia enviada</Text>
              <Text style={{ color: colors.textMuted, textAlign: 'center' }}>Um administrador vai analisar e você será avisado do resultado.</Text>
              <TouchableOpacity onPress={close} style={{ marginTop: 8, backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 10 }}>
                <Text style={{ color: '#ffffff', fontWeight: '800' }}>Fechar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={{ color: colors.textMuted }} numberOfLines={2}>
                Por que você está denunciando {TARGET_LABEL[targetType] || 'isto'}{targetTitle ? `: "${targetTitle}"` : ''}?
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {REPORT_REASONS.map((r) => {
                  const active = reason === r.id;
                  return (
                    <TouchableOpacity
                      key={r.id}
                      onPress={() => setReason(r.id)}
                      style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary : colors.surface }}
                    >
                      <Text style={{ fontWeight: '700', color: active ? '#ffffff' : colors.text }}>{r.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TextInput
                value={details}
                onChangeText={setDetails}
                placeholder="Detalhes (opcional)"
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={1000}
                style={{ minHeight: 70, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 10, color: colors.text, textAlignVertical: 'top' }}
              />
              {error ? <Text style={{ color: '#d93025' }}>{error}</Text> : null}
              <TouchableOpacity
                onPress={send}
                disabled={busy}
                style={{ backgroundColor: '#d93025', borderRadius: 12, paddingVertical: 12, alignItems: 'center', opacity: busy ? 0.7 : 1 }}
              >
                {busy ? <ActivityIndicator color="#ffffff" /> : <Text style={{ color: '#ffffff', fontWeight: '900' }}>Enviar denúncia</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
