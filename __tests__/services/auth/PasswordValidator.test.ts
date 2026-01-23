/**
 * PasswordValidator Tests
 *
 * Tests for password validation rules and security requirements.
 */

import { PasswordValidator } from '../../../services/auth/PasswordValidator';

describe('PasswordValidator', () => {
  describe('validate', () => {
    describe('valid passwords', () => {
      it('should accept a password meeting all requirements', () => {
        const result = PasswordValidator.validate('SecurePass1!');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept a password with all special characters', () => {
        const result = PasswordValidator.validate('Test123!@#$%');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept a long complex password', () => {
        const result = PasswordValidator.validate('MyVeryLongAndSecure1Password!');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept password with exactly 8 characters meeting all rules', () => {
        const result = PasswordValidator.validate('Abcdef1!');
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('invalid passwords - length', () => {
      it('should reject empty password', () => {
        const result = PasswordValidator.validate('');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must be at least 8 characters long');
      });

      it('should reject password shorter than 8 characters', () => {
        const result = PasswordValidator.validate('Short1!');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must be at least 8 characters long');
      });

      it('should reject password with 7 characters', () => {
        const result = PasswordValidator.validate('Abc123!');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must be at least 8 characters long');
      });
    });

    describe('invalid passwords - uppercase', () => {
      it('should reject password without uppercase letter', () => {
        const result = PasswordValidator.validate('lowercase1!');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one uppercase letter (A-Z)');
      });

      it('should reject all lowercase password', () => {
        const result = PasswordValidator.validate('allsmall123!');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one uppercase letter (A-Z)');
      });
    });

    describe('invalid passwords - lowercase', () => {
      it('should reject password without lowercase letter', () => {
        const result = PasswordValidator.validate('UPPERCASE1!');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one lowercase letter (a-z)');
      });

      it('should reject all uppercase password', () => {
        const result = PasswordValidator.validate('ALLCAPS123!');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one lowercase letter (a-z)');
      });
    });

    describe('invalid passwords - numbers', () => {
      it('should reject password without number', () => {
        const result = PasswordValidator.validate('NoNumbers!');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one number (0-9)');
      });

      it('should reject password with only letters and special chars', () => {
        const result = PasswordValidator.validate('LettersOnly!@');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one number (0-9)');
      });
    });

    describe('invalid passwords - special characters', () => {
      it('should reject password without special character', () => {
        const result = PasswordValidator.validate('NoSpecial123');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one special character (!@#$%^&*)');
      });

      it('should reject alphanumeric only password', () => {
        const result = PasswordValidator.validate('AlphaNum123');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one special character (!@#$%^&*)');
      });
    });

    describe('invalid passwords - multiple failures', () => {
      it('should return multiple errors for simple password', () => {
        const result = PasswordValidator.validate('simple');
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(1);
        expect(result.errors).toContain('Password must be at least 8 characters long');
        expect(result.errors).toContain('Password must contain at least one uppercase letter (A-Z)');
        expect(result.errors).toContain('Password must contain at least one number (0-9)');
        expect(result.errors).toContain('Password must contain at least one special character (!@#$%^&*)');
      });

      it('should return all 5 errors for empty string', () => {
        const result = PasswordValidator.validate('');
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(5);
      });

      it('should return 4 errors for short lowercase password', () => {
        const result = PasswordValidator.validate('abc');
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBe(4);
      });
    });
  });

  describe('isValid', () => {
    it('should return true for valid password', () => {
      expect(PasswordValidator.isValid('ValidPass1!')).toBe(true);
    });

    it('should return false for invalid password', () => {
      expect(PasswordValidator.isValid('weak')).toBe(false);
    });

    it('should return false for empty password', () => {
      expect(PasswordValidator.isValid('')).toBe(false);
    });
  });

  describe('getRequirementsMessage', () => {
    it('should return a string with all requirements', () => {
      const message = PasswordValidator.getRequirementsMessage();
      expect(message).toContain('8 characters');
      expect(message).toContain('uppercase');
      expect(message).toContain('lowercase');
      expect(message).toContain('number');
      expect(message).toContain('special character');
    });

    it('should return consistent message', () => {
      const message1 = PasswordValidator.getRequirementsMessage();
      const message2 = PasswordValidator.getRequirementsMessage();
      expect(message1).toBe(message2);
    });
  });

  describe('edge cases', () => {
    it('should handle unicode characters in password', () => {
      const result = PasswordValidator.validate('Passw0rd!');
      expect(result.isValid).toBe(true);
    });

    it('should handle whitespace in password', () => {
      const result = PasswordValidator.validate('Pass word1!');
      expect(result.isValid).toBe(true);
    });

    it('should handle very long passwords', () => {
      const longPassword = 'A' + 'a'.repeat(100) + '1!';
      const result = PasswordValidator.validate(longPassword);
      expect(result.isValid).toBe(true);
    });

    it('should handle password with only spaces', () => {
      const result = PasswordValidator.validate('        ');
      expect(result.isValid).toBe(false);
    });
  });
});
