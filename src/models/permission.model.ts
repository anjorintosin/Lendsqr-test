import knex from "../config/db";
import { v4 as uuidv4 } from "uuid";

export interface Authorization {
  id: string;
  name: string;
  module: string;
  status: string;
}

export const getAllAuthorizations = async (trx?: any): Promise<{ id: string }[]> => {
  const query = trx ? trx("authorization") : knex("authorization");
  return await query.select("id");
};

export const assignPersonAuthorizations = async (
  personId: string,
  trx?: any
): Promise<void> => {
  const authorizations = await getAllAuthorizations(trx);
  if (authorizations.length === 0) {
    console.warn("No authorizations found. Skipping person authorization assignment.");
    return;
  }

  const personAuthorizations = authorizations.map((auth) => ({
    id: uuidv4(),
    person_id: personId,
    authorization_id: auth.id,
    created_at: new Date(),
  }));

  const query = trx ? trx("people_authorzation") : knex("people_authorzation");
  await query.insert(personAuthorizations);
};

export const findPersonAuthorizations = async (personId: string) => {
  return await knex("people_authorzation")
    .join("authorization", "people_authorzation.authorization_id", "authorization.id")
    .where("people_authorzation.person_id", personId)
    .select("authorization.name", "authorization.status");
};
