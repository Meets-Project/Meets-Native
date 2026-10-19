-- Desfaz a migration 015: recria a tabela de salas ao vivo (vazia).
CREATE TABLE IF NOT EXISTS live_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  visibility VARCHAR(20) NOT NULL DEFAULT 'public',
  share_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
