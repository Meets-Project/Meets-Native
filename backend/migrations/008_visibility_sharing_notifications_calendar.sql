-- Migration 008: visibility, sharing, calendar data, and notification targets.
ALTER TABLE posts ADD COLUMN IF NOT EXISTS event_date DATE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS event_time TIME;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS event_end_time TIME;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) NOT NULL DEFAULT 'public';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS share_token TEXT;

ALTER TABLE events ADD COLUMN IF NOT EXISTS image VARCHAR(120);
ALTER TABLE events ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) NOT NULL DEFAULT 'public';
ALTER TABLE events ADD COLUMN IF NOT EXISTS share_token TEXT;

ALTER TABLE live_rooms ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) NOT NULL DEFAULT 'public';
ALTER TABLE live_rooms ADD COLUMN IF NOT EXISTS share_token TEXT;

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS target_type VARCHAR(30);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS target_id TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS target_token TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_target
  ON notifications(user_id, target_type, target_id)
  WHERE target_type IS NOT NULL AND target_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS content_audience (
  content_type VARCHAR(20) NOT NULL,
  content_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (content_type, content_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_content_audience_user
  ON content_audience(user_id, content_type, content_id);

CREATE TABLE IF NOT EXISTS event_ratings (
  id BIGSERIAL PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stars NUMERIC(2,1) NOT NULL CHECK (stars >= 1 AND stars <= 5),
  comment VARCHAR(1000) NOT NULL DEFAULT '',
  visibility VARCHAR(20) NOT NULL DEFAULT 'public',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, rater_id)
);

ALTER TABLE presentation_ratings ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) NOT NULL DEFAULT 'public';