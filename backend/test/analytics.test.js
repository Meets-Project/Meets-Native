import { describe, expect, it, beforeEach } from 'vitest';
import request from 'supertest';
import { summarizeSpeakerRatings } from '../src/services/scoring.js';
import { auth, createTestApp, signup } from './helpers.js';

const skills = (v) => ({ clarity: v, content: v, engagement: v, storytelling: v, timing: v, visuals: v });

describe('Pontuação do apresentador', () => {
  it('usa a média dos atributos e, sem atributos, as estrelas x 20', () => {
    expect(summarizeSpeakerRatings([{ stars: 5, skills: skills(90) }, { stars: 3, skills: skills(70) }]).overall).toBe(80);
    expect(summarizeSpeakerRatings([{ stars: 4, skills: {} }]).overall).toBe(80);
    expect(summarizeSpeakerRatings([]).overall).toBe(0);
  });
});

describe('Ranking de apresentadores (#007)', () => {
  let app, db, users;
  beforeEach(async () => {
    ({ app, db } = await createTestApp());
    users = {};
    for (const n of ['ana', 'bia', 'caio', 'rater']) users[n] = await signup(app, { name: n.toUpperCase(), email: `${n}@example.com` });
  });

  async function rate(speaker, stars, value, presentation) {
    await db.query(`INSERT INTO presentation_ratings(presentation_id,rater_id,speaker_id,stars,skills) VALUES($1,$2,$3,$4,$5)`,
      [presentation, users.rater.user.id, speaker.user.id, stars, JSON.stringify(skills(value))]);
  }

  it('lista vazia quando ninguém foi avaliado', async () => {
    const res = await request(app).get('/ranking').set(auth(users.rater.token));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it('ordena pela pontuação geral e numera as posições', async () => {
    await rate(users.ana, 4, 70, 'p1');
    await rate(users.bia, 5, 95, 'p2');
    await rate(users.caio, 3, 85, 'p3');
    const res = await request(app).get('/ranking').set(auth(users.rater.token));
    expect(res.body.data.map((r) => r.speaker.name)).toEqual(['BIA', 'CAIO', 'ANA']);
    expect(res.body.data[0]).toMatchObject({ position: 1, overall: 95, totalRatings: 1 });
  });

  it('o perfil do apresentador mostra a mesma pontuação do ranking', async () => {
    await rate(users.ana, 4, 70, 'p1');
    await rate(users.ana, 5, 90, 'p2');
    const ranking = await request(app).get('/ranking').set(auth(users.rater.token));
    const summary = await request(app).get(`/ratings/speakers/${users.ana.user.id}`).set(auth(users.rater.token));
    expect(summary.body.data.overall).toBe(ranking.body.data[0].overall);
    expect(summary.body.data.overall).toBe(80);
  });

  it('apresentador com conta desativada sai do ranking', async () => {
    await rate(users.ana, 4, 70, 'p1');
    await rate(users.bia, 5, 95, 'p2');
    await db.query(`UPDATE users SET status='deactivated' WHERE id=$1`, [users.bia.user.id]);
    const res = await request(app).get('/ranking').set(auth(users.rater.token));
    expect(res.body.data.map((r) => r.speaker.name)).toEqual(['ANA']);
  });
});

describe('Dashboards (#008)', () => {
  let app, db, ana, bia, admin;
  beforeEach(async () => {
    ({ app, db } = await createTestApp());
    ana = await signup(app, { name: 'Ana', email: 'ana@example.com' });
    bia = await signup(app, { name: 'Bia', email: 'bia@example.com' });
    admin = await signup(app, { name: 'Admin', email: 'admin@example.com' });
    await db.query(`UPDATE users SET account_type='admin' WHERE id=$1`, [admin.user.id]);
  });

  it('usuário vê só o próprio conteúdo; plataforma é exclusiva do admin', async () => {
    const p1 = (await request(app).post('/posts').set(auth(ana.token)).send({ content: 'Post da Ana' })).body.data;
    await request(app).post('/posts').set(auth(bia.token)).send({ content: 'Post da Bia' });
    await request(app).post(`/posts/${p1.id}/like`).set(auth(bia.token));
    await request(app).post(`/posts/${p1.id}/comments`).set(auth(bia.token)).send({ content: 'Legal' });
    await request(app).post('/shares').set(auth(bia.token)).send({ contentType: 'post', contentId: p1.id });

    const mine = await request(app).get('/dashboard').set(auth(ana.token));
    expect(mine.status).toBe(200);
    expect(mine.body.data.posts).toMatchObject({ total: 1, likes: 1, comments: 1, shares: 1, engagementPerPost: 3 });
    expect(mine.body.data.posts.top[0].engagement).toBe(3);
    expect(mine.body.data.community).toBeUndefined();

    const denied = await request(app).get('/dashboard?scope=platform').set(auth(ana.token));
    expect(denied.status).toBe(403);

    const platform = await request(app).get('/dashboard?scope=platform').set(auth(admin.token));
    expect(platform.body.data.posts.total).toBe(2);
    expect(platform.body.data.community.activeUsers).toBe(3);
  });

  it('eventos: participantes (sem contar o host), avaliações, distribuição e evolução', async () => {
    const ev = await db.query(`INSERT INTO events(author_id,title,description,event_date,event_time,event_end_time,location,share_token)
      VALUES($1,'Meetup','x','2020-01-01','10:00','11:00','Sala 1',gen_random_uuid()::text) RETURNING id`, [ana.user.id]);
    const eventId = ev.rows[0].id;
    await db.query(`INSERT INTO event_participants(event_id,user_id,status) VALUES($1,$2,'host'),($1,$3,'confirmed')`, [eventId, ana.user.id, bia.user.id]);
    await db.query(`INSERT INTO event_ratings(event_id,rater_id,stars) VALUES($1,$2,4)`, [eventId, bia.user.id]);

    const res = await request(app).get('/dashboard').set(auth(ana.token));
    const { events, ratings } = res.body.data;
    expect(events).toMatchObject({ total: 1, participants: 1, averageRating: 4, ratingsCount: 1 });
    expect(events.top[0]).toMatchObject({ title: 'Meetup', participants: 1, rating: 4 });
    expect(ratings.events).toMatchObject({ count: 1, average: 4 });
    expect(ratings.distribution.find((d) => d.stars === 4).events).toBe(1);
    expect(ratings.evolution).toHaveLength(6);
    expect(ratings.evolution[5].eventCount).toBe(1);
  });

  it('apresentadores: posição no ranking e evolução da pontuação de quem foi avaliado', async () => {
    await db.query(`INSERT INTO presentation_ratings(presentation_id,rater_id,speaker_id,stars,skills) VALUES('p1',$1,$2,5,$3)`,
      [bia.user.id, ana.user.id, JSON.stringify(skills(88))]);
    const res = await request(app).get('/dashboard').set(auth(ana.token));
    expect(res.body.data.presenters.mine).toMatchObject({ position: 1, overall: 88 });
    expect(res.body.data.presenters.evolution[5]).toMatchObject({ overall: 88, count: 1 });
  });

  it('o filtro de período deixa de fora o que é mais antigo', async () => {
    const old = (await request(app).post('/posts').set(auth(ana.token)).send({ content: 'Antigo' })).body.data;
    await db.query(`UPDATE posts SET created_at = NOW() - interval '60 days' WHERE id=$1`, [old.id]);
    await request(app).post('/posts').set(auth(ana.token)).send({ content: 'Recente' });
    const all = await request(app).get('/dashboard').set(auth(ana.token));
    const last30 = await request(app).get('/dashboard?days=30').set(auth(ana.token));
    expect(all.body.data.posts.total).toBe(2);
    expect(last30.body.data.posts.total).toBe(1);
  });
});
