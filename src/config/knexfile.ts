import type { Knex } from "knex";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const config: Knex.Config = {
  client: "mysql2",
  connection: {
    host: "sql7.freesqldatabase.com",
    user: "sql7769376",
    password: "MuxIPemP5m",
    database: "sql7769376",
    port: Number(3306),
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
