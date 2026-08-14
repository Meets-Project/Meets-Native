import { Router } from "express";
import { getDb } from "../services/firestore.js";
import { requireAuth } from "../middleware/auth.js";

const usersRouter = Router();
const defaultProfile = {
  id: "me",
  name: "Gabriel Rodrigues",
  role: "Organizador de Meetups",
  city: "São Paulo, BR",
  avatar: "🧑‍💻",
  connections: 128,
  eventsCount: 24,
  rating: 4.9,
  bio: "Curador de encontros de tecnologia e produto.",
};

const localProfiles = {
  me: { ...defaultProfile },
};

function hasFirestoreCredentials() {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
      process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ||
      process.env.FIRESTORE_EMULATOR_HOST,
  );
}

function shouldUseLocalFallback(req) {
  const devUserId = req.headers['x-dev-user-id'] || req.user?.uid;
  return Boolean(devUserId && String(devUserId).startsWith('dev-')) || !hasFirestoreCredentials();
}

const authMiddleware = (req, res, next) => {
  const devUserId = req.headers['x-dev-user-id'];

  if (devUserId) {
    req.user = { uid: String(devUserId), email: `${String(devUserId)}@local.dev` };
    return next();
  }

  if (hasFirestoreCredentials()) {
    return requireAuth(req, res, next);
  }

  return next();
};

function toProfileData(id, data) {
  return {
    id,
    ...defaultProfile,
    ...data,
  };
}

function getLocalUser(id) {
  const userId = String(id || "me");

  if (!localProfiles[userId]) {
    localProfiles[userId] = {
      ...defaultProfile,
      id: userId,
      name: `Usuário ${userId}`,
      role: "Usuário local",
      city: "Local",
      avatar: "👤",
      connections: 0,
      eventsCount: 0,
      rating: 0,
    };
  }

  return {
    id: localProfiles[userId].id,
    ...localProfiles[userId],
  };
}

function persistLocalUser(payload) {
  const userId = String(payload?.id || "me");
  const existing = localProfiles[userId] || { ...defaultProfile, id: userId };
  localProfiles[userId] = toProfileData(userId, {
    ...existing,
    ...payload,
  });

  return { id: localProfiles[userId].id, ...localProfiles[userId] };
}

// --- ROTAS /me (Devem vir SEMPRE antes de /:id) ---

usersRouter.get("/me", authMiddleware, async (req, res) => {
  const devUserId = req.headers['x-dev-user-id'] || req.user?.uid;
  if (shouldUseLocalFallback(req) || (devUserId && String(devUserId).startsWith('dev-'))) {
    const currentUserId = String(devUserId || 'me');
    return res.status(200).json({
      ok: true,
      data: getLocalUser(currentUserId),
      source: "local-fallback",
    });
  }

  try {
    const db = getDb();
    const userId = req.user.uid;
    const snapshot = await db.collection("users").doc(userId).get();

    if (!snapshot.exists) {
      return res.status(200).json({
        ok: true,
        data: toProfileData(userId, {}),
      });
    }

    return res.status(200).json({
      ok: true,
      data: toProfileData(snapshot.id, snapshot.data()),
    });
  } catch (error) {
    console.error('[Users] GET /me failed', error);
    return res.status(500).json({
      ok: false,
      message: 'Erro ao buscar perfil do usuário',
    });
  }
});

usersRouter.put("/me", authMiddleware, async (req, res) => {
  const payload = req.body;

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return res.status(400).json({
      ok: false,
      message: "Body inválido",
    });
  }

  const devUserId = req.headers['x-dev-user-id'] || req.user?.uid;
  if (shouldUseLocalFallback(req) || (devUserId && String(devUserId).startsWith('dev-'))) {
    const currentUserId = String(devUserId || 'me');
    return res.status(200).json({
      ok: true,
      data: persistLocalUser({ id: currentUserId, ...payload }),
      source: "local-fallback",
    });
  }

  try {
    const db = getDb();
    const userId = req.user.uid;
    const allowedFields = [
      'name',
      'email',
      'isGuest',
      'role',
      'city',
      'avatar',
      'bio',
      'connections',
      'eventsCount',
      'rating',
    ];

    const update = allowedFields.reduce((acc, key) => {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        acc[key] = payload[key];
      }
      return acc;
    }, {});

    if (Object.keys(update).length === 0) {
      return res.status(400).json({
        ok: false,
        message: 'Nenhum campo permitido para atualização',
      });
    }

    update.updatedAt = new Date();

    await db.collection("users").doc(userId).set(update, { merge: true });

    const updated = await db.collection("users").doc(userId).get();

    return res.status(200).json({
      ok: true,
      data: toProfileData(updated.id, updated.data()),
    });
  } catch (error) {
    console.error('[Users] PUT /me failed', error);
    return res.status(500).json({
      ok: false,
      message: 'Erro ao atualizar perfil do usuário',
    });
  }
});

// --- ROTAS /:id (Devem vir APÓS as rotas fixas como /me) ---

usersRouter.get("/:id", async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const docRef = db.collection("users").doc(id);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return res.status(404).json({
        ok: false,
        message: "Usuário não encontrado",
      });
    }

    return res.status(200).json({
      ok: true,
      data: {
        id: snapshot.id,
        ...snapshot.data(),
      },
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Erro ao buscar usuário",
      error: error.message,
    });
  }
});

usersRouter.put("/:id", authMiddleware, async (req, res) => {
  const payload = req.body;

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return res.status(400).json({
      ok: false,
      message: "Body inválido",
    });
  }

  if (hasFirestoreCredentials() && req.user.uid !== req.params.id) {
    return res.status(403).json({
      ok: false,
      message: 'Você não pode alterar este usuário',
    });
  }

  try {
    const db = getDb();
    const { id } = req.params;

    await db.collection("users").doc(id).set(payload, { merge: true });

    const updated = await db.collection("users").doc(id).get();

    return res.status(200).json({
      ok: true,
      data: {
        id: updated.id,
        ...updated.data(),
      },
    });
  } catch (error) {
    console.error('[Users] PUT /:id failed', error);
    return res.status(500).json({
      ok: false,
      message: "Erro ao atualizar usuário",
    });
  }
});

export { usersRouter };
