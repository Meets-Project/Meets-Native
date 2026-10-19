-- Migration 015: remove as salas ao vivo (decisão da equipe: tirar de tudo).
-- As salas eram gravadas, mas nenhuma tela as listava.
DROP TABLE IF EXISTS live_rooms;
