import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

import { auth, isFirebaseAuthConfigured } from './firebase';

let localAuthUser = null;

function createLocalUser(email) {
  const normalizedEmail = email.trim();

  return {
    uid: `local-${normalizedEmail}`,
    email: normalizedEmail,
    displayName: normalizedEmail.split('@')[0] || normalizedEmail,
  };
}

export async function register(email, password) {
  if (isFirebaseAuthConfigured && auth) {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    return credential.user;
  }

  localAuthUser = createLocalUser(email);
  return localAuthUser;
}

export async function login(email, password) {
  if (isFirebaseAuthConfigured && auth) {
    const credential = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    return credential.user;
  }

  localAuthUser = createLocalUser(email);
  return localAuthUser;
}

export async function logout() {
  if (isFirebaseAuthConfigured && auth) {
    await signOut(auth);
    return;
  }

  localAuthUser = null;
}

export function getDevUserId() {
  const user = localAuthUser || { uid: 'me' };
  return user.uid || 'me';
}

export async function getIdToken() {
  if (!isFirebaseAuthConfigured || !auth) {
    return null;
  }

  const user = auth.currentUser;
  if (!user) {
    return null;
  }

  return await user.getIdToken(true);
}
