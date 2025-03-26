import constants from "./constants";


export const validateInput = (payload) => {
  const { email } = payload;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error(constants.INVALID_EMAIL);
  }
};