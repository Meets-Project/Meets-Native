import { z } from 'zod';
import { requireAdmin } from '../auth.js';
import { REPORT_ACTIONS, REPORT_REASONS } from '../reportsRepository.js';

const REASON_LABELS = {
  spam: 'Spam',
  ofensivo: 'Conteúdo ofensivo',
  assedio: 'Assédio',
  falso: 'Informação falsa',
  improprio: 'Conteúdo impróprio',
  outro: 'Outro motivo',
};

const createSchema = z.object({
  targetType: z.enum(['post', 'event', 'user']),
  targetId: z.string().uuid(),
  reason: z.enum(REPORT_REASONS),
  details: z.string().trim().max(1000).optional(),
});

const decideSchema = z.object({
  decision: z.enum(['dismissed', 'upheld']),
  action: z.enum(REPORT_ACTIONS).optional(),
  note: z.string().trim().max(1000).optional(),
}).refine((d) => d.decision === 'dismissed' || d.action, { message: 'Escolha a ação de moderação para uma denúncia procedente.' });

// Denunciar (qualquer usuário) e #013 Analisar Denúncias (administradores).
export function registerReportRoutes(app, { repo, reportsRepo, moderation, adminRepo, requireAuth }) {
  app.post('/reports', requireAuth, async (req, res, next) => {
    try {
      const data = createSchema.parse(req.body);
      const target = await reportsRepo.describeTarget(data.targetType, data.targetId);
      if (!target) return res.status(404).json({ message: 'Conteúdo não encontrado.' });
      if (target.owner_id === req.auth.sub) return res.status(400).json({ message: 'Você não pode denunciar o seu próprio conteúdo.' });
      if (await reportsRepo.findOpenByReporter(req.auth.sub, data.targetType, data.targetId)) {
        return res.status(409).json({ message: 'Você já denunciou isto. A moderação está analisando.' });
      }
      const report = await reportsRepo.create({
        reporterId: req.auth.sub,
        targetType: data.targetType,
        targetId: data.targetId,
        ownerId: target.owner_id,
        preview: target.preview,
        reason: data.reason,
        details: data.details,
      });
      await repo.addHistory(req.auth.sub, { type: 'report', title: 'Enviou uma denúncia', subtitle: REASON_LABELS[data.reason] });
      for (const adminId of await reportsRepo.listAdminIds()) {
        if (adminId === req.auth.sub) continue;
        await repo.createNotification(adminId, {
          title: 'Nova denúncia para analisar',
          body: `${REASON_LABELS[data.reason]}: ${String(target.preview || '').slice(0, 100)}`,
          targetType: 'report',
          targetId: report.id,
        });
      }
      res.status(201).json({ data: report });
    } catch (e) { next(e); }
  });

  const guard = [requireAuth, requireAdmin];

  app.get('/admin/reports', ...guard, async (req, res, next) => {
    try { res.json({ data: await reportsRepo.list({ status: String(req.query.status || 'open') }) }); } catch (e) { next(e); }
  });

  app.get('/admin/reports/:id', ...guard, async (req, res, next) => {
    try {
      const report = await reportsRepo.get(req.params.id);
      if (!report) return res.status(404).json({ message: 'Denúncia não encontrada.' });
      const live = await reportsRepo.describeTarget(report.target_type, report.target_id);
      const others = await reportsRepo.listForTarget(report.target_type, report.target_id, report.id);
      res.json({ data: { ...report, target_exists: Boolean(live), target_current_preview: live?.preview || null, other_reports: others } });
    } catch (e) { next(e); }
  });

  // Pendente -> Em análise.
  app.post('/admin/reports/:id/start', ...guard, async (req, res, next) => {
    try {
      const report = await reportsRepo.get(req.params.id);
      if (!report) return res.status(404).json({ message: 'Denúncia não encontrada.' });
      if (report.status === 'pending') await reportsRepo.startReview(report.id, req.auth.sub);
      res.json({ data: await reportsRepo.get(report.id) });
    } catch (e) { next(e); }
  });

  // Em análise -> Improcedente ou Procedente (com ação de moderação).
  app.post('/admin/reports/:id/decide', ...guard, async (req, res, next) => {
    try {
      const data = decideSchema.parse(req.body);
      const report = await reportsRepo.get(req.params.id);
      if (!report) return res.status(404).json({ message: 'Denúncia não encontrada.' });
      if (!['pending', 'in_review'].includes(report.status)) {
        return res.status(409).json({ message: 'Esta denúncia já foi analisada.', data: report });
      }
      const action = data.decision === 'upheld' ? data.action : null;
      if (action === 'remove_content' && report.target_type === 'user') {
        return res.status(400).json({ message: 'Para denúncia de usuário, escolha advertir ou desativar a conta.' });
      }
      if (action === 'remove_content' && !(await reportsRepo.describeTarget(report.target_type, report.target_id))) {
        return res.status(400).json({ message: 'O conteúdo já não existe. Escolha outra ação ou marque como improcedente.' });
      }
      if (action === 'deactivate_user' && !report.target_owner_id) {
        return res.status(400).json({ message: 'Não foi possível identificar o autor.' });
      }

      const note = data.note || '';
      if (action === 'remove_content') {
        await moderation.removeContent(req.auth.sub, { type: report.target_type, id: report.target_id, reason: note || REASON_LABELS[report.reason] });
      } else if (action === 'warn_author') {
        await moderation.warnUser(req.auth.sub, { userId: report.target_owner_id, reason: note || REASON_LABELS[report.reason] });
      } else if (action === 'deactivate_user') {
        await moderation.deactivateUser(req.auth.sub, { userId: report.target_owner_id, reason: note || REASON_LABELS[report.reason] });
      }

      await reportsRepo.decide(report.id, { adminId: req.auth.sub, status: data.decision, action, note });
      await adminRepo.logAction(req.auth.sub, {
        action: data.decision === 'upheld' ? 'report_upheld' : 'report_dismissed',
        targetType: 'report',
        targetId: report.id,
        note: [action, note].filter(Boolean).join(' · '),
      });

      // Conteúdo removido ou conta desativada resolvem as demais denúncias abertas sobre o mesmo alvo.
      let closedTogether = [];
      if (action === 'remove_content' || action === 'deactivate_user') {
        closedTogether = await reportsRepo.closeOthersOnTarget(report.target_type, report.target_id, report.id, {
          adminId: req.auth.sub, status: 'upheld', action, note: `Resolvida junto com outra denúncia. ${note}`.trim(),
        });
      }

      const reporters = [report.reporter_id, ...closedTogether.map((r) => r.reporter_id)].filter(Boolean);
      for (const reporterId of [...new Set(reporters)]) {
        await repo.createNotification(reporterId, {
          title: 'Sua denúncia foi analisada',
          body: data.decision === 'upheld'
            ? 'A moderação considerou a denúncia procedente e tomou uma providência. Obrigado por avisar.'
            : 'A moderação analisou e não encontrou violação das regras da comunidade.',
        });
      }

      res.json({ data: { ...(await reportsRepo.get(report.id)), closed_together: closedTogether.length } });
    } catch (e) { next(e); }
  });
}
