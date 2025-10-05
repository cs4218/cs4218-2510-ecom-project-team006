import bcrypt from 'bcrypt';
import { hashPassword, comparePassword } from './authHelper';

jest.mock('bcrypt');

describe('authHelper', () => {
  describe('hashPassword', () => {
    it('hashes password with saltRounds 10 and returns hashed value', async () => {
      bcrypt.hash.mockResolvedValue('hashedValue');

      const result = await hashPassword('mySecret');

      expect(bcrypt.hash).toHaveBeenCalledWith('mySecret', 10);
      expect(result).toBe('hashedValue');
    });

    it('logs and returns undefined when bcrypt.hash throws', async () => {
      bcrypt.hash.mockRejectedValue(new Error('oops'));
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = await hashPassword('bad');

      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('comparePassword', () => {
    it('returns true when bcrypt.compare resolves true', async () => {
      bcrypt.compare.mockResolvedValue(true);

      const ok = await comparePassword('plain', 'hashed');

      expect(bcrypt.compare).toHaveBeenCalledWith('plain', 'hashed');
      expect(ok).toBe(true);
    });

    it('returns false when bcrypt.compare resolves false', async () => {
      bcrypt.compare.mockResolvedValue(false);

      const ok = await comparePassword('plain', 'hashed');

      expect(ok).toBe(false);
    });
  });
});
