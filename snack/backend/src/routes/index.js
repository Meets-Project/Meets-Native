import { Router } from "express";
import { usersRouter } from "./users.js";
import { socialRouter } from "./social.js";

const router = Router();

router.get("/health", (req, res) => {
  return res.status(200).json({
    ok: true,
    service: "snack-backend",
    uptime: process.uptime(),
  });
});

router.get("/ping", (req, res) => {
  return res.status(200).json({
    ok: true,
    message: "pong",
    timestamp: new Date().toISOString(),
  });
});

router.use("/users", usersRouter);
router.use("/", socialRouter);

export { router };
