import { describe, expect, it, beforeEach } from 'vitest';
import request from 'supertest';
import { auth, createTestApp, signup } from './helpers.js';

async function makeAdmin(db, userId) {
  await db.query(`UPDATE users SET account_type='admin' WHERE id=$1`, [userId]);
}

describe('Administrador: Manter Usuários e moderação de conteúdo', () => {
  let app, db, admin, member;
  beforeEach(async () => {
    ({ app, db } = await createTestApp());
    admin = await signup(app, { name: 'Admin Geral', email: 'admin@example.com' });
    member = await signup(app, { name: 'Membro Comum', email: 'membro@example.com' });
    await makeAdmin(db, admin.user.id);
  });

  it('usuário comum não acessa as rotas de administração', async () => {
    const res = await request(app).get('/admin/users').set(auth(member.token));
    expect(res.status).toBe(403);
  });

  it('admin lista, busca e vê detalhes de usuários', async () => {
    const list = await request(app).get('/admin/users?q=Membro').set(auth(admin.token));
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].email).toBe('membro@example.com');

    const detail = await request(app).get(`/admin/users/${member.user.id}`).set(auth(admin.token));
    expect(detail.body.data.account_type).toBe('user');
    expect(detail.body.data.status).toBe('active');
  });

  it('admin cria usuário, recusa e-mail repetido e edita conta e perfil', async () => {
    const created = await request(app).post('/admin/users').set(auth(admin.token))
      .send({ name: 'Nova Pessoa', email: 'nova@example.com', password: 'abc12345', role: 'Palestrante' });
    expect(created.status).toBe(201);
    expect(created.body.data.role).toBe('Palestrante');

    const dup = await request(app).post('/admin/users').set(auth(admin.token))
      .send({ name: 'Outra', email: 'nova@example.com', password: 'abc12345' });
    expect(dup.status).toBe(409);

    const edited = await request(app).put(`/admin/users/${created.body.data.id}`).set(auth(admin.token))
      .send({ name: 'Nova Pessoa Editada', accountType: 'admin', city: 'Mogi - SP' });
    expect(edited.status).toBe(200);
    expect(edited.body.data.account_type).toBe('admin');
    expect(edited.body.data.city).toBe('Mogi - SP');
    expect(edited.body.data.actions.some((a) => a.action === 'user_promoted')).toBe(true);

    const login = await request(app).post('/auth/login').send({ email: 'nova@example.com', password: 'abc12345' });
    expect(login.status).toBe(200);
  });

  it('admin desativa e reativa uma conta, com registro e aviso', async () => {
    const off = await request(app).post(`/admin/users/${member.user.id}/deactivate`).set(auth(admin.token)).send({ reason: 'Spam' });
    expect(off.status).toBe(200);
    expect(off.body.data.status).toBe('deactivated');
    const blocked = await request(app).post('/auth/login').send({ email: 'membro@example.com', password: 'senha123' });
    expect(blocked.status).toBe(403);

    const on = await request(app).post(`/admin/users/${member.user.id}/reactivate`).set(auth(admin.token)).send({});
    expect(on.body.data.status).toBe('active');
    expect(on.body.data.actions.map((a) => a.action).includes('user_deactivated')).toBe(true);
    const ok = await request(app).post('/auth/login').send({ email: 'membro@example.com', password: 'senha123' });
    expect(ok.status).toBe(200);
  });

  it('não deixa remover ou desativar o único administrador', async () => {
    const self = await request(app).post(`/admin/users/${admin.user.id}/deactivate`).set(auth(admin.token)).send({});
    expect(self.status).toBe(400);
    const demote = await request(app).put(`/admin/users/${admin.user.id}`).set(auth(admin.token)).send({ accountType: 'user' });
    expect(demote.status).toBe(400);
  });

  it('admin exclui post e evento de outra pessoa e o autor é avisado', async () => {
    const post = await request(app).post('/posts').set(auth(member.token)).send({ content: 'Conteúdo impróprio' });
    const notOwner = await signup(app, { name: 'Terceiro', email: 'terceiro@example.com' });
    const denied = await request(app).delete(`/posts/${post.body.data.id}`).set(auth(notOwner.token));
    expect(denied.status).toBe(404);

    const removed = await request(app).delete(`/posts/${post.body.data.id}`).set(auth(admin.token)).send({ reason: 'Ofensivo' });
    expect(removed.status).toBe(200);
    expect(removed.body.data.moderated).toBe(true);

    const notes = await request(app).get('/notifications').set(auth(member.token));
    expect(notes.body.data.some((n) => n.title.includes('foi removida'))).toBe(true);

    const actions = await request(app).get('/admin/actions').set(auth(admin.token));
    expect(actions.body.data.some((a) => a.action === 'post_removed')).toBe(true);
  });
});
