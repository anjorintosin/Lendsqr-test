import type { Knex } from "knex";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const config: Knex.Config = {
  client: "mysql2",
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: Number(process.env.DB_PORT),
    charset: "utf8mb4",
  },
  pool: { min: 2, max: 10 },
  debug: true,
  migrations: {
    tableName: "knex_migrations",
    directory: path.resolve(__dirname, "../migrations"),
  },
};

export default config;
