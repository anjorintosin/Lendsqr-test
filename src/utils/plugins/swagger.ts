import Hapi from "@hapi/hapi";
import Inert from "@hapi/inert";
import Vision from "@hapi/vision";
import HapiSwagger from "hapi-swagger";
import Pack from "../../../package.json";

export const registerSwagger = async (server: Hapi.Server) => {
  const isProduction = process.env.NODE_ENV === "production";
  const baseUrl = isProduction
    ? process.env.BASE_URL
    : "localhost:3000";

  await server.register([
    Inert,
    Vision,
    {
      plugin: HapiSwagger,
      options: {
        info: {
          title: "Wallet API Documentation",
          version: Pack.version,
          description: "API documentation for the Wallet Service",
        },
        schemes: isProduction ? ["https"] : ["http"],
        host: baseUrl,
        basePath: "/",
        grouping: "tags",
        securityDefinitions: {
          FauxTokenAuth: {
            type: "apiKey",
            name: "Authorization",
            in: "header",
            description: "Faux token-based authentication (Base64 encoded userId:secret)",
          },
        },
        security: [{ FauxTokenAuth: [] }],
      },
    },
  ]);
};
