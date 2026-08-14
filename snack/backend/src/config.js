// Configuração centralizada
export const config = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  corsCredentials:
    process.env.CORS_CREDENTIALS === 'true' || process.env.CORS_CREDENTIALS == null,
  jsonBodyLimit: process.env.JSON_BODY_LIMIT || '50mb',
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || 'snack-local',
    emulatorHost: process.env.FIRESTORE_EMULATOR_HOST,
    serviceAccountBase64: process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
    serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
  },
};

// Validar configuração ao iniciar
export function validateConfig() {
  if (!config.firebase.projectId) {
    throw new Error('FIREBASE_PROJECT_ID é obrigatório');
  }

  const usingEmulator = !!config.firebase.emulatorHost;
  const usingRealFirebase =
    config.firebase.serviceAccountBase64 || config.firebase.serviceAccountJson;

  if (!usingEmulator && !usingRealFirebase) {
    console.warn(
      'Aviso: Usando Firestore Emulator. Para produção, configure credenciais reais.'
    );
  }
}
