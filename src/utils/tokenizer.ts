import dotenv from "dotenv";
dotenv.config();

export const generateAuthToken = (userId: string): string => {
    const SECRET_KEY = process.env.SECRET_KEY || "secret-key";

    const token = Buffer.from(`${userId}:${SECRET_KEY}`).toString("base64");
    
    return `${token}`;
  };  