import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { requireAdmin } from '../auth.js';

const accountType = z.enum(['user', 'admin']);

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(128),
  accountType: accountType.default('user'),
  role: z.string().trim().max(80).optional(),
  city: z.string().trim().max(120).optional(),
  bio: z.string().max(1000).optional(),
});

const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().max(255).optional(),
  accountType: accountType.optional(),
  role: z.string().trim().max(80).optional(),
  city: z.string().trim().max(120).optional(),
  bio: z.string().max(1000).optional(),
}).strict();

// Caso de uso #012 Manter Usuários (somente administradores).
export function registerAdminRoutes(app, { repo, adminRepo, moderation, requireAuth }) {
  const guard = [requireAuth, requireAdmin];

  app.get('/admin/users', ...guard, async (req, res, next) => {
    try {
      const { q = '', status = 'all', type = 'all' } = req.query;
      const safeStatus = ['all', 'active', 'deactivated'].includes(status) ? status : 'all';
      const safeType = ['all', 'user', 'admin'].includes(type) ? type : 'all';
      res.json({ data: await adminRepo.listUsers({ q, status: safeStatus, type: safeType }) });
    } catch (e) { next(e); }
  });

  app.get('/admin/users/:id', ...guard, async (req, res, next) => {
    try {
      const user = await adminRepo.getUser(req.params.id);
      if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });
      res.json({ data: user });
    } catch (e) { next(e); }
  });

  app.post('/admin/users', ...guard, async (req, res, next) => {
    try {
      const data = createUserSchema.parse(req.body);
      if (await adminRepo.findByEmail(data.email)) return res.status(409).json({ message: 'E-mail já cadastrado.' });
      const created = await repo.createUser({
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash: await bcrypt.hash(data.password, 12),
        role: data.role,
        city: data.city,
        bio: data.bio,
      });
      if (data.accountType === 'admin') await adminRepo.setAccountType(created.id, 'admin');
      await repo.updateSettings(created.id, {});
      await adminRepo.logAction(req.auth.sub, { action: 'user_created', targetType: 'user', targetId: created.id, note: data.accountType === 'admin' ? 'Criado como administrador' : '' });
      res.status(201).json({ data: await adminRepo.getUser(created.id) });
    } catch (e) { next(e); }
  });

  app.put('/admin/users/:id', ...guard, async (req, res, next) => {
    try {
      const data = updateUserSchema.parse(req.body);
      const current = await repo.getAccount(req.params.id);
      if (!current) return res.status(404).json({ message: 'Usuário não encontrado.' });
      if (data.email && (await adminRepo.findByEmail(data.email, req.params.id))) {
        return res.status(409).json({ message: 'E-mail já cadastrado.' });
      }
      const demoting = current.account_type === 'admin' && data.accountType === 'user';
      if (demoting && current.status === 'active' && (await adminRepo.countActiveAdmins()) <= 1) {
        return res.status(400).json({ message: 'Não é possível remover o único administrador ativo.' });
      }
      await adminRepo.updateAccount(req.params.id, { name: data.name, email: data.email, accountType: data.accountType });
      await repo.updateUser(req.params.id, { role: data.role, city: data.city, bio: data.bio });
      const changes = Object.keys(data).join(', ');
      await adminRepo.logAction(req.auth.sub, { action: 'user_updated', targetType: 'user', targetId: req.params.id, note: `Campos: ${changes}` });
      if (data.accountType && data.accountType !== current.account_type) {
        await adminRepo.logAction(req.auth.sub, { action: data.accountType === 'admin' ? 'user_promoted' : 'user_demoted', targetType: 'user', targetId: req.params.id });
      }
      res.json({ data: await adminRepo.getUser(req.params.id) });
    } catch (e) { next(e); }
  });

  app.post('/admin/users/:id/deactivate', ...guard, async (req, res, next) => {
    try {
      const { reason } = z.object({ reason: z.string().trim().max(255).optional() }).parse(req.body || {});
      await moderation.deactivateUser(req.auth.sub, { userId: req.params.id, reason });
      res.json({ data: await adminRepo.getUser(req.params.id) });
    } catch (e) { next(e); }
  });

  app.post('/admin/users/:id/reactivate', ...guard, async (req, res, next) => {
    try {
      const { note } = z.object({ note: z.string().trim().max(255).optional() }).parse(req.body || {});
      await moderation.reactivateUser(req.auth.sub, { userId: req.params.id, note });
      res.json({ data: await adminRepo.getUser(req.params.id) });
    } catch (e) { next(e); }
  });

  app.get('/admin/actions', ...guard, async (req, res, next) => {
    try { res.json({ data: await adminRepo.listActions({ limit: req.query.limit }) }); } catch (e) { next(e); }
  });
}
