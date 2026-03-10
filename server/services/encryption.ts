import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

let encryptionKey: Buffer;

const envKey = process.env.DATA_ENCRYPTION_KEY;
if (envKey) {
  encryptionKey = Buffer.from(envKey, 'hex');
} else {
  encryptionKey = crypto.randomBytes(32);
  // WARNING: No DATA_ENCRYPTION_KEY set. Using random key - encrypted data will be lost on restart!
  console.warn('WARNING: No DATA_ENCRYPTION_KEY environment variable set. Using a random key - encrypted data will be lost on restart.');
}

export function encryptField(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decryptField(encrypted: string): string {
  try {
    const parts = encrypted.split(':');
    if (parts.length !== 2) {
      return encrypted;
    }
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    if (iv.length !== IV_LENGTH) {
      return encrypted;
    }
    const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return encrypted;
  }
}

export function isEncrypted(value: string): boolean {
  const hexPattern = /^[0-9a-f]{32}:[0-9a-f]+$/i;
  return hexPattern.test(value);
}
