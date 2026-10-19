-- Migration 010: Perfil separado do Usuário (decisão da equipe: tabela própria criada no cadastro).
-- A conta (login, e-mail, senha) fica em users; os dados públicos de perfil ficam em profiles (1:1).
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(80) NOT NULL DEFAULT 'Membro',
  city VARCHAR(120) NOT NULL DEFAULT 'São Paulo',
  address_number VARCHAR(20) NOT NULL DEFAULT '',
  avatar TEXT NOT NULL DEFAULT '👤',
  bio TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Copia os dados de perfil que estavam em users.
INSERT INTO profiles (user_id, role, city, address_number, avatar, bio, created_at, updated_at)
SELECT id, role, city, address_number, avatar, bio, created_at, updated_at FROM users
ON CONFLICT (user_id) DO NOTHING;

ALTER TABLE users DROP COLUMN IF EXISTS role;
ALTER TABLE users DROP COLUMN IF EXISTS city;
ALTER TABLE users DROP COLUMN IF EXISTS address_number;
ALTER TABLE users DROP COLUMN IF EXISTS avatar;
ALTER TABLE users DROP COLUMN IF EXISTS bio;
