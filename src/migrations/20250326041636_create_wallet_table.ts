import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("wallets", (table) => {
    table.string("id", 191).primary();
    table.string("person_id", 191).notNullable().unique();
    table.decimal("balance", 15, 2).notNullable().defaultTo(0.00);
    table.decimal("previous_balance", 15, 2).notNullable().defaultTo(0.00);
    table
      .enum("status", ["ACTIVE", "INACTIVE", "TERMINATED", "BLOCKED"])
      .notNullable()
      .defaultTo("ACTIVE");
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.datetime("updated_at").nullable();
    table.string("ledger_balance").nullable();

    table
      .foreign("person_id")
      .references("id")
      .inTable("people")
      .onDelete("CASCADE");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("wallets");
}
