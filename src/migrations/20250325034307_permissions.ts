import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("permissions", (table) => {
    table.string("id", 191).primary();
    table.string("name").notNullable();
    table.string("module").notNullable();
    table.enum("status", ["ACTIVE", "INACTIVE"]).notNullable().defaultTo("ACTIVE");
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("permissions");
}