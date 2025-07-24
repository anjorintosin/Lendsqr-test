import knex from "../config/db";
import bcrypt from "bcrypt";
import { getCache, setCache } from "../utils/redisUtils";
import { error } from "../utils/errorHandler";
import constants from "../utils/constants";

const MAX_ATTEMPTS = 5;
const BLOCK_TIME = 60 * 5; 


export const verifyPin = async (userId: string, pin: string): Promise<boolean> => {
  const cacheKey = `pin:${userId}`;
  const attemptsKey = `pin_attempts:${userId}`;

  const attempts = await getCache(attemptsKey);
  if (attempts && parseInt(attempts) >= MAX_ATTEMPTS) {
    throw error(429, "Too many failed attempts. Try again later.");
  }


  let hashedPin = await getCache(cacheKey);

  if (!hashedPin) {
    const user = await knex("people").select("pin").where({ id: userId }).first();
    if (!user || !user.pin) return false;

    hashedPin = user.pin;
    await setCache(cacheKey, hashedPin, 60 * 10);
  }

  const isMatch = await bcrypt.compare(pin, hashedPin);

  if (!isMatch) {
    const newAttempts = attempts ? parseInt(attempts) + 1 : 1;
    await setCache(attemptsKey, newAttempts, BLOCK_TIME);
    throw error(400, constants.INVALID_PIN);
  }

  await setCache(attemptsKey, 0, BLOCK_TIME);

  return true;
};
