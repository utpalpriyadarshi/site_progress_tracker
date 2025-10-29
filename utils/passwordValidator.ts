import bcrypt from 'react-native-bcrypt';

/**
 * Password Validator Utility
 *
 * Validates password strength and checks for password reuse
 * v2.2 - Activity 1, Week 3, Day 14
 *
 * Password Strength Requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 number (0-9)
 * - At least 1 special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate password strength against security requirements
 *
 * @param password - Plain text password to validate
 * @returns Validation result with errors array
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = [];

  // Check minimum length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter (A-Z)');
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter (a-z)');
  }

  // Check for number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number (0-9)');
  }

  // Check for special character
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if a password has been used before
 * Uses bcrypt.compare to check against historical password hashes
 *
 * @param newPassword - Plain text password to check
 * @param oldPasswordHashes - Array of historical password hashes (from password_history)
 * @returns Promise<boolean> - true if password was used before, false otherwise
 */
export async function isPasswordReused(
  newPassword: string,
  oldPasswordHashes: string[]
): Promise<boolean> {
  // Check each historical hash
  for (const oldHash of oldPasswordHashes) {
    try {
      const isMatch = await new Promise<boolean>((resolve) => {
        bcrypt.compare(newPassword, oldHash, (err: Error | undefined, result: boolean) => {
          if (err) {
            console.error('passwordValidator: Error comparing password:', err);
            resolve(false);
          } else {
            resolve(result);
          }
        });
      });

      if (isMatch) {
        console.log('passwordValidator: Password matches historical password');
        return true; // Password was used before
      }
    } catch (error) {
      console.error('passwordValidator: Error in isPasswordReused:', error);
    }
  }

  return false; // Password has not been used before
}

/**
 * Get user-friendly password requirements text
 *
 * @returns Array of requirement strings
 */
export function getPasswordRequirements(): string[] {
  return [
    'At least 8 characters long',
    'Contains at least one uppercase letter (A-Z)',
    'Contains at least one lowercase letter (a-z)',
    'Contains at least one number (0-9)',
    'Contains at least one special character (!@#$%^&*)',
  ];
}

/**
 * Calculate password strength score (0-5)
 * Used for displaying password strength meter
 *
 * @param password - Plain text password
 * @returns Score from 0 (very weak) to 5 (very strong)
 */
export function calculatePasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;

  // Length check
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // Character type checks
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) score++;

  // Determine label and color
  let label = 'Very Weak';
  let color = '#d32f2f'; // red

  if (score >= 5) {
    label = 'Very Strong';
    color = '#388e3c'; // green
  } else if (score >= 4) {
    label = 'Strong';
    color = '#689f38'; // light green
  } else if (score >= 3) {
    label = 'Medium';
    color = '#fbc02d'; // yellow
  } else if (score >= 2) {
    label = 'Weak';
    color = '#f57c00'; // orange
  }

  return { score, label, color };
}
