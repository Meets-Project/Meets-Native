import dotenv from "dotenv";

// Carregar variáveis de ambiente
dotenv.config({ path: ".env.docker" }); // Docker
dotenv.config({ path: ".env" }); // Local fallback

import { app } from "./app.js";
import { config } from "./config.js";

const nodeEnv = process.env.NODE_ENV || "development";

app.listen(config.port, "0.0.0.0", () => {
  console.log(`
╔════════════════════════════════════════╗
║    🚀 Meets Mobile Backend              ║
║    Porta: ${config.port}                        ║
║    Ambiente: ${nodeEnv}                 ║
║    CORS Origin: ${config.corsOrigin}     ║
╚════════════════════════════════════════╝
  `);
});
