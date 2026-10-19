-- Desfaz a migration 011: remove tipo e situação da conta (contas desativadas voltam a funcionar).
DROP INDEX IF EXISTS idx_users_status;
ALTER TABLE users DROP COLUMN IF EXISTS deactivation_reason;
ALTER TABLE users DROP COLUMN IF EXISTS deactivated_by;
ALTER TABLE users DROP COLUMN IF EXISTS deactivated_at;
ALTER TABLE users DROP COLUMN IF EXISTS status;
ALTER TABLE users DROP COLUMN IF EXISTS account_type;
