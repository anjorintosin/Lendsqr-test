import { generateAuthToken } from "../../src/utils/tokenizer";

describe("generateAuthToken", () => {
  const originalSecret = process.env.SECRET_KEY;

  beforeAll(() => {
    process.env.SECRET_KEY = "test-secret";
  });

  afterAll(() => {
    process.env.SECRET_KEY = originalSecret;
  });

  it("should return a base64 encoded token using the userId and secret key", () => {
    const userId = "user123";
    const expected = Buffer.from(`${userId}:test-secret`).toString("base64");

    const token = generateAuthToken(userId);

    expect(token).toBe(expected);
  });

  it("should use the default secret key when process.env.SECRET_KEY is not defined", () => {
    delete process.env.SECRET_KEY;
    const userId = "user456";
    const defaultSecret = "your-secret-key";
    const expected = Buffer.from(`${userId}:${defaultSecret}`).toString("base64");

    const token = generateAuthToken(userId);

    expect(token).toBe(expected);
  });
});
