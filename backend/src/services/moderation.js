// Ações de moderação usadas por Manter Usuários e por Analisar Denúncias.
// Cada ação é registrada em admin_actions e o usuário afetado é avisado por notificação.

export class ModerationError extends Error {
  constructor(message, code = 'MODERATION_INVALID', status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function makeModeration({ repo, adminRepo }) {
  const kindLabel = { post: 'publicação', event: 'evento' };

  async function removeContent(adminId, { type, id, reason = '' }) {
    const item = type === 'event' ? await adminRepo.getEvent(id) : await adminRepo.getPost(id);
    if (!item) throw new ModerationError('Conteúdo não encontrado.', 'NOT_FOUND', 404);
    const removed = type === 'event' ? await adminRepo.deleteEvent(id) : await adminRepo.deletePost(id);
    const title = String(item.title || item.content || item.description || '').slice(0, 80);
    await adminRepo.logAction(adminId, { action: type === 'event' ? 'event_removed' : 'post_removed', targetType: type, targetId: id, note: reason || title });
    if (item.author_id && item.author_id !== adminId) {
      await repo.createNotification(item.author_id, {
        title: `Sua ${kindLabel[type] || 'publicação'} foi removida`,
        body: `Um administrador removeu "${title}".${reason ? ` Motivo: ${reason}` : ''}`,
        essential: true,
      });
    }
    return { removed, authorId: item.author_id, title };
  }

  async function warnUser(adminId, { userId, reason = '' }) {
    await repo.createNotification(userId, {
      title: 'Advertência da moderação',
      body: reason ? `Um administrador enviou uma advertência: ${reason}` : 'Um administrador enviou uma advertência sobre um conteúdo seu.',
      essential: true,
    });
    await adminRepo.logAction(adminId, { action: 'user_warned', targetType: 'user', targetId: userId, note: reason });
  }

  async function deactivateUser(adminId, { userId, reason = '' }) {
    if (userId === adminId) throw new ModerationError('Para desativar a sua própria conta, use Configurações.');
    const account = await repo.getAccount(userId);
    if (!account) throw new ModerationError('Usuário não encontrado.', 'NOT_FOUND', 404);
    if (account.status === 'deactivated') return account;
    if (account.account_type === 'admin' && (await adminRepo.countActiveAdmins()) <= 1) {
      throw new ModerationError('Não é possível desativar o único administrador ativo.');
    }
    const result = await repo.deactivateUser(userId, { by: adminId, reason: reason || 'Desativada por um administrador' });
    await adminRepo.logAction(adminId, { action: 'user_deactivated', targetType: 'user', targetId: userId, note: reason });
    return result;
  }

  async function reactivateUser(adminId, { userId, note = '' }) {
    const account = await repo.getAccount(userId);
    if (!account) throw new ModerationError('Usuário não encontrado.', 'NOT_FOUND', 404);
    const result = await repo.reactivateUser(userId);
    await adminRepo.logAction(adminId, { action: 'user_reactivated', targetType: 'user', targetId: userId, note });
    await repo.createNotification(userId, { title: 'Conta reativada', body: 'Um administrador reativou a sua conta no Meets.', essential: true });
    return result;
  }

  return { removeContent, warnUser, deactivateUser, reactivateUser };
}
