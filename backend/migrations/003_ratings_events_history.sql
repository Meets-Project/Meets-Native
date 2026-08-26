-- Meets: ratings, presentations, richer events and audit/history controls.
ALTER TABLE posts ADD COLUMN IF NOT EXISTS type VARCHAR(30) NOT NULL DEFAULT 'default';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS title VARCHAR(160) NOT NULL DEFAULT '';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS presentation_id VARCHAR(160);

ALTER TABLE events ADD COLUMN IF NOT EXISTS event_date DATE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_time TIME;
ALTER TABLE events ADD COLUMN IF NOT EXISTS location VARCHAR(255) NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS presentation_speakers (
  presentation_id VARCHAR(160) NOT NULL,
  speaker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (presentation_id, speaker_id)
);

CREATE TABLE IF NOT EXISTS presentation_ratings (
  id BIGSERIAL PRIMARY KEY,
  presentation_id VARCHAR(160) NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  rater_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  speaker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stars NUMERIC(2,1) NOT NULL CHECK (stars >= 1 AND stars <= 5),
  skills JSONB NOT NULL DEFAULT '{}'::jsonb,
  comment VARCHAR(1000) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (presentation_id, rater_id, speaker_id)
);

CREATE INDEX IF NOT EXISTS idx_presentation_ratings_speaker
  ON presentation_ratings(speaker_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_presentation_ratings_presentation
  ON presentation_ratings(presentation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_presentation
  ON posts(presentation_id) WHERE presentation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_author_created
  ON events(author_id, created_at DESC);

-- Keep the public feed able to display old posts while adding presentation metadata.
UPDATE posts SET title = COALESCE(NULLIF(title,''), LEFT(content,160))
WHERE title = '';
