import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'migrations');
const files = (await fs.readdir(dir)).filter(f => f.endsWith('.sql')).sort();
for (const file of files) {
  const sql = (await fs.readFile(path.join(dir, file), 'utf8')).replace(/^\uFEFF/, '');
  await pool.query(sql);
  console.log(`Migration applied: ${file}`);
}
await pool.end();
