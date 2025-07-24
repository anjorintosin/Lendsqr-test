import Hapi from "@hapi/hapi";
import { loginUserController, registerUserController } from "../controllers/user.controller";
import { loginUserSchema, registerUserSchema } from "../validators/user.validator";

export const userRoutes: Hapi.ServerRoute[] = [
  {
    method: "POST",
    path: "/auth/register",
    options: {
      tags: ["api", "Auth"],
      description: "Register a new user",
      auth: false,
      validate: {
        payload: registerUserSchema,
        failAction: (request, h, err) => {
          throw err;
        },
      },
      plugins: {
        "hapi-swagger": {
          responses: {
            201: { description: "User registered successfully" },
            400: { description: "Validation error or user already exists" },
            500: { description: "Internal server error" },
          },
        },
      },
    },
    handler: registerUserController,
  },
  {
    method: "POST",
    path: "/auth/login",
    options: {
      tags: ["api", "Auth"],
      auth: false,
      description: "Login a user",
      validate: {
        payload: loginUserSchema,
        failAction: (request, h, err) => {
          throw err;
        },
      },
      plugins: {
        "hapi-swagger": {
          responses: {
            200: { description: "Login successful, returns access token" },
            400: { description: "Invalid credentials" },
            500: { description: "Internal server error" },
          },
        },
      },
    },
    handler: loginUserController,
  },
];
