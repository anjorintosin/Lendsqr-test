jest.mock("../../src/models/wallet.model", () => ({
    createWallet: jest.fn().mockResolvedValue(true),
  }));
  
  jest.mock("../../src/models/permission.model", () => ({
    assignPersonAuthorizations: jest.fn().mockResolvedValue(true),
  }));
  
  const mockQueryBuilder = {
    insert: jest.fn(),
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
  
  jest.mock("../../src/models/wallet.model", () => ({
    createWallet: jest.fn().mockResolvedValue(true),
  }));
  
  jest.mock("../../src/models/permission.model", () => ({
    assignPersonAuthorizations: jest.fn().mockResolvedValue(true),
  }));
  
  describe("User Model", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    describe("createUser", () => {
      it("should create a user successfully", async () => {
        const fakeInsertedUser = { id: "fake-user-id", name: "John" };
        mockQueryBuilder.first.mockResolvedValue(fakeInsertedUser);
  
        const payload = {
          name: "John",
          last_name: "Doe",
          email: "john@example.com",
          password: "password123",
          phone_number: "1234567890",
          pin: "1234",
          status: "ACTIVE",
        };
  
        const result = await createUser(payload);
  
        expect(result).toHaveProperty("userId");
        expect(result.email).toBe(payload.email);
        expect(mockTrx).toHaveBeenCalledWith("people");
        expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
          id: expect.any(String),
          name: payload.name,
          last_name: payload.last_name,
          email: payload.email,
          password: payload.password,
          phone_number: payload.phone_number,
          pin: payload.pin,
          status: "ACTIVE",
        });
        expect(mockQueryBuilder.where).toHaveBeenCalledWith({ id: expect.any(String) });
      });
  
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
  
    describe("findUserByEmail", () => {
      it("should return a user if found", async () => {
        const fakeUser = { id: "user1", email: "john@example.com" };
        mockQueryBuilder.first.mockResolvedValue(fakeUser);
  
        const user = await findUserByEmail("john@example.com");
        expect(user).toEqual(fakeUser);
        expect(mockQueryBuilder.where).toHaveBeenCalledWith({ email: "john@example.com" });
      });
  
      it("should return null if user not found", async () => {
        mockQueryBuilder.first.mockResolvedValue(null);
  
        const user = await findUserByEmail("john@example.com");
        expect(user).toBeNull();
      });
    });
  });