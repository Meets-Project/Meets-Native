import crypto from 'node:crypto';
import { describe, expect, it, beforeEach } from 'vitest';
import { newDb } from 'pg-mem';
import bcrypt from 'bcryptjs';
import { makeRepository } from '../src/repository.js';

function testDb() {
  const mem = newDb();
  mem.public.registerFunction({
    name: 'gen_random_uuid',
    impure: true,
    implementation: () => crypto.randomUUID(),
  });
  mem.public.none(`
    CREATE TABLE users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(120) NOT NULL,
      email varchar(255) NOT NULL UNIQUE, password_hash text NOT NULL,
      role varchar(80) NOT NULL DEFAULT 'Membro', city varchar(120) NOT NULL DEFAULT 'São Paulo',
      avatar varchar(20) NOT NULL DEFAULT '👤', bio text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE posts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), author_id uuid NOT NULL REFERENCES users(id),
      content text NOT NULL, image text, likes integer NOT NULL DEFAULT 0,
      title varchar(160) NOT NULL DEFAULT '', type varchar(30) NOT NULL DEFAULT 'default',
      presentation_id varchar(160), created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE post_likes (user_id uuid NOT NULL REFERENCES users(id), post_id uuid NOT NULL REFERENCES posts(id), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,post_id));
    CREATE TABLE favorites (user_id uuid NOT NULL REFERENCES users(id), post_id uuid NOT NULL REFERENCES posts(id), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,post_id));
    CREATE TABLE saved_posts (user_id uuid NOT NULL REFERENCES users(id), post_id uuid NOT NULL REFERENCES posts(id), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,post_id));
    CREATE TABLE events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), author_id uuid NOT NULL REFERENCES users(id),
      title varchar(160) NOT NULL, description text NOT NULL DEFAULT '', image text,
      event_date date, event_time time, location varchar(255) NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE saved_events (user_id uuid NOT NULL REFERENCES users(id), event_id uuid NOT NULL REFERENCES events(id), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,event_id));
    CREATE TABLE event_participants (event_id uuid NOT NULL REFERENCES events(id), user_id uuid NOT NULL REFERENCES users(id), status varchar(40) NOT NULL DEFAULT 'confirmed', created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(event_id,user_id));
    CREATE TABLE live_rooms (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), author_id uuid NOT NULL REFERENCES users(id), title varchar(160) NOT NULL, description text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE history (id serial PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id), type varchar(40) NOT NULL, title varchar(200) NOT NULL, subtitle varchar(255) NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE notifications (id serial PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id), title varchar(160) NOT NULL, body varchar(500) NOT NULL DEFAULT '', read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE settings (user_id uuid PRIMARY KEY REFERENCES users(id), notifications_enabled boolean NOT NULL DEFAULT true, dark_mode boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE chats (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(160), preview varchar(500), created_at timestamptz DEFAULT now());
    CREATE TABLE chat_members (chat_id uuid NOT NULL REFERENCES chats(id), user_id uuid NOT NULL REFERENCES users(id), unread integer NOT NULL DEFAULT 0, PRIMARY KEY(chat_id, user_id));
    CREATE TABLE chat_messages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), chat_id uuid NOT NULL REFERENCES chats(id), sender_id uuid NOT NULL REFERENCES users(id), content text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE presentation_speakers (
      presentation_id varchar(160) NOT NULL, speaker_id uuid NOT NULL REFERENCES users(id),
      created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(presentation_id,speaker_id)
    );
    CREATE TABLE presentation_ratings (
      id serial PRIMARY KEY, presentation_id varchar(160) NOT NULL, post_id uuid,
      rater_id uuid NOT NULL REFERENCES users(id), speaker_id uuid NOT NULL REFERENCES users(id),
      stars numeric(2,1) NOT NULL, skills jsonb NOT NULL DEFAULT '{}'::jsonb,
      comment varchar(1000) NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(presentation_id,rater_id,speaker_id)
    );
    CREATE TABLE user_connections (
      user_id uuid NOT NULL REFERENCES users(id), connected_user_id uuid NOT NULL REFERENCES users(id),
      created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id, connected_user_id)
    );
  `);
  const { Pool } = mem.adapters.createPg();
  return new Pool();
}

describe('Meets persistence and features', () => {
  let db, repo, user, other;
  beforeEach(async () => {
    db = testDb();
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
      title:'Talk Inovação',description:'Conteúdo sobre tecnologia',presentationId:'talk-1',speakerIds:[other.id]
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
});
