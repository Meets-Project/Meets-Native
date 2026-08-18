import { describe, expect, it, beforeEach } from 'vitest';
import { newDb } from 'pg-mem';
import bcrypt from 'bcryptjs';
import { makeRepository } from '../src/repository.js';

function testDb() {
  const mem = newDb();
  mem.public.none(`
    CREATE TABLE users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name varchar(120) NOT NULL,
      email varchar(255) NOT NULL UNIQUE,
      password_hash text NOT NULL,
      role varchar(80) NOT NULL DEFAULT 'Membro',
      city varchar(120) NOT NULL DEFAULT 'São Paulo',
      avatar varchar(20) NOT NULL DEFAULT '👤',
      bio text NOT NULL DEFAULT '',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE posts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), author_id uuid NOT NULL REFERENCES users(id),
      content text NOT NULL, image varchar(120), likes integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE post_likes (user_id uuid NOT NULL REFERENCES users(id), post_id uuid NOT NULL REFERENCES posts(id), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,post_id));
    CREATE TABLE favorites (user_id uuid NOT NULL REFERENCES users(id), post_id uuid NOT NULL REFERENCES posts(id), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,post_id));
    CREATE TABLE saved_posts (user_id uuid NOT NULL REFERENCES users(id), post_id uuid NOT NULL REFERENCES posts(id), created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,post_id));
    CREATE TABLE events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), author_id uuid NOT NULL REFERENCES users(id), title varchar(160) NOT NULL, description text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE live_rooms (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), author_id uuid NOT NULL REFERENCES users(id), title varchar(160) NOT NULL, description text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE history (id serial PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id), type varchar(40) NOT NULL, title varchar(200) NOT NULL, subtitle varchar(255) NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE notifications (id serial PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id), title varchar(160) NOT NULL, body varchar(500) NOT NULL DEFAULT '', read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
    CREATE TABLE settings (user_id uuid PRIMARY KEY REFERENCES users(id), notifications_enabled boolean NOT NULL DEFAULT true, dark_mode boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now());
  `);
  return mem.adapters.createPg().pool;
}

describe('PostgreSQL persistence repository', () => {
  let db, repo, user;
  beforeEach(async () => {
    db=testDb();
    repo=makeRepository(db);
    user=await repo.createUser({name:'Teste',email:'teste@example.com',passwordHash:await bcrypt.hash('123456',4)});
  });

  it('creates and reads a user', async () => {
    const got=await repo.getUser(user.id);
    expect(got.email).toBe('teste@example.com');
    expect(got.name).toBe('Teste');
  });

  it('persists profile updates', async () => {
    const got=await repo.updateUser(user.id,{name:'Novo Nome',bio:'Bio real',city:'Ferraz'});
    expect(got.name).toBe('Novo Nome');
    expect(got.bio).toBe('Bio real');
    expect(got.city).toBe('Ferraz');
  });

  it('persists a post, like, save and history', async () => {
    const post=await repo.createPost(user.id,{content:'Post persistente',image:'🎤'});
    expect((await repo.listPosts())[0].content).toBe('Post persistente');
    expect((await repo.toggleLike(user.id,post.id)).likes).toBe(1);
    expect((await repo.toggleLike(user.id,post.id)).likes).toBe(0);
    expect((await repo.toggleSave(user.id,post.id))).toBe(true);
    expect((await repo.listSaved(user.id))).toHaveLength(1);
    expect((await repo.toggleFavorite(user.id,post.id))).toBe(true);
    expect((await repo.listFavorites(user.id))).toHaveLength(1);
    await repo.addHistory(user.id,{type:'post',title:'Postou',subtitle:'teste'});
    expect((await repo.listHistory(user.id))).toHaveLength(1);
  });

  it('persists events, rooms and settings', async () => {
    await repo.createContent(user.id,'event',{title:'Meu evento',description:'Descrição'});
    await repo.createContent(user.id,'live',{title:'Minha sala',description:'Ao vivo'});
    await repo.createContent(user.id,'post',{title:'Meu post',description:'Texto'});
    expect((await repo.listHistory(user.id))).toHaveLength(3);
    const settings=await repo.updateSettings(user.id,{notificationsEnabled:false,darkMode:true});
    expect(settings.notifications_enabled).toBe(false);
    expect(settings.dark_mode).toBe(true);
  });
});
