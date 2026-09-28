import "dotenv/config";
import { app } from "./app.js";
import { pool } from "./db.js";

const port = Number(process.env.PORT || 3333);

async function runMigrations() {
  /*
   * As migrations são idempotentes.
   *
   * O arquivo migrate.js deve utilizar a mesma DATABASE_URL
   * configurada no ambiente.
   *
   * Para produção, recomendamos executar:
   *
   *   npm run migrate
   *
   * antes do start do servidor.
   *
   * O boot também verifica se o banco está acessível.
   */

  await pool.query("SELECT 1");

  console.log("PostgreSQL conectado com sucesso.");
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
          'O evento "' || e.title ||
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
    /*
     * O erro não deve derrubar a API.
     *
     * Isso é importante porque a criação das notificações
     * é uma tarefa secundária.
     */
    console.error(
      "Erro ao verificar notificações de avaliações:",
      error
    );
  }
}

async function boot() {
  try {
    /*
     * Verifica a conexão com o PostgreSQL antes de iniciar
     * o servidor HTTP.
     */
    await runMigrations();

    /*
     * O Render fornece process.env.PORT.
     *
     * O servidor precisa escutar em 0.0.0.0 para ser
     * acessível externamente.
     */
    const server = app.listen(
      port,
      "0.0.0.0",
      () => {
        console.log(`Meets API listening on 0.0.0.0:${port}`);
        console.log(
          `Environment: ${process.env.NODE_ENV || "development"}`
        );
      }
    );

    /*
     * Verificação inicial das notificações.
     */
    await notifyFinished();

    /*
     * Verifica novamente a cada minuto.
     */
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

    /*
     * Encerramento correto do processo.
     */
    const shutdown = async (signal) => {
      console.log(`${signal} recebido. Encerrando servidor...`);

      clearInterval(notificationInterval);

      server.close(async () => {
        try {
          await pool.end();
          console.log("PostgreSQL desconectado.");
          process.exit(0);
        } catch (error) {
          console.error(
            "Erro ao encerrar PostgreSQL:",
            error
          );
          process.exit(1);
        }
      });

      /*
       * Evita que o processo fique preso indefinidamente.
       */
      setTimeout(() => {
        console.error(
          "Encerramento forçado após timeout."
        );
        process.exit(1);
      }, 10_000).unref();
    };

    process.once("SIGTERM", () => shutdown("SIGTERM"));
    process.once("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("Falha ao iniciar Meets API:", error);

    try {
      await pool.end();
    } catch {
      // Ignora erro durante encerramento do pool.
    }

    process.exit(1);
  }
}

boot();
