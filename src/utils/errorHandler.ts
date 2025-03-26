import Boom from "@hapi/boom";
import logger from "./logger";

export const error = (statusCode: number, message: string) => {
  logger.error(`${statusCode} - ${message}`);

  switch (statusCode) {
    case 400:
      return Boom.badRequest(message);
    case 401:
      return Boom.unauthorized(message);
    case 403:
      return Boom.forbidden(message);
    case 404:
      return Boom.notFound(message);
    case 409:
      return Boom.conflict(message);
    case 500:
    default:
      return Boom.badImplementation(message || "Internal Server Error");
  }
};
