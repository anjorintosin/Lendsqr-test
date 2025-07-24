import { createUser, findUserByEmail } from "../../src/models/user.model";
import knex from "../../src/config/db";
import { v4 as uuidv4 } from "uuid";

jest.mock("../../src/config/db", () => {
  const peopleQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue({ id: "existing-user-id", email: "test@example.com" }),
  };
  const mockKnex = jest.fn((table: string) => {
    if (table === "people") {
      return peopleQueryBuilder;
    }
    return {};
  }) as any;
  
  mockKnex.transaction = jest.fn(async (callback: any) => {
    const trxPeopleQueryBuilder = {
      insert: jest.fn(),
      where: jest.fn().mockReturnThis(),
      first: jest.fn(),
    };
    const trx = Object.assign(
      jest.fn((table: string) => {
        if (table === "people") return trxPeopleQueryBuilder;
        return {};
      }),
      {
        commit: jest.fn(),
        rollback: jest.fn(),
      }
    );
    return callback(trx);
  });
  
  return mockKnex;
});

jest.mock("uuid", () => ({
  v4: jest.fn(() => "fixed-person-id"),
}));

jest.mock("../../src/models/wallet.model", () => ({
  createWallet: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../src/models/permission.model", () => ({
  assignPersonAuthorizations: jest.fn().mockResolvedValue(undefined),
}));

describe("User Model", () => {
  describe("createUser", () => {
    it("should create a user successfully", async () => {
      const payload = {
        name: "John",
        last_name: "Doe",
        email: "john@example.com",
        password: "secret",
        phone_number: "1234567890",
        pin: "1234",
        status: "ACTIVE",
      };

      const knexModule = require("../../src/config/db");
      knexModule.transaction.mockImplementation(async (callback: any) => {
        const trxPeopleQueryBuilder = {
          insert: jest.fn().mockResolvedValue([1]),
          where: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue({ id: "fixed-person-id", email: payload.email }),
        };
        const trx = Object.assign(
          jest.fn((table: string) => {
            if (table === "people") return trxPeopleQueryBuilder;
            return {};
          }),
          {
            commit: jest.fn(),
            rollback: jest.fn(),
          }
        );
        return callback(trx);
      });

      const result = await createUser(payload);

      expect(result).toEqual({ userId: "fixed-person-id", email: payload.email });

      const { createWallet } = require("../../src/models/wallet.model");
      const { assignPersonAuthorizations } = require("../../src/models/permission.model");
      expect(createWallet).toHaveBeenCalledWith("fixed-person-id", expect.any(Function));
      expect(assignPersonAuthorizations).toHaveBeenCalledWith("fixed-person-id", expect.any(Function));
    });

    it("should throw an error if the inserted user is not found", async () => {
      const payload = {
        name: "Jane",
        last_name: "Doe",
        email: "jane@example.com",
        password: "secret",
        phone_number: "0987654321",
        pin: "4321",
        status: "ACTIVE",
      };

      const knexModule = require("../../src/config/db");
      knexModule.transaction.mockImplementation(async (callback: any) => {
        const trxPeopleQueryBuilder = {
          insert: jest.fn().mockResolvedValue([1]),
          where: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue(null),
        };
        const trx = Object.assign(
          jest.fn((table: string) => {
            if (table === "people") return trxPeopleQueryBuilder;
            return {};
          }),
          {
            commit: jest.fn(),
            rollback: jest.fn(),
          }
        );
        return callback(trx);
      });

      await expect(createUser(payload)).rejects.toThrow("Failed to create user");
    });
  });

  describe("findUserByEmail", () => {
    it("should return a user if found", async () => {
      const knexModule = require("../../src/config/db");
      knexModule.mockImplementation((table: string) => {
        if (table === "people") {
          return {
            where: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue({ id: "user-id", email: "found@example.com" }),
          };
        }
        return {};
      });

      const user = await findUserByEmail("found@example.com");

      expect(user).toEqual({ id: "user-id", email: "found@example.com" });
    });

    it("should return null if user is not found", async () => {
      const knexModule = require("../../src/config/db");
      knexModule.mockImplementation((table: string) => {
        if (table === "people") {
          return {
            where: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(null),
          };
        }
        return {};
      });

      const user = await findUserByEmail("nonexistent@example.com");

      expect(user).toBeNull();
    });
  });
});