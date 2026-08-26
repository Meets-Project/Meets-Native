import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBackendBaseUrl } from '../data/apiConfig';

const TOKEN_KEY = '@meets/auth_token';
let unauthorizedHandler = null;

export function onUnauthorized(handler) {
  unauthorizedHandler = handler;
  return () => { if (unauthorizedHandler === handler) unauthorizedHandler = null; };
}

async function requestJson(path, options = {}) {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const response = await fetch(`${getBackendBaseUrl()}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const raw = await response.text();
  let body = null;
  try { body = raw ? JSON.parse(raw) : null; } catch {}
  if (!response.ok) {
    const error = new Error(body?.message || `Erro ${response.status}`);
    error.status = response.status;
    error.code = body?.code;
    error.details = body?.details;
    if (response.status === 401) {
      await AsyncStorage.removeItem(TOKEN_KEY);
      try { unauthorizedHandler?.(); } catch {}
    }
    throw error;
  }
  return body;
}

export async function setToken(token) { await AsyncStorage.setItem(TOKEN_KEY, token); }
export async function clearToken() { await AsyncStorage.removeItem(TOKEN_KEY); }
export async function hasToken() { return !!(await AsyncStorage.getItem(TOKEN_KEY)); }

export async function login(email, password) {
  const response = await requestJson('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  await setToken(response.data.token);
  return response.data.user;
}

export async function signup(name, email, password) {
  const response = await requestJson('/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) });
  await setToken(response.data.token);
  return response.data.user;
}

export async function getMe() { return (await requestJson('/users/me')).data; }
export async function updateMe(payload) { return (await requestJson('/users/me', { method: 'PUT', body: JSON.stringify(payload) })).data; }
export async function search(q) { return (await requestJson(`/search?q=${encodeURIComponent(q)}`)).data; }

// --- CHAT SERVICES ---
export async function getChats() { return (await requestJson('/chats')).data; }
export async function createDirectChat(recipientId) {
  return (await requestJson('/chats', { method: 'POST', body: JSON.stringify({ recipientId }) })).data;
}
export async function getChatMessages(chatId) {
  return (await requestJson(`/chats/${encodeURIComponent(chatId)}/messages`)).data;
}
export async function sendChatMessage(chatId, content) {
  return (await requestJson(`/chats/${encodeURIComponent(chatId)}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })).data;
}
export async function markChatRead(chatId) {
  return (await requestJson(`/chats/${encodeURIComponent(chatId)}/read`, { method: 'POST' })).data;
}

// --- FEED & CONTENT ---
export async function getFeed() { return (await requestJson('/feed')).data; }
export async function createContent(payload) { return (await requestJson('/content', { method: 'POST', body: JSON.stringify(payload) })).data; }
export async function getFavorites() { return (await requestJson('/favorites')).data; }
export async function toggleFavorite(id) { return (await requestJson(`/posts/${id}/favorite`, { method: 'POST' })).data; }
export async function getSaves() { return (await requestJson('/saves')).data; }
export async function toggleSave(id) { return (await requestJson(`/posts/${id}/save`, { method: 'POST' })).data; }
export async function toggleSaveEvent(id) { return (await requestJson(`/events/${id}/save`, { method: 'POST' })).data; }

// --- EVENT PARTICIPANTS ---
export async function participateEvent(id) {
  return (await requestJson(`/events/${encodeURIComponent(id)}/participate`, { method: 'POST' })).data;
}
export async function getEventParticipants(id) {
  return (await requestJson(`/events/${encodeURIComponent(id)}/participants`)).data;
}

export async function getHistory() { return (await requestJson('/history')).data; }
export async function getNotifications() { return (await requestJson('/notifications')).data; }
export async function markNotificationRead(id) { return (await requestJson(`/notifications/${id}/read`, { method: 'POST' })).data; }
export async function getSettings() { return (await requestJson('/settings')).data; }
export async function updateSettings(payload) { return (await requestJson('/settings', { method: 'PUT', body: JSON.stringify(payload) })).data; }
export async function toggleLike(id) { return (await requestJson(`/posts/${id}/like`, { method: 'POST' })).data; }
export async function createPost(content, image) { return (await requestJson('/posts', { method: 'POST', body: JSON.stringify({ content, image }) })).data; }

// --- RATINGS ---
export async function createPresentationRating(payload) {
  return (await requestJson('/ratings/presentations', {
    method: 'POST',
    body: JSON.stringify(payload),
  })).data;
}

export async function getSpeakerRatingSummary(speakerId) {
  return (await requestJson(`/ratings/speakers/${encodeURIComponent(speakerId)}`)).data;
}

export async function getMyEvents() {
  return (await requestJson('/events/mine')).data;
}

export async function deletePost(id) {
  return (await requestJson(`/posts/${encodeURIComponent(id)}`, { method: 'DELETE' })).data;
}

export async function deleteEvent(id) {
  return (await requestJson(`/events/${encodeURIComponent(id)}`, { method: 'DELETE' })).data;
}

export async function getMyPosts() { return (await requestJson('/posts/mine')).data; }
