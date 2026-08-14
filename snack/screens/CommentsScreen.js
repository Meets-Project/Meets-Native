import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { addPostComment, fetchCurrentUser, fetchPostComments, updateCurrentUser } from '../services/userApi';
import { useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../styles/colors';

function isRenderableImageUri(uri) {
  if (typeof uri !== 'string') return false;
  return uri.startsWith('data:') || uri.startsWith('http');
}

export function CommentsScreen() {
  const route = useRoute();
  const { creation } = route.params || {};
  const [comments, setComments] = useState(creation?.comments || []);
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const remoteComments = await fetchPostComments(creation.id);
        setComments(remoteComments);
        const user = await fetchCurrentUser();
        const out = user.outboxComments || [];
        const mine = out.filter((c) => c.creationId === creation.id);
        if (mine.length) setComments((prev) => [...prev, ...mine]);
      } catch (e) {}
    })();
  }, [creation?.id]);

  const pickFile = () => {
    if (typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,video/*,audio/*';
      input.onchange = async (ev) => {
        const file = ev.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          setAttachment({ uri: reader.result, name: file.name, type: file.type });
        };
        reader.readAsDataURL(file);
      };
      input.click();
    } else {
      Alert.alert('Não suportado aqui');
    }
  };

  const submit = async () => {
    if (!text.trim() && !attachment) return Alert.alert('Digite um comentário');
    try {
      const user = await fetchCurrentUser();
      const comment = {
        id: `c-${Date.now()}`,
        author: user.name || 'Você',
        authorId: user.id,
        content: text.trim(),
        attachment,
        timestamp: new Date().toISOString(),
        creationId: creation.id,
      };

      const remoteComment = await addPostComment(creation.id, {
        authorName: user.name || 'Você',
        avatar: user.avatar || '👤',
        message: text.trim(),
        content: text.trim(),
        createdAt: new Date().toISOString(),
      });

      if (creation.authorId === user.id) {
        const ownerProfile = user;
        const creations = Array.isArray(ownerProfile.creations) ? ownerProfile.creations.slice() : [];
        const idx = creations.findIndex((c) => c.id === creation.id);
        if (idx >= 0) {
          creations[idx] = { ...(creations[idx] || {}), comments: [...(creations[idx].comments || []), remoteComment || comment] };
          await updateCurrentUser({ ...ownerProfile, creations });
        } else {
          const out = ownerProfile.outboxComments || [];
          await updateCurrentUser({ ...ownerProfile, outboxComments: [remoteComment || comment, ...out] });
        }
      } else {
        const out = user.outboxComments || [];
        await updateCurrentUser({ ...user, outboxComments: [remoteComment || comment, ...out] });
      }

      setComments((prev) => [remoteComment || comment, ...prev]);
      setText('');
      setAttachment(null);
    } catch (e) {
      Alert.alert('Erro ao enviar comentário');
    }
  };

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <FlatList
        data={comments}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={{ padding: 8, borderBottomWidth: 1, borderColor: '#eee' }}>
            <Text style={{ fontWeight: '600' }}>{item.author}</Text>
            <Text>{item.content}</Text>
            {item.attachment && isRenderableImageUri(item.attachment.uri) ? (
              <Image source={{ uri: item.attachment.uri }} style={{ width: 200, height: 120, marginTop: 8 }} />
            ) : null}
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: '#666' }}>Sem comentários ainda</Text>}
      />

      <View style={{ marginTop: 12 }}>
        <TextInput
          placeholder="Escreva um comentário"
          value={text}
          onChangeText={setText}
          style={{ borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 6, marginBottom: 8 }}
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={pickFile} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialCommunityIcons name="paperclip" size={20} color={colors.primary} />
            <Text style={{ marginLeft: 8 }}>Anexar</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={submit} style={{ backgroundColor: colors.primary, padding: 8, borderRadius: 6 }}>
            <Text style={{ color: '#fff' }}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default CommentsScreen;
