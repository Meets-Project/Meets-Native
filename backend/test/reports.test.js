import { describe, expect, it, beforeEach } from 'vitest';
import request from 'supertest';
import { auth, createTestApp, signup } from './helpers.js';

describe('Denúncias (#013 Analisar Denúncias)', () => {
  let app, db, admin, author, reporter, post;
  beforeEach(async () => {
    ({ app, db } = await createTestApp());
    admin = await signup(app, { name: 'Admin', email: 'admin@example.com' });
    author = await signup(app, { name: 'Autor', email: 'autor@example.com' });
    reporter = await signup(app, { name: 'Leitor', email: 'leitor@example.com' });
    await db.query(`UPDATE users SET account_type='admin' WHERE id=$1`, [admin.user.id]);
    post = (await request(app).post('/posts').set(auth(author.token)).send({ content: 'Texto ofensivo' })).body.data;
  });

  const report = (token, body) => request(app).post('/reports').set(auth(token)).send(body);

  it('usuário denuncia; não denuncia o próprio conteúdo nem repete enquanto está aberta', async () => {
    const own = await report(author.token, { targetType: 'post', targetId: post.id, reason: 'ofensivo' });
    expect(own.status).toBe(400);
    const ok = await report(reporter.token, { targetType: 'post', targetId: post.id, reason: 'ofensivo', details: 'Xingamentos' });
    expect(ok.status).toBe(201);
    expect(ok.body.data.status).toBe('pending');
    const again = await report(reporter.token, { targetType: 'post', targetId: post.id, reason: 'spam' });
    expect(again.status).toBe(409);

    const adminNotes = await request(app).get('/notifications').set(auth(admin.token));
    expect(adminNotes.body.data.some((n) => n.title.includes('Nova denúncia'))).toBe(true);
  });

  it('só admin vê a fila de denúncias', async () => {
    await report(reporter.token, { targetType: 'post', targetId: post.id, reason: 'ofensivo' });
    const denied = await request(app).get('/admin/reports').set(auth(reporter.token));
    expect(denied.status).toBe(403);
    const list = await request(app).get('/admin/reports').set(auth(admin.token));
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].reporter_name).toBe('Leitor');
    expect(list.body.data[0].target_owner_name).toBe('Autor');
  });

  it('pendente -> em análise -> improcedente mantém o conteúdo e avisa quem denunciou', async () => {
    const r = (await report(reporter.token, { targetType: 'post', targetId: post.id, reason: 'spam' })).body.data;
    const started = await request(app).post(`/admin/reports/${r.id}/start`).set(auth(admin.token)).send({});
    expect(started.body.data.status).toBe('in_review');

    const decided = await request(app).post(`/admin/reports/${r.id}/decide`).set(auth(admin.token)).send({ decision: 'dismissed', note: 'Sem violação' });
    expect(decided.status).toBe(200);
    expect(decided.body.data.status).toBe('dismissed');

    const feed = await request(app).get('/feed').set(auth(reporter.token));
    expect(feed.body.data.some((i) => i.id === post.id)).toBe(true);
    const notes = await request(app).get('/notifications').set(auth(reporter.token));
    expect(notes.body.data.some((n) => n.title === 'Sua denúncia foi analisada')).toBe(true);

    const again = await request(app).post(`/admin/reports/${r.id}/decide`).set(auth(admin.token)).send({ decision: 'upheld', action: 'warn_author' });
    expect(again.status).toBe(409);
  });

  it('procedente com remoção apaga o conteúdo, avisa o autor e fecha as outras denúncias do mesmo post', async () => {
    const other = await signup(app, { name: 'Outra', email: 'outra@example.com' });
    const r1 = (await report(reporter.token, { targetType: 'post', targetId: post.id, reason: 'ofensivo' })).body.data;
    await report(other.token, { targetType: 'post', targetId: post.id, reason: 'assedio' });

    const noAction = await request(app).post(`/admin/reports/${r1.id}/decide`).set(auth(admin.token)).send({ decision: 'upheld' });
    expect(noAction.status).toBe(400);

    const decided = await request(app).post(`/admin/reports/${r1.id}/decide`).set(auth(admin.token)).send({ decision: 'upheld', action: 'remove_content', note: 'Ofensa' });
    expect(decided.body.data.status).toBe('upheld');
    expect(decided.body.data.action).toBe('remove_content');
    expect(decided.body.data.closed_together).toBe(1);

    const exists = await db.query('SELECT 1 FROM posts WHERE id=$1', [post.id]);
    expect(exists.rows).toHaveLength(0);
    const open = await request(app).get('/admin/reports?status=open').set(auth(admin.token));
    expect(open.body.data).toHaveLength(0);
    const authorNotes = await request(app).get('/notifications').set(auth(author.token));
    expect(authorNotes.body.data.some((n) => n.title.includes('foi removida'))).toBe(true);
  });

  it('denúncia de usuário procedente pode desativar a conta denunciada', async () => {
    const r = (await report(reporter.token, { targetType: 'user', targetId: author.user.id, reason: 'assedio' })).body.data;
    const bad = await request(app).post(`/admin/reports/${r.id}/decide`).set(auth(admin.token)).send({ decision: 'upheld', action: 'remove_content' });
    expect(bad.status).toBe(400);
    const ok = await request(app).post(`/admin/reports/${r.id}/decide`).set(auth(admin.token)).send({ decision: 'upheld', action: 'deactivate_user', note: 'Assédio repetido' });
    expect(ok.status).toBe(200);
    const login = await request(app).post('/auth/login').send({ email: 'autor@example.com', password: 'senha123' });
    expect(login.status).toBe(403);
  });

  it('advertência envia notificação ao autor e mantém o conteúdo', async () => {
    const r = (await report(reporter.token, { targetType: 'post', targetId: post.id, reason: 'improprio' })).body.data;
    await request(app).post(`/admin/reports/${r.id}/decide`).set(auth(admin.token)).send({ decision: 'upheld', action: 'warn_author', note: 'Evite esse tom' });
    const notes = await request(app).get('/notifications').set(auth(author.token));
    expect(notes.body.data.some((n) => n.title === 'Advertência da moderação')).toBe(true);
    const exists = await db.query('SELECT 1 FROM posts WHERE id=$1', [post.id]);
    expect(exists.rows).toHaveLength(1);
  });
});
