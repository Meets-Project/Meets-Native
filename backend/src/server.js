import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app } from "./app.js";
import { pool } from "./db.js";

const port = Number(process.env.PORT || 3333);

async function checkDatabase() {
  await pool.query("SELECT 1");
  console.log("PostgreSQL conectado com sucesso.");
}

async function runMigrations() {
  const dir = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "migrations"
  );
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  const files = (await fs.readdir(dir))
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) {
    const already = await pool.query(
      "SELECT 1 FROM _migrations WHERE filename=$1",
      [file]
    );
    if (already.rows.length > 0) continue;
    const sql = (await fs.readFile(path.join(dir, file), "utf8")).replace(
      /^\uFEFF/,
      ""
    );
    await pool.query(sql);
    await pool.query("INSERT INTO _migrations (filename) VALUES ($1)", [file]);
    console.log(`Migration aplicada: ${file}`);
  }
  console.log("Migrations verificadas.");
}

async function notifyFinished() {
  try {
    await pool.query(`
      INSERT INTO notifications (
        user_id,
        title,
        body,
        target_type,
        target_id,
        target_token
      )
      SELECT
        target.user_id,
        target.title,
        target.body,
        target.target_type,
        target.target_id,
        target.target_token
      FROM (
        SELECT
          ep.user_id,
          'Avalie o evento que você participou' AS title,
          'O evento "' ||
            e.title ||
            '" terminou. Toque para avaliar sua experiência.' AS body,
          'event-rating' AS target_type,
          e.id::text AS target_id,
          e.share_token AS target_token
        FROM event_participants ep
        JOIN events e
          ON e.id = ep.event_id
        WHERE
          e.event_date IS NOT NULL
          AND e.event_end_time IS NOT NULL
          AND (
            e.event_date < CURRENT_DATE
            OR (
              e.event_date = CURRENT_DATE
              AND e.event_end_time <= CURRENT_TIME
            )
          )

        UNION ALL

        SELECT
          ep.user_id,
          'Avalie a apresentação' AS title,
          'A apresentação "' ||
            COALESCE(p.title, 'Apresentação') ||
            '" terminou. Toque para avaliar.' AS body,
          'presentation-rating' AS target_type,
          p.id::text AS target_id,
          p.share_token AS target_token
        FROM posts p
        JOIN event_participants ep
          ON ep.event_id = p.mentioned_event_id
        WHERE
          (
            p.type = 'presentation'
            OR p.presentation_id IS NOT NULL
          )
          AND p.event_date IS NOT NULL
          AND p.event_end_time IS NOT NULL
          AND (
            p.event_date < CURRENT_DATE
            OR (
              p.event_date = CURRENT_DATE
              AND p.event_end_time <= CURRENT_TIME
            )
          )
      ) target
      WHERE NOT EXISTS (
        SELECT 1
        FROM notifications n
        WHERE
          n.user_id = target.user_id
          AND n.target_type = target.target_type
          AND n.target_id = target.target_id
      )
      ON CONFLICT (
        user_id,
        target_type,
        target_id
      )
      WHERE
        target_type IS NOT NULL
        AND target_id IS NOT NULL
      DO NOTHING
    `);

    console.log("Notificações de avaliações verificadas.");
  } catch (error) {
    console.error(
      "Erro ao verificar notificações:",
      error
    );
  }
}

async function boot() {
  try {
    await checkDatabase();
    await runMigrations();

    const server = app.listen(
      port,
      "0.0.0.0",
      () => {
        console.log(
          `Meets API listening on 0.0.0.0:${port}`
        );

        console.log(
          `Environment: ${
            process.env.NODE_ENV || "development"
          }`
        );
      }
    );

    await notifyFinished();

    const notificationInterval = setInterval(
      () => {
        notifyFinished().catch((error) => {
          console.error(
            "Erro no intervalo de notificações:",
            error
          );
        });
      },
      60_000
    );

    const shutdown = async (signal) => {
      console.log(
        `${signal} recebido. Encerrando servidor...`
      );

      clearInterval(notificationInterval);

      server.close(async () => {
        try {
          await pool.end();

          console.log(
            "PostgreSQL desconectado."
          );

          process.exit(0);
        } catch (error) {
          console.error(
            "Erro ao encerrar PostgreSQL:",
            error
          );

          process.exit(1);
        }
      });

      setTimeout(() => {
        console.error(
          "Encerramento forçado após timeout."
        );

        process.exit(1);
      }, 10_000).unref();
    };

    process.once(
      "SIGTERM",
      () => shutdown("SIGTERM")
    );

    process.once(
      "SIGINT",
      () => shutdown("SIGINT")
    );
  } catch (error) {
    console.error(
      "Falha ao iniciar Meets API:",
      error
    );

    try {
      await pool.end();
    } catch {
      // Ignora erro durante encerramento.
    }

    process.exit(1);
  }
}

boot();
