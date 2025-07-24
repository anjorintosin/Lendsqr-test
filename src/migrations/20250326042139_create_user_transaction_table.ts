import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("user_transactions", (table) => {
    table.string("id", 191).primary();
    table.string("person_id", 191).notNullable();
    table.enum("type", ["CREDIT", "DEBIT"]).notNullable();
    table.decimal("amount", 15, 2).notNullable();
    table.decimal("amount_before", 15, 2).notNullable();
    table.decimal("amount_after", 15, 2).notNullable();
    table.string("reference", 191).unique().notNullable();
    table.string("status").defaultTo("PENDING");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.datetime("updated_at").nullable();

    table
      .foreign("person_id")
      .references("id")
      .inTable("people")
      .onDelete("CASCADE");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("user_transactions");
}
