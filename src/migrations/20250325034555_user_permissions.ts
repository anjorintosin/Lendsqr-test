import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("user_permissions", (table) => {
    table.string("id", 191).primary();
    table.string("user_id", 191).notNullable().unique();
    table.string("permission_id", 191).notNullable().unique()
    table.timestamp("created_at").defaultTo(knex.fn.now());

    table.foreign("user_id").references("id").inTable("users").onDelete("CASCADE");
    table.foreign("permission_id").references("id").inTable("permissions").onDelete("CASCADE");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("user_permissions");
}
