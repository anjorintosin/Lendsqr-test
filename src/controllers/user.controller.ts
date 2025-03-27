import { Request, ResponseToolkit } from "@hapi/hapi";
import { registerUser, loginUser } from "../services/user.service";
import { error } from "../utils/errorHandler";
import { getCache, setCache } from "../utils/redisUtils";
import constants from "../utils/constants";
import { validateInput } from "../utils/validate";

export const registerUserController = async (req: Request, h: ResponseToolkit) => {
  try {
    const payload = req.payload as {
      name: string;
      email: string;
      password: string;
      phone_number: string;
      pin: string;
      last_name: string;
    };

    validateInput(payload)

    const cachedUser = await getCache(`user:${payload.email}`);
    if (cachedUser) {
      return h.response({ error: `User ${constants.EXIST}` }).code(400);
    }

    const result = await registerUser(payload);

    if (result.error) {
      throw error(400, result.error);
    }

    await setCache(`user:${payload.email}`, result.user, 3600);

    return h.response(result).code(201);
  } catch (err) {
    console.error("Error in registerUserController:", err);
    return err.isBoom ? err : error(500, constants.GENERIC_ERROR);
  }
};

export const loginUserController = async (req: Request, h: ResponseToolkit) => {
    try {
      const payload = req.payload as {
        email: string;
        password: string;
      };
  
      const user = await loginUser(payload.email, payload.password);
      if (user.error) {
        throw error(401, user.error);
      }
  
      return h.response(user).code(200);
    } catch (err) {
      console.error("Error in loginUserController:", err);
      return err.isBoom ? err : error(500, constants.GENERIC_ERROR);
    }
};

