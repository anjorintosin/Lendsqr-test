// tests/models/wallet.model.test.ts
import {
  createWallet,
  findWalletByPersonId,
  updateWalletBalance,
  updateWalletLedgerBalance,
  isWalletActive,
  getUserTransactions,
} from "../../src/models/wallet.model";
import knex from "../../src/config/db";
import { v4 as uuidv4 } from "uuid";

// --- MOCK SETUP ---

// 1. Mock Knex: simulate a query builder for the "wallets" and "user_transactions" tables.
jest.mock("../../src/config/db", () => {
  // A generic query builder mock.
  const mockQueryBuilder = {
    insert: jest.fn(),
    where: jest.fn().mockReturnThis(),
    first: jest.fn(),
    select: jest.fn(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockResolvedValue([]),
  };

  // The main knex function returns our query builder based on table name.
  const mockKnex = jest.fn((table: string) => {
    // For simplicity, return the same mock for "wallets" and "user_transactions"
    return mockQueryBuilder;
  }) as any;

  // Attach a transaction method.
  mockKnex.transaction = jest.fn(async (callback: any) => {
    // Create a trx query builder.
    const trxQueryBuilder = {
      insert: jest.fn(),
      where: jest.fn().mockReturnThis(),
      first: jest.fn(),
      update: jest.fn(),
    };
    // Make a callable trx function and attach commit and rollback.
    const trx = Object.assign(
      jest.fn((table: string) => {
        if (table === "wallets" || table === "user_transactions") {
          return trxQueryBuilder;
        }
        return {};
      }),
      {
        commit: jest.fn(),
        rollback: jest.fn(),
      }
    );
    return callback(trx);
  });

  // Provide a minimal knex.fn with now() (used in updateWalletBalance)
  mockKnex.fn = { now: jest.fn(() => "now") };

  return mockKnex;
});

// 2. Mock UUID so that it always returns "fixed-wallet-id".
jest.mock("uuid", () => ({
  v4: jest.fn(() => "fixed-wallet-id"),
}));

// --- TESTS ---
describe("Wallet Model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createWallet", () => {
    it("should create a wallet when trx is provided", async () => {
      const personId = "person-1";
      // Simulate a trx: when called with "wallets", returns a query builder whose first() returns a wallet.
      const trxInsertMock = jest.fn().mockResolvedValue([1]);
      const trxFirstMock = jest.fn().mockResolvedValue({
        id: "fixed-wallet-id",
        person_id: personId,
        balance: 0.0,
        previous_balance: 0.0,
        ledger_balance: 0.0,
        status: "ACTIVE",
        is_active: true,
        created_at: new Date(),
      });
      const trx = jest.fn((table: string) => {
        if (table === "wallets") {
          return {
            insert: trxInsertMock,
            where: jest.fn().mockReturnThis(),
            first: trxFirstMock,
          };
        }
        return {};
      });
      const result = await createWallet(personId, trx as any);
      expect(trx).toHaveBeenCalledWith("wallets");
      expect(result).toHaveProperty("id", "fixed-wallet-id");
      expect(result).toHaveProperty("person_id", personId);
    });

    it("should create a wallet when trx is not provided", async () => {
      const personId = "person-2";
      // Override knex mock for this test.
      const knexModule = require("../../src/config/db");
      const knexInsertMock = jest.fn().mockResolvedValue([1]);
      const knexFirstMock = jest.fn().mockResolvedValue({
        id: "fixed-wallet-id",
        person_id: personId,
        balance: 0.0,
        previous_balance: 0.0,
        ledger_balance: null,
        status: "ACTIVE",
        is_active: true,
        created_at: new Date(),
      });
      knexModule.mockImplementation((table: string) => {
        if (table === "wallets") {
          return {
            insert: knexInsertMock,
            where: jest.fn().mockReturnThis(),
            first: knexFirstMock,
          };
        }
        return {};
      });
      const result = await createWallet(personId);
      expect(knexModule).toHaveBeenCalledWith("wallets");
      expect(result).toHaveProperty("id", "fixed-wallet-id");
      expect(result).toHaveProperty("person_id", personId);
    });
  });

  describe("findWalletByPersonId", () => {
    it("should return a wallet if found", async () => {
      const personId = "person-1";
      const knexModule = require("../../src/config/db");
      knexModule.mockImplementation((table: string) => {
        if (table === "wallets") {
          return {
            where: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue({
              id: "fixed-wallet-id",
              person_id: personId,
              balance: 0,
              previous_balance: 0,
              ledger_balance: 0,
              status: "ACTIVE",
              is_active: true,
              created_at: new Date(),
            }),
          };
        }
        return {};
      });
      const wallet = await findWalletByPersonId(personId);
      expect(wallet).not.toBeNull();
      expect(wallet).toHaveProperty("person_id", personId);
    });

    it("should return null if wallet not found", async () => {
      const personId = "person-unknown";
      const knexModule = require("../../src/config/db");
      knexModule.mockImplementation((table: string) => {
        if (table === "wallets") {
          return {
            where: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(null),
          };
        }
        return {};
      });
      const wallet = await findWalletByPersonId(personId);
      expect(wallet).toBeNull();
    });
  });

  describe("updateWalletBalance", () => {
    it("should update wallet balance and record transaction when trx is provided", async () => {
      const personId = "person-1";
      const amount = 100;
      // Simulate an existing wallet.
      const wallet = { balance: 0, ledger_balance: 150 };
      const trxUpdateMock = jest.fn().mockResolvedValue(1);
      const trxFirstMock = jest.fn().mockResolvedValue(wallet);
      const trx = jest.fn((table: string) => {
        if (table === "wallets") {
          return {
            where: jest.fn().mockReturnThis(),
            first: trxFirstMock,
            update: trxUpdateMock,
          };
        }
        if (table === "user_transactions") {
          return { insert: jest.fn().mockResolvedValue(1) };
        }
        return {};
      });
      await updateWalletBalance(personId, amount, "credit", trx as any);
      expect(trx).toHaveBeenCalledWith("wallets");
      expect(trx).toHaveBeenCalledWith("user_transactions");
    });

    it("should throw an error if wallet is not found", async () => {
      const personId = "person-2";
      const amount = 50;
      const trxFirstMock = jest.fn().mockResolvedValue(null);
      const trx = jest.fn((table: string) => {
        if (table === "wallets") {
          return {
            where: jest.fn().mockReturnThis(),
            first: trxFirstMock,
          };
        }
        return {};
      });
      await expect(updateWalletBalance(personId, amount, "debit", trx as any)).rejects.toThrow("Wallet not found");
    });
  });

  describe("updateWalletLedgerBalance", () => {
    it("should update ledger balance when trx is provided", async () => {
      const personId = "person-1";
      const amount = 50;
      const trxUpdateMock = jest.fn().mockResolvedValue(1);
      const trxFirstMock = jest.fn().mockResolvedValue({ ledger_balance: 100 });
      const trx = jest.fn((table: string) => {
        if (table === "wallets") {
          return {
            where: jest.fn().mockReturnThis(),
            first: trxFirstMock,
            update: trxUpdateMock,
          };
        }
        return {};
      });
      await updateWalletLedgerBalance(personId, amount, "credit", trx as any);
      expect(trx).toHaveBeenCalledWith("wallets");
      expect(trxUpdateMock).toHaveBeenCalledWith({ ledger_balance: 150 });
    });

    it("should throw an error if wallet is not found", async () => {
      const personId = "person-unknown";
      const amount = 50;
      const trxFirstMock = jest.fn().mockResolvedValue(null);
      const trx = jest.fn((table: string) => {
        if (table === "wallets") {
          return { where: jest.fn().mockReturnThis(), first: trxFirstMock, update: jest.fn() };
        }
        return {};
      });
      await expect(updateWalletLedgerBalance(personId, amount, "debit", trx as any)).rejects.toThrow("Wallet not found");
    });
  });

  describe("isWalletActive", () => {
    it("should return true if wallet is active", async () => {
      const personId = "person-1";
      const knexModule = require("../../src/config/db");
      knexModule.mockImplementation((table: string) => {
        if (table === "wallets") {
          return {
            select: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue({ is_active: true }),
          };
        }
        return {};
      });
      const result = await isWalletActive(personId);
      expect(result).toBe(true);
    });

    it("should return false if wallet is not active", async () => {
      const personId = "person-1";
      const knexModule = require("../../src/config/db");
      knexModule.mockImplementation((table: string) => {
        if (table === "wallets") {
          return {
            select: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(null),
          };
        }
        return {};
      });
      const result = await isWalletActive(personId);
      expect(result).toBe(false);
    });
  });

  describe("getUserTransactions", () => {
    it("should return a list of transactions", async () => {
      const personId = "person-1";
      const transactions = [
        { id: "tx1", person_id: personId, amount: 100, created_at: new Date() },
        { id: "tx2", person_id: personId, amount: 50, created_at: new Date() },
      ];
      const knexModule = require("../../src/config/db");
      knexModule.mockImplementation((table: string) => {
        if (table === "user_transactions") {
          return {
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            offset: jest.fn().mockResolvedValue(transactions),
          };
        }
        return {};
      });
      const result = await getUserTransactions(personId, 10, 0);
      expect(result).toEqual(transactions);
    });

    it("should throw an error if fetching transactions fails", async () => {
      const personId = "person-1";
      const knexModule = require("../../src/config/db");
      knexModule.mockImplementation((table: string) => {
        if (table === "user_transactions") {
          return {
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            offset: jest.fn().mockRejectedValue(new Error("DB error")),
          };
        }
        return {};
      });
      await expect(getUserTransactions(personId)).rejects.toThrow("Failed to fetch transactions");
    });
  });
});
