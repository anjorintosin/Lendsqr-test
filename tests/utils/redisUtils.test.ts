import redis from "../../src/config/redis";
import { setCache, getCache, deleteCache } from "../../src/utils/redisUtils";


jest.mock("../../src/config/redis", () => ({
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
}));

describe("Redis Utils", () => {
  const key = "testKey";
  const value = { data: "test" };
  const ttl = 3600;

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("setCache", () => {
    it("should set a cache key with the provided value and ttl", async () => {
      await setCache(key, value, ttl);
      expect(redis.set).toHaveBeenCalledWith(key, JSON.stringify(value), "EX", ttl);
    });
  });

  describe("getCache", () => {
    it("should return parsed data when key exists", async () => {
      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(value));
      const data = await getCache(key);
      expect(redis.get).toHaveBeenCalledWith(key);
      expect(data).toEqual(value);
    });

    it("should return null when key does not exist", async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      const data = await getCache(key);
      expect(redis.get).toHaveBeenCalledWith(key);
      expect(data).toBeNull();
    });
  });

  describe("deleteCache", () => {
    it("should delete the cache key", async () => {
      await deleteCache(key);
      expect(redis.del).toHaveBeenCalledWith(key);
    });
  });
});
