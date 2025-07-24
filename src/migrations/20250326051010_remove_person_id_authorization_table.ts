import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("people_authorzation", (table) => {
    table.dropForeign(["person_id"]);
  });

  await knex.schema.alterTable("people_authorzation", (table) => {
    table.dropUnique(["person_id"]);
  });

  await knex.schema.alterTable("people_authorzation", (table) => {
    table
      .foreign("person_id")
      .references("id")
      .inTable("people")
      .onDelete("CASCADE");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("people_authorzation", (table) => {
    table.dropForeign(["person_id"]);
  });

  await knex.schema.alterTable("people_authorzation", (table) => {
    table.unique(["person_id"]);
  });

  await knex.schema.alterTable("people_authorzation", (table) => {
    table
      .foreign("person_id")
      .references("id")
      .inTable("people")
      .onDelete("CASCADE");
  });
}
