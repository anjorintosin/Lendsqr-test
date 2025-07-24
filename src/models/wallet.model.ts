import constants from "../utils/constants";
import knex from "../config/db";
import { Knex } from "knex";
import { v4 as uuidv4 } from "uuid";

export interface Wallet {
  id: string;
  person_id: string;
  balance: number;
  previous_balance: number;
  ledger_balance?: number | null;
  status: "ACTIVE" | "INACTIVE" | "TERMINATED" | "BLOCKED";
  is_active: boolean;
  created_at: Date;
  updated_at?: Date | null;
}

export const createWallet = async (personId: string, trx?: Knex.Transaction): Promise<Wallet> => {
    const walletId = uuidv4();
  
    if (trx) {
      await trx("wallets").insert({
        id: walletId,
        person_id: personId,
        balance: 0.0,
        previous_balance: 0.0,
        ledger_balance: 0.00,
        status: "ACTIVE",
        is_active: true,
      });

      const wallet = await trx("wallets").where({ id: walletId }).first();
      return wallet;
    } else {
      await knex("wallets").insert({
        id: walletId,
        person_id: personId,
        balance: 0.0,
        previous_balance: 0.0,
        ledger_balance: null,
        status: "ACTIVE",
        is_active: true,
      });
      const wallet = await knex("wallets").where({ id: walletId }).first();
      return wallet;
    }
  };
  
  

export const findWalletByPersonId = async (personId: string): Promise<Wallet | null> => {
  return (await knex("wallets").where({ person_id: personId }).first()) || null;
};

export const findWalletByPersonIdForUpdate = async (personId: string, trx: Knex.Transaction): Promise<Wallet | null> => {
  // Use FOR UPDATE to lock the row for update
  return (await trx<Wallet>("wallets").where({ person_id: personId }).forUpdate().first()) || null;
};


export const updateWalletBalance = async (
  personId: string,
  amount: number,
  type: "credit" | "debit",
  trx?: Knex.Transaction
): Promise<void> => {
  const qb = trx ? trx("wallets") : knex("wallets");

  const wallet = await qb.where({ person_id: personId }).first();
  if (!wallet) {
    throw new Error("Wallet not found");
  }

  const currentBalance = Number(wallet.balance) || 0;

  const reference = uuidv4();

  const transaction = trx || (await knex.transaction());

  try {
    await transaction("wallets")
      .where({ person_id: personId })
      .update({
        previous_balance: currentBalance,
        balance: wallet.ledger_balance,
      });

    await transaction("user_transactions").insert({
      id: uuidv4(),
      person_id: personId,
      type: type.toUpperCase(),
      amount: amount,
      amount_before: currentBalance,
      amount_after: wallet.ledger_balance,
      reference: reference,
      status: "SUCCESS",
      created_at: knex.fn.now(),
      updated_at: null,
    });

    if (!trx) {
      await transaction.commit();
    }
  } catch (error) {
    console.error("Error updating balance and recording transaction:", error);
    if (!trx) {
      await transaction.rollback();
    }
    throw error;
  }
};

export const updateWalletLedgerBalance = async (
  personId: string,
  amount: number,
  type: "credit" | "debit",
  trx: Knex.Transaction
): Promise<void> => {
  // Always require a transaction and use FOR UPDATE
  const wallet = await findWalletByPersonIdForUpdate(personId, trx);
  if (!wallet) {
    throw new Error("Wallet not found");
  }
  const currentBalance = Number(wallet.ledger_balance) || 0;
  const newBalance = type === "credit" ? currentBalance + amount : currentBalance - amount;
  await trx("wallets").where({ person_id: personId }).update({
    ledger_balance: newBalance,
  });
};

  export const isWalletActive = async (personId: string): Promise<boolean> => {
    try {
      const wallet = await knex("wallets")
        .select("is_active")
        .where({ person_id: personId })
        .andWhere("is_active", true)
        .first();
  
      return !!wallet;
    } catch (err) {
      console.error("Error checking wallet status:", err);
      throw new Error("Failed to verify wallet status");
    }
  };
  


export const getUserTransactions = async (userId: string, limit = 10, offset = 0) => {
    try {
      const transactions = await knex("user_transactions")
        .where({ person_id: userId })
        .orderBy("created_at", "desc")
        .limit(limit)
        .offset(offset);
  
      return transactions;
    } catch (err) {
      console.error("Error fetching user transactions:", err);
      throw new Error("Failed to fetch transactions");
    }
  };