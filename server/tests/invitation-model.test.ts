import { inviteBodySchema } from '../src/models/invitation-model.js';

describe('invitation-model Joi schemas', () => {
  describe('inviteBodySchema', () => {
    it('accepts a valid email', () => {
      const { error, value } = inviteBodySchema.validate({ email: 'user@example.com' });
      expect(error).toBeUndefined();
      expect(value).toEqual({ email: 'user@example.com' });
    });

    it('rejects invalid email', () => {
      const { error } = inviteBodySchema.validate({ email: 'not-an-email' });
      expect(error).toBeDefined();
    });

    it('rejects missing email', () => {
      const { error } = inviteBodySchema.validate({});
      expect(error).toBeDefined();
    });

    it('strips unknown fields', () => {
      const { error, value } = inviteBodySchema.validate({
        email: 'user@example.com',
        extra: 'ignored',
      });
      expect(error).toBeUndefined();
      expect(value).toEqual({ email: 'user@example.com' });
    });
  });
});
