import bcrypt from "bcrypt";
import { hashPassword, comparePassword } from "../helpers/authHelper.js";

jest.mock("bcrypt");

describe("authHelper", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("hashPassword", () => {
    it("hashes password with saltRounds 10 and returns hashed value", async () => {
      bcrypt.hash.mockResolvedValue("hashedValue");

      const result = await hashPassword("mySecret");

      expect(bcrypt.hash).toHaveBeenCalledWith("mySecret", 10);
      expect(result).toBe("hashedValue");
    });

    it("logs and throws when bcrypt.hash throws", async () => {
      bcrypt.hash.mockRejectedValue(new Error("oops"));
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

      await expect(hashPassword("bad")).rejects.toThrow("Failed to hash password");
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('comparePassword', () => {
    it('returns true when bcrypt.compare resolves true', async () => {
      bcrypt.compare.mockResolvedValue(true);

      const result = await comparePassword('plain', 'hash');

      expect(bcrypt.compare).toHaveBeenCalledWith('plain', 'hash');
      expect(result).toBe(true);
    });

    it('throws when bcrypt.compare rejects', async () => {
      bcrypt.compare.mockRejectedValue(new Error('compare-fail'));

      await expect(comparePassword('a', 'b')).rejects.toThrow('compare-fail');
    });
  });
});
