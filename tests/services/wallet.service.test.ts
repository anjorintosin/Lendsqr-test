import {
  fundWallet,
  withdrawFunds,
  transferFunds,
  getWallet,
  getUserTransactionsService,
} from "../../src/services/wallet.service"; 

import { getCache, setCache } from "../../src/utils/redisUtils";
import { verifyPin } from "../../src/utils/verifyPin";
import { error } from "../../src/utils/errorHandler";
import constants from "../../src/utils/constants";
import { producer } from "../../src/utils/queue";
import { findWalletByPersonId, getUserTransactions, updateWalletLedgerBalance } from "../../src/models/wallet.model";

jest.mock("../../src/utils/redisUtils", () => ({
  getCache: jest.fn(),
  setCache: jest.fn(),
}));

jest.mock("../../src/utils/verifyPin", () => ({
  verifyPin: jest.fn(),
}));

jest.mock("../../src/utils/errorHandler", () => ({
  error: jest.fn((status, msg) => ({ status, msg })),
}));

jest.mock("../../src/utils/constants", () => ({
  NOT_FOUND: "not found",
  GENERIC_ERROR: "Generic error occurred",
  INVALID_PIN: "Invalid pin",
  INSUFFICIENT_FUNDS: "Insufficient funds",
}));

jest.mock("../../src/utils/queue", () => ({
  producer: jest.fn(),
}));

jest.mock("../../src/models/wallet.model", () => ({
  findWalletByPersonId: jest.fn(),
  getUserTransactions: jest.fn(),
  updateWalletLedgerBalance: jest.fn(),
}));

describe("Wallet Service", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("fundWallet", () => {
    it("should return an error if a recent funding attempt exists", async () => {
      (getCache as jest.Mock).mockResolvedValue("true");

      const payload = { userId: "user1", amount: 100 };
      const result = await fundWallet(payload);

      expect(result).toEqual({ error: "Too many funding attempts. Try again later." });
      expect(getCache).toHaveBeenCalledWith(`funding:user1`);
    });

    it("should return an error if wallet is not found", async () => {
      (getCache as jest.Mock).mockResolvedValue(null);
      (findWalletByPersonId as jest.Mock).mockResolvedValue(null);

      const payload = { userId: "user1", amount: 100 };
      const result = await fundWallet(payload);

      expect(result.error).toContain("Wallet not found");
      expect(findWalletByPersonId).toHaveBeenCalledWith("user1");
    });

    it("should process funding successfully", async () => {
      (getCache as jest.Mock).mockResolvedValue(null);
      (findWalletByPersonId as jest.Mock).mockResolvedValue({ id: "wallet1", balance: 0 });
      (setCache as jest.Mock).mockResolvedValue(undefined);
      (updateWalletLedgerBalance as jest.Mock).mockResolvedValue(undefined);
      (producer as jest.Mock).mockResolvedValue(undefined);

      const payload = { userId: "user1", amount: 100 };
      const result = await fundWallet(payload);

      expect(setCache).toHaveBeenCalledWith(`funding:user1`, "true", 30);
      expect(updateWalletLedgerBalance).toHaveBeenCalledWith("user1", 100, "credit");
      expect(producer).toHaveBeenCalledWith({
        type: "credit_wallet",
        queueName: undefined,
        userId: "user1",
        amount: 100,
      });
      expect(result).toEqual({ message: "Request processed successfully" });
    });
  });

  describe("withdrawFunds", () => {
    it("should return an error if a recent withdrawal attempt exists", async () => {
      (getCache as jest.Mock).mockResolvedValue("true");

      const payload = { userId: "user1", amount: 50, pin: "1234" };
      const result = await withdrawFunds(payload);

      expect(result).toEqual({ error: "Too many withdrawal attempts. Try again later." });
      expect(getCache).toHaveBeenCalledWith(`withdrawal:user1`);
    });

    it("should return an error if the PIN is invalid", async () => {
      (getCache as jest.Mock).mockResolvedValue(null);
      (verifyPin as jest.Mock).mockResolvedValue(false);

      const payload = { userId: "user1", amount: 50, pin: "wrong-pin" };
      const result = await withdrawFunds(payload);

      expect(result).toEqual({ error: constants.INVALID_PIN });
      expect(verifyPin).toHaveBeenCalledWith("user1", "wrong-pin");
    });

    it("should return an error if wallet is not found", async () => {
      (getCache as jest.Mock).mockResolvedValue(null);
      (verifyPin as jest.Mock).mockResolvedValue(true);
      (findWalletByPersonId as jest.Mock).mockResolvedValue(null);

      const payload = { userId: "user1", amount: 50, pin: "1234" };
      const result = await withdrawFunds(payload);

      expect(result.error).toContain("Wallet not found");
      expect(findWalletByPersonId).toHaveBeenCalledWith("user1");
    });

    it("should return an error if insufficient funds", async () => {
      (getCache as jest.Mock).mockResolvedValue(null);
      (verifyPin as jest.Mock).mockResolvedValue(true);
      (findWalletByPersonId as jest.Mock).mockResolvedValue({ id: "wallet1", balance: 30 });

      const payload = { userId: "user1", amount: 50, pin: "1234" };
      const result = await withdrawFunds(payload);

      expect(result.error).toEqual(constants.INSUFFICIENT_FUNDS);
    });

    it("should process withdrawal successfully", async () => {
      (getCache as jest.Mock).mockResolvedValue(null);
      (verifyPin as jest.Mock).mockResolvedValue(true);
      (findWalletByPersonId as jest.Mock).mockResolvedValue({ id: "wallet1", balance: 100 });
      (setCache as jest.Mock).mockResolvedValue(undefined);
      (updateWalletLedgerBalance as jest.Mock).mockResolvedValue(undefined);
      (producer as jest.Mock).mockResolvedValue(undefined);

      const payload = { userId: "user1", amount: 50, pin: "1234" };
      const result = await withdrawFunds(payload);

      expect(setCache).toHaveBeenCalledWith(`withdrawal:user1`, "true", 30);
      expect(updateWalletLedgerBalance).toHaveBeenCalledWith("user1", 50, "debit");
      expect(producer).toHaveBeenCalledWith({
        type: "debit_wallet",
        queueName: undefined,
        userId: "user1",
        amount: 50,
      });
      expect(result).toEqual({ message: "Withdrawal request processed successfully" });
    });
  });

  describe("transferFunds", () => {
    it("should return an error when transferring to the same account", async () => {
      const payload = {
        userId: "user1",
        recipientId: "user1",
        amount: 50,
        pin: "1234",
      };
      const result = await transferFunds(payload);
      expect(result.error).toEqual("Cannot transfer to the same account");
    });

    it("should return an error if a recent transfer attempt exists", async () => {
      (getCache as jest.Mock).mockResolvedValue("true");

      const payload = {
        userId: "user1",
        recipientId: "user2",
        amount: 50,
        pin: "1234",
      };
      const result = await transferFunds(payload);
      expect(result.error).toEqual("Too many transfer attempts. Try again later.");
      expect(getCache).toHaveBeenCalledWith(`transfer:user1`);
    });

    it("should return an error if the PIN is invalid", async () => {
      (getCache as jest.Mock).mockResolvedValue(null);
      (verifyPin as jest.Mock).mockResolvedValue(false);

      const payload = {
        userId: "user1",
        recipientId: "user2",
        amount: 50,
        pin: "wrong-pin",
      };
      const result = await transferFunds(payload);
      expect(result.error).toEqual(constants.INVALID_PIN);
      expect(verifyPin).toHaveBeenCalledWith("user1", "wrong-pin");
    });

    it("should return an error if sender wallet is not found", async () => {
      (getCache as jest.Mock).mockResolvedValue(null);
      (verifyPin as jest.Mock).mockResolvedValue(true);
      (findWalletByPersonId as jest.Mock).mockImplementation((id: string) =>
        id === "user1" ? null : { id: "wallet2", balance: 100 }
      );

      const payload = {
        userId: "user1",
        recipientId: "user2",
        amount: 50,
        pin: "1234",
      };
      const result = await transferFunds(payload);
      expect(result.error).toContain("User's account not found");
    });

    it("should return an error if sender has insufficient funds", async () => {
      (getCache as jest.Mock).mockResolvedValue(null);
      (verifyPin as jest.Mock).mockResolvedValue(true);
      (findWalletByPersonId as jest.Mock).mockImplementation((id: string) =>
        id === "user1"
          ? { id: "wallet1", balance: 30 }
          : { id: "wallet2", balance: 100 }
      );

      const payload = {
        userId: "user1",
        recipientId: "user2",
        amount: 50,
        pin: "1234",
      };
      const result = await transferFunds(payload);
      expect(result.error).toEqual(constants.INSUFFICIENT_FUNDS);
    });

    it("should return an error if recipient wallet is not found", async () => {
      (getCache as jest.Mock).mockResolvedValue(null);
      (verifyPin as jest.Mock).mockResolvedValue(true);
      (findWalletByPersonId as jest.Mock).mockImplementation((id: string) =>
        id === "user1"
          ? { id: "wallet1", balance: 100 }
          : null
      );

      const payload = {
        userId: "user1",
        recipientId: "user2",
        amount: 50,
        pin: "1234",
      };
      const result = await transferFunds(payload);
      expect(result.error).toContain("Beneficiary Account not found");
    });

    it("should process transfer successfully", async () => {
      (getCache as jest.Mock).mockResolvedValue(null);
      (verifyPin as jest.Mock).mockResolvedValue(true);
      (findWalletByPersonId as jest.Mock).mockImplementation((id: string) =>
        id === "user1"
          ? { id: "wallet1", balance: 200 }
          : { id: "wallet2", balance: 100 }
      );
      (updateWalletLedgerBalance as jest.Mock).mockResolvedValue(undefined);
      (setCache as jest.Mock).mockResolvedValue(undefined);
      (producer as jest.Mock).mockResolvedValue(undefined);

      const payload = {
        userId: "user1",
        recipientId: "user2",
        amount: 50,
        pin: "1234",
      };
      const result = await transferFunds(payload);

      expect(updateWalletLedgerBalance).toHaveBeenNthCalledWith(1, "user1", 50, "debit");
      expect(updateWalletLedgerBalance).toHaveBeenNthCalledWith(2, "user2", 50, "credit");
      expect(setCache).toHaveBeenCalledWith(`transfer:user1`, "true", 30);
      expect(producer).toHaveBeenCalledWith({
        queueName: undefined,
        type: "process_transfer",
        userId: "user1",
        recipientId: "user2",
        amount: 50,
      });
      expect(result).toEqual({ message: "Transfer request received and is being processed" });
    });
  });

  describe("getWallet", () => {
    it("should return an error if wallet is not found", async () => {
      (findWalletByPersonId as jest.Mock).mockResolvedValue(null);
      const result = await getWallet("user1");
      expect(result.error).toContain("Wallet not found");
    });

    it("should return wallet details if found", async () => {
      const walletData = { id: "wallet1", balance: 100 };
      (findWalletByPersonId as jest.Mock).mockResolvedValue(walletData);
      const result = await getWallet("user1");
      expect(result).toEqual(walletData);
    });
  });

  describe("getUserTransactionsService", () => {
    it("should return an error if wallet is not found", async () => {
      (findWalletByPersonId as jest.Mock).mockResolvedValue(null);
      const result = await getUserTransactionsService("user1");
      expect(result.error).toContain("Wallet not found");
    });

    it("should return transactions data if wallet is found", async () => {
      const transactions = [{ id: 1 }, { id: 2 }];
      (findWalletByPersonId as jest.Mock).mockResolvedValue({ id: "wallet1", balance: 100 });
      (getUserTransactions as jest.Mock).mockResolvedValue(transactions);

      const result = await getUserTransactionsService("user1", 10, 0);
      expect(result).toEqual({
        count: transactions.length,
        data: transactions,
      });
      expect(getUserTransactions).toHaveBeenCalledWith("user1", 10, 0);
    });
  });
});
