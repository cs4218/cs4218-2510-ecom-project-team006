const mongoose = require('mongoose');

describe('User Model Schema', () => {
  const User = require('./userModel.js').default;

  test('validation fails when required fields are missing', async () => {
    const u = new User({});

    try {
      await u.validate();
      // If validate() does not throw, fail the test
      throw new Error('Validation should have failed but did not');
    } catch (err) {
      expect(err).toBeDefined();
      expect(err.name).toBe('ValidationError');
      // Check required fields are reported
      expect(err.errors).toHaveProperty('name');
      expect(err.errors).toHaveProperty('email');
      expect(err.errors).toHaveProperty('password');
      expect(err.errors).toHaveProperty('phone');
      expect(err.errors).toHaveProperty('address');
      expect(err.errors).toHaveProperty('answer');
    }
  });

  test('valid document passes validation and name is trimmed, role defaults to 0', async () => {
    const data = {
      name: '  Alice  ',
      email: 'alice@example.com',
      password: 'hashed-password',
      phone: '1234567890',
  address: '123 Main St',
      answer: 'blue'
    };

    const u = new User(data);
    // Defaults are applied on instantiation
    expect(u.role).toBe(0);

    // validate should succeed
    await expect(u.validate()).resolves.toBeUndefined();

    // setters (trim) should have been applied
    expect(u.name).toBe('Alice');
  });
});
