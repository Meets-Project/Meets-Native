import React from 'react';
import { Modal, View, Text, TouchableOpacity, Alert } from 'react-native';
import { sharePost } from '../services/userApi';
import { colors } from '../styles/colors';

export function ShareModal({ visible, onClose, creation, navigation }) {
  const copyLink = async () => {
    try {
      const link = `https://meets.example.com/post/${creation.id}`;
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(link);
      } else if (typeof window !== 'undefined' && window.prompt) {
        window.prompt('Copiar link', link);
      }
      await sharePost(creation.id, 'link');
      Alert.alert('Link copiado');
      onClose();
    } catch (e) {
      Alert.alert('Não foi possível copiar o link');
    }
  };

  const shareToChat = async () => {
    onClose();
    try {
      await sharePost(creation.id, 'conversa');
      try {
        navigation.navigate('chat', { sharePostId: creation.id });
      } catch (e) {}
    } catch (e) {
      Alert.alert('Não foi possível registrar o compartilhamento');
    }
  };

  const shareNative = async () => {
    try {
      const shareData = { title: creation.title || '', text: creation.content || '', url: `https://meets.example.com/post/${creation.id}` };
      if (navigator && navigator.share) {
        await navigator.share(shareData);
      } else {
        Alert.alert('Compartilhar', 'Recurso de compartilhamento não disponível aqui.');
      }
      await sharePost(creation.id, 'native');
      onClose();
    } catch (e) {
      // ignore
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center' }}>
        <View style={{ margin: 20, backgroundColor: '#fff', borderRadius: 8, padding: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Compartilhar</Text>

          <TouchableOpacity onPress={shareToChat} style={{ padding: 8 }}>
            <Text>Enviar em conversa</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={copyLink} style={{ padding: 8 }}>
            <Text>Copiar link</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={shareNative} style={{ padding: 8 }}>
            <Text>Outros apps</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: colors.primary }}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default ShareModal;
