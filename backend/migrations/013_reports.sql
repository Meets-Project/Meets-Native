-- Migration 013: denúncias de conteúdo (post, evento) ou de usuário, analisadas por administradores.
-- Estados: pending (pendente) -> in_review (em análise) -> dismissed (improcedente) | upheld (procedente).
-- Quando procedente, guarda a ação de moderação aplicada.
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('post', 'event', 'user')),
  target_id UUID NOT NULL,
  target_owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_preview VARCHAR(500) NOT NULL DEFAULT '',
  reason VARCHAR(30) NOT NULL CHECK (reason IN ('spam', 'ofensivo', 'assedio', 'falso', 'improprio', 'outro')),
  details VARCHAR(1000) NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'dismissed', 'upheld')),
  action VARCHAR(30) CHECK (action IN ('remove_content', 'warn_author', 'deactivate_user')),
  decision_note VARCHAR(1000) NOT NULL DEFAULT '',
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  review_started_at TIMESTAMPTZ,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_target ON reports(target_type, target_id);
-- Uma mesma pessoa não abre duas denúncias ao mesmo tempo sobre o mesmo alvo.
CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_open_unique
  ON reports(reporter_id, target_type, target_id)
  WHERE status IN ('pending', 'in_review');
