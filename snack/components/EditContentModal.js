import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { updateEvent, updatePost } from '../services/api';

export function EditContentModal({ visible, onClose, item, onSaved }) {
  const isEvent = item?.type === 'event';
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [location, setLocation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!item) return;
    setTitle(item.title || '');
    setContent(item.content || item.description || '');
    setEventDate(item.event_date ? String(item.event_date).slice(0, 10) : '');
    setEventTime(item.event_time ? String(item.event_time).slice(0, 5) : '');
    setLocation(item.location || '');
    setError('');
  }, [item]);

  async function handleSave() {
    if (!title.trim()) return setError('Título é obrigatório.');
    setBusy(true);
    setError('');
    try {
      if (isEvent) {
        await updateEvent(item.id, {
          title: title.trim(),
          description: content.trim(),
          eventDate: eventDate.trim() || undefined,
          eventTime: eventTime.trim() || undefined,
          location: location.trim() || undefined,
        });
      } else {
        await updatePost(item.id, {
          title: title.trim(),
          content: content.trim(),
        });
      }
      onSaved?.();
      onClose();
    } catch (e) {
      setError(e.message || 'Erro ao atualizar.');
    } finally {
      setBusy(false);
    }
  }

  if (!item) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={styles.sheet}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {isEvent ? 'Editar Evento' : 'Editar Publicação'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
            <View>
              <Text style={styles.label}>Título</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Título"
                placeholderTextColor={colors.textSubtle}
              />
            </View>

            <View>
              <Text style={styles.label}>{isEvent ? 'Descrição' : 'Conteúdo'}</Text>
              <TextInput
                style={[styles.input, { minHeight: 90, textAlignVertical: 'top' }]}
                value={content}
                onChangeText={setContent}
                multiline
                placeholder="Detalhes"
                placeholderTextColor={colors.textSubtle}
              />
            </View>

            {isEvent ? (
              <>
                <View>
                  <Text style={styles.label}>Data (AAAA-MM-DD ou DD/MM/AAAA)</Text>
                  <TextInput
                    style={styles.input}
                    value={eventDate}
                    onChangeText={setEventDate}
                    placeholder="2026-09-15"
                    placeholderTextColor={colors.textSubtle}
                  />
                </View>

                <View>
                  <Text style={styles.label}>Horário (HH:MM)</Text>
                  <TextInput
                    style={styles.input}
                    value={eventTime}
                    onChangeText={setEventTime}
                    placeholder="19:30"
                    placeholderTextColor={colors.textSubtle}
                  />
                </View>

                <View>
                  <Text style={styles.label}>Local / Endereço</Text>
                  <TextInput
                    style={styles.input}
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Local do evento"
                    placeholderTextColor={colors.textSubtle}
                  />
                </View>
              </>
            ) : null}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={busy}>
              {busy ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.saveBtnText}>Salvar Alterações</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  closeBtn: {
    padding: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  errorText: {
    fontSize: 12,
    color: '#e0245e',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
