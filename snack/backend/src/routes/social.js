import { Router } from "express";
import { getDb } from "../services/firestore.js";
import { requireAuth } from "../middleware/auth.js";
import {
  addLocalComment,
  addLocalShare,
  ensureLocalUser,
  getHistoryForUser,
  getLocalComments,
  getLocalPostById,
  listLocalMeets,
  listLocalPosts,
  listLocalRooms,
  recordHistoryEntry,
  toggleFavoriteForUser,
  upsertLocalMeet,
  upsertLocalPost,
  upsertLocalRoom,
  upsertLocalUser,
} from "../services/localStore.js";

const socialRouter = Router();

function normalizeUserId(req) {
  if (req.user?.uid) return req.user.uid;
  if (req.headers["x-dev-user-id"]) return String(req.headers["x-dev-user-id"]);
  return "me";
}

const hasFirestoreCredentials = () => Boolean(
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ||
    process.env.FIRESTORE_EMULATOR_HOST,
);

function useDevFallback(req) {
  const devUserId = req.headers['x-dev-user-id'] || req.user?.uid;
  if (devUserId && String(devUserId).startsWith('dev-')) return true;
  if (!hasFirestoreCredentials()) return true;
  return false;
}

function safeDate(value) {
  return value ? new Date(value).toISOString() : new Date().toISOString();
}

socialRouter.get("/posts", async (req, res) => {
  try {
    if (useDevFallback(req)) {
      return res.status(200).json({ ok: true, data: listLocalPosts(), source: "local-fallback" });
    }

    const db = getDb();
    const snapshot = await db.collection("posts").orderBy("createdAt", "desc").get();
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return res.status(200).json({ ok: true, data });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Erro ao listar posts", error: error.message });
  }
});

socialRouter.post("/posts", async (req, res) => {
  const payload = req.body || {};
  const userId = normalizeUserId(req);

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return res.status(400).json({ ok: false, message: "Body inválido" });
  }

  try {
    const post = {
      id: payload.id || `post-${Date.now()}`,
      mode: "post",
      title: payload.title || "Novo post",
      content: payload.content || "",
      authorId: userId,
      authorName: payload.authorName || "Você",
      avatar: payload.avatar || "👤",
      attachment: payload.attachment || null,
      createdAt: safeDate(payload.createdAt),
      updatedAt: new Date().toISOString(),
      stars: Number(payload.stars || 0),
      commentsCount: Number(payload.commentsCount || 0),
      shareCount: Number(payload.shareCount || 0),
    };

    if (useDevFallback(req)) {
      upsertLocalPost(post);
      const user = ensureLocalUser(userId);
      user.creations = [post, ...(user.creations || [])].slice(0, 50);
      recordHistoryEntry(userId, { type: "post_created", title: post.title, postId: post.id, createdAt: post.createdAt });
      return res.status(201).json({ ok: true, data: post, source: "local-fallback" });
    }

    const db = getDb();
    await db.collection("posts").doc(post.id).set(post, { merge: true });

    const userRef = db.collection("users").doc(userId);
    await userRef.set({
      creations: [
        { id: post.id, mode: "post", title: post.title, createdAt: post.createdAt },
        ...((await userRef.get()).exists ? ((await userRef.get()).data()?.creations || []) : []),
      ].slice(0, 50),
      updatedAt: new Date(),
    }, { merge: true });

    recordHistoryEntry(userId, { type: "post_created", title: post.title, postId: post.id, createdAt: post.createdAt });

    return res.status(201).json({ ok: true, data: post });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Erro ao criar post", error: error.message });
  }
});

socialRouter.post("/posts/:id/star", async (req, res) => {
  const userId = normalizeUserId(req);
  const { id } = req.params;

  try {
    if (useDevFallback(req)) {
      const post = getLocalPostById(id) || { id, authorId: userId, title: "Post", stars: 0 };
      const payload = toggleFavoriteForUser(userId, { ...post, id, type: "post" });
      const nextStars = payload.favorited ? (Number(post.stars || 0) + 1) : Math.max(0, Number(post.stars || 0) - 1);
      const updatedPost = { ...post, stars: nextStars, updatedAt: new Date().toISOString() };
      upsertLocalPost(updatedPost);
      recordHistoryEntry(userId, { type: payload.favorited ? "post_starred" : "post_unstarred", title: updatedPost.title || "Post", postId: updatedPost.id, createdAt: new Date().toISOString() });
      return res.status(200).json({ ok: true, data: { starred: payload.favorited, stars: nextStars, favorites: payload.favorites, savedItems: payload.savedItems }, source: "local-fallback" });
    }

    const db = getDb();
    const postRef = db.collection("posts").doc(id);
    const postSnap = await postRef.get();
    if (!postSnap.exists) {
      return res.status(404).json({ ok: false, message: "Post não encontrado" });
    }

    const current = postSnap.data();
    const starredByUser = Array.isArray(current.starredBy) && current.starredBy.includes(userId);
    const nextStarredBy = starredByUser
      ? (current.starredBy || []).filter((entry) => entry !== userId)
      : [...(current.starredBy || []), userId];

    const nextStars = nextStarredBy.length;
    await postRef.update({ starredBy: nextStarredBy, stars: nextStars, updatedAt: new Date() });

    return res.status(200).json({ ok: true, data: { starred: !starredByUser, stars: nextStars } });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Erro ao registrar estrela", error: error.message });
  }
});

socialRouter.get("/posts/:id/comments", async (req, res) => {
  const { id } = req.params;

  try {
    if (useDevFallback(req)) {
      return res.status(200).json({ ok: true, data: getLocalComments(id), source: "local-fallback" });
    }

    const db = getDb();
    const snapshot = await db.collection("posts").doc(id).collection("comments").orderBy("createdAt", "desc").get();
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return res.status(200).json({ ok: true, data });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Erro ao listar comentários", error: error.message });
  }
});

socialRouter.post("/posts/:id/comments", async (req, res) => {
  const { id } = req.params;
  const payload = req.body || {};
  const userId = normalizeUserId(req);

  const comment = {
    id: payload.id || `comment-${Date.now()}`,
    postId: id,
    authorId: userId,
    authorName: payload.authorName || "Você",
    avatar: payload.avatar || "👤",
    message: payload.message || payload.content || "",
    createdAt: safeDate(payload.createdAt),
  };

  try {
    if (useDevFallback(req)) {
      addLocalComment(id, comment);
      const post = getLocalPostById(id) || { id, title: "Post", commentsCount: 0 };
      upsertLocalPost({ ...post, commentsCount: Number(post.commentsCount || 0) + 1, updatedAt: new Date().toISOString() });
      recordHistoryEntry(userId, { type: "comment_created", title: post.title || "Post", postId: id, createdAt: comment.createdAt });
      return res.status(201).json({ ok: true, data: comment, source: "local-fallback" });
    }

    const db = getDb();
    const commentRef = db.collection("posts").doc(id).collection("comments").doc(comment.id);
    await commentRef.set(comment, { merge: true });
    const postRef = db.collection("posts").doc(id);
    await postRef.set({ commentsCount: (await postRef.get()).exists ? Number((await postRef.get()).data()?.commentsCount || 0) + 1 : 1, updatedAt: new Date() }, { merge: true });

    return res.status(201).json({ ok: true, data: comment });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Erro ao criar comentário", error: error.message });
  }
});

socialRouter.post("/posts/:id/share", async (req, res) => {
  const { id } = req.params;
  const userId = normalizeUserId(req);
  const payload = req.body || {};

  const share = {
    id: payload.id || `share-${Date.now()}`,
    postId: id,
    userId,
    channel: payload.channel || "link",
    createdAt: safeDate(payload.createdAt),
  };

  try {
    if (useDevFallback(req)) {
      addLocalShare(share);
      const post = getLocalPostById(id) || { id, title: "Post", shareCount: 0 };
      upsertLocalPost({ ...post, shareCount: Number(post.shareCount || 0) + 1, updatedAt: new Date().toISOString() });
      recordHistoryEntry(userId, { type: "post_shared", title: post.title || "Post", postId: id, channel: share.channel, createdAt: share.createdAt });
      return res.status(201).json({ ok: true, data: share, source: "local-fallback" });
    }

    const db = getDb();
    const docRef = db.collection("shares").doc(share.id);
    await docRef.set(share, { merge: true });
    const postRef = db.collection("posts").doc(id);
    await postRef.set({ shareCount: (await postRef.get()).exists ? Number((await postRef.get()).data()?.shareCount || 0) + 1 : 1, updatedAt: new Date() }, { merge: true });

    return res.status(201).json({ ok: true, data: share });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Erro ao registrar compartilhamento", error: error.message });
  }
});

socialRouter.get("/meets", async (req, res) => {
  try {
    if (useDevFallback(req)) {
      return res.status(200).json({ ok: true, data: listLocalMeets(), source: "local-fallback" });
    }

    const db = getDb();
    const snapshot = await db.collection("meets").orderBy("createdAt", "desc").get();
    return res.status(200).json({ ok: true, data: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Erro ao listar meets", error: error.message });
  }
});

socialRouter.post("/meets", async (req, res) => {
  const payload = req.body || {};
  const userId = normalizeUserId(req);

  const meet = {
    id: payload.id || `meet-${Date.now()}`,
    mode: "meet",
    title: payload.title || "Meet sem título",
    date: payload.date || "",
    time: payload.time || "",
    location: payload.location || "",
    details: payload.details || "",
    creatorId: userId,
    creatorName: payload.creatorName || "Você",
    participants: Array.isArray(payload.participants) ? payload.participants : [userId],
    createdAt: safeDate(payload.createdAt),
    updatedAt: new Date().toISOString(),
  };

  try {
    if (useDevFallback(req)) {
      upsertLocalMeet(meet);
      const user = ensureLocalUser(userId);
      user.creations = [meet, ...(user.creations || [])].slice(0, 50);
      recordHistoryEntry(userId, { type: "meet_created", title: meet.title, meetId: meet.id, createdAt: meet.createdAt });
      return res.status(201).json({ ok: true, data: meet, source: "local-fallback" });
    }

    const db = getDb();
    await db.collection("meets").doc(meet.id).set(meet, { merge: true });
    return res.status(201).json({ ok: true, data: meet });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Erro ao criar meet", error: error.message });
  }
});

socialRouter.post("/meets/:id/join", async (req, res) => {
  const { id } = req.params;
  const userId = normalizeUserId(req);

  try {
    if (useDevFallback(req)) {
      const localMeet = listLocalMeets().find((item) => item.id === id) || { id, title: "Meet", participants: [] };
      const participants = Array.isArray(localMeet.participants) ? [...new Set([...localMeet.participants, userId])] : [userId];
      const next = { ...localMeet, participants, updatedAt: new Date().toISOString() };
      upsertLocalMeet(next);
      const user = ensureLocalUser(userId);
      user.participatedMeets = [{ id: next.id, title: next.title, createdAt: next.createdAt }, ...(user.participatedMeets || [])];
      recordHistoryEntry(userId, { type: "meet_joined", title: next.title, meetId: next.id, createdAt: new Date().toISOString() });
      return res.status(200).json({ ok: true, data: next, source: "local-fallback" });
    }

    const db = getDb();
    const docRef = db.collection("meets").doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ ok: false, message: "Meet não encontrado" });

    const current = snap.data();
    const participants = Array.isArray(current.participants) ? [...new Set([...current.participants, userId])] : [userId];
    await docRef.update({ participants, updatedAt: new Date() });
    return res.status(200).json({ ok: true, data: { ...current, participants } });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Erro ao participar do meet", error: error.message });
  }
});

socialRouter.get("/rooms", async (req, res) => {
  try {
    if (useDevFallback(req)) {
      return res.status(200).json({ ok: true, data: listLocalRooms(), source: "local-fallback" });
    }

    const db = getDb();
    const snapshot = await db.collection("rooms").orderBy("createdAt", "desc").get();
    return res.status(200).json({ ok: true, data: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Erro ao listar salas", error: error.message });
  }
});

socialRouter.post("/rooms", async (req, res) => {
  const payload = req.body || {};
  const userId = normalizeUserId(req);

  const room = {
    id: payload.id || `room-${Date.now()}`,
    mode: "virtual-room",
    title: payload.title || "Sala sem título",
    topic: payload.topic || "",
    duration: payload.duration || "",
    summary: payload.summary || "",
    creatorId: userId,
    creatorName: payload.creatorName || "Você",
    participants: Array.isArray(payload.participants) ? payload.participants : [userId],
    status: payload.status || "open",
    createdAt: safeDate(payload.createdAt),
    updatedAt: new Date().toISOString(),
  };

  try {
    if (useDevFallback(req)) {
      upsertLocalRoom(room);
      const user = ensureLocalUser(userId);
      user.creations = [room, ...(user.creations || [])].slice(0, 50);
      recordHistoryEntry(userId, { type: "room_created", title: room.title, roomId: room.id, createdAt: room.createdAt });
      return res.status(201).json({ ok: true, data: room, source: "local-fallback" });
    }

    const db = getDb();
    await db.collection("rooms").doc(room.id).set(room, { merge: true });
    return res.status(201).json({ ok: true, data: room });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Erro ao criar sala virtual", error: error.message });
  }
});

socialRouter.post("/rooms/:id/join", async (req, res) => {
  const { id } = req.params;
  const userId = normalizeUserId(req);

  try {
    if (useDevFallback(req)) {
      const localRoom = listLocalRooms().find((item) => item.id === id) || { id, title: "Sala", participants: [] };
      const participants = Array.isArray(localRoom.participants) ? [...new Set([...localRoom.participants, userId])] : [userId];
      const next = { ...localRoom, participants, updatedAt: new Date().toISOString() };
      upsertLocalRoom(next);
      const user = ensureLocalUser(userId);
      user.participatedRooms = [{ id: next.id, title: next.title, createdAt: next.createdAt }, ...(user.participatedRooms || [])];
      recordHistoryEntry(userId, { type: "room_joined", title: next.title, roomId: next.id, createdAt: new Date().toISOString() });
      return res.status(200).json({ ok: true, data: next, source: "local-fallback" });
    }

    const db = getDb();
    const docRef = db.collection("rooms").doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ ok: false, message: "Sala não encontrada" });

    const current = snap.data();
    const participants = Array.isArray(current.participants) ? [...new Set([...current.participants, userId])] : [userId];
    await docRef.update({ participants, updatedAt: new Date() });
    return res.status(200).json({ ok: true, data: { ...current, participants } });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Erro ao participar da sala", error: error.message });
  }
});

socialRouter.get("/history", async (req, res) => {
  const userId = normalizeUserId(req);

  try {
    if (useDevFallback(req)) {
      return res.status(200).json({ ok: true, data: getHistoryForUser(userId), source: "local-fallback" });
    }

    const db = getDb();
    const snapshot = await db.collection("users").doc(userId).collection("history").orderBy("createdAt", "desc").limit(50).get();
    return res.status(200).json({ ok: true, data: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Erro ao listar histórico", error: error.message });
  }
});

export { socialRouter };
