import { describe, expect, it, beforeEach } from 'vitest';
import request from 'supertest';
import { auth, createTestApp, signup } from './helpers.js';
import { makeRepository } from '../src/repository.js';

const skills = { clarity: 80, content: 80, engagement: 80, storytelling: 80, timing: 80, visuals: 80 };

describe('Correções de gravidade alta da auditoria', () => {
  let app, db, ana, bia, caio;
  beforeEach(async () => {
    ({ app, db } = await createTestApp());
    ana = await signup(app, { name: 'Ana', email: 'ana@example.com' });
    bia = await signup(app, { name: 'Bia', email: 'bia@example.com' });
    caio = await signup(app, { name: 'Caio', email: 'caio@example.com' });
  });

  it('avaliar um post comum não o transforma em apresentação', async () => {
    const post = (await request(app).post('/posts').set(auth(ana.token)).send({ content: 'Post comum' })).body.data;
    const res = await request(app).post('/ratings/presentations').set(auth(bia.token)).send({ postId: post.id, stars: 5, skills });
    expect(res.status).toBe(400);
    const row = await db.query('SELECT type, presentation_id FROM posts WHERE id=$1', [post.id]);
    expect(row.rows[0].type).toBe('default');
    expect(row.rows[0].presentation_id).toBeNull();
  });

  it('não dá para inventar uma apresentação para avaliar qualquer pessoa', async () => {
    const res = await request(app).post('/ratings/presentations').set(auth(bia.token))
      .send({ presentationId: 'inventada', speakerId: ana.user.id, stars: 1, skills });
    expect(res.status).toBe(400);
  });

  it('avaliar o organizador de um evento exige ter participado e o evento ter terminado', async () => {
    const ev = await db.query(`INSERT INTO events(author_id,title,description,event_date,event_time,event_end_time,location,share_token)
      VALUES($1,'Encerrado','x','2020-01-01','10:00','11:00','x',gen_random_uuid()::text) RETURNING id`, [ana.user.id]);
    const presentationId = `presentation-event-${ev.rows[0].id}`;
    const outsider = await request(app).post('/ratings/presentations').set(auth(bia.token)).send({ presentationId, stars: 5, skills });
    expect(outsider.status).toBe(403);

    await db.query(`INSERT INTO event_participants(event_id,user_id) VALUES($1,$2)`, [ev.rows[0].id, bia.user.id]);
    const available = await request(app).get('/ratings/available').set(auth(bia.token));
    expect(available.body.data.some((a) => a.presentationId === presentationId)).toBe(true);
    const notListed = await request(app).get('/ratings/available').set(auth(caio.token));
    expect(notListed.body.data.some((a) => a.presentationId === presentationId)).toBe(false);

    const ok = await request(app).post('/ratings/presentations').set(auth(bia.token)).send({ presentationId, stars: 5, skills });
    expect(ok.status).toBe(201);
  });

  it('público "selecionados" aceita os seus seguidores (quem segue você)', async () => {
    await request(app).post(`/users/${ana.user.id}/connect`).set(auth(bia.token));
    const followers = await request(app).get('/users/followers').set(auth(ana.token));
    expect(followers.body.data.map((f) => f.id)).toEqual([bia.user.id]);

    const res = await request(app).post('/posts').set(auth(ana.token))
      .send({ content: 'Só para a Bia', visibility: 'selected', audienceUserIds: [bia.user.id] });
    expect(res.status).toBe(201);
    const biaFeed = await request(app).get('/feed').set(auth(bia.token));
    expect(biaFeed.body.data.some((i) => i.id === res.body.data.id)).toBe(true);
    const caioFeed = await request(app).get('/feed').set(auth(caio.token));
    expect(caioFeed.body.data.some((i) => i.id === res.body.data.id)).toBe(false);
  });

  it('link de perfil compartilhado não expõe e-mail nem número do endereço', async () => {
    await request(app).put('/users/me').set(auth(ana.token)).send({ addressNumber: '123' });
    const res = await request(app).get(`/public/content/user/${ana.user.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.name).toBe('Ana');
    expect(res.body.data.user.email).toBeUndefined();
    expect(res.body.data.user.address_number).toBeUndefined();
    expect(res.body.data.user.email_verified).toBeUndefined();
  });

  it('avaliar apresentação pela rota funciona (antes o corpo da requisição era ignorado)', async () => {
    const repo = makeRepository(db);
    const ev = await db.query(`INSERT INTO events(author_id,title,description,event_date,event_time,event_end_time,location,share_token)
      VALUES($1,'Semana Tech','x','2020-01-01','09:00','18:00','x',gen_random_uuid()::text) RETURNING id`, [caio.user.id]);
    await db.query(`INSERT INTO event_participants(event_id,user_id) VALUES($1,$2)`, [ev.rows[0].id, bia.user.id]);
    const talk = await repo.createPresentation(ana.user.id, { title: 'Palestra', description: 'x', eventDate: '2020-01-01', eventTime: '10:00', eventEndTime: '11:00', mentionedEventId: ev.rows[0].id });

    const res = await request(app).post('/ratings/presentations').set(auth(bia.token))
      .send({ postId: talk.id, speakerId: ana.user.id, stars: 4, includeSpeakerSkills: true, skills, comment: 'Boa' });
    expect(res.status).toBe(201);
    expect(Number(res.body.data.stars)).toBe(4);

    const outsider = await request(app).post('/ratings/presentations').set(auth(caio.token))
      .send({ postId: talk.id, speakerId: ana.user.id, stars: 1, skills });
    expect(outsider.status).toBe(403);

    const summary = await request(app).get(`/ratings/speakers/${ana.user.id}`).set(auth(bia.token));
    expect(summary.body.data.totalRatings).toBe(1);
  });
});
