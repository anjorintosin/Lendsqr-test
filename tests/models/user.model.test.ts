jest.mock("../../src/models/wallet.model", () => ({
  createWallet: jest.fn().mockResolvedValue(true),
}));

jest.mock("../../src/models/permission.model", () => ({
  assignPersonAuthorizations: jest.fn().mockResolvedValue(true),
}));

const mockQueryBuilder = {
  insert: jest.fn().mockResolvedValue(undefined),
  where: jest.fn().mockReturnThis(),
  first: jest.fn(),
};

const mockTrx = jest.fn().mockImplementation((tableName) => {
  if (tableName === "people") {
    return mockQueryBuilder;
  }
  return {};
});

const mockKnex = Object.assign(
  jest.fn().mockImplementation((tableName) => {
    if (tableName === "people") {
      return mockQueryBuilder;
    }
    return {};
  }),
  {
    transaction: jest.fn(async (cb) => {
      return await cb(mockTrx);
    }),
  }
);

jest.mock("../../src/config/db", () => mockKnex);

import { createUser, findUserByEmail } from "../../src/models/user.model";

describe("User Model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createUser", () => {
    it("should throw an error if inserted user is not found", async () => {
      mockQueryBuilder.first.mockResolvedValue(null);

      const payload = {
        name: "John",
        last_name: "Doe",
        email: "john@example.com",
        password: "password123",
        phone_number: "1234567890",
        pin: "1234",
        status: "ACTIVE",
      };

      await expect(createUser(payload)).rejects.toThrow("Failed to create user");
    });
  });

});
