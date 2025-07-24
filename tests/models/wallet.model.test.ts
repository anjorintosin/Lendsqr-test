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

jest.mock("../../src/config/db", () => {
  const mockQueryBuilder = {
    insert: jest.fn(),
    where: jest.fn().mockReturnThis(),
    first: jest.fn(),
    select: jest.fn(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockResolvedValue([]),
    update: jest.fn(),
    forUpdate: jest.fn().mockReturnThis(),
  };

  const mockKnex = jest.fn((table: string) => {
    return mockQueryBuilder;
  }) as any;

  mockKnex.transaction = jest.fn(async (callback: any) => {
    const trxQueryBuilder = {
      insert: jest.fn(),
      where: jest.fn().mockReturnThis(),
      first: jest.fn(),
      update: jest.fn(),
      forUpdate: jest.fn().mockReturnThis(),
    };
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

  mockKnex.fn = { now: jest.fn(() => "now") };

  return mockKnex;
});

jest.mock("uuid", () => ({
  v4: jest.fn(() => "fixed-wallet-id"),
}));

describe("Wallet Model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createWallet", () => {
    it("should create a wallet when trx is provided", async () => {
      const personId = "person-1";
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
            forUpdate: jest.fn().mockReturnThis(),
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
            forUpdate: jest.fn().mockReturnThis(),
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
            forUpdate: jest.fn().mockReturnThis(),
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
            forUpdate: jest.fn().mockReturnThis(),
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
      const wallet = { balance: 0, ledger_balance: 150 };
      const trxUpdateMock = jest.fn().mockResolvedValue(1);
      const trxFirstMock = jest.fn().mockResolvedValue(wallet);
      const trx = jest.fn((table: string) => {
        if (table === "wallets") {
          return {
            where: jest.fn().mockReturnThis(),
            first: trxFirstMock,
            update: trxUpdateMock,
            forUpdate: jest.fn().mockReturnThis(),
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
            forUpdate: jest.fn().mockReturnThis(),
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
            forUpdate: jest.fn().mockReturnThis(),
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
          return { where: jest.fn().mockReturnThis(), first: trxFirstMock, update: jest.fn(), forUpdate: jest.fn().mockReturnThis() };
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
            forUpdate: jest.fn().mockReturnThis(),
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
            forUpdate: jest.fn().mockReturnThis(),
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
            forUpdate: jest.fn().mockReturnThis(),
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
            forUpdate: jest.fn().mockReturnThis(),
          };
        }
        return {};
      });
      await expect(getUserTransactions(personId)).rejects.toThrow("Failed to fetch transactions");
    });
  });
});