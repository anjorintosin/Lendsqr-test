import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("people_authorzation", (table) => {
    table.foreign("authorization_id").references("id").inTable("authorization").onDelete("CASCADE");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("people_authorzation", (table) => {
    table.dropForeign(["authorization_id"]);
  });
}
