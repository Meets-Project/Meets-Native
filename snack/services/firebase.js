import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const hasFirebaseAuthConfig =
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId;

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.warn(
    'Firebase Auth não está configurado. O app vai usar login/cadastro local até você definir as variáveis EXPO_PUBLIC_FIREBASE_*.'
  );
}

const app = hasFirebaseAuthConfig ? initializeApp(firebaseConfig) : null;

export const auth = app ? getAuth(app) : null;
export const isFirebaseAuthConfigured = Boolean(app);
