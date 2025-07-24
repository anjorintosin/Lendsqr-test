import { hashManager } from "../../src/utils/bycrpt";

describe("hashManager", () => {
  const manager = hashManager();
  const password = "supersecret";

  it("should hash a password", async () => {
    const hashed = await manager.hash(password);
    expect(hashed).not.toBe(password);
    expect(typeof hashed).toBe("string");
  });

  it("should return true when comparing the correct password", async () => {
    const hashed = await manager.hash(password);
    const isValid = await manager.compare(password, hashed);
    expect(isValid).toBe(true);
  });

  it("should return false when comparing an incorrect password", async () => {
    const hashed = await manager.hash(password);
    const isValid = await manager.compare("wrongpassword", hashed);
    expect(isValid).toBe(false);
  });
});
