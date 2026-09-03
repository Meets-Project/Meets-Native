import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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
  const [cep, setCep] = useState('');
  const [number, setNumber] = useState('');
  const [avatar, setAvatar] = useState('');
  const [address, setAddress] = useState(null);
  const [cepLoading, setCepLoading] = useState(false);
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
        setAvatar(profile.avatar || '');
        setNumber(profile.address_number || '');
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

  async function chooseAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8, base64: true });
    if (!result.canceled && result.assets?.[0]) {
      const image = result.assets[0];
      setAvatar(image.base64 ? `data:image/jpeg;base64,${image.base64}` : image.uri);
    }
  }

  async function lookupCep(value) {
    const cleanCep = value.replace(/\D/g, '');
    setCep(cleanCep.replace(/^(\d{5})(\d)/, '$1-$2'));
    if (cleanCep.length !== 8) return;
    setCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      if (data.erro) throw new Error('CEP não encontrado.');
      setAddress(data);
      setCity(`${data.localidade} - ${data.uf}`);
    } catch (error) {
      setAddress(null);
      Alert.alert('CEP inválido', error.message || 'Não foi possível consultar o ViaCEP.');
    } finally {
      setCepLoading(false);
    }
  }

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
        addressNumber: number.trim() || undefined,
        avatar: avatar || undefined,
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
        <TouchableOpacity style={{ alignItems: 'center', marginBottom: 20 }} onPress={chooseAvatar}>
          {avatar ? <Image source={{ uri: avatar }} style={{ width: 88, height: 88, borderRadius: 44 }} resizeMode="cover" /> : <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}><MaterialCommunityIcons name="camera-plus-outline" size={30} color={colors.primary} /></View>}
          <Text style={{ color: colors.primary, fontWeight: '700', marginTop: 8 }}>Alterar foto de perfil</Text>
        </TouchableOpacity>
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

        <FormInput label="CEP" value={cep} onChangeText={lookupCep} placeholder="00000-000" keyboardType="numeric" leftIcon="map-marker-outline" />
        <FormInput label="Número" value={number} onChangeText={setNumber} placeholder="Número do endereço" keyboardType="numeric" leftIcon="numeric" />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <MaterialCommunityIcons name="radiobox-marked" size={22} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>Cidade / Estado</Text>
            <Text style={{ color: colors.textMuted, marginTop: 2 }}>{cepLoading ? 'Consultando ViaCEP...' : address ? `${address.localidade} - ${address.uf}` : 'Digite um CEP válido para preencher'}</Text>
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
