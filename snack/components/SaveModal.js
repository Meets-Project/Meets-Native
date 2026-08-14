import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, FlatList, Alert } from 'react-native';
import { fetchCurrentUser, updateCurrentUser } from '../services/userApi';
import { colors } from '../styles/colors';

export function SaveModal({ visible, onClose, creation }) {
  const [folders, setFolders] = useState([]);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (visible) load();
  }, [visible]);

  async function load() {
    try {
      const user = await fetchCurrentUser();
      setFolders(user?.folders || []);
    } catch (e) {
      setFolders([]);
    }
  }

  async function createAndSave() {
    if (!newName.trim()) return Alert.alert('Nome obrigatório');
    try {
      const user = await fetchCurrentUser();
      const folders = user.folders || [];
      const savedItems = user.savedItems || [];
      const id = `f-${Date.now()}`;
      const folder = { id, name: newName.trim(), items: [creation.id] };
      const savedItem = {
        id: `s-${Date.now()}`,
        creationId: creation.id,
        creation,
        folderId: id,
        folderName: folder.name,
        savedAt: new Date().toISOString(),
      };
      const payload = { ...user, folders: [folder, ...folders], savedItems: [savedItem, ...savedItems] };
      await updateCurrentUser(payload);
      setNewName('');
      onClose();
    } catch (e) {
      Alert.alert('Erro ao salvar');
    }
  }

  async function saveTo(folderId) {
    try {
      const user = await fetchCurrentUser();
      const folders = user.folders || [];
      const savedItems = user.savedItems || [];
      const updated = folders.map((f) => {
        if (f.id !== folderId) return f;
        const items = Array.isArray(f.items) ? f.items.slice() : [];
        if (!items.includes(creation.id)) items.unshift(creation.id);
        return { ...f, items };
      });
      const folder = updated.find((f) => f.id === folderId);
      const savedItem = {
        id: `s-${Date.now()}`,
        creationId: creation.id,
        creation,
        folderId,
        folderName: folder?.name || 'Coleção',
        savedAt: new Date().toISOString(),
      };
      const payload = { ...user, folders: updated, savedItems: [savedItem, ...savedItems] };
      await updateCurrentUser(payload);
      onClose();
    } catch (e) {
      Alert.alert('Erro ao salvar');
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center' }}>
        <View style={{ margin: 20, backgroundColor: '#fff', borderRadius: 8, padding: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Salvar post</Text>

          <Text style={{ marginBottom: 8 }}>Escolha onde salvar ou crie uma nova coleção</Text>

          <FlatList
            data={folders}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => saveTo(item.id)} style={{ padding: 8 }}>
                <Text>{item.name}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={{ color: '#666' }}>Nenhuma coleção encontrada</Text>}
            style={{ maxHeight: 180, marginBottom: 8 }}
          />

          <TextInput
            placeholder="Criar nova coleção"
            value={newName}
            onChangeText={setNewName}
            style={{ borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 4, marginBottom: 8 }}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <TouchableOpacity onPress={onClose} style={{ marginRight: 12 }}>
              <Text style={{ color: colors.textMuted }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={createAndSave}>
              <Text style={{ color: colors.primary }}>Criar e salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default SaveModal;
