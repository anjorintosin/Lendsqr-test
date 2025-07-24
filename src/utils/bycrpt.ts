import bcrypt from "bcrypt";

const saltRounds: number = 10;

export const hashManager = () => {
  return {
    async hash(password: string): Promise<string> {
      return await bcrypt.hash(password, saltRounds);
    },
    async compare(password: string, hash: string): Promise<boolean> {
      return await bcrypt.compare(password, hash);
    },
  };
};
