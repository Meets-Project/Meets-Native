import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { addComment, deleteComment, getComments, getMe } from '../services/api';

export function CommentsModal({ visible, onClose, targetId, targetTitle = 'Comentários', isEvent = false, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    getMe().then((u) => setCurrentUserId(u?.id)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!visible || !targetId) return;
    setLoading(true);
    getComments(targetId, isEvent)
      .then((data) => setComments(Array.isArray(data) ? data : []))
      .catch((e) => console.error('Erro ao buscar comentários:', e))
      .finally(() => setLoading(false));
  }, [visible, targetId, isEvent]);

  async function handleSend() {
    const text = inputText.trim();
    if (!text || !targetId || isSending) return;
    setIsSending(true);
    try {
      const newComment = await addComment(targetId, text, isEvent);
      setComments((prev) => [...prev, newComment]);
      setInputText('');
      onCommentAdded?.();
    } catch (e) {
      console.error('Erro ao enviar comentário:', e);
    } finally {
      setIsSending(false);
    }
  }

  async function handleDelete(commentId) {
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (e) {
      console.error('Erro ao excluir comentário:', e);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={styles.sheet}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Comentários</Text>
              <Text style={styles.subtitle} numberOfLines={1}>{targetTitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{ padding: 16, gap: 12 }}
              renderItem={({ item }) => {
                const isMine = currentUserId && item.user_id === currentUserId;
                const timeStr = item.created_at
                  ? new Date(item.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                  : '';

                return (
                  <View style={styles.commentCard}>
                    <Text style={styles.avatar}>{item.user_avatar || '👤'}</Text>
                    <View style={{ flex: 1 }}>
                      <View style={styles.commentHeaderRow}>
                        <Text style={styles.authorName}>{item.user_name || 'Membro'}</Text>
                        <Text style={styles.timeText}>{timeStr}</Text>
                      </View>
                      <Text style={styles.commentContent}>{item.content}</Text>
                    </View>
                    {isMine ? (
                      <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 4 }}>
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color="#e0245e" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={styles.center}>
                  <MaterialCommunityIcons name="comment-text-outline" size={44} color={colors.textMuted} />
                  <Text style={styles.emptyTitle}>Seja o primeiro a comentar!</Text>
                  <Text style={styles.emptySubtitle}>Deixe sua opinião ou faça uma pergunta sobre este conteúdo.</Text>
                </View>
              }
            />
          )}

          {/* Input Bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="Escreva um comentário..."
              placeholderTextColor={colors.textSubtle}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: inputText.trim() ? colors.primary : colors.surfaceSoft }]}
              onPress={handleSend}
              disabled={!inputText.trim() || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <MaterialCommunityIcons name="send" size={18} color={inputText.trim() ? '#ffffff' : colors.textMuted} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  center: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 12,
  },
  avatar: {
    fontSize: 20,
  },
  commentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  timeText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  commentContent: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
    maxHeight: 90,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
