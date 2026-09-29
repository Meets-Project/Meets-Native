-- Meets: e-mail verification and event likes
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_verification_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_email_verification_token
  ON users(email_verification_token_hash)
  WHERE email_verification_token_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS event_likes (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_event_likes_event ON event_likes(event_id);
