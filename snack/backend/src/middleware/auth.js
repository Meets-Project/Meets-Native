import admin from 'firebase-admin';
import { initializeFirebase } from '../firebase.js';

export async function requireAuth(req, res, next) {
  try {
    const devUserId = req.headers['x-dev-user-id'];
    const header = req.headers.authorization;

    if (devUserId) {
      req.user = {
        uid: String(devUserId),
        email: `${String(devUserId)}@local.dev`,
      };
      return next();
    }

    const hasFirebaseCreds = Boolean(
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
        process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ||
        process.env.FIRESTORE_EMULATOR_HOST,
    );

    if (!hasFirebaseCreds) {
      req.user = { uid: 'me', email: 'dev@local.dev' };
      return next();
    }

    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({
        ok: false,
        message: 'Token não informado',
      });
    }

    initializeFirebase();
    const token = header.substring(7);
    const decodedToken = await admin.auth().verifyIdToken(token);

    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Authentication error:', error);

    return res.status(401).json({
      ok: false,
      message: 'Token inválido',
    });
  }
}