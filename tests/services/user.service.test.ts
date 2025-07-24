import { registerUser, loginUser } from "../../src/services/user.service";
import { createUser, findUserByEmail } from "../../src/models/user.model";
import { hashManager } from "../../src/utils/bycrpt";
import { generateAuthToken } from "../../src/utils/tokenizer";
import { isUserBlacklisted } from "../../src/utils/lendSqrBlacklist";
import constants from "../../src/utils/constants";

jest.mock("../../src/models/user.model", () => ({
  createUser: jest.fn(),
  findUserByEmail: jest.fn(),
}));

jest.mock("../../src/utils/bycrpt", () => ({
  hashManager: jest.fn(() => ({
    hash: jest.fn((input) => Promise.resolve(`hashed_${input}`)),
    compare: jest.fn((input, hashed) => Promise.resolve(hashed === `hashed_${input}`)),
  })),
}));

jest.mock("../../src/utils/tokenizer", () => ({
  generateAuthToken: jest.fn(() => "mocked_token"),
}));

jest.mock("../../src/utils/lendSqrBlacklist", () => ({
  isUserBlacklisted: jest.fn(),
}));

describe("User Service", () => {
  describe("registerUser", () => {
    it("should return an error if the user is blacklisted", async () => {
      (isUserBlacklisted as jest.Mock).mockReturnValue(true);
      const response = await registerUser({
        name: "John",
        email: "test@example.com",
        password: "password123",
        last_name: "Doe",
        phone_number: "1234567890",
        pin: "1234",
      });
      expect(response).toEqual({ error: constants.BLACKLISTED_USER });
    });

    it("should return an error if the user already exists", async () => {
      (isUserBlacklisted as jest.Mock).mockReturnValue(false);
      (findUserByEmail as jest.Mock).mockResolvedValue({ id: "123" });
      const response = await registerUser({
        name: "John",
        email: "test@example.com",
        password: "password123",
        last_name: "Doe",
        phone_number: "1234567890",
        pin: "1234",
      });
      expect(response).toEqual({ error: `User ${constants.EXIST}` });
    });

    it("should successfully register a new user", async () => {
      (isUserBlacklisted as jest.Mock).mockReturnValue(false);
      (findUserByEmail as jest.Mock).mockResolvedValue(null);
      (createUser as jest.Mock).mockResolvedValue({ id: "123", email: "test@example.com" });

      const response = await registerUser({
        name: "John",
        email: "test@example.com",
        password: "password123",
        last_name: "Doe",
        phone_number: "1234567890",
        pin: "1234",
      });

      expect(response).toEqual({
        success: true,
        message: "User registered successfully",
        user: { id: "123", email: "test@example.com" },
      });
    });
  });

  describe("loginUser", () => {
    it("should return an error if the user is not found", async () => {
      (findUserByEmail as jest.Mock).mockResolvedValue(null);
      const response = await loginUser("test@example.com", "password123");
      expect(response).toEqual({ error: constants.INVALID_CREDENTIALS });
    });

    it("should return an error if the user is inactive", async () => {
      (findUserByEmail as jest.Mock).mockResolvedValue({ status: "INACTIVE", password: "hashed_password123" });
      const response = await loginUser("test@example.com", "password123");
      expect(response).toEqual({ error: constants.INVALID_ACCESS });
    });

    it("should return an error if the password is incorrect", async () => {
      (findUserByEmail as jest.Mock).mockResolvedValue({ status: "ACTIVE", password: "hashed_password123" });
      (hashManager().compare as jest.Mock).mockResolvedValue(false);

      const response = await loginUser("test@example.com", "wrongpassword");
      expect(response).toEqual({ error: constants.INVALID_CREDENTIALS });
    });

    it("should return success and token if login is successful", async () => {
      (findUserByEmail as jest.Mock).mockResolvedValue({ id: "123", status: "ACTIVE", password: "hashed_password123" });
      (hashManager().compare as jest.Mock).mockResolvedValue(true);

      const response = await loginUser("test@example.com", "password123");
      expect(response).toEqual({
        success: true,
        message: "Login successful",
        user: { id: "123", status: "ACTIVE" },
        token: "mocked_token",
      });
    });
  });
});
