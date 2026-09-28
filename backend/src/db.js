import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const isProduction =
  process.env.NODE_ENV === "production";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  max: 10,

  idleTimeoutMillis: 30_000,

  connectionTimeoutMillis: 10_000,

  ssl: isProduction
    ? {
        rejectUnauthorized: false
      }
    : false
});

pool.on("connect", () => {
  console.log("Conexão PostgreSQL estabelecida.");
});

pool.on("error", (error) => {
  console.error(
    "Erro inesperado no pool PostgreSQL:",
    error
  );
});

export async function query(text, params) {
  return pool.query(text, params);
}

export async function withTransaction(work) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await work(client);

    await client.query("COMMIT");

    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(
        "Erro ao executar ROLLBACK:",
        rollbackError
      );
    }

    throw error;
  } finally {
    client.release();
  }
}
