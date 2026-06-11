import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { agentsRouter } from "./routes/agents.js";
import { auditRouter } from "./routes/audit.js";
import { claimsRouter } from "./routes/claims.js";
import { credentialsRouter } from "./routes/credentials.js";
import { delegationsRouter } from "./routes/delegations.js";
import { presentationsRouter } from "./routes/presentations.js";
import { referralsRouter } from "./routes/referrals.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.FRONTEND_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.use("/api/agents", agentsRouter);
  app.use("/api/credentials", credentialsRouter);
  app.use("/api/presentations", presentationsRouter);
  app.use("/api/claims", claimsRouter);
  app.use("/api/delegations", delegationsRouter);
  app.use("/api/referrals", referralsRouter);
  app.use("/api", auditRouter);

  app.use(errorHandler);

  return app;
}
