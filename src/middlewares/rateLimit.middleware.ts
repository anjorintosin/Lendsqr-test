import Hapi from "@hapi/hapi";
const rateLimit = require("hapi-rate-limit");

export const registerRateLimit = async (server: Hapi.Server) => {
  await server.register({
    plugin: rateLimit,
    options: {},
  });
};
