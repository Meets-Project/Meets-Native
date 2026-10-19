-- Migration 014: registro de compartilhamentos (casos de uso #003 e #004, e Dashboard).
-- Cada vez que alguém gera o link de um post, evento ou perfil, fica um registro aqui.
CREATE TABLE IF NOT EXISTS content_shares (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('post', 'event', 'user')),
  content_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_shares_content ON content_shares(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_shares_created ON content_shares(created_at DESC);
