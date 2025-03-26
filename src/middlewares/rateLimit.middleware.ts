import Hapi from "@hapi/hapi";
const rateLimit = require("hapi-rate-limit");

export const registerRateLimit = async (server: Hapi.Server) => {
  console.log("Registering rate limiter...");
  
  await server.register({
    plugin: rateLimit,
    options: {}, // Start with an empty config to avoid errors
  });

  console.log("Rate limiting middleware initialized");
};
