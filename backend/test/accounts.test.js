import { describe, expect, it, beforeEach } from 'vitest';
import request from 'supertest';
import { makeRepository } from '../src/repository.js';
import { auth, createTestApp, signup } from './helpers.js';

describe('Conta: troca de senha e desativação', () => {
  let app, db, repo;
  beforeEach(async () => {
    ({ app, db } = await createTestApp());
    repo = makeRepository(db);
  });

  it('troca a senha só com a senha atual correta', async () => {
    const { token } = await signup(app);
    const wrong = await request(app).put('/users/me/password').set(auth(token)).send({ currentPassword: 'errada', newPassword: 'novaSenha1' });
    expect(wrong.status).toBe(400);

    const ok = await request(app).put('/users/me/password').set(auth(token)).send({ currentPassword: 'senha123', newPassword: 'novaSenha1' });
    expect(ok.status).toBe(200);

    const oldLogin = await request(app).post('/auth/login').send({ email: 'pessoa@example.com', password: 'senha123' });
    expect(oldLogin.status).toBe(401);
    const newLogin = await request(app).post('/auth/login').send({ email: 'pessoa@example.com', password: 'novaSenha1' });
    expect(newLogin.status).toBe(200);
  });

  it('desativar a conta exige a senha, bloqueia login e sessão e mantém os dados', async () => {
    const { token, user } = await signup(app);
    const bad = await request(app).post('/users/me/deactivate').set(auth(token)).send({ password: 'errada' });
    expect(bad.status).toBe(400);

    const res = await request(app).post('/users/me/deactivate').set(auth(token)).send({ password: 'senha123' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('deactivated');

    const session = await request(app).get('/users/me').set(auth(token));
    expect(session.status).toBe(401);
    expect(session.body.code).toBe('ACCOUNT_DEACTIVATED');

    const login = await request(app).post('/auth/login').send({ email: 'pessoa@example.com', password: 'senha123' });
    expect(login.status).toBe(403);
    expect(login.body.code).toBe('ACCOUNT_DEACTIVATED');

    const account = await repo.getAccount(user.id);
    expect(account.email).toBe('pessoa@example.com');
  });

  it('conteúdo de conta desativada some do feed e da busca, e volta ao reativar', async () => {
    const a = await signup(app, { email: 'a@example.com' });
    const b = await signup(app, { name: 'Bruno Leitor', email: 'b@example.com' });
    const post = await request(app).post('/posts').set(auth(a.token)).send({ content: 'Post visível da Ana' });
    expect(post.status).toBe(201);

    await request(app).post('/users/me/deactivate').set(auth(a.token)).send({ password: 'senha123' });

    const feed = await request(app).get('/feed').set(auth(b.token));
    expect(feed.body.data.some((i) => i.id === post.body.data.id)).toBe(false);
    const search = await request(app).get('/search?q=Ana').set(auth(b.token));
    expect(search.body.data.length).toBe(0);
    const like = await request(app).post(`/posts/${post.body.data.id}/like`).set(auth(b.token));
    expect(like.status).toBe(403);

    await repo.reactivateUser(a.user.id);
    const feedAgain = await request(app).get('/feed').set(auth(b.token));
    expect(feedAgain.body.data.some((i) => i.id === post.body.data.id)).toBe(true);
  });

  it('o único administrador ativo não pode desativar a própria conta', async () => {
    const { token, user } = await signup(app);
    await db.query(`UPDATE users SET account_type='admin' WHERE id=$1`, [user.id]);
    const res = await request(app).post('/users/me/deactivate').set(auth(token)).send({ password: 'senha123' });
    expect(res.status).toBe(400);
  });
});

describe('Preferência de notificações', () => {
  it('com notificações desligadas, avisos comuns não chegam, mas os de moderação sim', async () => {
    const { app, db } = await createTestApp();
    const repo = makeRepository(db);
    const a = await signup(app, { email: 'a@example.com' });
    const b = await signup(app, { email: 'b@example.com' });
    await request(app).put('/settings').set(auth(a.token)).send({ notificationsEnabled: false });
    await request(app).post(`/users/${a.user.id}/connect`).set(auth(b.token));
    await repo.createNotification(a.user.id, { title: 'Moderação', body: 'x', essential: true });
    const notes = await request(app).get('/notifications').set(auth(a.token));
    expect(notes.body.data.some((n) => n.title.includes('Nova conexão'))).toBe(false);
    expect(notes.body.data.some((n) => n.title === 'Moderação')).toBe(true);
  });
});
