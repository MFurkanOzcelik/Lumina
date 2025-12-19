import CryptoJS from 'crypto-js';
import bcrypt from 'bcryptjs';

/**
 * Encryption Utility for Lumina Notes
 * Uses AES-256 encryption for note content
 * Uses bcrypt for password hashing
 */

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 * @param password - Plain text password
 * @param hash - Stored password hash
 * @returns True if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Encrypt text using AES-256
 * @param plainText - Text to encrypt
 * @param password - Encryption password (Master Password)
 * @returns Encrypted string
 */
export function encryptText(plainText: string, password: string): string {
  if (!plainText || !password) {
    throw new Error('Plain text and password are required for encryption');
  }
  
  try {
    const encrypted = CryptoJS.AES.encrypt(plainText, password).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt content');
  }
}

/**
 * Decrypt text using AES-256
 * @param encryptedText - Encrypted string
 * @param password - Decryption password (Master Password)
 * @returns Decrypted plain text
 * @throws Error if decryption fails or password is incorrect
 */
export function decryptText(encryptedText: string, password: string): string {
  if (!encryptedText || !password) {
    throw new Error('Encrypted text and password are required for decryption');
  }
  
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedText, password);
    const plainText = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!plainText) {
      throw new Error('Invalid password or corrupted data');
    }
    
    return plainText;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt content. Password may be incorrect.');
  }
}

/**
 * Generate a random salt for additional security
 * @returns Random salt string
 */
export function generateSalt(): string {
  return CryptoJS.lib.WordArray.random(128/8).toString();
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with validation result and message
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  message: string;
  strength: 'weak' | 'medium' | 'strong';
} {
  if (password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long',
      strength: 'weak'
    };
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const strengthScore = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
  
  if (strengthScore < 2) {
    return {
      isValid: false,
      message: 'Password is too weak. Use a mix of uppercase, lowercase, numbers, and special characters.',
      strength: 'weak'
    };
  }
  
  if (strengthScore === 2) {
    return {
      isValid: true,
      message: 'Password strength: Medium',
      strength: 'medium'
    };
  }
  
  return {
    isValid: true,
    message: 'Password strength: Strong',
    strength: 'strong'
  };
}

