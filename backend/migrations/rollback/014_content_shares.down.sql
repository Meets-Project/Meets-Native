-- Desfaz a migration 014: apaga o registro de compartilhamentos.
DROP TABLE IF EXISTS content_shares;
