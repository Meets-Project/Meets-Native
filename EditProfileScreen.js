import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { authStyles } from '../styles/authStyles';
import { colors } from '../styles/colors';
import { fetchCurrentUser, updateCurrentUser } from '../services/userApi';

export function EditProfileScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

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

        {message ? <Text style={authStyles.loadingSubtitle}>{message}</Text> : null}

        <TouchableOpacity style={authStyles.primaryButton} onPress={handleSave} disabled={isSaving}>
          <Text style={authStyles.primaryButtonText}>{isSaving ? 'Salvando...' : 'Salvar alterações'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
