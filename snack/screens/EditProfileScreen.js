import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { authStyles } from '../styles/authStyles';
import { colors } from '../styles/colors';
import { fetchCurrentUser, updateCurrentUser } from '../services/userApi';
import { FormInput } from '../components/FormInput';

export function EditProfileScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [city, setCity] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [nameError, setNameError] = useState('');

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
        setCity(profile.city || '');
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
    if (!name.trim()) {
      setNameError('Nome é obrigatório.');
      return;
    }
    setNameError('');

    setIsSaving(true);
    setMessage('');

    try {
      await updateCurrentUser({
        name: name.trim(),
        role: role.trim(),
        city: city.trim() || undefined,
      });
      navigation.goBack();
    } catch (error) {
      setMessage(error.message || 'Erro ao salvar perfil.');
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
        <FormInput
          label="Nome Completo"
          required
          value={name}
          onChangeText={(val) => {
            setName(val);
            if (nameError && val.trim()) setNameError('');
          }}
          placeholder="Seu nome completo"
          leftIcon="account-outline"
          error={nameError}
        />

        <FormInput
          label="Ocupação / Bio"
          value={role}
          onChangeText={setRole}
          placeholder="Ex: Desenvolvedor, Organizador de Meetups"
          leftIcon="badge-account-horizontal-outline"
        />

        <FormInput
          label="Cidade / Estado"
          value={city}
          onChangeText={setCity}
          placeholder="Ex: São Paulo, SP"
          leftIcon="map-marker-outline"
        />

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

        <TouchableOpacity style={authStyles.primaryButton} onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={authStyles.primaryButtonText}>Salvar alterações</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[authStyles.secondaryButton, { marginTop: 10 }]}
          onPress={() => navigation.goBack()}
          disabled={isSaving}
        >
          <Text style={authStyles.secondaryButtonText}>Cancelar e Voltar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
