-- Migration 006: allow posts to mention events.
ALTER TABLE posts ADD COLUMN IF NOT EXISTS mentioned_event_id UUID REFERENCES events(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_posts_mentioned_event
  ON posts(mentioned_event_id) WHERE mentioned_event_id IS NOT NULL;
