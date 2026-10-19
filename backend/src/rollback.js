// Desfaz uma migration já aplicada: npm run rollback -- 010_profiles
// Executa migrations/rollback/<nome>.down.sql e remove o registro em _migrations,
// para que a migration volte a ser aplicada no próximo start se o arquivo continuar na pasta.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, withTransaction } from './db.js';

const name = String(process.argv[2] || '').replace(/\.sql$/, '');
if (!name) {
  console.error('Informe a migration. Ex.: npm run rollback -- 010_profiles');
  process.exit(1);
}

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'migrations');
const file = path.join(dir, 'rollback', `${name}.down.sql`);

try {
  const sql = await fs.readFile(file, 'utf8');
  await withTransaction(async (client) => {
    await client.query(sql);
    await client.query(`CREATE TABLE IF NOT EXISTS _migrations (filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
    await client.query('DELETE FROM _migrations WHERE filename=$1', [`${name}.sql`]);
  });
  console.log(`Rollback aplicado: ${name}`);
  console.log(`Para não reaplicar no próximo start, remova também migrations/${name}.sql (ou reverta o commit).`);
} catch (error) {
  console.error(`Falha no rollback de ${name}:`, error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
