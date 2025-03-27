import Hapi from "@hapi/hapi";
import { userRoutes } from "./user.routes";
import { walletRoutes } from "./wallet.routes"

export const registerRoutes = (server: Hapi.Server) => {
  server.route(userRoutes);
  server.route(walletRoutes);  
};
