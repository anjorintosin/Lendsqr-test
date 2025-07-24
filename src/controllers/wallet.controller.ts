import { Request, ResponseToolkit } from "@hapi/hapi";
import { fundWallet, withdrawFunds, transferFunds, getWallet, getUserTransactionsService } from "../services/wallet.service";
import { validatePermission } from "../middlewares/permission.middleware";
import { error } from "../utils/errorHandler";

export const fundWalletController = async (req: Request, h: ResponseToolkit) => {
    try {
      await validatePermission(req, ["FUND_WALLET"]);
  
      const userId: any = req.auth.credentials.userId;
      const payload = req.payload as { amount: number; pin: string };
  
      const result = await fundWallet({ userId, ...payload });
  
      if (result.error) {
        throw error(400, result.error);
      }
  
      return h.response(result).code(200);
    } catch (err) {
      console.error("Error in fundWalletController:", err);
      return err.isBoom ? err : error(500, "Internal Server Error");
    }
};  


export const withdrawFundsController = async (req: Request, h: ResponseToolkit) => {
    try {
      await validatePermission(req, ["WITHDRAW_FUNDS"]);
  
      const userId: any = req.auth.credentials.userId;
      const payload = req.payload as { amount: number; pin: string };
  
      const result = await withdrawFunds({ userId, ...payload });
  
      if (result.error) {
        throw error(400, result.error);
      }
  
      return h.response(result).code(200);
    } catch (err) {
      console.error("Error in withdrawFundsController:", err);
      return err.isBoom ? err : error(500, "Internal Server Error");
    }
  };
  

  export const transferFundsController = async (req: Request, h: ResponseToolkit) => {
    try {
      await validatePermission(req, ["TRANSFER_FUNDS"]);
  
      const userId: any = req.auth.credentials.userId;
      const payload = req.payload as { recipientId: string; amount: number; pin: string };
  
      const result = await transferFunds({ userId, ...payload });
  
      if (result.error) {
        throw error(400, result.error);
      }
  
      return h.response(result).code(200);
    } catch (err) {
      console.error("Error in transferFundsController:", err);
      return err.isBoom ? err : error(500, "Internal Server Error");
    }
  };
  
  export const getWalletController = async (req: Request, h: ResponseToolkit) => {
    try {
    await validatePermission(req, ["VIEW_WALLET"]);
      const personId: any = req.auth.credentials.userId;
      const result = await getWallet(personId);
      if (result.error) {
        throw error(404, result.error);
      }
      return h.response(result).code(200);
    } catch (err) {
      console.error("Error in getWalletController:", err);
      return err.isBoom ? err : error(500, "Internal Server Error");
    }
  };

  export const getUserTransactionsController = async (req: Request, h: ResponseToolkit) => {
    try {
      await validatePermission(req, ["VIEW_TRANSACTIONS"]);
      
      const userId: any = req.auth.credentials.userId;
      const { limit, offset } = req.query;
      
      const transactions = await getUserTransactionsService(userId, Number(limit) || 10, Number(offset) || 0);
      
      return h.response({ transactions }).code(200);
    } catch (err) {
      console.error("Error in getUserTransactionsController:", err);
      return err.isBoom ? err : error(500, "Internal Server Error");
    }
  };
  