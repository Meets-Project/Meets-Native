import jwt from 'jsonwebtoken';
import { query as defaultQuery } from './db.js';

const secret = () => process.env.JWT_SECRET || 'development-only-secret';

export function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, secret(), { expiresIn: '7d' });
}

export const DEACTIVATED_MESSAGE = 'Esta conta está desativada. Procure um administrador para reativá-la.';

function toAuth(payload, account) {
  return { ...payload, sub: account.id, email: account.email, accountType: account.account_type, isAdmin: account.account_type === 'admin' };
}

// Só administradores passam. Use depois de requireAuth.
export function requireAdmin(req, res, next) {
  if (!req.auth?.isAdmin) return res.status(403).json({ message: 'Acesso restrito a administradores.', code: 'ADMIN_ONLY' });
  next();
}

function bearer(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

// Cria os middlewares de autenticação usando o banco recebido (permite testar com outro banco).
export function makeAuth({ query } = { query: defaultQuery }) {
  async function requireAuth(req, res, next) {
    const token = bearer(req);
    if (!token) return res.status(401).json({ message: 'Autenticação necessária.' });
    try {
      const payload = jwt.verify(token, secret());
      const result = await query('SELECT id, email, account_type, status FROM users WHERE id=$1', [payload.sub]);
      const account = result.rows[0];
      if (!account) {
        return res.status(401).json({ message: 'Sessão inválida. Faça login novamente.', code: 'AUTH_USER_NOT_FOUND' });
      }
      if (account.status !== 'active') {
        return res.status(401).json({ message: DEACTIVATED_MESSAGE, code: 'ACCOUNT_DEACTIVATED' });
      }
      req.auth = toAuth(payload, account);
      next();
    } catch (error) {
      if (error?.name === 'JsonWebTokenError' || error?.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Sessão inválida ou expirada.', code: 'AUTH_INVALID' });
      }
      next(error);
    }
  }

  async function optionalAuth(req, _res, next) {
    const token = bearer(req);
    if (!token) return next();
    try {
      const payload = jwt.verify(token, secret());
      const result = await query('SELECT id, email, account_type, status FROM users WHERE id=$1', [payload.sub]);
      const account = result.rows[0];
      if (account && account.status === 'active') req.auth = toAuth(payload, account);
    } catch (_) {
      // Links públicos/compartilhados continuam acessíveis com token antigo ou expirado.
    }
    next();
  }

  return { requireAuth, optionalAuth };
}

const defaults = makeAuth();
export const requireAuth = defaults.requireAuth;
export const optionalAuth = defaults.optionalAuth;
