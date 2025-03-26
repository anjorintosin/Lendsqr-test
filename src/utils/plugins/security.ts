import Hapi from "@hapi/hapi";
import helmet from "helmet";

export const registerSecurity = async (server: Hapi.Server) => {
  server.ext("onRequest", (request, h) => {
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:"],
          connectSrc: ["'self'"],
          frameAncestors: ["'self'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
    })(request.raw.req, request.raw.res, () => {});

    return h.continue;
  });

  console.log("Security middleware initialized");
};
