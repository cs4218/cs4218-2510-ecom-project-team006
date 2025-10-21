/**
 * Integration Tests for authHelper.js
 * 
 * DISCLAIMER: These tests were AI-generated (GitHub Copilot) and reviewed/adapted by the developer.
 * 
 * These tests validate password hashing and comparison using the real bcrypt library
 * to ensure proper integration with cryptographic functions and edge case handling.
 * 
 * Modules exercised by these tests:
 * - helpers/authHelper.js (hashPassword, comparePassword functions)
 * - bcrypt library (bcrypt.hash, bcrypt.compare)
 * 
 * Bug-finding focus:
 * - Verify real bcrypt hashing produces valid, unique hashes
 * - Confirm password comparison works with real bcrypt hashes
 * - Test edge cases: empty passwords, special characters, long passwords
 * - Validate error handling for invalid inputs
 */

import { hashPassword, comparePassword } from "./authHelper.js";

describe("authHelper integration (real bcrypt)", () => {
  it("hashes and compares password correctly", async () => {
    const password = "mySecret123!";
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(20);

    const match = await comparePassword(password, hash);
    expect(match).toBe(true);

    const wrong = await comparePassword("wrongPassword", hash);
    expect(wrong).toBe(false);
  });

  it("produces different hashes for same password", async () => {
    const password = "repeatMe";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);
    expect(hash1).not.toBe(hash2);
  });

  it("throws or returns false for null/undefined input", async () => {
    await expect(hashPassword(null)).rejects.toThrow();
    await expect(hashPassword(undefined)).rejects.toThrow();
    await expect(comparePassword(null, null)).rejects.toThrow();
  });

  it("handles empty string password", async () => {
    const hash = await hashPassword("");
    expect(hash).not.toBe("");
    const match = await comparePassword("", hash);
    expect(match).toBe(true);
  });

  it("handles very long password", async () => {
    const longPassword = "a".repeat(1000);
    const hash = await hashPassword(longPassword);
    expect(hash.length).toBeGreaterThan(20);
    const match = await comparePassword(longPassword, hash);
    expect(match).toBe(true);
  });
});
