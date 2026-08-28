-- Migration 005: User connections (follow/connect network)
CREATE TABLE IF NOT EXISTS user_connections (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  connected_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, connected_user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_connections_user ON user_connections(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_connections_connected ON user_connections(connected_user_id, created_at DESC);
