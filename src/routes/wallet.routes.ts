import Hapi from "@hapi/hapi";
import { 
  fundWalletController, 
  withdrawFundsController, 
  transferFundsController,
  getWalletController,
  getUserTransactionsController
} from "../controllers/wallet.controller";
import { 
  fundWalletSchema, 
  withdrawFundsSchema, 
  transferFundsSchema,
  getUserTransactionsSchema,
} from "../validators/wallet.validator";
import { authMiddleware } from "../middlewares/auth.middleware";

export const walletRoutes: Hapi.ServerRoute[] = [
  {
    method: "POST",
    path: "/wallets/fund",
    options: {
      auth: false,
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
    path: "/wallets/withdraw",
    options: {
      auth: false,
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
    path: "/wallets/transfer",
    options: {
      auth: false,
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
  {
    method: "GET",
    path: "/wallets/wallet",
    options: {
      auth: false,
      pre: [authMiddleware],
      tags: ["api", "Wallet"],
      description: "Retrieve wallet details for the authenticated person",
      plugins: {
        "hapi-swagger": {
          responses: {
            200: { description: "Wallet details retrieved successfully" },
            404: { description: "Wallet not found" },
            500: { description: "Internal server error" },
          },
        },
      },
    },
    handler: getWalletController,
  },
  {
    method: "GET",
    path: "/wallets/transactions",
    options: {
      auth: false,
      pre: [authMiddleware],
      tags: ["api", "Wallet"],
      description: "Retrieve user transactions",
      validate: {
        query: getUserTransactionsSchema,
        failAction: (request, h, err) => {
          throw err;
        },
      },
      plugins: {
        "hapi-swagger": {
          responses: {
            200: { description: "Transactions retrieved successfully" },
            400: { description: "Invalid query parameters" },
            500: { description: "Internal server error" },
          },
        },
      },
    },
    handler: getUserTransactionsController,
  },
];