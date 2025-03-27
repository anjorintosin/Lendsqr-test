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
  
  const newBalance = type === "credit" ? wallet.balance + amount : wallet.balance - amount;

  const reference = uuidv4();

  const transaction = trx || (await knex.transaction());

  try {
    await transaction("wallets")
      .where({ person_id: personId })
      .update({
        previous_balance: currentBalance,
        balance: newBalance,
        ledger_balance: newBalance,
      });

    await transaction("user_transactions").insert({
      id: uuidv4(),
      person_id: personId,
      type: type.toUpperCase(),
      amount: amount,
      amount_before: currentBalance,
      amount_after: newBalance,
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
    trx?: Knex.Transaction
  ): Promise<void> => {
    const qb = trx ? trx("wallets") : knex("wallets");
  
    const wallet = await qb.where({ person_id: personId }).first();
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    const currentBalance = Number(wallet.ledger_balance) || 0;
    const newBalance = type === "credit" ? currentBalance + amount : currentBalance - amount;

    let affectedRows;
    if (trx) {
      affectedRows = await trx("wallets").where({ person_id: personId }).update({
        ledger_balance: Number(newBalance),
      });
    } else {
      affectedRows = await knex("wallets").where({ person_id: personId }).update({
        ledger_balance: newBalance,
      });

    }
  };

export const isWalletActive = async (personId: string): Promise<boolean> => {
  const wallet = await knex("wallets")
    .select("is_active")
    .where({ person_id: personId })
    .first();

  return wallet ? wallet.is_active : false;
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

