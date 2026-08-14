import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { authStyles } from '../styles/authStyles';
import { colors } from '../styles/colors';
import { createMeet, createPost, createRoom, fetchCurrentUser } from '../services/userApi';
import { updateCurrentUser } from '../services/userApi';

function CreateActionScreen({ icon, title, description, fields, actionLabel, creationMode }) {
  const navigation = useNavigation();
  const [values, setValues] = useState(() =>
    fields.reduce((acc, field) => {
      acc[field.name] = '';
      return acc;
    }, {}),
  );
  const [attachmentType, setAttachmentType] = useState('image');
  const [attachmentUri, setAttachmentUri] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentSource, setAttachmentSource] = useState('link');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  function updateField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function handlePickAttachment() {
    try {
      if (Platform.OS !== 'web' || typeof document === 'undefined') {
        setMessage('No app mobile, cole o link do arquivo abaixo.');
        return;
      }

      const input = document.createElement('input');
      input.type = 'file';
      // Keep the picker broad to avoid browser/system dialogs returning "no matching items".
      // The selected media category is still stored in `attachmentType`.
      input.accept = '*/*';

      input.onchange = (event) => {
        const file = event?.target?.files?.[0];
        if (!file) {
          return;
        }

        const finalizeSelection = (fileUrl) => {
          setAttachmentUri(fileUrl || file.name);
          setAttachmentName(file.name || 'Arquivo selecionado');
          setAttachmentSource('file-picker');
          setMessage('');
        };

        if (attachmentType === 'image' && typeof FileReader !== 'undefined') {
          const reader = new FileReader();
          reader.onload = () => finalizeSelection(typeof reader.result === 'string' ? reader.result : '');
          reader.onerror = () => finalizeSelection(file.name || 'Arquivo selecionado');
          reader.readAsDataURL(file);
          return;
        }

        const fileUrl = typeof URL !== 'undefined' && URL.createObjectURL ? URL.createObjectURL(file) : '';
        finalizeSelection(fileUrl || file.name);
      };

      input.click();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    setMessage('');

    try {
      const currentUser = await fetchCurrentUser();
      const currentCreations = Array.isArray(currentUser?.creations) ? currentUser.creations : [];
      const trimmedValues = Object.fromEntries(
        Object.entries(values).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]),
      );
      const trimmedAttachmentUri = attachmentUri.trim();

      const creation = {
        id: `${creationMode}-${Date.now()}`,
        mode: creationMode,
        ...trimmedValues,
        attachment:
          trimmedAttachmentUri.length > 0
            ? {
                type: attachmentType,
                uri: trimmedAttachmentUri,
                name: attachmentName || null,
                source: attachmentSource,
              }
            : null,
        createdAt: new Date().toISOString(),
      };

      if (creationMode === 'post') {
        await createPost({
          id: creation.id,
          title: creation.title,
          content: creation.content,
          attachment: creation.attachment,
          createdAt: creation.createdAt,
        });
      }

      if (creationMode === 'meet') {
        await createMeet({
          id: creation.id,
          title: creation.title,
          date: creation.date,
          time: creation.date,
          location: creation.location,
          details: creation.details,
          createdAt: creation.createdAt,
        });
      }

      if (creationMode === 'virtual-room') {
        await createRoom({
          id: creation.id,
          title: creation.title,
          topic: creation.topic,
          duration: creation.duration,
          summary: creation.summary,
          createdAt: creation.createdAt,
        });
      }

      await updateCurrentUser({
        creations: [creation, ...currentCreations].slice(0, 10),
        latestCreation: creation,
      });

      setMessage('Criado com sucesso.');
      navigation.navigate('MainTabs', { screen: 'profile' });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={authStyles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={authStyles.hero}>
        <View style={authStyles.logoMark}>
          <MaterialCommunityIcons name={icon} size={42} color="#ffffff" />
        </View>
        <Text style={authStyles.heroTitle}>{title}</Text>
        <Text style={authStyles.heroText}>{description}</Text>
      </View>

      <View style={authStyles.card}>
        {fields.map((field) => (
          <View key={field.name} style={authStyles.field}>
            <Text style={authStyles.fieldLabel}>{field.label}</Text>
            <TextInput
              style={[
                authStyles.fieldInput,
                field.multiline ? { minHeight: 110, textAlignVertical: 'top' } : null,
              ]}
              value={values[field.name]}
              onChangeText={(text) => updateField(field.name, text)}
              placeholder={field.placeholder}
              placeholderTextColor="#9a9a9a"
              multiline={Boolean(field.multiline)}
            />
          </View>
        ))}

        <View style={authStyles.field}>
          <Text style={authStyles.fieldLabel}>Adicionar arquivo</Text>
          <Text style={authStyles.loadingSubtitle}>Selecione um arquivo ou cole um link abaixo.</Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            <TouchableOpacity
              style={[
                authStyles.secondaryButton,
                attachmentType === 'image' ? { backgroundColor: colors.primarySoft } : null,
                { flexGrow: 1, minWidth: 96, marginTop: 0 },
              ]}
              onPress={() => setAttachmentType('image')}
            >
              <Text style={authStyles.secondaryButtonText}>Imagem</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                authStyles.secondaryButton,
                attachmentType === 'video' ? { backgroundColor: colors.primarySoft } : null,
                { flexGrow: 1, minWidth: 96, marginTop: 0 },
              ]}
              onPress={() => setAttachmentType('video')}
            >
              <Text style={authStyles.secondaryButtonText}>Vídeo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                authStyles.secondaryButton,
                attachmentType === 'music' ? { backgroundColor: colors.primarySoft } : null,
                { flexGrow: 1, minWidth: 96, marginTop: 0 },
              ]}
              onPress={() => setAttachmentType('music')}
            >
              <Text style={authStyles.secondaryButtonText}>Música</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              authStyles.primaryButton,
              {
                flexDirection: 'row',
                gap: 10,
                marginTop: 12,
                paddingHorizontal: 16,
              },
            ]}
            onPress={handlePickAttachment}
          >
            <MaterialCommunityIcons name="paperclip" size={18} color="#ffffff" />
            <Text style={authStyles.primaryButtonText}>Selecionar arquivo</Text>
          </TouchableOpacity>

          {attachmentName ? (
            <Text style={[authStyles.loadingSubtitle, { marginTop: 8 }]}>
              Arquivo selecionado: {attachmentName}
            </Text>
          ) : null}

          <TextInput
            style={[authStyles.fieldInput, { marginTop: 12 }]}
            value={attachmentUri}
            onChangeText={(text) => {
              setAttachmentUri(text);
              setAttachmentName('');
              setAttachmentSource('link');
            }}
            placeholder="Ou cole aqui o link do arquivo"
            placeholderTextColor="#9a9a9a"
            autoCapitalize="none"
          />
        </View>

        {message ? <Text style={authStyles.loadingSubtitle}>{message}</Text> : null}

        <TouchableOpacity style={authStyles.primaryButton} onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={authStyles.primaryButtonText}>{actionLabel}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={authStyles.guestButton}
          onPress={() => navigation.goBack()}
          disabled={isSaving}
        >
          <Text style={authStyles.guestButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

export function CreatePostScreen() {
  return (
    <CreateActionScreen
      icon="post-outline"
      title="Criar post"
      description="Compartilhe uma atualização rápida com sua comunidade."
      actionLabel="Publicar post"
      creationMode="post"
      fields={[
        { name: 'title', label: 'Título', placeholder: 'Ex.: Novo artigo no ar' },
        {
          name: 'content',
          label: 'Conteúdo',
          placeholder: 'Escreva o texto do post...',
          multiline: true,
        },
      ]}
    />
  );
}

export function CreateMeetScreen() {
  return (
    <CreateActionScreen
      icon="account-group-outline"
      title="Criar meet"
      description="Organize um encontro para reunir pessoas com interesses em comum."
      actionLabel="Salvar meet"
      creationMode="meet"
      fields={[
        { name: 'title', label: 'Título do meet', placeholder: 'Ex.: Meet de Product Design' },
        { name: 'date', label: 'Data e horário', placeholder: 'Ex.: 28/05 às 19h' },
        { name: 'location', label: 'Local', placeholder: 'Ex.: Faria Lima, SP' },
        {
          name: 'details',
          label: 'Detalhes',
          placeholder: 'Descreva o objetivo e o público do encontro...',
          multiline: true,
        },
      ]}
    />
  );
}

export function CreateVirtualRoomScreen() {
  return (
    <CreateActionScreen
      icon="video-plus-outline"
      title="Criar sala virtual"
      description="Abra uma sala ao vivo para conversar, apresentar ou tirar dúvidas."
      actionLabel="Abrir sala"
      creationMode="virtual-room"
      fields={[
        { name: 'title', label: 'Título da sala', placeholder: 'Ex.: Tirando dúvidas ao vivo' },
        { name: 'topic', label: 'Tema', placeholder: 'Ex.: Lançamento do app' },
        { name: 'duration', label: 'Duração', placeholder: 'Ex.: 45 minutos' },
        {
          name: 'summary',
          label: 'Resumo',
          placeholder: 'Explique o que será discutido na sala...',
          multiline: true,
        },
      ]}
    />
  );
}