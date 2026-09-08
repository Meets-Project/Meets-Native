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
      INSERT INTO notifications(user_id, title, body, target_type, target_id, target_token)
      SELECT target.user_id, target.title, target.body, target.target_type, target.target_id, target.target_token
      FROM (
        SELECT ep.user_id, 'Avalie o evento que você participou' AS title,
          'O evento "' || e.title || '" terminou. Toque para avaliar sua experiência.' AS body,
          'event-rating' AS target_type, e.id::text AS target_id, e.share_token AS target_token
        FROM event_participants ep JOIN events e ON e.id = ep.event_id
        WHERE e.event_date IS NOT NULL AND e.event_end_time IS NOT NULL
          AND (e.event_date < CURRENT_DATE OR (e.event_date = CURRENT_DATE AND e.event_end_time <= CURRENT_TIME))
        UNION ALL
        SELECT ep.user_id, 'Avalie a apresentação' AS title,
          'A apresentação "' || COALESCE(p.title, 'Apresentação') || '" terminou. Toque para avaliar.' AS body,
          'presentation-rating' AS target_type, p.id::text AS target_id, p.share_token AS target_token
        FROM posts p
        JOIN event_participants ep ON ep.event_id = p.mentioned_event_id
        WHERE (p.type = 'presentation' OR p.presentation_id IS NOT NULL)
          AND p.event_date IS NOT NULL AND p.event_end_time IS NOT NULL
          AND (p.event_date < CURRENT_DATE OR (p.event_date = CURRENT_DATE AND p.event_end_time <= CURRENT_TIME))
      ) target
      WHERE NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.user_id = target.user_id
          AND n.target_type = target.target_type
          AND n.target_id = target.target_id
      )
      ON CONFLICT (user_id, target_type, target_id) WHERE target_type IS NOT NULL AND target_id IS NOT NULL DO NOTHING
    `);
  };
  notifyFinished().catch(() => {});
  setInterval(() => notifyFinished().catch(() => {}), 60_000);
}
boot().catch(err=>{console.error(err);process.exit(1);});
