import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("authorization", (table) => {
    table.string("id", 191).primary();
    table.string("person_id", 191).notNullable();
    table.string("name").notNullable();
    table.string("module").notNullable();
    table
      .enum("status", ["ACTIVE", "INACTIVE"])
      .notNullable()
      .defaultTo("ACTIVE");
    table.timestamp("created_at").defaultTo(knex.fn.now());

    table
      .foreign("person_id")
      .references("id")
      .inTable("people")
      .onDelete("CASCADE");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("authorization");
}
