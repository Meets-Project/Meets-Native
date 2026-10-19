import { describe, expect, it, beforeEach } from 'vitest';
import { newDb } from 'pg-mem';
import bcrypt from 'bcryptjs';
import { makeRepository } from '../src/repository.js';
import { applyMigrations, createTestDb, registerPgMemFunctions } from './helpers.js';

it('applies migration schema for visibility, audience and notification targets', async () => {
  const mem = newDb();
  registerPgMemFunctions(mem);
  await applyMigrations(mem);

  const visible = await mem.public.query(`SELECT column_name FROM information_schema.columns WHERE table_name='events' AND column_name='visibility'`);
  expect(visible.rows.some((row) => row.column_name === 'visibility')).toBe(true);

  const contentAudience = await mem.public.query(`SELECT table_name FROM information_schema.tables WHERE table_name='content_audience'`);
  expect(contentAudience.rows.some((row) => row.table_name === 'content_audience')).toBe(true);

  const notificationTargets = await mem.public.query(`SELECT column_name FROM information_schema.columns WHERE table_name='notifications' AND column_name='target_type'`);
  expect(notificationTargets.rows.some((row) => row.column_name === 'target_type')).toBe(true);
});

describe('Meets persistence and features', () => {
  let db, repo, user, other;
  beforeEach(async () => {
    ({ db } = await createTestDb());
    repo = makeRepository(db);
    user = await repo.createUser({name:'Teste',email:'teste@example.com',passwordHash:await bcrypt.hash('123456',4)});
    other = await repo.createUser({name:'Outro',email:'outro@example.com',passwordHash:await bcrypt.hash('123456',4)});
  });

  it('persists user, profile, post, likes, saves and history', async () => {
    expect((await repo.getUser(user.id)).email).toBe('teste@example.com');
    const updated = await repo.updateUser(user.id,{name:'Novo Nome',bio:'Bio real',city:'Ferraz'});
    expect(updated.name).toBe('Novo Nome');
    const post = await repo.createPost(user.id,{content:'Post persistente'});
    expect((await repo.listPosts())[0].content).toBe('Post persistente');
    expect((await repo.toggleLike(user.id,post.id)).likes).toBe(1);
    expect((await repo.toggleSave(user.id,post.id))).toBe(true);
    expect((await repo.listSaved(user.id))).toHaveLength(1);
    await repo.addHistory(user.id,{type:'post',title:'Postou',subtitle:'teste'});
    expect((await repo.listHistory(user.id)).length).toBeGreaterThanOrEqual(2);
  });

  it('persists events with date, time and location, and supports event participants', async () => {
    const event = await repo.createContent(user.id,'event',{
      title:'Meu meetup',description:'Descrição completa',eventDate:'2026-09-15',eventTime:'19:30',location:'Centro de Inovação'
    });
    expect(event.location).toBe('Centro de Inovação');
    expect(event.event_date ? new Date(event.event_date).toISOString() : '').toContain('2026-09');
    expect(String(event.event_time)).toContain('19:30');

    // Host was auto-added as participant
    const participants = await repo.listEventParticipants(event.id);
    expect(participants).toHaveLength(1);
    expect(participants[0].id).toBe(user.id);

    // Other user joins
    const joinResult = await repo.toggleEventParticipation(other.id, event.id);
    expect(joinResult.participating).toBe(true);
    expect(joinResult.participantsCount).toBe(2);

    // Saving the event
    const saveEventResult = await repo.toggleSave(other.id, event.id);
    expect(saveEventResult).toBe(true);
    const savedItems = await repo.listSaved(other.id);
    expect(savedItems.some(i => i.id === event.id && i.type === 'event')).toBe(true);
  });

  it('supports user connections and filtering feed by connections', async () => {
    expect(await repo.getConnectionStatus(user.id, other.id)).toBe(false);

    // Connect
    const connRes = await repo.toggleConnection(user.id, other.id);
    expect(connRes.connected).toBe(true);
    expect(connRes.connectionsCount).toBe(1);
    expect(await repo.getConnectionStatus(user.id, other.id)).toBe(true);

    const userProfile = await repo.getUser(user.id);
    expect(userProfile.connections).toBe(1);

    // Other user receives notification
    const notifications = await repo.listNotifications(other.id);
    expect(notifications.some(n => n.title.includes('Nova conexão'))).toBe(true);

    // Create post by other user
    await repo.createPost(other.id, { content: 'Post de conexão' });
    const feedConnections = await repo.listFeed(user.id, 'connections');
    expect(feedConnections.some(p => p.content === 'Post de conexão')).toBe(true);

    // Disconnect
    const disconnRes = await repo.toggleConnection(user.id, other.id);
    expect(disconnRes.connected).toBe(false);
    expect(disconnRes.connectionsCount).toBe(0);
    expect(await repo.getConnectionStatus(user.id, other.id)).toBe(false);
  });

  it('supports direct chats and message sending with history and notifications', async () => {
    const chat = await repo.getOrCreateDirectChat(user.id, other.id);
    expect(chat.id).toBeDefined();

    // Send message
    const msg = await repo.sendChatMessage(chat.id, user.id, 'Olá, tudo bem?');
    expect(msg.content).toBe('Olá, tudo bem?');
    expect(msg.sender_id).toBe(user.id);

    // Recipient lists messages
    const messages = await repo.listChatMessages(chat.id, other.id);
    expect(messages).toHaveLength(1);
    expect(messages[0].content).toBe('Olá, tudo bem?');

    // Recipient receives notification
    const notifications = await repo.listNotifications(other.id);
    expect(notifications.some(n => n.title.includes('Mensagem de'))).toBe(true);
  });

  it('creates a presentation and persists presentation and speaker ratings with skills radar', async () => {
    const post = await repo.createPresentation(user.id,{
      title:'Talk Inovação',description:'Conteúdo sobre tecnologia',presentationId:'talk-1',speakerIds:[other.id],eventDate:'2020-01-01',eventTime:'10:00',eventEndTime:'11:00'
    });

    const available = await repo.listAvailablePresentations(user.id);
    expect(available.some(a => a.presentationId === 'talk-1')).toBe(true);

    // Rating given by user to other speaker
    const rating = await repo.createRating(user.id,{
      postId:post.id,presentationId:'talk-1',speakerId:other.id,stars:4,
      includeSpeakerSkills:true,
      skills:{clarity:80,content:90,engagement:70,storytelling:80,timing:75,visuals:85},
      comment:'Excelente'
    });
    expect(Number(rating.stars)).toBe(4);
    const summary = await repo.getSpeakerRatingSummary(other.id);
    expect(summary.totalRatings).toBe(1);
    expect(summary.averageStars).toBe(4);
    expect(summary.averageSkills.clarity).toBe(80);
    expect(summary.overall).toBeGreaterThan(0);
  });
  it('supports private visibility and direct share links', async () => {
    await repo.toggleConnection(other.id, user.id); // other follows user
    const post = await repo.createPost(user.id, { content:'Privado', visibility:'followers' });
    expect((await repo.listFeed(other.id,'all')).some(i => i.id === post.id)).toBe(true);

    const outsider = await repo.createUser({name:'Terceiro',email:'terceiro@example.com',passwordHash:await bcrypt.hash('123456',4)});
    expect((await repo.listFeed(outsider.id,'all')).some(i => i.id === post.id)).toBe(false);

    const linkPost = await repo.createPost(user.id, { content:'Link only', visibility:'link' });
    expect(await repo.getSharedContent('post', linkPost.id, null, linkPost.share_token)).toBeTruthy();
    expect(await repo.getSharedContent('post', linkPost.id, outsider.id, null)).toBe(null);
  });

  it('creates exact rating notification after a participated event ends', async () => {
    const row = await db.query(`INSERT INTO events(author_id,title,description,event_date,event_time,event_end_time,location,visibility,share_token) VALUES($1,'Evento encerrado','x','2020-01-01','10:00','11:00','x','public',gen_random_uuid()::text) RETURNING id`, [user.id]);
    await db.query(`INSERT INTO event_participants(event_id,user_id,status) VALUES($1,$2,'confirmed')`, [row.rows[0].id, other.id]);
    const notes = await repo.listNotifications(other.id);
    expect(notes.some(n => n.target_type === 'event-rating' && n.target_id === row.rows[0].id)).toBe(true);
  });

});
