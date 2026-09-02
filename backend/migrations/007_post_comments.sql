-- Migration 007: comments on posts and events.
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT post_comments_target_check CHECK (post_id IS NOT NULL OR event_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post
  ON post_comments(post_id, created_at ASC) WHERE post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_post_comments_event
  ON post_comments(event_id, created_at ASC) WHERE event_id IS NOT NULL;
