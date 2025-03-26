import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("wallet_accounts", (table) => {
    table.string("id", 191).primary();
    table.string("user_id", 191).notNullable().unique();
    table.decimal("balance", 15, 2).notNullable().defaultTo(0.00);
    table.decimal("previous_balance", 15, 2).notNullable().defaultTo(0.00);
    table
    .enum("status", ["ACTIVE", "INACTIVE", "TERMINATED", "BLOCKED"])
    .notNullable()
    .defaultTo("ACTIVE");
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.datetime("updated_at").nullable();

    table.foreign("user_id").references("id").inTable("users").onDelete("CASCADE");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("wallet_accounts");
}
