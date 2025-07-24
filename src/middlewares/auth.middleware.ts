import { Request, ResponseToolkit, Lifecycle } from "@hapi/hapi";
import dotenv from "dotenv";

dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY || "your-secret-key";

export const authMiddleware = async (request: Request, h: ResponseToolkit) => {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    return h.response({ message: "No token provided" }).code(401).takeover();
  }

  try {
    const decoded = Buffer.from(authHeader.split(" ")[1], "base64").toString();
    const [userId, secret] = decoded.split(":");

    if (secret !== SECRET_KEY) {
      throw new Error("Invalid token");
    }

    (request.auth as any).credentials = { userId };

    return h.continue;
  } catch (error) {
    return h.response({ message: "Invalid token" }).code(401).takeover();
  }
};
