import { getCache, setCache } from "../utils/redisUtils";
import { verifyPin } from "../utils/verifyPin";
import { error } from "../utils/errorHandler";
import constants from "../utils/constants";
import { producer } from "../utils/queue";
import knex from "../config/db";
import { findWalletByPersonId, getUserTransactions, updateWalletLedgerBalance, findWalletByPersonIdForUpdate } from "../models/wallet.model";

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

    await knex.transaction(async (trx) => {
      await updateWalletLedgerBalance(userId, amount, "credit", trx);
    });

    const queueData = {
        type: "credit_wallet",
        queueName: process.env.QUEUE_NAME,
        userId,
        amount
    }
    await producer(queueData);

    return { message: "Funding processed successfully" };
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
  
      await knex.transaction(async (trx) => {
        const wallet = await findWalletByPersonIdForUpdate(userId, trx);
        if (!wallet) {
          throw new Error(`Wallet ${constants.NOT_FOUND}`);
        }
        if ((wallet.ledger_balance ?? 0) < amount) {
          throw new Error(constants.INSUFFICIENT_FUNDS);
        }
        await updateWalletLedgerBalance(userId, amount, "debit", trx);
      });
  
      await setCache(cacheKey, "true", 30);
  
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
  
      await knex.transaction(async (trx) => {
        const senderWallet = await findWalletByPersonIdForUpdate(userId, trx);
        if (!senderWallet) throw new Error(`User's account ${constants.NOT_FOUND}`);
        if ((senderWallet.ledger_balance ?? 0) < amount) throw new Error(constants.INSUFFICIENT_FUNDS);
        const recipientWallet = await findWalletByPersonIdForUpdate(recipientId, trx);
        if (!recipientWallet) throw new Error(`Beneficiary Account ${constants.NOT_FOUND}`);
        await updateWalletLedgerBalance(userId, amount, "debit", trx);
        await updateWalletLedgerBalance(recipientId, amount, "credit", trx);
      });
  
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
  