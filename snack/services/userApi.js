import { getBackendBaseUrl } from '../data/apiConfig';
import { getDevUserId, getIdToken } from './auth';

async function requestJson(path, options = {}) {
  const baseUrl = getBackendBaseUrl();
  const token = await getIdToken();
  const devUserId = getDevUserId();

  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(!token ? { 'X-Dev-User-Id': devUserId } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const rawText = await response.text();
  let body = null;

  if (rawText) {
    try {
      body = JSON.parse(rawText);
    } catch (_error) {
      body = null;
    }
  }

  if (!response.ok) {
    const message = body?.message || `Erro ao chamar ${path}`;
    throw new Error(message);
  }

  return body;
}

export async function fetchCurrentUser() {
  const response = await requestJson('/users/me');
  return response?.data || null;
}

export async function updateCurrentUser(payload) {
  const response = await requestJson('/users/me', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  return response?.data || null;
}

export async function fetchPosts() {
  const response = await requestJson('/posts');
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createPost(payload) {
  const response = await requestJson('/posts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response?.data || null;
}

export async function togglePostStar(postId) {
  const response = await requestJson(`/posts/${postId}/star`, {
    method: 'POST',
    body: JSON.stringify({}),
  });

  return response?.data || null;
}

export async function fetchPostComments(postId) {
  const response = await requestJson(`/posts/${postId}/comments`);
  return Array.isArray(response?.data) ? response.data : [];
}

export async function addPostComment(postId, payload) {
  const response = await requestJson(`/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response?.data || null;
}

export async function sharePost(postId, channel = 'link') {
  const response = await requestJson(`/posts/${postId}/share`, {
    method: 'POST',
    body: JSON.stringify({ channel }),
  });

  return response?.data || null;
}

export async function fetchMeets() {
  const response = await requestJson('/meets');
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createMeet(payload) {
  const response = await requestJson('/meets', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response?.data || null;
}

export async function joinMeet(meetId) {
  const response = await requestJson(`/meets/${meetId}/join`, {
    method: 'POST',
    body: JSON.stringify({}),
  });

  return response?.data || null;
}

export async function fetchRooms() {
  const response = await requestJson('/rooms');
  return Array.isArray(response?.data) ? response.data : [];
}

export async function createRoom(payload) {
  const response = await requestJson('/rooms', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response?.data || null;
}

export async function joinRoom(roomId) {
  const response = await requestJson(`/rooms/${roomId}/join`, {
    method: 'POST',
    body: JSON.stringify({}),
  });

  return response?.data || null;
}

export async function fetchHistory() {
  const response = await requestJson('/history');
  return Array.isArray(response?.data) ? response.data : [];
}