import { getMe, onTokenChange } from './api';

// Guarda o usuário logado por alguns segundos, para várias telas e cards
// saberem quem está usando o app (ex.: se é administrador) sem repetir a chamada.
let cached = null;
let cachedAt = 0;
let pending = null;
const TTL_MS = 60_000;

export async function getCurrentUser({ refresh = false } = {}) {
  if (!refresh && cached && Date.now() - cachedAt < TTL_MS) return cached;
  if (!pending) {
    pending = getMe()
      .then((user) => { cached = user; cachedAt = Date.now(); return user; })
      .finally(() => { pending = null; });
  }
  return pending;
}

// Ao entrar, sair ou perder a sessão, esquece o usuário guardado.
onTokenChange(() => clearCurrentUser());

export function clearCurrentUser() {
  cached = null;
  cachedAt = 0;
}

export function isAdmin(user) {
  return user?.account_type === 'admin';
}
