import { createServer } from "./app";

const init = async () => {
  try {
    const server = await createServer();
    await server.start();
    console.log(`Server running on ${server.info.uri}`);
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});

init();
