import { describe, expect, it, beforeEach } from 'vitest';
import request from 'supertest';
import { auth, createTestApp, signup } from './helpers.js';

describe('API: cadastro, login e perfil', () => {
  let app, db;
  beforeEach(async () => {
    ({ app, db } = await createTestApp());
  });

  it('cadastra, entra e lê o próprio perfil', async () => {
    const { res, token } = await signup(app);
    expect(res.status).toBe(201);
    expect(token).toBeTruthy();

    const login = await request(app).post('/auth/login').send({ email: 'pessoa@example.com', password: 'senha123' });
    expect(login.status).toBe(200);

    const me = await request(app).get('/users/me').set('Authorization', `Bearer ${login.body.data.token}`);
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe('pessoa@example.com');
  });

  it('recusa rota protegida sem token', async () => {
    const res = await request(app).get('/users/me');
    expect(res.status).toBe(401);
  });
});

describe('Compartilhamentos', () => {
  let app;
  beforeEach(async () => {
    ({ app } = await createTestApp());
  });

  it('registra o compartilhamento e o feed mostra a contagem', async () => {
    const a = await signup(app, { email: 'a@example.com' });
    const b = await signup(app, { email: 'b@example.com' });
    const post = (await request(app).post('/posts').set(auth(a.token)).send({ content: 'Compartilhe' })).body.data;
    const first = await request(app).post('/shares').set(auth(b.token)).send({ contentType: 'post', contentId: post.id });
    expect(first.status).toBe(201);
    await request(app).post('/shares').set(auth(a.token)).send({ contentType: 'presentation', contentId: post.id });
    const feed = await request(app).get('/feed').set(auth(b.token));
    expect(feed.body.data.find((i) => i.id === post.id).shares_count).toBe(2);
  });

  it('não registra compartilhamento de conteúdo privado que a pessoa não vê', async () => {
    const a = await signup(app, { email: 'a@example.com' });
    const b = await signup(app, { email: 'b@example.com' });
    const post = (await request(app).post('/posts').set(auth(a.token)).send({ content: 'Só seguidores', visibility: 'followers' })).body.data;
    const res = await request(app).post('/shares').set(auth(b.token)).send({ contentType: 'post', contentId: post.id });
    expect(res.status).toBe(403);
  });
});

describe('Salas ao vivo removidas', () => {
  it('a API não aceita mais criar sala ao vivo e a tabela não existe', async () => {
    const { app, db } = await createTestApp();
    const { token } = await signup(app);
    const res = await request(app).post('/content').set(auth(token)).send({ mode: 'live', title: 'Sala' });
    expect(res.status).toBe(400);
    const table = await db.query(`SELECT to_regclass('live_rooms') AS t`);
    expect(table.rows[0].t).toBeNull();
  });
});
