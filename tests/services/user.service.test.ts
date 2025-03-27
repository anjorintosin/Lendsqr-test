import { registerUser, loginUser } from "../../src/services/user.service";
import { createUser, findUserByEmail } from "../../src/models/user.model";
import { hashManager } from "../../src/utils/bycrpt";
import { generateAuthToken } from "../../src/utils/tokenizer";
import { isUserBlacklisted } from "../../src/utils/lendSqrBlacklist";
import constants from "../../src/utils/constants";

const mockCompare = jest.fn();

jest.mock("../../src/models/user.model", () => ({
  createUser: jest.fn(),
  findUserByEmail: jest.fn(),
}));

jest.mock("../../src/utils/bycrpt", () => ({
  hashManager: jest.fn(() => ({
    hash: jest.fn(),
    compare: mockCompare,
  })),
}));

jest.mock("../../src/utils/tokenizer", () => ({
  generateAuthToken: jest.fn(),
}));

jest.mock("../../src/utils/lendSqrBlacklist", () => ({
  isUserBlacklisted: jest.fn(),
}));

describe("User Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCompare.mockReset();
  });

  describe("registerUser", () => {
    it("should return an error if user is blacklisted", async () => {
      (isUserBlacklisted as jest.Mock).mockResolvedValue(true);
      const payload = {
        name: "John",
        last_name: "Doe",
        email: "john@example.com",
        password: "password123",
        phone_number: "1234567890",
        pin: "1234",
      };
      const result = await registerUser(payload);
      expect(result).toEqual({ error: constants.BLACKLISTED_USER });
    });
  });

  describe("loginUser", () => {
    it("should return an error if user does not exist", async () => {
      (findUserByEmail as jest.Mock).mockResolvedValue(null);
      const result = await loginUser("john@example.com", "password123");
      expect(result).toEqual({ error: constants.INVALID_CREDENTIALS });
    });

    it("should return an error if user is inactive", async () => {
      (findUserByEmail as jest.Mock).mockResolvedValue({ id: "user1", status: "INACTIVE" });
      const result = await loginUser("john@example.com", "password123");
      expect(result).toEqual({ error: constants.INVALID_ACCESS });
    });

    it("should return an error if password is incorrect", async () => {
      (findUserByEmail as jest.Mock).mockResolvedValue({
        id: "user1",
        password: "hashedPassword",
        status: "ACTIVE",
      });
      mockCompare.mockResolvedValue(false);
      const result = await loginUser("john@example.com", "wrongpassword");
      expect(result).toEqual({ error: constants.INVALID_CREDENTIALS });
    });

    it("should log in a user successfully", async () => {
      (findUserByEmail as jest.Mock).mockResolvedValue({
        id: "user1",
        email: "anjorintosin077@gmail.com",
        password: "hashedPassword",
        status: "ACTIVE",
      });
      mockCompare.mockResolvedValue(true);
      (generateAuthToken as jest.Mock).mockReturnValue("jwt_token");
      const result = await loginUser("anjorintosin077@gmail.com", "hashedPassword");
      expect(result).toEqual({
        success: true,
        message: "Login successful",
        user: { id: "user1", email: "anjorintosin077@gmail.com", status: "ACTIVE" },
        token: "jwt_token",
      });
    });
  });
});