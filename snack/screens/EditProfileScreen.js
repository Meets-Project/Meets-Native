import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, ScrollView, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { authStyles } from '../styles/authStyles';
import { colors } from '../styles/colors';
import { fetchCurrentUser, updateCurrentUser } from '../services/userApi';

export function EditProfileScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [avatar, setAvatar] = useState('');
  const [avatarUri, setAvatarUri] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  function isRenderableImageUri(uri) {
    return typeof uri === 'string' && (uri.startsWith('data:') || uri.startsWith('http://') || uri.startsWith('https://'));
  }

  function pickAvatar() {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      Alert.alert('Sem suporte', 'No mobile, use um link de imagem para o avatar.');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event) => {
      const file = event?.target?.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        setAvatarUri(result);
        setAvatar('');
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  useEffect(() => {
    let isActive = true;

    async function loadProfile() {
      try {
        const profile = await fetchCurrentUser();

        if (!isActive || !profile) {
          return;
        }

        setName(profile.name || '');
        setRole(profile.role || '');
        setAvatar(profile.avatar && !isRenderableImageUri(profile.avatarUri) ? profile.avatar : '');
        setAvatarUri(profile.avatarUri || '');
      } catch (error) {
        if (isActive) {
          setMessage(error.message);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isActive = false;
    };
  }, []);

  async function handleSave() {
    setIsSaving(true);
    setMessage('');

    try {
      await updateCurrentUser({
        name,
        role,
        avatar: avatarUri ? '🖼️' : avatar,
        avatarUri,
      });
      navigation.goBack();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <View style={[authStyles.screen, authStyles.loadingWrap]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[authStyles.loadingSubtitle, { marginTop: 16 }]}>Carregando perfil...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={authStyles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={authStyles.hero}>
        <View style={authStyles.logoMark}>
          <MaterialCommunityIcons name="account-edit-outline" size={42} color="#ffffff" />
        </View>
        <Text style={authStyles.heroTitle}>Editar perfil</Text>
        <Text style={authStyles.heroText}>Atualize seu nome, bio e informações visíveis para a comunidade.</Text>
      </View>

      <View style={authStyles.card}>
        <TouchableOpacity
          onPress={pickAvatar}
          style={{ alignSelf: 'center', marginBottom: 16, alignItems: 'center' }}
        >
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#f2f2f2', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
            {isRenderableImageUri(avatarUri) ? (
              <Image source={{ uri: avatarUri }} style={{ width: 96, height: 96 }} />
            ) : (
              <Text style={{ fontSize: 42 }}>{avatar || '👤'}</Text>
            )}
          </View>
          <Text style={authStyles.footerLink}>Alterar foto do perfil</Text>
        </TouchableOpacity>

        <View style={authStyles.field}>
          <Text style={authStyles.fieldLabel}>Nome</Text>
          <TextInput
            style={authStyles.fieldInput}
            value={name}
            onChangeText={setName}
            placeholder="Gabriel Rodrigues"
            placeholderTextColor="#9a9a9a"
          />
        </View>

        <View style={authStyles.field}>
          <Text style={authStyles.fieldLabel}>Bio</Text>
          <TextInput
            style={authStyles.fieldInput}
            value={role}
            onChangeText={setRole}
            placeholder="Organizador de Meetups"
            placeholderTextColor="#9a9a9a"
          />
        </View>

        <View style={authStyles.field}>
          <Text style={authStyles.fieldLabel}>Avatar texto/emoji</Text>
          <TextInput
            style={authStyles.fieldInput}
            value={avatar}
            onChangeText={setAvatar}
            placeholder="🙂"
            placeholderTextColor="#9a9a9a"
          />
        </View>

        {message ? <Text style={authStyles.loadingSubtitle}>{message}</Text> : null}

        <TouchableOpacity style={authStyles.primaryButton} onPress={handleSave} disabled={isSaving}>
          <Text style={authStyles.primaryButtonText}>{isSaving ? 'Salvando...' : 'Salvar alterações'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
