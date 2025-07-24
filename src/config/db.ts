import Knex from "knex";
import knexConfig from "./knexfile";

const knexInstance = Knex(knexConfig);

export default knexInstance; 