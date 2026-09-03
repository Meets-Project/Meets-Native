import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { authStyles } from '../styles/authStyles';
import { colors } from '../styles/colors';
import { createContent, clearToken, getMyEvents, getFeed } from '../services/api';
import { FormInput } from '../components/FormInput';
import { dateToISO, validateDate, validateTime } from '../utils/masks';

const copy = {
  event: {
    icon: 'calendar-plus',
    title: 'Criar evento ou reunião',
    text: 'Defina data, horário, local, descrição e imagem do meetup.',
    cta: 'Salvar evento',
  },
  live: {
    icon: 'video-plus',
    title: 'Abrir sala ao vivo',
    text: 'Inicie uma sala em vídeo para conversar com sua comunidade.',
    cta: 'Abrir sala',
  },
  post: {
    icon: 'post-outline',
    title: 'Publicar atualização',
    text: 'Compartilhe uma atualização com texto, imagem e mencione eventos.',
    cta: 'Publicar',
  },
  presentation: {
    icon: 'presentation',
    title: 'Criar apresentação',
    text: 'Publique uma apresentação e permita que a comunidade avalie.',
    cta: 'Publicar apresentação',
  },
};

export function CreateFlowScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [mode, setMode] = useState(route.params?.mode || 'event');
  const content = copy[mode] || copy.event;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [location, setLocation] = useState('');
  const [image, setImage] = useState(route.params?.editedImage || '');
  const [mentionedEventId, setMentionedEventId] = useState('');
  const [availableEvents, setAvailableEvents] = useState([]);
  const [showEventPicker, setShowEventPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  // Validation errors
  const [titleError, setTitleError] = useState('');
  const [dateError, setDateError] = useState('');
  const [timeError, setTimeError] = useState('');
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    if (route.params?.mode) {
      setMode(route.params.mode);
    }
  }, [route.params?.mode]);

  useEffect(() => {
    if (route.params?.editedImage) {
      setImage(route.params.editedImage);
      setMessage('Imagem editada aplicada.');
    }
  }, [route.params?.editedImage]);

  // Load available events for mention
  useEffect(() => {
    if (mode === 'post') {
      Promise.all([getMyEvents(), getFeed('events')])
        .then(([mine, feedEvents]) => {
          const list = [...(mine || []), ...(feedEvents || [])];
          const unique = [];
          const seen = new Set();
          for (const ev of list) {
            if (ev?.id && !seen.has(ev.id)) {
              seen.add(ev.id);
              unique.push(ev);
            }
          }
          setAvailableEvents(unique);
        })
        .catch(() => {});
    }
  }, [mode]);

  async function chooseImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });
    if (result.canceled) return;
    const uri = result.assets?.[0]?.uri;
    if (!uri) return;
    navigation.navigate('ImageEditor', { uri, returnTo: 'CreateFlow', mode });
  }

  function editImage() {
    if (image) navigation.navigate('ImageEditor', { uri: image, returnTo: 'CreateFlow', mode });
  }

  async function save() {
    setMessage('');
    let hasValidationError = false;

    if (!title.trim()) {
      setTitleError('Título é obrigatório.');
      hasValidationError = true;
    } else {
      setTitleError('');
    }

    if (mode === 'event') {
      if (!eventDate.trim()) {
        setDateError('Data do evento é obrigatória.');
        hasValidationError = true;
      } else {
        const dVal = validateDate(eventDate);
        if (!dVal.valid) {
          setDateError(dVal.error);
          hasValidationError = true;
        } else {
          setDateError('');
        }
      }

      if (!eventTime.trim()) {
        setTimeError('Horário do evento é obrigatório.');
        hasValidationError = true;
      } else {
        const tVal = validateTime(eventTime);
        if (!tVal.valid) {
          setTimeError(tVal.error);
          hasValidationError = true;
        } else {
          setTimeError('');
        }
      }

      if (!location.trim()) {
        setLocationError('Local ou link da reunião é obrigatório.');
        hasValidationError = true;
      } else {
        setLocationError('');
      }
    }

    if (hasValidationError) {
      return setMessage('Verifique os campos destacados em vermelho.');
    }

    setBusy(true);
    setMessage('');
    try {
      await createContent({
        mode,
        title: title.trim(),
        description: description.trim(),
        image: image || undefined,
        eventDate: eventDate.trim() ? dateToISO(eventDate) : undefined,
        eventTime: eventTime.trim() || undefined,
        location: location.trim() || undefined,
        mentionedEventId: mentionedEventId || undefined,
      });

      // Redireciona para o Início após criar com sucesso
      navigation.navigate('MainTabs', { screen: 'home' });
    } catch (e) {
      if (e?.status === 401) {
        await clearToken();
        setMessage('Sua sessão expirou. Faça login novamente.');
        setTimeout(() => navigation.replace('Login'), 500);
      } else {
        setMessage(e.message || 'Não foi possível salvar.');
      }
    } finally {
      setBusy(false);
    }
  }

  const selectedEvent = availableEvents.find((e) => e.id === mentionedEventId);

  return (
    <ScrollView contentContainerStyle={authStyles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={authStyles.hero}>
        <View style={authStyles.logoMark}>
          <MaterialCommunityIcons name={content.icon} size={42} color="#fff" />
        </View>
        <Text style={authStyles.heroTitle}>{content.title}</Text>
        <Text style={authStyles.heroText}>{content.text}</Text>
      </View>

      <View style={authStyles.card}>
        <FormInput
          label="Título"
          required
          value={title}
          onChangeText={(val) => {
            setTitle(val);
            if (titleError && val.trim()) setTitleError('');
          }}
          placeholder="Digite o título"
          error={titleError}
        />

        <FormInput
          label="Descrição"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          placeholder="Conte mais detalhes sobre este meetup ou conteúdo..."
        />

        {mode === 'event' ? (
          <View style={{ marginBottom: 4 }}>
            <FormInput
              label="Data do Evento"
              required
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
              required
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
              helperText="Formato: HH:MM de 00:00 a 23:59 (ex: 19:30)"
              onBlur={() => {
                if (eventTime) {
                  const v = validateTime(eventTime);
                  if (!v.valid) setTimeError(v.error);
                }
              }}
            />

            <FormInput
              label="Local / Endereço"
              required
              value={location}
              onChangeText={(val) => {
                setLocation(val);
                if (locationError && val.trim()) setLocationError('');
              }}
              placeholder="Ex: Av. Paulista, 1000 ou link do Google Meet"
              leftIcon="map-marker-outline"
              error={locationError}
            />
          </View>
        ) : null}

        {/* Mencionar Evento no Post */}
        {mode === 'post' ? (
          <View style={{ marginBottom: 16 }}>
            <Text style={authStyles.fieldLabel}>Mencionar Evento (opcional)</Text>
            {selectedEvent ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.primarySoft,
                  padding: 10,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.primary,
                  gap: 10,
                }}
              >
                <MaterialCommunityIcons name="calendar-star" size={22} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>
                    {selectedEvent.title}
                  </Text>
                  {selectedEvent.event_date ? (
                    <Text style={{ fontSize: 11, color: colors.textMuted }}>
                      📅 {new Date(`${selectedEvent.event_date}T00:00:00`).toLocaleDateString('pt-BR')}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity onPress={() => setMentionedEventId('')} style={{ padding: 4 }}>
                  <MaterialCommunityIcons name="close-circle" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  authStyles.secondaryButton,
                  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
                ]}
                onPress={() => setShowEventPicker((v) => !v)}
              >
                <MaterialCommunityIcons name="calendar-plus" size={18} color={colors.primary} />
                <Text style={authStyles.secondaryButtonText}>
                  {showEventPicker ? 'Fechar lista de eventos' : 'Vincular um evento a este post'}
                </Text>
              </TouchableOpacity>
            )}

            {showEventPicker && !selectedEvent ? (
              <View
                style={{
                  marginTop: 8,
                  backgroundColor: colors.surfaceSoft,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  maxHeight: 180,
                  padding: 6,
                }}
              >
                {availableEvents.length > 0 ? (
                  availableEvents.map((ev) => (
                    <TouchableOpacity
                      key={ev.id}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      }}
                      onPress={() => {
                        setMentionedEventId(ev.id);
                        setShowEventPicker(false);
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>{ev.title}</Text>
                      {ev.event_date ? (
                        <Text style={{ fontSize: 11, color: colors.textMuted }}>
                          {new Date(`${ev.event_date}T00:00:00`).toLocaleDateString('pt-BR')}
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={{ padding: 10, fontSize: 12, color: colors.textMuted, textAlign: 'center' }}>
                    Nenhum evento encontrado para vincular.
                  </Text>
                )}
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={{ marginBottom: 16 }}>
          <Text style={authStyles.fieldLabel}>Imagem</Text>
          {image ? (
            <View style={{ borderRadius: 12, overflow: 'hidden', backgroundColor: '#111' }}>
              <Image source={{ uri: image }} style={{ width: '100%', height: 220, resizeMode: 'contain' }} />
            </View>
          ) : (
            <View
              style={{
                height: 140,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#ddd',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#fafafa',
              }}
            >
              <MaterialCommunityIcons name="image-plus" size={38} color={colors.textMuted} />
              <Text style={{ marginTop: 8, color: colors.textMuted, fontSize: 13 }}>Nenhuma imagem selecionada</Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <TouchableOpacity style={[authStyles.secondaryButton, { flex: 1 }]} onPress={chooseImage}>
              <MaterialCommunityIcons name="image-plus" size={20} color={colors.primary} />
              <Text style={authStyles.secondaryButtonText}>Escolher imagem</Text>
            </TouchableOpacity>
            {image ? (
              <TouchableOpacity style={[authStyles.secondaryButton, { flex: 1 }]} onPress={editImage}>
                <MaterialCommunityIcons name="image-edit" size={20} color={colors.primary} />
                <Text style={authStyles.secondaryButtonText}>Editar imagem</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {message ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#fff0f0',
              padding: 10,
              borderRadius: 8,
              marginBottom: 14,
              borderWidth: 1,
              borderColor: '#ffd2d2',
            }}
          >
            <MaterialCommunityIcons name="alert-circle" size={18} color="#d93025" />
            <Text style={{ color: '#d93025', fontSize: 13, fontWeight: '600', flex: 1 }}>{message}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={authStyles.primaryButton} onPress={save} disabled={busy}>
          {busy ? <ActivityIndicator color={colors.white} /> : <Text style={authStyles.primaryButtonText}>{content.cta}</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={[authStyles.secondaryButton, { marginTop: 10 }]}
          onPress={() => navigation.goBack()}
          disabled={busy}
        >
          <Text style={authStyles.secondaryButtonText}>Cancelar e Voltar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
