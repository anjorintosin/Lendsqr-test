// tests/models/user.model.test.ts
import { createUser, findUserByEmail } from "../../src/models/user.model";
import knex from "../../src/config/db";
import { v4 as uuidv4 } from "uuid";

// --- MOCK SETUP ---

// 1. Mock Knex: simulate a query builder for "people" and attach a transaction method.
jest.mock("../../src/config/db", () => {
  // For non-transaction calls (e.g. findUserByEmail), return a query builder.
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
  
  // Attach a transaction method.
  mockKnex.transaction = jest.fn(async (callback: any) => {
    // Create a query builder for "people" inside the transaction.
    const trxPeopleQueryBuilder = {
      insert: jest.fn(),
      where: jest.fn().mockReturnThis(),
      first: jest.fn(),
    };
    // Create a callable trx using Object.assign so we can add commit and rollback.
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

// 2. Mock UUID so that it always returns a fixed person ID.
jest.mock("uuid", () => ({
  v4: jest.fn(() => "fixed-person-id"),
}));

// 3. Mock external modules.
jest.mock("../../src/models/wallet.model", () => ({
  createWallet: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../src/models/permission.model", () => ({
  assignPersonAuthorizations: jest.fn().mockResolvedValue(undefined),
}));

// --- TESTS ---
describe("User Model", () => {
  describe("createUser", () => {
    it("should create a user successfully", async () => {
      // Arrange: prepare payload
      const payload = {
        name: "John",
        last_name: "Doe",
        email: "john@example.com",
        password: "secret",
        phone_number: "1234567890",
        pin: "1234",
        status: "ACTIVE",
      };

      // Override the transaction mock to simulate a successful insert:
      // The trx for table "people" will return a query builder whose first() returns the inserted user.
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

      // Act
      const result = await createUser(payload);

      // Assert
      expect(result).toEqual({ userId: "fixed-person-id", email: payload.email });

      // Verify that external functions were called with the correct parameters.
      const { createWallet } = require("../../src/models/wallet.model");
      const { assignPersonAuthorizations } = require("../../src/models/permission.model");
      expect(createWallet).toHaveBeenCalledWith("fixed-person-id", expect.any(Function));
      expect(assignPersonAuthorizations).toHaveBeenCalledWith("fixed-person-id", expect.any(Function));
    });

    it("should throw an error if the inserted user is not found", async () => {
      // Arrange: prepare payload
      const payload = {
        name: "Jane",
        last_name: "Doe",
        email: "jane@example.com",
        password: "secret",
        phone_number: "0987654321",
        pin: "4321",
        status: "ACTIVE",
      };

      // Override the transaction mock to simulate that the inserted user is not found.
      const knexModule = require("../../src/config/db");
      knexModule.transaction.mockImplementation(async (callback: any) => {
        const trxPeopleQueryBuilder = {
          insert: jest.fn().mockResolvedValue([1]),
          where: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue(null), // Simulate not found
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

      // Act & Assert: createUser should throw an error.
      // Since the catch block always throws "Failed to create user", we expect that message.
      await expect(createUser(payload)).rejects.toThrow("Failed to create user");
    });
  });

  describe("findUserByEmail", () => {
    it("should return a user if found", async () => {
      // Arrange: override knex mock for findUserByEmail
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

      // Act
      const user = await findUserByEmail("found@example.com");

      // Assert
      expect(user).toEqual({ id: "user-id", email: "found@example.com" });
    });

    it("should return null if user is not found", async () => {
      // Arrange: override knex mock for findUserByEmail to return null.
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

      // Act
      const user = await findUserByEmail("nonexistent@example.com");

      // Assert
      expect(user).toBeNull();
    });
  });
});
