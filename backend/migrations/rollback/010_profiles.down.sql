-- Desfaz a migration 010: devolve os campos de perfil para users e apaga profiles.
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(80) NOT NULL DEFAULT 'Membro';
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(120) NOT NULL DEFAULT 'São Paulo';
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_number VARCHAR(20) NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT NOT NULL DEFAULT '👤';
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT '';

UPDATE users u SET role = p.role, city = p.city, address_number = p.address_number, avatar = p.avatar, bio = p.bio
FROM profiles p WHERE p.user_id = u.id;

DROP TABLE IF EXISTS profiles;
