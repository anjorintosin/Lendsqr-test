import knex from "../config/db";
import { v4 as uuidv4 } from "uuid";
import { assignPersonAuthorizations } from "./permission.model";
import { createWallet } from "./wallet.model";

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  last_name: string;
  phone_number: string;
  status: "ACTIVE" | "INACTIVE" | "TERMINATED" | "BLOCKED";
  created_at: Date;
}

export interface Account {
  id: string;
  user_id: string;
  balance: number;
  created_at: Date;
}

export interface UserPermission {
  id: string;
  user_id: string;
  permission_id: string;
  created_at: Date;
}

interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  phone_number: string;
  pin: string;
  last_name: string;
  status: string;
}

export const createUser = async (payload: CreateUserPayload) => {
  const personId = uuidv4();

  try {
    await knex.transaction(async (trx) => {
      await trx("people").insert({
        id: personId,
        name: payload.name,
        last_name: payload.last_name, 
        email: payload.email,
        password: payload.password,
        phone_number: payload.phone_number,
        pin: payload.pin,
        status: "ACTIVE",
      });

      const insertedUser = await trx("people").where({ id: personId }).first();
      if (!insertedUser) {
        throw new Error("User was inserted but not found in DB");
      }


      await Promise.all([
        await createWallet(personId, trx),
        await assignPersonAuthorizations(personId, trx),
      ])
    });

    return { userId: personId, email: payload.email };
  } catch (error) {
    console.error("Database transaction error:", error);
    throw new Error("Failed to create user");
  }
};


export const findUserByEmail = async (email: string) => {
  try {
    const user = await knex("people")
      .where({ email })
      .first();

    return user || null;
  } catch (error) {
    console.error("Database error in findUserByEmail:", error);
    throw new Error("Error fetching user by email");
  }
};