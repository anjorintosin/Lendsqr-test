import { createServer } from "./app";

const init = async () => {
  try {
    const server = await createServer();
    await server.start();
    console.log(`[${new Date().toISOString()}] Server running on ${server.info.uri}`);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Failed to start server:`, err);
    process.exit(1);
  }
};

process.on("unhandledRejection", (err) => {
  console.error(`[${new Date().toISOString()}] Unhandled Rejection:`, err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error(`[${new Date().toISOString()}] Uncaught Exception:`, err);
  process.exit(1);
});

process.on("SIGTERM", async () => {
  console.log(`[${new Date().toISOString()}] SIGTERM received. Shutting down server...`);
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log(`[${new Date().toISOString()}] SIGINT received. Cleaning up resources...`);
  process.exit(0);
});

init();
