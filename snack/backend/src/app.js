import cors from "cors";
import express from "express";
import { router } from "./routes/index.js";
import { config, validateConfig } from "./config.js";
import { initializeFirebase } from "./firebase.js";

validateConfig();
initializeFirebase();

const app = express();

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: config.corsCredentials,
  }),
);
app.use(express.json({ limit: config.jsonBodyLimit }));

app.get("/", (req, res) => {
  return res.status(200).json({
    ok: true,
    message: "Meets Mobile Backend",
    health: "/health",
    api: "/api",
  });
});

app.get("/health", (req, res) => {
  return res.status(200).json({
    ok: true,
    service: "snack-backend",
    uptime: process.uptime(),
  });
});

app.use("/api", router);

export { app };
