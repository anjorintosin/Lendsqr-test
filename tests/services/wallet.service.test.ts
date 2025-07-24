import { fundWallet, withdrawFunds, transferFunds, getWallet, getUserTransactionsService } from "../../src/services/wallet.service";
import { getCache, setCache } from "../../src/utils/redisUtils";
import { verifyPin } from "../../src/utils/verifyPin";
import { producer } from "../../src/utils/queue";
import { findWalletByPersonId, getUserTransactions, updateWalletLedgerBalance } from "../../src/models/wallet.model";
import constants from "../../src/utils/constants";

jest.mock("../../src/utils/redisUtils", () => ({
  getCache: jest.fn(),
  setCache: jest.fn(),
}));

jest.mock("../../src/utils/verifyPin", () => ({
  verifyPin: jest.fn(),
}));

jest.mock("../../src/utils/queue", () => ({
  producer: jest.fn(),
}));

jest.mock("../../src/models/wallet.model", () => ({
  findWalletByPersonId: jest.fn(),
  getUserTransactions: jest.fn(),
  updateWalletLedgerBalance: jest.fn(),
  findWalletByPersonIdForUpdate: jest.fn(),
}));

describe("Wallet Service", () => {
  describe("fundWallet", () => {
    it("should return an error if too many funding attempts", async () => {
      (getCache as jest.Mock).mockResolvedValue(true);
      const response = await fundWallet({ userId: "123", amount: 100 });
      expect(response).toEqual({ error: "Too many funding attempts. Try again later." });
    });

    it("should return an error if wallet is not found", async () => {
      (getCache as jest.Mock).mockResolvedValue(null);
      (findWalletByPersonId as jest.Mock).mockResolvedValue(null);
      const response = await fundWallet({ userId: "123", amount: 100 });
      expect(response).toEqual({ error: `Wallet ${constants.NOT_FOUND}` });
    });

    it("should process funding successfully", async () => {
      (findWalletByPersonId as jest.Mock).mockResolvedValue({ id: "123", balance: 500 });
      (updateWalletLedgerBalance as jest.Mock).mockResolvedValue(true);
      (producer as jest.Mock).mockResolvedValue(true);
      const response = await fundWallet({ userId: "123", amount: 100 });
      expect(response).toEqual({ message: "Funding processed successfully" });
    });
  });

  describe("withdrawFunds", () => {
    it("should return an error if too many withdrawal attempts", async () => {
      (getCache as jest.Mock).mockResolvedValue(true);
      const response = await withdrawFunds({ userId: "123", amount: 50, pin: "1234" });
      expect(response).toEqual({ error: "Too many withdrawal attempts. Try again later." });
    });

    it("should return an error if PIN is invalid", async () => {
      (getCache as jest.Mock).mockResolvedValue(null);
      (verifyPin as jest.Mock).mockResolvedValue(false);
      const response = await withdrawFunds({ userId: "123", amount: 50, pin: "1234" });
      expect(response).toEqual({ error: constants.INVALID_PIN });
    });

    it("should process withdrawal successfully", async () => {
      (verifyPin as jest.Mock).mockResolvedValue(true);
      // Mock findWalletByPersonIdForUpdate to return a wallet with sufficient ledger_balance
      const mockWallet = { id: "123", ledger_balance: 200 };
      const { findWalletByPersonIdForUpdate } = require("../../src/models/wallet.model");
      (findWalletByPersonIdForUpdate as jest.Mock).mockResolvedValue(mockWallet);
      (updateWalletLedgerBalance as jest.Mock).mockResolvedValue(true);
      (producer as jest.Mock).mockResolvedValue(true);
      const response = await withdrawFunds({ userId: "123", amount: 50, pin: "1234" });
      expect(response).toEqual({ message: "Withdrawal request processed successfully" });
    });
  });

  describe("transferFunds", () => {
    it("should return an error if transferring to the same account", async () => {
      const response = await transferFunds({ userId: "123", recipientId: "123", amount: 50, pin: "1234" });
      expect(response).toEqual({ error: "Cannot transfer to the same account" });
    });

    it("should return an error if PIN is invalid", async () => {
      (verifyPin as jest.Mock).mockResolvedValue(false);
      const response = await transferFunds({ userId: "123", recipientId: "456", amount: 50, pin: "1234" });
      expect(response).toEqual({ error: constants.INVALID_PIN });
    });

    it("should process transfer successfully", async () => {
      (verifyPin as jest.Mock).mockResolvedValue(true);
      // Mock sender and recipient wallets with sufficient ledger_balance
      const { findWalletByPersonIdForUpdate } = require("../../src/models/wallet.model");
      (findWalletByPersonIdForUpdate as jest.Mock)
        .mockResolvedValueOnce({ id: "123", ledger_balance: 200 }) // sender
        .mockResolvedValueOnce({ id: "456", ledger_balance: 100 }); // recipient
      (updateWalletLedgerBalance as jest.Mock).mockResolvedValue(true);
      (producer as jest.Mock).mockResolvedValue(true);
      const response = await transferFunds({ userId: "123", recipientId: "456", amount: 50, pin: "1234" });
      expect(response).toEqual({ message: "Transfer request received and is being processed" });
    });
  });

  describe("getWallet", () => {
    it("should return an error if wallet is not found", async () => {
      (findWalletByPersonId as jest.Mock).mockResolvedValue(null);
      const response = await getWallet("123");
      expect(response).toEqual({ error: `Wallet ${constants.NOT_FOUND}` });
    });

    it("should return wallet details", async () => {
      (findWalletByPersonId as jest.Mock).mockResolvedValue({ id: "123", balance: 500 });
      const response = await getWallet("123");
      expect(response).toEqual({ id: "123", balance: 500 });
    });
  });

  describe("getUserTransactionsService", () => {
    it("should return an error if wallet is not found", async () => {
      (findWalletByPersonId as jest.Mock).mockResolvedValue(null);
      const response = await getUserTransactionsService("123", 10, 0);
      expect(response).toEqual({ error: `Wallet ${constants.NOT_FOUND}` });
    });

    it("should return transactions successfully", async () => {
      (findWalletByPersonId as jest.Mock).mockResolvedValue({ id: "123" });

      (getUserTransactions as jest.Mock).mockResolvedValue([{ id: "txn_1", amount: 100 }]);
      const response = await getUserTransactionsService("123", 10, 0);
      expect(response).toEqual({ count: 1, data: [{ id: "txn_1", amount: 100 }] });
    });
  });
});
