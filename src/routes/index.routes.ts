import Hapi from "@hapi/hapi";
import { userRoutes } from "./user.routes";
import { walletRoutes } from "./wallet.routes"

export const registerRoutes = (server: Hapi.Server) => {
  server.route(userRoutes);
  server.route(walletRoutes);
  server.route({
    method: "GET",
    path: "/",
    options: {
      auth: false,
    },
    handler: () => ({
      message: "Server is running 🚀",
    }),
  });
  
};
