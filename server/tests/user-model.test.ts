import {
  loginBodySchema,
  registerBodySchema,
  updateProfileBodySchema,
} from '../src/models/user-model.js';

describe('registerBodySchema', () => {
  it('accepts valid registration input', () => {
    const { error, value } = registerBodySchema.validate({
      username: 'tamar',
      email: 'tamar@example.com',
      password: 'secret1',
    });

    expect(error).toBeUndefined();
    expect(value).toEqual({
      username: 'tamar',
      email: 'tamar@example.com',
      password: 'secret1',
    });
  });

  it('rejects username shorter than 3 characters', () => {
    const { error } = registerBodySchema.validate({
      username: 'ab',
      email: 'tamar@example.com',
      password: 'secret1',
    });

    expect(error).toBeDefined();
  });

  it('rejects invalid email', () => {
    const { error } = registerBodySchema.validate({
      username: 'tamar',
      email: 'not-an-email',
      password: 'secret1',
    });

    expect(error).toBeDefined();
  });

  it('rejects password shorter than 6 characters', () => {
    const { error } = registerBodySchema.validate({
      username: 'tamar',
      email: 'tamar@example.com',
      password: '12345',
    });

    expect(error).toBeDefined();
  });

  it('strips unknown fields', () => {
    const { error, value } = registerBodySchema.validate({
      username: 'tamar',
      email: 'tamar@example.com',
      password: 'secret1',
      role: 'admin',
    });

    expect(error).toBeUndefined();
    expect(value).toEqual({
      username: 'tamar',
      email: 'tamar@example.com',
      password: 'secret1',
    });
  });
});

describe('loginBodySchema', () => {
  it('accepts valid login input', () => {
    const { error, value } = loginBodySchema.validate({
      email: 'tamar@example.com',
      password: 'secret1',
    });

    expect(error).toBeUndefined();
    expect(value).toEqual({
      email: 'tamar@example.com',
      password: 'secret1',
    });
  });

  it('rejects missing password', () => {
    const { error } = loginBodySchema.validate({
      email: 'tamar@example.com',
    });

    expect(error).toBeDefined();
  });
});

describe('updateProfileBodySchema', () => {
  it('accepts valid username', () => {
    const { error, value } = updateProfileBodySchema.validate({ username: 'newname' });

    expect(error).toBeUndefined();
    expect(value).toEqual({ username: 'newname' });
  });

  it('rejects username shorter than 3 characters', () => {
    const { error } = updateProfileBodySchema.validate({ username: 'ab' });

    expect(error).toBeDefined();
  });
});
