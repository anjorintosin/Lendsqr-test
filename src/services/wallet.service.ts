import { getCache, setCache } from "../utils/redisUtils";
import { verifyPin } from "../utils/verifyPin";
import { error } from "../utils/errorHandler";
import constants from "../utils/constants";
import { producer } from "../utils/queue";
import { findWalletByPersonId, getUserTransactions, updateWalletBalance, updateWalletLedgerBalance } from "../models/wallet.model";

interface FundWalletPayload {
  userId: string;
  amount: number;
}

interface WithdrawFundsPayload {
    userId: string;
    amount: number;
    pin: string;
}

interface TransferPayload {
    userId: string;
    recipientId: string;
    amount: number;
    pin: string;
  }

export const fundWallet = async (payload: FundWalletPayload): Promise<any> => {
  try {
    const { userId, amount } = payload;

    const cacheKey = `funding:${userId}`;
    const recentFundAttempt = await getCache(cacheKey);
    if (recentFundAttempt) {
      return { error: `Too many funding attempts. Try again later.` }
    }

    const wallet = await findWalletByPersonId(userId);
    if (!wallet) {
      return { error: `Wallet ${constants.NOT_FOUND}` }
    }

   await setCache(cacheKey, "true", 30);

    await updateWalletLedgerBalance(userId, amount, "credit");

    const queueData = {
        type: "credit_wallet",
        queueName: process.env.QUEUE_NAME,
        userId,
        amount
    }
    await producer(queueData);

    return { message: "Request processed successfully" };
  } catch (err) {
    return { error: err.message || constants.GENERIC_ERROR };
  }
};

export const withdrawFunds = async (payload: WithdrawFundsPayload): Promise<any> => {
    try {
      const { userId, amount, pin } = payload;
  
      const cacheKey = `withdrawal:${userId}`;
      const recentWithdrawAttempt = await getCache(cacheKey);
      if (recentWithdrawAttempt) {
        return { error: `Too many withdrawal attempts. Try again later.` };
      }
  
      const isValidPin = await verifyPin(userId, pin);
      if (!isValidPin) {
        return { error: constants.INVALID_PIN };
      }
  
      const wallet = await findWalletByPersonId(userId);
      if (!wallet) {
        return { error: `Wallet ${constants.NOT_FOUND}` };
      }
  
      if (wallet.balance < amount) {
        return { error: constants.INSUFFICIENT_FUNDS };
      }
  
      await setCache(cacheKey, "true", 30);
  
      await updateWalletLedgerBalance(userId, amount, "debit");
  
      const queueData = {
        type: "debit_wallet",
        queueName: process.env.QUEUE_NAME,
        userId,
        amount,
      };
      await producer(queueData);
  
      return { message: "Withdrawal request processed successfully" };
    } catch (err) {
      return { error: err.message || constants.GENERIC_ERROR };
    }
};

export const transferFunds = async (payload: TransferPayload): Promise<any> => {
    try {
      const { userId, recipientId, amount, pin } = payload;
  
      if (userId === recipientId) {
        return { error: 'Cannot transfer to the same account' }
      }
  
      const cacheKey = `transfer:${userId}`;
      const recentTransfer = await getCache(cacheKey);
      if (recentTransfer) {
        return { error: "Too many transfer attempts. Try again later." };
      }
  
      const isValidPin = await verifyPin(userId, pin);
      if (!isValidPin) {
        return { error: constants.INVALID_PIN }
      }
  
      const senderWallet = await findWalletByPersonId(userId);
      if (!senderWallet) return { error: `User's account ${constants.NOT_FOUND}` }
  
      if (senderWallet.balance < amount) return { error: constants.INSUFFICIENT_FUNDS }
  
      const recipientWallet = await findWalletByPersonId(recipientId);
      if (!recipientWallet) return { error: `Beneficiary Account ${constants.NOT_FOUND}` }
  
      await updateWalletLedgerBalance(userId, amount, "debit");
      await updateWalletLedgerBalance(recipientId, amount, "credit");

      await setCache(cacheKey, "true", 30);
  
      const queueData = {
        queueName: process.env.QUEUE_NAME,
        type: "process_transfer",
        userId,
        recipientId,
        amount
      };
      await producer(queueData);
  
      return { message: "Transfer request received and is being processed" };
    } catch (err) {
      console.error("Transfer Error:", err);
      return err.isBoom ? err : error(500, "Internal Server Error");
    }
};

export const getWallet = async (personId: string): Promise<any> => {
    const wallet = await findWalletByPersonId(personId);
    if (!wallet) {
      return { error: `Wallet ${constants.NOT_FOUND}` };
    }
    return wallet;
  };


  export const getUserTransactionsService = async (personId: string, limit: number = 10, offset: number = 0): Promise<any> => {
    const wallet = await findWalletByPersonId(personId);
    if (!wallet) {
      return { error: `Wallet ${constants.NOT_FOUND}` };
    }
  
    const userTransactions = await getUserTransactions(personId, limit, offset)
    return {
        count: userTransactions.length,
        data: userTransactions,
    }
  };
  