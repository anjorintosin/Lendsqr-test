import { getAllAuthorizations, assignPersonAuthorizations, findPersonAuthorizations } from "../../src/models/permission.model";
import knex from "../../src/config/db";
import { v4 as uuidv4 } from "uuid";

jest.mock("../../src/config/db", () => {
  // Create a query builder mock with chainable methods.
  const mockQueryBuilder = {
    select: jest.fn(),
    insert: jest.fn(),
    join: jest.fn(),
    where: jest.fn(),
  };

  // Create a function that returns the query builder.
  const mockKnex = jest.fn(() => mockQueryBuilder) as any;

  // Attach transaction method explicitly.
  mockKnex.transaction = jest.fn(async (callback: any) => {
    const trxMock = {
      // Make trx callable: a function that returns the query builder.
      ...(jest.fn(() => mockQueryBuilder) as any),
      select: mockQueryBuilder.select,
      insert: mockQueryBuilder.insert,
      join: mockQueryBuilder.join,
      where: mockQueryBuilder.where,
      commit: jest.fn(),
      rollback: jest.fn(),
    };
    return callback(trxMock);
  });

  return mockKnex;
});

// Mock UUID so that it always returns "fixed-uuid".
jest.mock("uuid", () => ({
  v4: jest.fn(() => "fixed-uuid"),
}));

describe("Authorization Module", () => {
  let mockKnex: any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Cast the return value as any.
    mockKnex = knex() as any;
  });

  describe("getAllAuthorizations", () => {
    it("should return authorizations when trx is not provided", async () => {
      const expectedAuths = [{ id: "1" }, { id: "2" }];
      // Cast to any so TypeScript accepts the property access.
      (mockKnex.select as any).mockResolvedValue(expectedAuths);

      const result = await getAllAuthorizations();

      expect(knex).toHaveBeenCalledWith("authorization");
      expect((mockKnex.select as any)).toHaveBeenCalledWith("id");
      expect(result).toEqual(expectedAuths);
    });

    it("should return authorizations when trx is provided", async () => {
      const expectedAuths = [{ id: "1" }];
      // Instead of passing an object, pass a function that returns a query builder.
      const trx = jest.fn((table: string) => {
        return {
          select: jest.fn().mockResolvedValue(expectedAuths),
        };
      });

      const result = await getAllAuthorizations(trx as any);

      expect(trx).toHaveBeenCalledWith("authorization");
      expect(result).toEqual(expectedAuths);
    });
  });

  describe("assignPersonAuthorizations", () => {
    it("should warn and do nothing when no authorizations are found", async () => {
      const trx = jest.fn((table: string) => {
        return { select: jest.fn().mockResolvedValue([]) };
      });
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

      await assignPersonAuthorizations("person-1", trx as any);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "No authorizations found. Skipping person authorization assignment."
      );
      consoleWarnSpy.mockRestore();
    });

    it("should insert person authorizations when authorizations exist", async () => {
      const existingAuths = [{ id: "auth-1" }, { id: "auth-2" }];
      const insertMock = jest.fn().mockResolvedValue(undefined);
      // Create a trx function that returns different query builders based on the table.
      const trx = jest.fn((table: string) => {
        if (table === "authorization") {
          return { select: jest.fn().mockResolvedValue(existingAuths) };
        }
        if (table === "people_authorzation") {
          return { insert: insertMock };
        }
      });

      await assignPersonAuthorizations("person-1", trx as any);

      // Verify that trx was called for both tables.
      expect(trx).toHaveBeenCalledWith("authorization");
      expect(trx).toHaveBeenCalledWith("people_authorzation");
      expect(insertMock).toHaveBeenCalled();
      const insertedRecords = insertMock.mock.calls[0][0];
      expect(insertedRecords.length).toBe(existingAuths.length);
      expect(insertedRecords[0].id).toBe("fixed-uuid");
    });
  });

  describe("findPersonAuthorizations", () => {
    it("should return joined authorization details", async () => {
      const expectedResults = [{ name: "auth1", status: "active" }];
      // Cast mockKnex.join to any so we can call .mockReturnValue.
      (mockKnex.join as any).mockReturnValue({
        where: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue(expectedResults),
        }),
      });

      const result = await findPersonAuthorizations("person-1");

      expect(knex).toHaveBeenCalledWith("people_authorzation");
      expect((mockKnex.join as any)).toHaveBeenCalledWith(
        "authorization",
        "people_authorzation.authorization_id",
        "authorization.id"
      );
      expect(result).toEqual(expectedResults);
    });
  });
});
