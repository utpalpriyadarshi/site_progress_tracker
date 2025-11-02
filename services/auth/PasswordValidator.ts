/**
 * Password Validator
 * v2.2 - Activity 1, Day 3
 *
 * Validates password strength according to security requirements
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export class PasswordValidator {
  private static readonly MIN_LENGTH = 8;
  private static readonly UPPERCASE_REGEX = /[A-Z]/;
  private static readonly LOWERCASE_REGEX = /[a-z]/;
  private static readonly NUMBER_REGEX = /[0-9]/;
  private static readonly SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

  /**
   * Validate password strength
   *
   * Requirements:
   * - Minimum 8 characters
   * - At least 1 uppercase letter
   * - At least 1 lowercase letter
   * - At least 1 number
   * - At least 1 special character
   *
   * @param password - Password to validate
   * @returns PasswordValidationResult with isValid flag and error messages
   */
  static validate(password: string): PasswordValidationResult {
    const errors: string[] = [];

    // Check minimum length
    if (!password || password.length < this.MIN_LENGTH) {
      errors.push(`Password must be at least ${this.MIN_LENGTH} characters long`);
    }

    // Check for uppercase letter
    if (!this.UPPERCASE_REGEX.test(password)) {
      errors.push('Password must contain at least one uppercase letter (A-Z)');
    }

    // Check for lowercase letter
    if (!this.LOWERCASE_REGEX.test(password)) {
      errors.push('Password must contain at least one lowercase letter (a-z)');
    }

    // Check for number
    if (!this.NUMBER_REGEX.test(password)) {
      errors.push('Password must contain at least one number (0-9)');
    }

    // Check for special character
    if (!this.SPECIAL_CHAR_REGEX.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*)');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get a user-friendly message for password requirements
   */
  static getRequirementsMessage(): string {
    return `Password must:
• Be at least ${this.MIN_LENGTH} characters long
• Contain at least one uppercase letter (A-Z)
• Contain at least one lowercase letter (a-z)
• Contain at least one number (0-9)
• Contain at least one special character (!@#$%^&*)`;
  }

  /**
   * Quick validation - returns true if valid, false if not
   */
  static isValid(password: string): boolean {
    return this.validate(password).isValid;
  }
}

export default PasswordValidator;
