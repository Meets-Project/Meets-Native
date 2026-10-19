-- Desfaz a migration 012: apaga o registro de ações de administração.
DROP TABLE IF EXISTS admin_actions;
