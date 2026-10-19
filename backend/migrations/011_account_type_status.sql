-- Migration 011: tipo de conta (usuário ou administrador) e situação da conta.
-- Decisão da equipe: a conta nunca é apagada; ela é desativada (pelo próprio usuário ou por um admin)
-- e só um administrador pode reativá-la.
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (account_type IN ('user', 'admin'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deactivated'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deactivated_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deactivation_reason VARCHAR(255) NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
