import { getBackendBaseUrl } from '../data/apiConfig';

async function requestJson(path, options = {}) {
  const baseUrl = getBackendBaseUrl();
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
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