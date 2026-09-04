import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { updateEvent, updatePost } from '../services/api';
import { FormInput } from './FormInput';
import { dateToISO, isoToDate, validateDate, validateTime } from '../utils/masks';

export function EditContentModal({ visible, onClose, item, onSaved }) {
  const isEvent = item?.type === 'event';
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [location, setLocation] = useState('');
  const [cep, setCep] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [venueAddress, setVenueAddress] = useState(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Field validation errors
  const [titleError, setTitleError] = useState('');
  const [dateError, setDateError] = useState('');
  const [timeError, setTimeError] = useState('');

  useEffect(() => {
    if (!item) return;
    setTitle(item.title || '');
    setContent(item.content || item.description || '');
    setEventDate(item.event_date ? isoToDate(item.event_date) : '');
    setEventTime(item.event_time ? String(item.event_time).slice(0, 5) : '');
    setLocation(item.location || '');
    setCep('');
    setAddressNumber('');
    setVenueAddress(null);
    setError('');
    setTitleError('');
    setDateError('');
    setTimeError('');
  }, [item]);

  async function lookupCep(value) {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    setCep(digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits);
    if (digits.length !== 8) {
      setVenueAddress(null);
      return;
    }
    setCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await response.json();
      if (data.erro || !data.logradouro) throw new Error('CEP não encontrado.');
      setVenueAddress(data);
    } catch (e) {
      setError(e.message || 'Não foi possível consultar o CEP.');
    } finally {
      setCepLoading(false);
    }
  }

  async function handleSave() {
    setError('');
    let hasError = false;

    if (!title.trim()) {
      setTitleError('Título é obrigatório.');
      hasError = true;
    } else {
      setTitleError('');
    }

    if (isEvent) {
      if (eventDate.trim()) {
        const dVal = validateDate(eventDate);
        if (!dVal.valid) {
          setDateError(dVal.error);
          hasError = true;
        } else {
          setDateError('');
        }
      }

      if (eventTime.trim()) {
        const tVal = validateTime(eventTime);
        if (!tVal.valid) {
          setTimeError(tVal.error);
          hasError = true;
        } else {
          setTimeError('');
        }
      }

      if (cep.trim() && (!venueAddress || !addressNumber.trim())) {
        setError('Informe um CEP válido e o número do endereço.');
        hasError = true;
      }
    }

    if (hasError) {
      return setError('Verifique os campos destacados em vermelho.');
    }

    setBusy(true);
    try {
      if (isEvent) {
        await updateEvent(item.id, {
          title: title.trim(),
          description: content.trim(),
          eventDate: eventDate.trim() ? dateToISO(eventDate) : undefined,
          eventTime: eventTime.trim() || undefined,
          location: venueAddress ? `${venueAddress.logradouro}, ${addressNumber.trim()} - ${venueAddress.bairro}, ${venueAddress.localidade} - ${venueAddress.uf}` : location.trim() || undefined,
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

          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <FormInput
              label="Título"
              required
              value={title}
              onChangeText={(val) => {
                setTitle(val);
                if (titleError && val.trim()) setTitleError('');
              }}
              placeholder="Título"
              error={titleError}
            />

            <FormInput
              label={isEvent ? 'Descrição' : 'Conteúdo'}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={4}
              placeholder="Detalhes"
            />

            {isEvent ? (
              <>
                <FormInput
                  label="Data do Evento"
                  mask="date"
                  value={eventDate}
                  onChangeText={(val) => {
                    setEventDate(val);
                    if (dateError) {
                      const v = validateDate(val);
                      setDateError(v.valid ? '' : v.error);
                    }
                  }}
                  placeholder="DD/MM/AAAA"
                  leftIcon="calendar-outline"
                  error={dateError}
                  helperText="Formato: DD/MM/AAAA (ex: 25/10/2026)"
                  onBlur={() => {
                    if (eventDate) {
                      const v = validateDate(eventDate);
                      if (!v.valid) setDateError(v.error);
                    }
                  }}
                />

                <FormInput
                  label="Horário"
                  mask="time"
                  value={eventTime}
                  onChangeText={(val) => {
                    setEventTime(val);
                    if (timeError) {
                      const v = validateTime(val);
                      setTimeError(v.valid ? '' : v.error);
                    }
                  }}
                  placeholder="HH:MM"
                  leftIcon="clock-outline"
                  error={timeError}
                  helperText="Formato: HH:MM (ex: 19:30)"
                  onBlur={() => {
                    if (eventTime) {
                      const v = validateTime(eventTime);
                      if (!v.valid) setTimeError(v.error);
                    }
                  }}
                />

                <FormInput label="CEP do local" value={cep} onChangeText={lookupCep} placeholder="00000-000" keyboardType="numeric" leftIcon="map-marker-outline" />
                <FormInput label="Número" value={addressNumber} onChangeText={setAddressNumber} placeholder="Número do local" keyboardType="numeric" leftIcon="numeric" />
                <View style={{ marginBottom: 12, padding: 12, borderRadius: 10, backgroundColor: colors.surfaceSoft }}>
                  <Text style={{ color: colors.text, fontWeight: '700' }}>{cepLoading ? 'Consultando ViaCEP...' : venueAddress ? 'Endereço do local' : 'Informe o CEP para alterar o endereço'}</Text>
                  {venueAddress ? <Text style={{ color: colors.textMuted, marginTop: 4 }}>{venueAddress.logradouro}, {venueAddress.bairro} - {venueAddress.localidade}/{venueAddress.uf}</Text> : null}
                </View>
              </>
            ) : null}

            {error ? (
              <View style={styles.errorAlert}>
                <MaterialCommunityIcons name="alert-circle" size={18} color="#d93025" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

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
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff0f0',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffd2d2',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#d93025',
    fontWeight: '600',
    flex: 1,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
