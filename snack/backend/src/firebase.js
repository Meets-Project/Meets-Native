// Firebase Admin SDK Configuration
import admin from 'firebase-admin';
import { config } from './config.js';

let db;

export function initializeFirebase() {
  if (admin.apps && admin.apps.length > 0) {
    return admin.app();
  }

  try {
    if (config.firebase.emulatorHost) {
      process.env.FIREBASE_EMULATOR_HOST = config.firebase.emulatorHost;
      console.log(`📱 Usando Firestore Emulator: ${config.firebase.emulatorHost}`);
    }

    let serviceAccount;

    if (config.firebase.serviceAccountBase64) {
      const decoded = Buffer.from(
        config.firebase.serviceAccountBase64,
        'base64'
      ).toString('utf8');
      serviceAccount = JSON.parse(decoded);
    } else if (config.firebase.serviceAccountJson) {
      serviceAccount = JSON.parse(config.firebase.serviceAccountJson);
    }

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: config.firebase.projectId,
      });
    } else {
      admin.initializeApp({
        projectId: config.firebase.projectId,
      });
    }

    db = admin.firestore();
    console.log('✅ Firebase inicializado com sucesso');
    return db;
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase:', error.message);
    throw error;
  }
}

export function getFirestore() {
  if (!db) {
    throw new Error('Firestore não inicializado. Chame initializeFirebase() primeiro.');
  }
  return db;
}

export default db;
