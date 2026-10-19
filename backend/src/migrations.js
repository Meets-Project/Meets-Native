import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const migrationsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'migrations');

// Aplica, em ordem, cada arquivo .sql de migrations/ que ainda não está registrado em _migrations.
export async function runMigrations(pool, log = console.log) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  const files = (await fs.readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    const already = await pool.query('SELECT 1 FROM _migrations WHERE filename=$1', [file]);
    if (already.rows.length > 0) continue;
    const sql = (await fs.readFile(path.join(migrationsDir, file), 'utf8')).replace(/^﻿/, '');
    await pool.query(sql);
    await pool.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
    log(`Migration aplicada: ${file}`);
  }
  log('Migrations verificadas.');
}
