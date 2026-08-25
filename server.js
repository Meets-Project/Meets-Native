import 'dotenv/config';
import { app } from './app.js';
import { pool } from './db.js';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const port=Number(process.env.PORT||3333);
async function boot(){
  // As migrations são idempotentes (CREATE/ALTER ... IF NOT EXISTS), então
  // executamos sempre para que instalações antigas recebam novas colunas.
  const run=promisify(execFile);
  await run('node',['src/migrate.js'],{cwd:process.cwd()});
  app.listen(port,()=>console.log(`Meets API listening on :${port}`));
}
boot().catch(err=>{console.error(err);process.exit(1);});
