import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("people_authorzation", (table) => {
    table.string("id", 191).primary();
    table.string("person_id", 191).notNullable().unique();
    table.string("authorization_id", 191).notNullable().unique();
    table.timestamp("created_at").defaultTo(knex.fn.now());

    table
      .foreign("person_id")
      .references("id")
      .inTable("people")
      .onDelete("CASCADE");

    table
      .foreign("authorization_id")
      .references("id")
      .inTable("authorization")
      .onDelete("CASCADE");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("people_authorzation");
}
