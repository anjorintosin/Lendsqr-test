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
      await updateWalletBalance(personId, amount, "credit", trx);
    });

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
      await knex.transaction(async (trx) => {
        await updateWalletLedgerBalance(personId, amount, "credit", trx);
      });
      throw error(400, constants.INSUFFICIENT_FUNDS);
    }

    await knex.transaction(async (trx) => {
      await updateWalletBalance(personId, amount, "debit", trx);
    });
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
      const senderWallet = await trx("wallets").where({ person_id: senderId }).first();
      if (!senderWallet) {
        throw new Error(`Sender wallet not found`);
      }
      if (senderWallet.balance < amount) {
        throw new Error(`Insufficient funds`);
      }

      await updateWalletBalance(senderId, amount, "debit", trx);
      await updateWalletBalance(recipientId, amount, "credit", trx);
    });

  } catch (err) {
    console.error("Error processing transfer:", err);
  }
};
