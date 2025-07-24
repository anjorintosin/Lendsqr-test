import constants from "../utils/constants";
import { createUser, findUserByEmail } from "../models/user.model";
import { hashManager } from "../utils/bycrpt";
import { generateAuthToken } from "../utils/tokenizer";
import { isUserBlacklisted } from "../utils/lendSqrBlacklist";


interface RegisterUser {
  name: string;
  email: string;
  password: string;
  last_name: string;
  phone_number: string;
  pin: string;
}


export const registerUser = async (payload: RegisterUser): Promise<any> => {
  try {
    const { name, email, password, phone_number, pin, last_name } = payload;
    const blackListedUser = isUserBlacklisted(email, phone_number);
    if (blackListedUser) {
      return { error: constants.BLACKLISTED_USER };
    }
    

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return { error: `User ${constants.EXIST}` };
    }

    const hashedPassword = await hashManager().hash(password);
    const hashedPin = await hashManager().hash(pin)

    const user = await createUser({
      name,
      last_name,
      email,
      password: hashedPassword,
      phone_number,
      status: "ACTIVE",
      pin: hashedPin,
    });

    return { success: true, message: "User registered successfully", user };
  } catch (error) {
    return { error: error.message || constants.GENERIC_ERROR };
  }
};


export const loginUser = async (email: string, password: string): Promise<any> => {
  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return { error: constants.INVALID_CREDENTIALS }
    }

    if(user.status !== "ACTIVE") {
      return { error: constants.INVALID_ACCESS }
    }

    const isPasswordValid = await hashManager().compare(password, user.password);
    if (!isPasswordValid) {
      return { error: constants.INVALID_CREDENTIALS }
    }

    const { password: _, pin, ...userData } = user;
    const token = generateAuthToken(userData.id)

    return { success: true, message: "Login successful", user: userData, token };
  } catch (err) {
    return { error: err.message || constants.GENERIC_ERROR };
  }
};
