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
        ledger_balance: null,
        status: "ACTIVE",
        is_active: true,
      });
      // Use a new query builder for the select
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
      // Use a new query builder for the select
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
  const query = trx ? trx("wallets") : knex("wallets");

  // Get current balance before updating
  const wallet = await query.where({ person_id: personId }).first();
  if (!wallet) {
    throw new Error(`Wallet not found for person ${personId}`);
  }

  const previousBalance = wallet.balance;
  const newBalance = type === "credit" ? previousBalance + amount : previousBalance - amount;

  // Update balance and set previous_balance
  await query.where({ person_id: personId }).update({
    balance: newBalance,
    previous_balance: previousBalance, // Save the previous balance before the update
    updated_at: knex.fn.now(),
  });
};

export const updateWalletLedgerBalance = async (
  personId: string,
  amount: number,
  type: "credit" | "debit",
  trx?: Knex.Transaction
): Promise<void> => {
  const query = trx ? trx("wallets") : knex("wallets");

  if (type === "credit") {
    await query.where({ person_id: personId }).increment("ledger_balance", amount);
  } else {
    await query.where({ person_id: personId }).decrement("ledger_balance", amount);
  }
};

export const isWalletActive = async (personId: string): Promise<boolean> => {
  const wallet = await knex("wallets")
    .select("is_active")
    .where({ person_id: personId })
    .first();

  return wallet ? wallet.is_active : false;
};
