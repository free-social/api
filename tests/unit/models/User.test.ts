import { UserZodSchema } from '../../../src/models/User';

describe('User Model (Zod Schema)', () => {

  // ✅ HAPPY PATH
  it('should validate a correct user object', () => {
    const validData = {
      username: 'validUser',
      email: 'test@example.com',
      password: 'Password@123' // valid: 1 Uppercase, 1 Lowercase, 1 Number, 1 Special
    };
    
    const result = UserZodSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  // ❌ UNHAPPY PATHS (Validation Errors)
  describe('Password Validation', () => {
    
    it('should fail if password is too short (under 6 chars)', () => {
      const result = UserZodSchema.safeParse({
        username: 'user', email: 't@t.com', 
        password: 'Aa@1' 
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 6 chars');
      }
    });

    it('should fail if missing uppercase letter', () => {
      const result = UserZodSchema.safeParse({
        username: 'user', email: 't@t.com', 
        password: 'password@123' 
      });
      expect(result.success).toBe(false);
    });

    it('should fail if missing lowercase letter', () => {
      const result = UserZodSchema.safeParse({
        username: 'user', email: 't@t.com', 
        password: 'PASSWORD@123' 
      });
      expect(result.success).toBe(false);
    });

    it('should fail if missing number', () => {
      const result = UserZodSchema.safeParse({
        username: 'user', email: 't@t.com', 
        password: 'Password@' 
      });
      expect(result.success).toBe(false);
    });

    it('should fail if missing special character', () => {
      const result = UserZodSchema.safeParse({
        username: 'user', email: 't@t.com', 
        password: 'Password123' 
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Other Fields', () => {
    it('should fail on invalid email', () => {
      const result = UserZodSchema.safeParse({
        username: 'user', password: 'Password@123',
        email: 'not-an-email' 
      });
      expect(result.success).toBe(false);
    });

    it('should fail if username is too short', () => {
      const result = UserZodSchema.safeParse({
        username: 'ab', password: 'Password@123', // 2 chars
        email: 'test@example.com' 
      });
      expect(result.success).toBe(false);
    });
  });
});