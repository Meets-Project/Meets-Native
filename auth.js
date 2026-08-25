import jwt from 'jsonwebtoken';
import { query } from './db.js';

const secret = () => process.env.JWT_SECRET || 'development-only-secret';

export function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, secret(), { expiresIn: '7d' });
}

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Autenticação necessária.' });
  try {
    const payload = jwt.verify(token, secret());
    const result = await query('SELECT id, email FROM users WHERE id=$1', [payload.sub]);
    if (!result.rows[0]) {
      return res.status(401).json({ message: 'Sessão inválida. Faça login novamente.', code: 'AUTH_USER_NOT_FOUND' });
    }
    req.auth = { ...payload, sub: result.rows[0].id, email: result.rows[0].email };
    next();
  } catch (error) {
    if (error?.name === 'JsonWebTokenError' || error?.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Sessão inválida ou expirada.', code: 'AUTH_INVALID' });
    }
    next(error);
  }
}
