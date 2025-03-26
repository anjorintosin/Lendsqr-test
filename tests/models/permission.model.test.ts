const mockQueryBuilder = {
    select: jest.fn(),
    insert: jest.fn(),
    join: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
  };
  
  const mockTrx = jest.fn().mockImplementation((tableName) => {
    return mockQueryBuilder;
  });
  
  const mockKnex = Object.assign(
    jest.fn().mockImplementation((tableName) => {
      if (tableName === "authorization" || tableName === "people_authorzation") {
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
  
  jest.mock("uuid", () => ({
    v4: jest.fn(() => "constant-uuid"),
  }));
  
  import { getAllAuthorizations, assignPersonAuthorizations, findPersonAuthorizations } from "../../src/models/permission.model";
  
  describe("Permission Model", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    describe("getAllAuthorizations", () => {
      it("should return authorizations using provided trx", async () => {
        const fakeAuths = [{ id: "auth1" }, { id: "auth2" }];
        mockQueryBuilder.select.mockResolvedValue(fakeAuths);
  
        const result = await getAllAuthorizations(mockTrx);
        expect(result).toEqual(fakeAuths);
        expect(mockTrx).toHaveBeenCalledWith("authorization");
        expect(mockQueryBuilder.select).toHaveBeenCalledWith("id");
      });
  
      it("should return authorizations using global knex when trx is not provided", async () => {
        const fakeAuths = [{ id: "auth1" }];
        mockQueryBuilder.select.mockResolvedValue(fakeAuths);
  
        const result = await getAllAuthorizations();
        expect(result).toEqual(fakeAuths);
        expect(mockKnex).toHaveBeenCalledWith("authorization");
        expect(mockQueryBuilder.select).toHaveBeenCalledWith("id");
      });
    });
  
    describe("assignPersonAuthorizations", () => {
      it("should insert person authorizations when authorizations are found", async () => {
        const fakeAuths = [{ id: "auth1" }, { id: "auth2" }];
        mockQueryBuilder.select.mockResolvedValue(fakeAuths);
  
        await assignPersonAuthorizations("person-123", mockTrx);
  
        expect(mockQueryBuilder.insert).toHaveBeenCalled();
        const insertedRecords = (mockQueryBuilder.insert as jest.Mock).mock.calls[0][0];
        expect(insertedRecords).toHaveLength(2);
        insertedRecords.forEach((record) => {
          expect(record).toMatchObject({
            person_id: "person-123",
            authorization_id: expect.any(String),
            created_at: expect.any(Date),
          });
          expect(record.id).toBe("constant-uuid");
        });
      });
  
      it("should do nothing if no authorizations are found", async () => {
        mockQueryBuilder.select.mockResolvedValue([]);
        
        const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  
        await assignPersonAuthorizations("person-123", mockTrx);
        expect(mockQueryBuilder.insert).not.toHaveBeenCalled();
        expect(warnSpy).toHaveBeenCalledWith("No authorizations found. Skipping person authorization assignment.");
  
        warnSpy.mockRestore();
      });
  
      it("should throw an error if insertion fails", async () => {
        const fakeAuths = [{ id: "auth1" }];
        mockQueryBuilder.select.mockResolvedValue(fakeAuths);
  
        mockQueryBuilder.insert.mockRejectedValue(new Error("Insert failed"));
  
        await expect(assignPersonAuthorizations("person-123", mockTrx)).rejects.toThrow("Insert failed");
      });
    });
  
    describe("findPersonAuthorizations", () => {
      it("should return joined authorizations for a person", async () => {
        const fakeJoinResult = [{ name: "perm1", status: "active" }];
        mockQueryBuilder.select.mockResolvedValue(fakeJoinResult);
  
        const result = await findPersonAuthorizations("person-123");
        expect(result).toEqual(fakeJoinResult);
  
        expect(mockKnex).toHaveBeenCalledWith("people_authorzation");
        expect(mockQueryBuilder.join).toHaveBeenCalledWith("authorization", "people_authorzation.authorization_id", "authorization.id");
        expect(mockQueryBuilder.where).toHaveBeenCalledWith("people_authorzation.person_id", "person-123");
        expect(mockQueryBuilder.select).toHaveBeenCalledWith("authorization.name", "authorization.status");
      });
    });
  });