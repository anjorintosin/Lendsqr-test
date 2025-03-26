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
  
export const getUserTransactionsSchema = Joi.object({
    limit: Joi.number().integer().positive().default(10),
    offset: Joi.number().integer().min(0).default(0),
});
