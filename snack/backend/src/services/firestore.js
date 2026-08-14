import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let cachedDb = null;

function isUsingEmulator() {
  const host = process.env.FIRESTORE_EMULATOR_HOST;
  return Boolean(host && host.trim().length > 0);
}

function parseServiceAccountFromEnv() {
  const jsonRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (jsonRaw && jsonRaw.trim().length > 0) {
    return JSON.parse(jsonRaw);
  }

  const base64Raw = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (base64Raw && base64Raw.trim().length > 0) {
    const decoded = Buffer.from(base64Raw, "base64").toString("utf8");
    return JSON.parse(decoded);
  }

  return null;
}

function initFirebaseApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  if (isUsingEmulator()) {
    return initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || "snack-local",
    });
  }

  const serviceAccount = parseServiceAccountFromEnv();
  if (!serviceAccount) {
    throw new Error(
      "Credenciais Firebase ausentes. Configure FIREBASE_SERVICE_ACCOUNT_JSON/FIREBASE_SERVICE_ACCOUNT_BASE64 ou use FIRESTORE_EMULATOR_HOST.",
    );
  }

  return initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
  });
}

export function getDb() {
  if (cachedDb) {
    return cachedDb;
  }

  const app = initFirebaseApp();
  cachedDb = getFirestore(app);
  return cachedDb;
}
