import Hapi from "@hapi/hapi";
import { 
  fundWalletController, 
  withdrawFundsController, 
  transferFundsController 
} from "../controllers/wallet.controller";
import { 
  fundWalletSchema, 
  withdrawFundsSchema, 
  transferFundsSchema 
} from "../validators/wallet.validator";
import { authMiddleware } from "../middlewares/auth.middleware";

export const walletRoutes: Hapi.ServerRoute[] = [
  {
    method: "POST",
    path: "/wallet/fund",
    options: {
      auth: "default",
      pre: [authMiddleware],
      tags: ["api", "Wallet"],
      description: "Fund wallet",
      validate: {
        payload: fundWalletSchema,
        failAction: (request, h, err) => {
          throw err;
        },
      },
      plugins: {
        "hapi-swagger": {
          responses: {
            200: { description: "Wallet funded successfully" },
            400: { description: "Validation error or insufficient funds" },
            500: { description: "Internal server error" },
          },
        },
      },
    },
    handler: fundWalletController,
  },
  {
    method: "POST",
    path: "/wallet/withdraw",
    options: {
      auth: "default",
      pre: [authMiddleware],
      tags: ["api", "Wallet"],
      description: "Withdraw funds from wallet",
      validate: {
        payload: withdrawFundsSchema,
        failAction: (request, h, err) => {
          throw err;
        },
      },
      plugins: {
        "hapi-swagger": {
          responses: {
            200: { description: "Withdrawal successful" },
            400: { description: "Invalid amount or insufficient balance" },
            500: { description: "Internal server error" },
          },
        },
      },
    },
    handler: withdrawFundsController,
  },
  {
    method: "POST",
    path: "/wallet/transfer",
    options: {
      auth: "default",
      pre: [authMiddleware],
      tags: ["api", "Wallet"],
      description: "Transfer funds to another user",
      validate: {
        payload: transferFundsSchema,
        failAction: (request, h, err) => {
          throw err;
        },
      },
      plugins: {
        "hapi-swagger": {
          responses: {
            200: { description: "Transfer successful" },
            400: { description: "Validation error or insufficient funds" },
            500: { description: "Internal server error" },
          },
        },
      },
    },
    handler: transferFundsController,
  },
];