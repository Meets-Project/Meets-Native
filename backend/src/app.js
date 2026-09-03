import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from './db.js';
import { makeRepository } from './repository.js';
import { requireAuth, signToken } from './auth.js';

const app = express();
const repo = makeRepository({ query });

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '20mb' }));

const credentials = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(128),
});
const profileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  role: z.string().trim().max(80).optional(),
  city: z.string().trim().max(120).optional(),
  addressNumber: z.string().trim().max(20).optional(),
  avatar: z.string().max(5_000_000).optional(),
  bio: z.string().max(1000).optional(),
}).strict();

// Helper to normalize date to YYYY-MM-DD
function normalizeDate(input) {
  if (!input) return undefined;
  const str = String(input).trim();
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  // DD/MM/YYYY or DD-MM-YYYY
  const match = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    return `${year}-${month}-${day}`;
  }
  return undefined;
}

function normalizeTime(input) {
  if (!input) return undefined;
  const str = String(input).trim();
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(str)) return str.slice(0, 5);
  const match = str.match(/^(\d{1,2}):(\d{1,2})$/);
  if (match) {
    return `${match[1].padStart(2, '0')}:${match[2].padStart(2, '0')}`;
  }
  return undefined;
}

app.get('/health', async (_req, res) => {
  try { await query('SELECT 1'); res.json({ ok: true, database: 'postgresql' }); }
  catch { res.status(503).json({ ok: false, database: 'postgresql' }); }
});

app.post('/auth/signup', async (req, res, next) => {
  try {
    const data = credentials.parse(req.body);
    if (!data.name) return res.status(400).json({ message: 'Nome é obrigatório.' });
    const exists = await repo.findUserByEmail(data.email);
    if (exists) return res.status(409).json({ message: 'E-mail já cadastrado.' });
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await repo.createUser({ name: data.name, email: data.email.toLowerCase(), passwordHash });
    await repo.updateSettings(user.id, {});
    await repo.createNotification(user.id, {
      title: 'Bem-vindo ao Meets',
      body: 'Sua conta foi criada e seus dados estão persistidos no PostgreSQL.',
    });
    res.status(201).json({ data: { token: signToken(user), user } });
  } catch (e) { next(e); }
});

app.post('/auth/login', async (req, res, next) => {
  try {
    const data = credentials.omit({ name: true }).parse(req.body);
    const user = await repo.findUserByEmail(data.email);
    if (!user || !(await bcrypt.compare(data.password, user.password_hash))) {
      return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
    }
    const safe = await repo.getUser(user.id);
    res.json({ data: { token: signToken(user), user: safe } });
  } catch (e) { next(e); }
});

app.get('/users/me', requireAuth, async (req, res, next) => {
  try {
    const user = await repo.getUser(req.auth.sub);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });
    res.json({ data: user });
  } catch (e) { next(e); }
});

app.put('/users/me', requireAuth, async (req, res, next) => {
  try { res.json({ data: await repo.updateUser(req.auth.sub, profileSchema.parse(req.body)) }); }
  catch (e) { next(e); }
});

app.get('/search', requireAuth, async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    res.json({ data: q ? await repo.search(q) : [] });
  } catch (e) { next(e); }
});

// --- CONNECTION ROUTES ---
app.post('/users/:id/connect', requireAuth, async (req, res, next) => {
  try {
    const result = await repo.toggleConnection(req.auth.sub, req.params.id);
    res.json({ data: result });
  } catch (e) { next(e); }
});

app.get('/users/:id/connection-status', requireAuth, async (req, res, next) => {
  try {
    const connected = await repo.getConnectionStatus(req.auth.sub, req.params.id);
    res.json({ data: { connected } });
  } catch (e) { next(e); }
});

app.get('/users/connections', requireAuth, async (req, res, next) => {
  try {
    const connections = await repo.listConnections(req.auth.sub);
    res.json({ data: connections });
  } catch (e) { next(e); }
});

// --- CHAT ROUTES ---
app.get('/chats', requireAuth, async (req, res, next) => {
  try { res.json({ data: await repo.listChats(req.auth.sub) }); } catch (e) { next(e); }
});

app.post('/chats', requireAuth, async (req, res, next) => {
  try {
    const data = z.object({
      recipientId: z.string().uuid(),
    }).parse(req.body);

    const chat = await repo.getOrCreateDirectChat(req.auth.sub, data.recipientId);
    res.status(201).json({ data: chat });
  } catch (e) { next(e); }
});

app.get('/chats/:id/messages', requireAuth, async (req, res, next) => {
  try {
    const messages = await repo.listChatMessages(req.params.id, req.auth.sub);
    res.json({ data: messages });
  } catch (e) { next(e); }
});

app.post('/chats/:id/messages', requireAuth, async (req, res, next) => {
  try {
    const data = z.object({
      content: z.string().trim().min(1).max(5000),
    }).parse(req.body);

    const message = await repo.sendChatMessage(req.params.id, req.auth.sub, data.content);
    res.status(201).json({ data: message });
  } catch (e) { next(e); }
});

app.post('/chats/:id/read', requireAuth, async (req, res, next) => {
  try {
    await repo.markChatRead(req.params.id, req.auth.sub);
    res.json({ data: { read: true } });
  } catch (e) { next(e); }
});

// --- FEED & CONTENT ---
app.get('/feed', requireAuth, async (req, res, next) => {
  try {
    const filter = String(req.query.filter || 'all');
    res.json({ data: await repo.listFeed(req.auth.sub, filter) });
  } catch (e) { next(e); }
});

app.post('/posts', requireAuth, async (req, res, next) => {
  try {
    const data = z.object({
      content: z.string().trim().min(1).max(5000),
      image: z.string().max(15000000).optional(),
      title: z.string().trim().max(160).optional(),
      type: z.enum(['default', 'presentation']).optional(),
      presentationId: z.string().trim().max(160).optional(),
      mentionedEventId: z.string().uuid().optional().nullable(),
      speakerIds: z.array(z.string().uuid()).max(20).optional(),
    }).parse(req.body);

    let post;
    if (data.type === 'presentation') {
      post = await repo.createPresentation(req.auth.sub, {
        title: data.title || data.content.slice(0, 160),
        description: data.content,
        image: data.image,
        presentationId: data.presentationId,
        speakerIds: data.speakerIds || [],
      });
    } else {
      post = await repo.createPost(req.auth.sub, data);
    }

    await repo.addHistory(req.auth.sub, {
      type: data.type === 'presentation' ? 'presentation' : 'post',
      title: data.type === 'presentation' ? 'Criou uma apresentação' : 'Publicou uma atualização',
      subtitle: (data.title || data.content).slice(0, 120),
    });
    res.status(201).json({ data: post });
  } catch (e) { next(e); }
});

app.put('/posts/:id', requireAuth, async (req, res, next) => {
  try {
    const data = z.object({
      title: z.string().trim().max(160).optional(),
      content: z.string().trim().min(1).max(5000).optional(),
      image: z.string().max(15000000).optional().nullable(),
      mentionedEventId: z.string().uuid().optional().nullable(),
    }).parse(req.body);

    const updated = await repo.updatePost(req.auth.sub, req.params.id, data);
    res.json({ data: updated });
  } catch (e) { next(e); }
});

// --- COMMENTS ROUTES ---
app.get('/posts/:id/comments', requireAuth, async (req, res, next) => {
  try { res.json({ data: await repo.listComments(req.params.id) }); } catch (e) { next(e); }
});

app.post('/posts/:id/comments', requireAuth, async (req, res, next) => {
  try {
    const data = z.object({
      content: z.string().trim().min(1).max(2000),
    }).parse(req.body);

    const comment = await repo.createComment(req.auth.sub, { postId: req.params.id, content: data.content });
    res.status(201).json({ data: comment });
  } catch (e) { next(e); }
});

app.get('/events/:id/comments', requireAuth, async (req, res, next) => {
  try { res.json({ data: await repo.listComments(req.params.id) }); } catch (e) { next(e); }
});

app.post('/events/:id/comments', requireAuth, async (req, res, next) => {
  try {
    const data = z.object({
      content: z.string().trim().min(1).max(2000),
    }).parse(req.body);

    const comment = await repo.createComment(req.auth.sub, { eventId: req.params.id, content: data.content });
    res.status(201).json({ data: comment });
  } catch (e) { next(e); }
});

app.delete('/comments/:id', requireAuth, async (req, res, next) => {
  try {
    const deleted = await repo.deleteComment(req.auth.sub, req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Comentário não encontrado ou sem permissão.' });
    res.json({ data: { deleted: true } });
  } catch (e) { next(e); }
});

app.post('/posts/:id/like', requireAuth, async (req, res, next) => {
  try { res.json({ data: await repo.toggleLike(req.auth.sub, req.params.id) }); } catch (e) { next(e); }
});

app.post('/posts/:id/save', requireAuth, async (req, res, next) => {
  try {
    const saved = await repo.toggleSave(req.auth.sub, req.params.id);
    res.json({ data: { saved } });
  } catch (e) { next(e); }
});

app.post('/events/:id/save', requireAuth, async (req, res, next) => {
  try {
    const saved = await repo.toggleSaveEvent(req.auth.sub, req.params.id);
    res.json({ data: { saved } });
  } catch (e) { next(e); }
});

app.post('/posts/:id/favorite', requireAuth, async (req, res, next) => {
  try { res.json({ data: { favorite: await repo.toggleFavorite(req.auth.sub, req.params.id) } }); } catch (e) { next(e); }
});

app.delete('/posts/:id', requireAuth, async (req, res, next) => {
  try {
    const deleted = await repo.deleteOwnPost(req.auth.sub, req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Publicação não encontrada ou sem permissão.' });
    await repo.addHistory(req.auth.sub, { type: 'post_deleted', title: 'Excluiu uma publicação', subtitle: req.params.id });
    res.json({ data: { deleted: true } });
  } catch (e) { next(e); }
});

app.get('/favorites', requireAuth, async (req, res, next) => {
  try { res.json({ data: await repo.listFavorites(req.auth.sub) }); } catch (e) { next(e); }
});

app.get('/saves', requireAuth, async (req, res, next) => {
  try { res.json({ data: await repo.listSaved(req.auth.sub) }); } catch (e) { next(e); }
});

app.get('/history', requireAuth, async (req, res, next) => {
  try { res.json({ data: await repo.listHistory(req.auth.sub) }); } catch (e) { next(e); }
});

app.post('/content', requireAuth, async (req, res, next) => {
  try {
    const raw = z.object({
      mode: z.enum(['event', 'live', 'post', 'presentation']),
      title: z.string().trim().min(1).max(160),
      description: z.string().max(5000).optional(),
      image: z.string().max(15000000).optional(),
      eventDate: z.string().optional(),
      eventTime: z.string().optional(),
      eventEndTime: z.string().optional(),
      location: z.string().max(255).optional(),
      presentationId: z.string().trim().max(160).optional(),
      mentionedEventId: z.string().uuid().optional().nullable(),
      speakerIds: z.array(z.string().uuid()).max(20).optional(),
    }).parse(req.body);

    const payload = {
      ...raw,
      eventDate: normalizeDate(raw.eventDate),
      eventTime: normalizeTime(raw.eventTime),
      eventEndTime: normalizeTime(raw.eventEndTime),
    };

    const item = await repo.createContent(req.auth.sub, payload.mode, payload);
    await repo.addHistory(req.auth.sub, {
      type: payload.mode,
      title: payload.mode === 'event' ? 'Criou um evento' : payload.mode === 'live' ? 'Abriu uma sala ao vivo' : 'Criou conteúdo',
      subtitle: payload.title,
    });
    res.status(201).json({ data: item });
  } catch (e) { next(e); }
});

app.get('/posts/mine', requireAuth, async (req, res, next) => {
  try { res.json({ data: await repo.listUserPosts(req.auth.sub) }); } catch (e) { next(e); }
});

// --- EVENT PARTICIPATION & MANAGEMENT ---
app.get('/events/mine', requireAuth, async (req, res, next) => {
  try { res.json({ data: await repo.listEvents(req.auth.sub) }); } catch (e) { next(e); }
});

app.post('/events/:id/participate', requireAuth, async (req, res, next) => {
  try {
    const result = await repo.toggleEventParticipation(req.auth.sub, req.params.id);
    res.json({ data: result });
  } catch (e) { next(e); }
});

app.get('/events/:id/participants', requireAuth, async (req, res, next) => {
  try {
    const participants = await repo.listEventParticipants(req.params.id);
    res.json({ data: participants });
  } catch (e) { next(e); }
});

app.get('/events/:id', requireAuth, async (req, res, next) => {
  try {
    const event = await repo.getEventById(req.params.id, req.auth.sub);
    if (!event) return res.status(404).json({ message: 'Evento não encontrado.' });
    res.json({ data: event });
  } catch (e) { next(e); }
});

app.put('/events/:id', requireAuth, async (req, res, next) => {
  try {
    const raw = z.object({
      title: z.string().trim().min(1).max(160).optional(),
      description: z.string().max(5000).optional(),
      image: z.string().max(15000000).optional().nullable(),
      eventDate: z.string().optional(),
      eventTime: z.string().optional(),
      eventEndTime: z.string().optional(),
      location: z.string().max(255).optional(),
    }).parse(req.body);

    const payload = {
      ...raw,
      eventDate: raw.eventDate !== undefined ? normalizeDate(raw.eventDate) : undefined,
      eventTime: raw.eventTime !== undefined ? normalizeTime(raw.eventTime) : undefined,
      eventEndTime: raw.eventEndTime !== undefined ? normalizeTime(raw.eventEndTime) : undefined,
    };

    const updated = await repo.updateEvent(req.auth.sub, req.params.id, payload);
    res.json({ data: updated });
  } catch (e) { next(e); }
});

app.delete('/events/:id', requireAuth, async (req, res, next) => {
  try {
    const deleted = await repo.deleteOwnEvent(req.auth.sub, req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Evento não encontrado ou sem permissão.' });
    await repo.addHistory(req.auth.sub, { type: 'event_deleted', title: 'Excluiu um evento', subtitle: req.params.id });
    res.json({ data: { deleted: true } });
  } catch (e) { next(e); }
});

// --- RATINGS ---
app.get('/ratings/available', requireAuth, async (req, res, next) => {
  try {
    res.json({ data: await repo.listAvailablePresentations(req.auth.sub) });
  } catch (e) { next(e); }
});

app.post('/ratings/presentations', requireAuth, async (req, res, next) => {
  try {
    const data = z.object({
      postId: z.string().uuid().optional().or(z.literal('')).transform(v => v || undefined),
      presentationId: z.string().trim().min(1).max(160).optional().or(z.literal('')).transform(v => v || undefined),
      stars: z.coerce.number().min(1).max(5),
      speakerId: z.string().uuid().optional().or(z.literal('')).transform(v => v || undefined),
      includeSpeakerSkills: z.boolean().optional(),
      skills: z.object({
        clarity: z.coerce.number().min(0).max(99).optional(),
        content: z.coerce.number().min(0).max(99).optional(),
        engagement: z.coerce.number().min(0).max(99).optional(),
        storytelling: z.coerce.number().min(0).max(99).optional(),
        timing: z.coerce.number().min(0).max(99).optional(),
        visuals: z.coerce.number().min(0).max(99).optional(),
      }).optional(),
      comment: z.string().max(1000).optional(),
    }).refine(v => v.postId || v.presentationId, { message: 'Apresentação não informada.' });

    const rating = await repo.createRating(req.auth.sub, data);
    res.status(201).json({ data: rating });
  } catch (e) { next(e); }
});

app.get('/ratings/speakers/:speakerId', requireAuth, async (req, res, next) => {
  try { res.json({ data: await repo.getSpeakerRatingSummary(req.params.speakerId) }); } catch (e) { next(e); }
});

app.get('/settings', requireAuth, async (req, res, next) => {
  try { res.json({ data: await repo.listSettings(req.auth.sub) }); } catch (e) { next(e); }
});

app.put('/settings', requireAuth, async (req, res, next) => {
  try {
    const d = z.object({
      notificationsEnabled: z.boolean().optional(),
      darkMode: z.boolean().optional(),
    }).parse(req.body);
    res.json({ data: await repo.updateSettings(req.auth.sub, d) });
  } catch (e) { next(e); }
});

app.use((err, _req, res, _next) => {
  if (err instanceof z.ZodError) return res.status(400).json({ message: 'Dados inválidos.', details: err.issues });
  if (err.code === 'SELF_RATING') return res.status(400).json({ message: err.message });
  if (err.code === 'SPEAKER_NOT_LINKED') return res.status(400).json({ message: err.message });
  if (err.code === 'PRESENTATION_REQUIRED') return res.status(400).json({ message: err.message });
  if (err.code === 'FORBIDDEN') return res.status(403).json({ message: err.message });
  if (err.code === '23505') return res.status(409).json({ message: 'Registro duplicado.' });
  if (err.code === '23503') return res.status(404).json({ message: err.message || 'Registro relacionado não encontrado.' });
  console.error(err);
  res.status(500).json({ message: err.message || 'Erro interno do servidor.' });
});

export { app };
