import knex from "../config/db";
import { error } from "../utils/errorHandler";
import constants from "../utils/constants";
import { 
  findWalletByPersonId, 
  updateWalletBalance, 
  updateWalletLedgerBalance 
} from "../models/wallet.model";

export const creditPersonWallet = async (personId: string, amount: number): Promise<void> => {
  try {
    const wallet = await findWalletByPersonId(personId);
    if (!wallet) {
      throw error(404, `Wallet ${constants.NOT_FOUND}`);
    }

    await knex.transaction(async (trx) => {
      // Deduct from ledger_balance and then update the actual balance as credit
      await updateWalletLedgerBalance(personId, amount, "debit", trx);
      await updateWalletBalance(personId, amount, "credit", trx);
    });

    console.log(`Wallet successfully credited for person ${personId}`);
  } catch (err) {
    console.error("Error crediting wallet:", err);
  }
};

export const debitPersonWallet = async (personId: string, amount: number): Promise<void> => {
  try {
    const wallet = await findWalletByPersonId(personId);
    if (!wallet) {
      throw error(404, `Wallet ${constants.NOT_FOUND}`);
    }

    if (wallet.balance < amount) {
      await updateWalletLedgerBalance(personId, amount, "credit");
      throw error(400, constants.INSUFFICIENT_FUNDS);
    }

    await knex.transaction(async (trx) => {
      // Increase ledger_balance then debit the actual balance
      await updateWalletLedgerBalance(personId, amount, "credit", trx);
      await updateWalletBalance(personId, amount, "debit", trx);
    });

    console.log(`Wallet successfully debited for person ${personId}`);
  } catch (err) {
    console.error("Error debiting wallet:", err);
  }
};

export const processTransfer = async (
  senderId: string,
  recipientId: string,
  amount: number
): Promise<void> => {
  try {
    await knex.transaction(async (trx) => {
      // Use the new table name "wallets" with person_id
      const senderWallet = await trx("wallets").where({ person_id: senderId }).first();
      if (!senderWallet) {
        throw new Error(`Sender wallet not found`);
      }
      if (senderWallet.balance < amount) {
        throw new Error(`Insufficient funds`);
      }

      await updateWalletLedgerBalance(senderId, amount, "debit", trx);
      await updateWalletBalance(senderId, amount, "debit", trx);
      await updateWalletLedgerBalance(recipientId, amount, "credit", trx);
      await updateWalletBalance(recipientId, amount, "credit", trx);
    });

    console.log(`Transfer successful: ${senderId} -> ${recipientId} (₦${amount})`);
  } catch (err) {
    console.error("Error processing transfer:", err);
  }
};
