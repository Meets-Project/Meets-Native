import React, { useEffect, useState } from 'react';
import { Image, Modal, View, Text, TouchableOpacity, FlatList, TextInput, Alert, Platform } from 'react-native';
import { fetchCurrentUser, updateCurrentUser } from '../services/userApi';
import { colors } from '../styles/colors';

function isRenderableImageUri(uri) {
  if (typeof uri !== 'string' || uri.length === 0) {
    return false;
  }

  return uri.startsWith('data:') || uri.startsWith('http://') || uri.startsWith('https://');
}

function pickImage(onSelected) {
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
    reader.onload = () => onSelected(typeof reader.result === 'string' ? reader.result : '');
    reader.readAsDataURL(file);
  };
  input.click();
}

export function AccountsModal({ visible, onClose }) {
  const [accounts, setAccounts] = useState([]);
  const [accountName, setAccountName] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [accountAvatarUri, setAccountAvatarUri] = useState('');

  useEffect(() => {
    if (visible) load();
  }, [visible]);

  async function load() {
    try {
      const user = await fetchCurrentUser();
      setAccounts(user.savedAccounts || []);
    } catch (e) {
      setAccounts([]);
    }
  }

  async function createAccount() {
    if (!accountName.trim()) return Alert.alert('Nome obrigatório');
    if (!accountEmail.trim()) return Alert.alert('E-mail obrigatório');
    if (!accountPassword.trim()) return Alert.alert('Senha obrigatória');

    try {
      const user = await fetchCurrentUser();
      const saved = user.savedAccounts || [];
      const acc = {
        id: `a-${Date.now()}`,
        name: accountName.trim(),
        email: accountEmail.trim(),
        password: accountPassword,
        avatar: isRenderableImageUri(accountAvatarUri) ? accountAvatarUri : '🙂',
        avatarUri: isRenderableImageUri(accountAvatarUri) ? accountAvatarUri : '',
      };
      const payload = { ...user, savedAccounts: [acc, ...saved] };
      await updateCurrentUser(payload);
      setAccountName('');
      setAccountEmail('');
      setAccountPassword('');
      setAccountAvatarUri('');
      load();
    } catch (e) {
      Alert.alert('Erro ao criar conta');
    }
  }

  async function switchTo(id) {
    try {
      const user = await fetchCurrentUser();
      const saved = user.savedAccounts || [];
      const target = saved.find((s) => s.id === id);
      if (!target) return;

      // swap: replace target entry with current top-level profile so we can switch back
      const remaining = saved.map((s) =>
        s.id === id
          ? {
              id: user.id || `u-${Date.now()}`,
              name: user.name || 'Você',
              email: user.email || '',
              password: user.password || '',
              avatar: user.avatarUri || user.avatar || '🙂',
              avatarUri: user.avatarUri || '',
              meta: user.meta,
            }
          : s,
      );

      const newProfile = { ...target, savedAccounts: remaining };
      // ensure newProfile keeps an id
      newProfile.id = newProfile.id || `u-${Date.now()}`;

      await updateCurrentUser(newProfile);
      onClose();
    } catch (e) {
      Alert.alert('Erro ao alternar conta');
    }
  }

  async function removeAccount(id) {
    try {
      const user = await fetchCurrentUser();
      const saved = (user.savedAccounts || []).filter((s) => s.id !== id);
      await updateCurrentUser({ ...user, savedAccounts: saved });
      load();
    } catch (e) {
      Alert.alert('Erro ao remover');
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center' }}>
        <View style={{ margin: 20, backgroundColor: '#fff', borderRadius: 8, padding: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Gerenciar contas</Text>

          <FlatList
            data={accounts}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 8 }}>
                <TouchableOpacity onPress={() => switchTo(item.id)} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primarySoft, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                    {isRenderableImageUri(item.avatarUri || item.avatar) ? (
                      <Image source={{ uri: item.avatarUri || item.avatar }} style={{ width: 34, height: 34 }} />
                    ) : (
                      <Text style={{ fontSize: 16 }}>{item.avatar || '🙂'}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600' }}>{item.name}</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>{item.email || 'Sem e-mail'}</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeAccount(item.id)}>
                  <Text style={{ color: '#d00' }}>Remover</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={<Text style={{ color: '#666' }}>Nenhuma conta salva</Text>}
            style={{ maxHeight: 240, marginBottom: 8 }}
          />

          <TextInput
            placeholder="Nome da conta"
            value={accountName}
            onChangeText={setAccountName}
            style={{ borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 4, marginBottom: 8 }}
          />

          <TextInput
            placeholder="E-mail"
            value={accountEmail}
            onChangeText={setAccountEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={{ borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 4, marginBottom: 8 }}
          />

          <TextInput
            placeholder="Senha"
            value={accountPassword}
            onChangeText={setAccountPassword}
            secureTextEntry
            style={{ borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 4, marginBottom: 8 }}
          />

          <TouchableOpacity
            onPress={() => pickImage(setAccountAvatarUri)}
            style={{ borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 4, marginBottom: 8 }}
          >
            <Text style={{ color: colors.text }}>Adicionar imagem de perfil</Text>
          </TouchableOpacity>

          {isRenderableImageUri(accountAvatarUri) ? (
            <View style={{ width: 64, height: 64, borderRadius: 32, overflow: 'hidden', alignSelf: 'center', marginBottom: 8 }}>
              <Image source={{ uri: accountAvatarUri }} style={{ width: 64, height: 64 }} />
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <TouchableOpacity onPress={onClose} style={{ marginRight: 12 }}>
              <Text style={{ color: colors.textMuted }}>Fechar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={createAccount}>
              <Text style={{ color: colors.primary }}>Adicionar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default AccountsModal;
