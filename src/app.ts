import Hapi from "@hapi/hapi";
import dotenv from "dotenv";
import Knex from "knex";
import { Model } from "objection";
import knexConfig from "./config/knexfile";
import { registerSwagger } from "./utils/plugins/swagger";
import { authMiddleware } from "./middlewares/auth.middleware";
import { subscriber } from "./utils/queue";
import { registerRoutes } from "./routes/index.routes";

dotenv.config();

const db = Knex(knexConfig);
Model.knex(db);

export const createServer = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost",
    routes: {
      cors: {
        origin: ["*"],
      },
    },
  });

  await registerSwagger(server);
  subscriber();

  server.auth.scheme("custom", () => ({
    authenticate: authMiddleware,
  }));

  server.auth.strategy("default", "custom");
  server.auth.default("default");

  registerRoutes(server);

  process.on("SIGINT", async () => {
    console.log("Shutting down gracefully...");
    await db.destroy();
    await server.stop();
    console.log("Server stopped.");
    process.exit(0);
  });

  return server;
};
