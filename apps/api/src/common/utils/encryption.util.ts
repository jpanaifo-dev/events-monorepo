import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard for GCM

function getMasterKey(): Buffer {
  const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_REFRESH_SECRET || 'zynqro-events-encryption-fallback-key-32b';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts a sensitive string using AES-256-GCM.
 * Output format: ivHex:authTagHex:encryptedHex
 */
export function encryptCredential(plaintext: string): string {
  if (!plaintext || plaintext.trim() === '') return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getMasterKey(), iv);
  
  let encrypted = cipher.update(plaintext.trim(), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted string.
 * If the string is not in the encrypted format (e.g. legacy plain text), returns it as-is.
 */
export function decryptCredential(ciphertext: string): string {
  if (!ciphertext || ciphertext.trim() === '') return '';
  
  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    // Unencrypted / plain fallback
    return ciphertext;
  }

  try {
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, getMasterKey(), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Failed to decrypt credential:', error);
    return '';
  }
}

/**
 * Masks a secret string for safe display on the frontend.
 * Example: "re_1234567890abcdef" -> "re_••••••••cdef"
 */
export function maskSecret(secret: string | null | undefined, visibleLast = 4): string {
  if (!secret || secret.trim() === '') return '';
  const decrypted = decryptCredential(secret);
  if (!decrypted) return '';

  if (decrypted.length <= visibleLast + 3) {
    return '••••••••';
  }

  const prefix = decrypted.startsWith('re_') ? 're_' : '';
  const actualValue = decrypted.startsWith('re_') ? decrypted.slice(3) : decrypted;
  const lastChars = actualValue.slice(-visibleLast);

  return `${prefix}••••••••${lastChars}`;
}
