import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("wallet_accounts", (table) => {
    table.string("ledger_balance").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("wallet_accounts", (table) => {
    table.dropColumn("ledger_balance");
  });
}
