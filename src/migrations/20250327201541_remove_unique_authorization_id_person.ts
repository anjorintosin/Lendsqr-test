import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("people_authorzation", (table) => {
    // No need to drop a non-existent unique constraint
    table.foreign("authorization_id").references("id").inTable("authorization").onDelete("CASCADE");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("people_authorzation", (table) => {
    table.dropForeign(["authorization_id"]);
  });
}
