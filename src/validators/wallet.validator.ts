import Joi from "joi";

export const fundWalletSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required(),
  pin: Joi.string().length(4).pattern(/^\d+$/).required(),
});

export const withdrawFundsSchema = Joi.object({
    amount: Joi.number().positive().precision(2).required(),
    pin: Joi.string().length(4).pattern(/^\d+$/).required(),
});

export const transferFundsSchema = Joi.object({
    recipientId: Joi.string().uuid().required(),
    amount: Joi.number().positive().precision(2).required(),
    pin: Joi.string().length(4).pattern(/^\d+$/).required(),
});
  