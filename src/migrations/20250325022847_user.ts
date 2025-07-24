import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (table) => {
    table.string("id", 191).primary();
    table
    .enum("status", ["ACTIVE", "INACTIVE", "TERMINATED", "BLOCKED"])
    .notNullable()
    .defaultTo("ACTIVE");
    table.string("name").notNullable();
    table.string('last_name').notNullable();
    table.string("email", 191).unique().notNullable();
    table.string("password").notNullable();
    table.string("phone_number", 191).unique().notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.datetime("updated_at").nullable();
  });

  await knex.schema.alterTable("users", (table) => {
    table.index(["email", "phone_number"], "idx_user_email_phone");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("users");
}
