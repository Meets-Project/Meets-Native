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
  const notifyFinished = async () => {
    await pool.query(`
      INSERT INTO notifications(user_id, title, body)
      SELECT target.user_id, 'Avalie o evento ou apresentação', target.marker
      FROM (
        SELECT ep.user_id, 'rating-event:' || e.id AS marker
        FROM event_participants ep JOIN events e ON e.id = ep.event_id
        WHERE e.event_date + e.event_end_time <= NOW()
        UNION
        SELECT p.author_id, 'rating-presentation:' || p.id || ':' || COALESCE(p.presentation_id, 'presentation-' || p.id) AS marker
        FROM posts p
        WHERE p.type = 'presentation' AND p.event_date + p.event_end_time <= NOW()
      ) target
      WHERE target.user_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM notifications n
          WHERE n.user_id = target.user_id AND n.body = target.marker
        )
    `);
  };
  notifyFinished().catch(() => {});
  setInterval(() => notifyFinished().catch(() => {}), 60_000);
}
boot().catch(err=>{console.error(err);process.exit(1);});
