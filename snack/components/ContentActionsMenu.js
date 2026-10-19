import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../styles/colors';

// Menu de opções de um conteúdo (⋮). Cada opção: { id, label, icon, danger, onPress }.
export function ContentActionsMenu({ visible, onClose, title = 'Opções', options = [] }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}>
        <TouchableOpacity activeOpacity={1} style={{ backgroundColor: colors.surface, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, paddingBottom: 28, gap: 4 }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 8 }} numberOfLines={1}>{title}</Text>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              onPress={() => { onClose(); opt.onPress?.(); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name={opt.icon || 'dots-horizontal'} size={22} color={opt.danger ? '#d93025' : colors.primary} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: opt.danger ? '#d93025' : colors.text }}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={onClose} style={{ alignItems: 'center', paddingVertical: 12, marginTop: 4 }}>
            <Text style={{ fontWeight: '700', color: colors.textMuted }}>Cancelar</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
