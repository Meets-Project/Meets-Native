import { describe, expect, it, beforeEach } from 'vitest';
import { newDb } from 'pg-mem';
import bcrypt from 'bcryptjs';
import { makeRepository } from '../src/repository.js';

function testDb() {
  const mem = newDb();
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
      content text NOT NULL, image varchar(120), likes integer NOT NULL DEFAULT 0,
      title varchar(160) NOT NULL DEFAULT '', type varchar(30) NOT NULL DEFAULT 'default',
      presentation_id varchar(160), created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE post_likes (user_id uuid NOT NULL REFERENCES users(id), post_id uuid NOT NULL REFERENCES posts(id), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,post_id));
    CREATE TABLE favorites (user_id uuid NOT NULL REFERENCES users(id), post_id uuid NOT NULL REFERENCES posts(id), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,post_id));
    CREATE TABLE saved_posts (user_id uuid NOT NULL REFERENCES users(id), post_id uuid NOT NULL REFERENCES posts(id), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,post_id));
    CREATE TABLE events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), author_id uuid NOT NULL REFERENCES users(id),
      title varchar(160) NOT NULL, description text NOT NULL DEFAULT '', image varchar(120),
      event_date date, event_time time, location varchar(255) NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE live_rooms (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), author_id uuid NOT NULL REFERENCES users(id), title varchar(160) NOT NULL, description text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE history (id serial PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id), type varchar(40) NOT NULL, title varchar(200) NOT NULL, subtitle varchar(255) NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE notifications (id serial PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id), title varchar(160) NOT NULL, body varchar(500) NOT NULL DEFAULT '', read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE settings (user_id uuid PRIMARY KEY REFERENCES users(id), notifications_enabled boolean NOT NULL DEFAULT true, dark_mode boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE chat_members (chat_id uuid, user_id uuid REFERENCES users(id));
    CREATE TABLE chats (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(160), preview varchar(500), created_at timestamptz DEFAULT now());
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
  `);
  return mem.adapters.createPg().pool;
}

describe('Meets persistence and rating control', () => {
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

  it('persists events with date, time and location', async () => {
    const event = await repo.createContent(user.id,'event',{
      title:'Meu evento',description:'Descrição',eventDate:'2026-09-15',eventTime:'19:30',location:'Centro'
    });
    expect(event.location).toBe('Centro');
    expect(String(event.event_date)).toContain('2026-09-15');
    expect(String(event.event_time)).toContain('19:30');
    expect((await repo.listEvents(user.id))).toHaveLength(1);
  });

  it('creates a presentation and keeps speaker ratings controlled and persistent', async () => {
    const post = await repo.createPresentation(user.id,{
      title:'Talk',description:'Conteúdo',presentationId:'talk-1',speakerIds:[other.id]
    });
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
    const again = await repo.createRating(user.id,{
      postId:post.id,presentationId:'talk-1',speakerId:other.id,stars:5,
      includeSpeakerSkills:false,comment:'Atualizei'
    });
    expect(Number(again.stars)).toBe(5);
    expect((await repo.getSpeakerRatingSummary(other.id)).totalRatings).toBe(1);
  });
});
