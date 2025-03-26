import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // 1. Drop the foreign key constraint on person_id.
  await knex.schema.alterTable("people_authorzation", (table) => {
    table.dropForeign(["person_id"]);
  });

  // 2. Drop the unique constraint/index on person_id.
  await knex.schema.alterTable("people_authorzation", (table) => {
    table.dropUnique(["person_id"]);
  });

  // 3. Re-add the foreign key constraint (if you still need it) without the unique constraint.
  await knex.schema.alterTable("people_authorzation", (table) => {
    table
      .foreign("person_id")
      .references("id")
      .inTable("people")
      .onDelete("CASCADE");
  });
}

export async function down(knex: Knex): Promise<void> {
  // To roll back, you would drop the foreign key, re-add the unique constraint, and re-add the foreign key.
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
