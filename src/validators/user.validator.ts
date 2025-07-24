import Joi from "joi";

export const registerUserSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  last_name: Joi.string().min(2).max(50).required(),
  password: Joi.string().min(8).max(100).required(),
  pin: Joi.string().length(4).pattern(/^\d+$/).required(),
  phone_number: Joi.string().pattern(/^[0-9]{10,15}$/).required()
});

export const loginUserSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  });