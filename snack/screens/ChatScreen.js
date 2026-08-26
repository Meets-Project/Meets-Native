import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { screenStyles } from '../styles/screenStyles';
import {
  createDirectChat,
  getChatMessages,
  getChats,
  getMe,
  search,
  sendChatMessage,
} from '../services/api';

export function ChatScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const flatListRef = useRef(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);

  // Active Chat State
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // New Chat Modal / Search State
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Load current user
  useEffect(() => {
    getMe().then(setCurrentUser).catch(() => {});
  }, []);

  // Fetch list of chats
  const loadChats = useCallback(async () => {
    try {
      const list = await getChats();
      setChats(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Erro ao carregar chats:', e);
    } finally {
      setLoadingChats(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const list = await getChats();
          if (active) setChats(Array.isArray(list) ? list : []);
        } finally {
          if (active) setLoadingChats(false);
        }
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  // Handle route params (e.g. if opened with a specific user or chat)
  useEffect(() => {
    const { recipientId, recipientName, recipientAvatar, chatId } = route.params || {};
    if (recipientId) {
      (async () => {
        try {
          const chat = await createDirectChat(recipientId);
          openChat({
            id: chat.id,
            name: recipientName || chat.name,
            avatar: recipientAvatar || chat.avatar || '👤',
          });
        } catch (e) {
          console.error('Erro ao abrir chat com usuário:', e);
        }
      })();
    } else if (chatId) {
      openChat({ id: chatId, name: recipientName || 'Conversa', avatar: recipientAvatar || '💬' });
    }
  }, [route.params]);

  // Open a specific chat
  async function openChat(chat) {
    setActiveChat(chat);
    setLoadingMessages(true);
    try {
      const msgs = await getChatMessages(chat.id);
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch (e) {
      console.error('Erro ao carregar mensagens:', e);
    } finally {
      setLoadingMessages(false);
    }
  }

  // Poll for new messages when in active chat
  useEffect(() => {
    if (!activeChat?.id) return;
    const interval = setInterval(async () => {
      try {
        const msgs = await getChatMessages(activeChat.id);
        setMessages(Array.isArray(msgs) ? msgs : []);
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [activeChat?.id]);

  // Send message handler
  async function handleSendMessage() {
    const content = inputText.trim();
    if (!content || !activeChat?.id || isSending) return;

    setIsSending(true);
    setInputText('');

    // Optimistic UI update
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      chat_id: activeChat.id,
      sender_id: currentUser?.id,
      sender_name: currentUser?.name || 'Eu',
      sender_avatar: currentUser?.avatar || '👤',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const sent = await sendChatMessage(activeChat.id, content);
      setMessages((prev) => prev.map((m) => (m.id === optimisticMsg.id ? sent : m)));
      loadChats();
    } catch (e) {
      console.error('Erro ao enviar mensagem:', e);
      // Revert if failed
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setInputText(content);
    } finally {
      setIsSending(false);
    }
  }

  // Search users for new chat
  async function handleSearchUsers(query) {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await search(query.trim());
      const users = (res || []).filter((item) => item.type === 'user' && item.id !== currentUser?.id);
      setSearchResults(users);
    } catch (e) {
      console.error('Erro na busca de usuários:', e);
    } finally {
      setSearching(false);
    }
  }

  // Start chat with user from search
  async function handleStartChatWithUser(user) {
    setShowNewChat(false);
    setSearchQuery('');
    setSearchResults([]);
    setLoadingMessages(true);
    try {
      const chat = await createDirectChat(user.id);
      openChat({
        id: chat.id,
        name: user.title || user.name,
        avatar: user.avatar || '👤',
      });
      loadChats();
    } catch (e) {
      console.error('Erro ao iniciar chat:', e);
    } finally {
      setLoadingMessages(false);
    }
  }

  // --- RENDER CONVERSATION VIEW ---
  if (activeChat) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Chat Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <TouchableOpacity
            style={{ marginRight: 12, padding: 4 }}
            onPress={() => {
              setActiveChat(null);
              setMessages([]);
              loadChats();
            }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>

          <Text style={{ fontSize: 24, marginRight: 10 }}>{activeChat.avatar || '👤'}</Text>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{activeChat.name}</Text>
            <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>● Online no Meets</Text>
          </View>
        </View>

        {/* Messages List */}
        {loadingMessages ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 10 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => {
              const isMe = item.sender_id === currentUser?.id;
              const timeFormatted = item.created_at
                ? new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <View
                  style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    backgroundColor: isMe ? colors.primary : colors.surface,
                    borderRadius: 16,
                    borderBottomRightRadius: isMe ? 2 : 16,
                    borderBottomLeftRadius: isMe ? 16 : 2,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.06,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                >
                  {!isMe && item.sender_name ? (
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 2 }}>
                      {item.sender_name}
                    </Text>
                  ) : null}

                  <Text style={{ fontSize: 14, color: isMe ? '#ffffff' : colors.text, lineHeight: 20 }}>
                    {item.content}
                  </Text>

                  <Text
                    style={{
                      fontSize: 10,
                      color: isMe ? 'rgba(255,255,255,0.75)' : colors.textSubtle,
                      alignSelf: 'flex-end',
                      marginTop: 4,
                    }}
                  >
                    {timeFormatted}
                  </Text>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', marginTop: 40, paddingHorizontal: 20 }}>
                <MaterialCommunityIcons name="chat-processing-outline" size={48} color={colors.textMuted} />
                <Text style={[screenStyles.sectionTitle, { marginTop: 12, textAlign: 'center' }]}>
                  Nenhuma mensagem ainda
                </Text>
                <Text style={[screenStyles.sectionText, { textAlign: 'center', marginTop: 4 }]}>
                  Diga um "Olá" e inicie a conversa!
                </Text>
              </View>
            }
          />
        )}

        {/* Message Input Bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            gap: 10,
          }}
        >
          <TextInput
            style={{
              flex: 1,
              backgroundColor: colors.background,
              borderRadius: 24,
              paddingHorizontal: 16,
              paddingVertical: 10,
              fontSize: 14,
              color: colors.text,
              maxHeight: 100,
            }}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Digite sua mensagem..."
            placeholderTextColor={colors.textSubtle}
            multiline
          />

          <TouchableOpacity
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: inputText.trim() ? colors.primary : colors.surfaceSoft,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <MaterialCommunityIcons
                name="send"
                size={20}
                color={inputText.trim() ? '#ffffff' : colors.textMuted}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // --- RENDER CHAT LIST ---
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Search / New Chat Header Bar */}
      <View style={{ padding: 16, paddingBottom: 8, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>Conversas</Text>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.primary,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              gap: 6,
            }}
            onPress={() => setShowNewChat(true)}
          >
            <MaterialCommunityIcons name="plus" size={18} color="#ffffff" />
            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 13 }}>Nova conversa</Text>
          </TouchableOpacity>
        </View>

        {showNewChat ? (
          <View style={{ marginTop: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: 12, paddingHorizontal: 12 }}>
              <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
              <TextInput
                style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, color: colors.text, fontSize: 14 }}
                placeholder="Buscar membro para conversar..."
                placeholderTextColor={colors.textSubtle}
                value={searchQuery}
                onChangeText={handleSearchUsers}
                autoFocus
              />
              <TouchableOpacity onPress={() => { setShowNewChat(false); setSearchQuery(''); setSearchResults([]); }}>
                <MaterialCommunityIcons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {searching ? (
              <ActivityIndicator style={{ marginTop: 12 }} color={colors.primary} />
            ) : searchResults.length > 0 ? (
              <View style={{ marginTop: 8, maxHeight: 180 }}>
                {searchResults.map((u) => (
                  <TouchableOpacity
                    key={u.id}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}
                    onPress={() => handleStartChatWithUser(u)}
                  >
                    <Text style={{ fontSize: 22, marginRight: 10 }}>{u.avatar || '👤'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{u.title}</Text>
                      <Text style={{ fontSize: 12, color: colors.textMuted }}>{u.subtitle}</Text>
                    </View>
                    <MaterialCommunityIcons name="chat-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : searchQuery.trim() ? (
              <Text style={{ marginTop: 8, fontSize: 13, color: colors.textMuted }}>Nenhum membro encontrado.</Text>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* Chats FlatList */}
      {loadingChats ? (
        <View style={[screenStyles.listContent, { alignItems: 'center', justifyContent: 'center', minHeight: 200 }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={screenStyles.listContent}
          ItemSeparatorComponent={() => <View style={screenStyles.separator} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={screenStyles.sectionCard}
              onPress={() => openChat(item)}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
                  <View
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 23,
                      backgroundColor: colors.primarySoft,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>{item.avatar || '👤'}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[screenStyles.rowTitle, { fontSize: 15 }]}>{item.name}</Text>
                    <Text style={[screenStyles.rowSubtitle, { marginTop: 3 }]} numberOfLines={1}>
                      {item.preview || 'Nenhuma mensagem recente'}
                    </Text>
                  </View>
                </View>

                {item.unread > 0 ? (
                  <View
                    style={{
                      backgroundColor: colors.primary,
                      borderRadius: 12,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      minWidth: 22,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '800' }}>{item.unread}</Text>
                  </View>
                ) : (
                  <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
                )}
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={screenStyles.sectionCard}>
              <Text style={screenStyles.sectionTitle}>Nenhuma conversa iniciada</Text>
              <Text style={screenStyles.sectionText}>
                Converse diretamente com palestrantes e participantes do Meets.
              </Text>
              <TouchableOpacity
                style={[screenStyles.createButton, { marginTop: 16 }]}
                onPress={() => setShowNewChat(true)}
              >
                <Text style={screenStyles.createButtonText}>Iniciar uma conversa</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}
