import Hapi from "@hapi/hapi";
const rateLimit = require("hapi-rate-limit");

export const registerRateLimit = async (server: Hapi.Server) => {
  console.log("Registering rate limiter...");
  
  await server.register({
    plugin: rateLimit,
    options: {},
  });

  console.log("Rate limiting middleware initialized");
};
