import { describe, expect, it, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import { makeRepository } from '../src/repository.js';
import { createTestDb } from './helpers.js';

describe('Perfil em tabela própria (profiles)', () => {
  let db, repo;
  beforeEach(async () => {
    ({ db } = await createTestDb());
    repo = makeRepository(db);
  });

  it('o cadastro cria a conta e o perfil 1:1', async () => {
    const user = await repo.createUser({ name: 'Ana', email: 'ana@example.com', passwordHash: await bcrypt.hash('123456', 4), avatar: '🦊' });
    const profile = await repo.getProfile(user.id);
    expect(profile.user_id).toBe(user.id);
    expect(profile.avatar).toBe('🦊');
    expect(profile.role).toBe('Membro');
    expect(user.avatar).toBe('🦊');
  });

  it('a conta não guarda mais os campos de perfil', async () => {
    const cols = await db.query(`SELECT column_name FROM information_schema.columns WHERE table_name='users'`);
    const names = cols.rows.map((r) => r.column_name);
    expect(names.includes('avatar')).toBe(false);
    expect(names.includes('bio')).toBe(false);
    expect(names.includes('email')).toBe(true);
  });

  it('editar perfil grava o nome na conta e o resto no perfil', async () => {
    const user = await repo.createUser({ name: 'Ana', email: 'ana@example.com', passwordHash: 'x' });
    const updated = await repo.updateUser(user.id, { name: 'Ana Lima', role: 'Professora', city: 'Ferraz - SP', bio: 'Oi', addressNumber: '12' });
    expect(updated.name).toBe('Ana Lima');
    expect(updated.role).toBe('Professora');
    const profile = await repo.getProfile(user.id);
    expect(profile.city).toBe('Ferraz - SP');
    expect(profile.address_number).toBe('12');
  });

  it('perfil público não expõe e-mail nem número do endereço', async () => {
    const user = await repo.createUser({ name: 'Ana', email: 'ana@example.com', passwordHash: 'x' });
    await repo.updateUser(user.id, { addressNumber: '99' });
    const pub = await repo.getPublicUser(user.id);
    expect(pub.email).toBeUndefined();
    expect(pub.address_number).toBeUndefined();
    expect(pub.name).toBe('Ana');
  });

  it('feed, comentários e participantes trazem a foto do perfil', async () => {
    const user = await repo.createUser({ name: 'Ana', email: 'ana@example.com', passwordHash: 'x', avatar: '🦊' });
    const post = await repo.createPost(user.id, { content: 'Olá' });
    await repo.createComment(user.id, { postId: post.id, content: 'Comentário' });
    const feed = await repo.listFeed(user.id, 'all');
    expect(feed[0].author.avatar).toBe('🦊');
    const comments = await repo.listComments(post.id, user.id, 'post');
    expect(comments[0].user_avatar).toBe('🦊');
  });
});
