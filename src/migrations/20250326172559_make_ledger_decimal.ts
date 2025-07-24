import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("wallets", (table) => {
    table.decimal("ledger_balance", 15, 2).nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("wallets", (table) => {
    table.string("ledger_balance", 191).nullable().alter();
  });
}
