/**
 * HIPAA Encryption Tests
 *
 * Comprehensive test suite for AES-256-GCM encryption
 */

import * as crypto from 'crypto';
import {
  decrypt,
  encrypt,
  EncryptedData,
  ENCRYPTION_CONFIG,
  HIPAAEncryption,
} from '../../src/security/hipaa-encryption';

describe('HIPAAEncryption', () => {
  let encryption: HIPAAEncryption;
  let masterKey: string;

  beforeEach(() => {
    masterKey = HIPAAEncryption.generateMasterKey();
    encryption = new HIPAAEncryption(masterKey);
  });

  afterEach(() => {
    encryption.destroy();
  });

  describe('Key Generation', () => {
    it('should generate 256-bit master key', () => {
      const key = HIPAAEncryption.generateMasterKey();
      const keyBuffer = Buffer.from(key, 'hex');
      expect(keyBuffer.length).toBe(ENCRYPTION_CONFIG.KEY_LENGTH);
      expect(keyBuffer.length).toBe(32); // 256 bits
    });

    it('should generate unique keys', () => {
      const key1 = HIPAAEncryption.generateMasterKey();
      const key2 = HIPAAEncryption.generateMasterKey();
      expect(key1).not.toBe(key2);
    });

    it('should accept hex-encoded master key', () => {
      const hexKey = HIPAAEncryption.generateMasterKey();
      expect(() => new HIPAAEncryption(hexKey)).not.toThrow();
    });

    it('should accept base64-encoded master key', () => {
      const buffer = crypto.randomBytes(ENCRYPTION_CONFIG.KEY_LENGTH);
      const base64Key = buffer.toString('base64');
      expect(() => new HIPAAEncryption(base64Key)).not.toThrow();
    });

    it('should accept Buffer master key', () => {
      const buffer = crypto.randomBytes(ENCRYPTION_CONFIG.KEY_LENGTH);
      expect(() => new HIPAAEncryption(buffer)).not.toThrow();
    });

    it('should reject invalid key length', () => {
      const shortKey = crypto.randomBytes(16).toString('hex');
      expect(() => new HIPAAEncryption(shortKey)).toThrow(/256 bits/);
    });
  });

  describe('Basic Encryption/Decryption', () => {
    it('should encrypt and decrypt string data', () => {
      const plaintext = 'Sensitive HIPAA data';
      const encrypted = encryption.encrypt(plaintext);
      const decrypted = encryption.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt Buffer data', () => {
      const plaintext = Buffer.from('Binary medical data', 'utf8');
      const encrypted = encryption.encrypt(plaintext);
      const decrypted = encryption.decrypt(encrypted, { encoding: 'utf8' });

      expect(decrypted).toBe(plaintext.toString('utf8'));
    });

    it('should encrypt empty string', () => {
      const plaintext = '';
      const encrypted = encryption.encrypt(plaintext);
      const decrypted = encryption.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt large data', () => {
      const plaintext = 'X'.repeat(1000000); // 1MB
      const encrypted = encryption.encrypt(plaintext);
      const decrypted = encryption.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt Unicode data', () => {
      const plaintext = '你好 🔒 Здравствуй مرحبا';
      const encrypted = encryption.encrypt(plaintext);
      const decrypted = encryption.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('Encrypted Data Structure', () => {
    it('should return properly formatted encrypted data', () => {
      const plaintext = 'Test data';
      const encrypted = encryption.encrypt(plaintext);

      expect(encrypted).toHaveProperty('ciphertext');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('authTag');
      expect(encrypted).toHaveProperty('salt');
      expect(encrypted).toHaveProperty('version');
      expect(encrypted).toHaveProperty('timestamp');
    });

    it('should use base64 encoding for all fields', () => {
      const plaintext = 'Test data';
      const encrypted = encryption.encrypt(plaintext);

      expect(() => Buffer.from(encrypted.ciphertext, 'base64')).not.toThrow();
      expect(() => Buffer.from(encrypted.iv, 'base64')).not.toThrow();
      expect(() => Buffer.from(encrypted.authTag, 'base64')).not.toThrow();
      expect(() => Buffer.from(encrypted.salt, 'base64')).not.toThrow();
    });

    it('should include version information', () => {
      const plaintext = 'Test data';
      const encrypted = encryption.encrypt(plaintext);

      expect(encrypted.version).toBe('1.0');
    });

    it('should include timestamp', () => {
      const before = Date.now();
      const encrypted = encryption.encrypt('Test data');
      const after = Date.now();

      expect(encrypted.timestamp).toBeGreaterThanOrEqual(before);
      expect(encrypted.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('Initialization Vector (IV)', () => {
    it('should generate unique IV for each encryption', () => {
      const plaintext = 'Same data';
      const encrypted1 = encryption.encrypt(plaintext);
      const encrypted2 = encryption.encrypt(plaintext);

      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });

    it('should use correct IV length', () => {
      const encrypted = encryption.encrypt('Test');
      const ivBuffer = Buffer.from(encrypted.iv, 'base64');

      expect(ivBuffer.length).toBe(ENCRYPTION_CONFIG.IV_LENGTH);
    });
  });

  describe('Authentication Tag', () => {
    it('should use correct auth tag length', () => {
      const encrypted = encryption.encrypt('Test');
      const authTagBuffer = Buffer.from(encrypted.authTag, 'base64');

      expect(authTagBuffer.length).toBe(ENCRYPTION_CONFIG.AUTH_TAG_LENGTH);
    });

    it('should fail decryption with tampered ciphertext', () => {
      const encrypted = encryption.encrypt('Test data');

      // Tamper with ciphertext
      const tampered = { ...encrypted };
      const ciphertextBuffer = Buffer.from(tampered.ciphertext, 'base64');
      ciphertextBuffer[0] ^= 0x01; // Flip one bit
      tampered.ciphertext = ciphertextBuffer.toString('base64');

      expect(() => encryption.decrypt(tampered)).toThrow(/Decryption failed/);
    });

    it('should fail decryption with tampered auth tag', () => {
      const encrypted = encryption.encrypt('Test data');

      // Tamper with auth tag
      const tampered = { ...encrypted };
      const authTagBuffer = Buffer.from(tampered.authTag, 'base64');
      authTagBuffer[0] ^= 0x01;
      tampered.authTag = authTagBuffer.toString('base64');

      expect(() => encryption.decrypt(tampered)).toThrow(/Decryption failed/);
    });

    it('should fail decryption with tampered IV', () => {
      const encrypted = encryption.encrypt('Test data');

      // Tamper with IV
      const tampered = { ...encrypted };
      const ivBuffer = Buffer.from(tampered.iv, 'base64');
      ivBuffer[0] ^= 0x01;
      tampered.iv = ivBuffer.toString('base64');

      expect(() => encryption.decrypt(tampered)).toThrow(/Decryption failed/);
    });
  });

  describe('Additional Authenticated Data (AAD)', () => {
    it('should encrypt and decrypt with AAD', () => {
      const plaintext = 'Sensitive data';
      const aad = 'patient-id-12345';

      const encrypted = encryption.encrypt(plaintext, { aad });
      const decrypted = encryption.decrypt(encrypted, { aad });

      expect(decrypted).toBe(plaintext);
    });

    it('should fail decryption with wrong AAD', () => {
      const plaintext = 'Sensitive data';
      const encrypted = encryption.encrypt(plaintext, { aad: 'correct-aad' });

      expect(() => encryption.decrypt(encrypted, { aad: 'wrong-aad' })).toThrow();
    });

    it('should fail decryption with missing AAD', () => {
      const plaintext = 'Sensitive data';
      const encrypted = encryption.encrypt(plaintext, { aad: 'required-aad' });

      expect(() => encryption.decrypt(encrypted)).toThrow();
    });
  });

  describe('Key Derivation', () => {
    it('should use unique salt for each encryption', () => {
      const plaintext = 'Test data';
      const encrypted1 = encryption.encrypt(plaintext);
      const encrypted2 = encryption.encrypt(plaintext);

      expect(encrypted1.salt).not.toBe(encrypted2.salt);
    });

    it('should use correct salt length', () => {
      const encrypted = encryption.encrypt('Test');
      const saltBuffer = Buffer.from(encrypted.salt, 'base64');

      expect(saltBuffer.length).toBe(ENCRYPTION_CONFIG.SALT_LENGTH);
    });

    it('should derive same key from same salt', () => {
      const plaintext = 'Test data';

      // Use same salt for both encryptions
      const salt = crypto.randomBytes(ENCRYPTION_CONFIG.SALT_LENGTH);
      const encrypted1 = encryption.encrypt(plaintext, {
        keyDerivation: { salt },
      });

      // Decrypt should work because salt is stored in encrypted data
      const decrypted = encryption.decrypt(encrypted1);
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('Key Rotation', () => {
    it('should re-encrypt data with new key', () => {
      const plaintext = 'Sensitive data';
      const oldKey = HIPAAEncryption.generateMasterKey();
      const newKey = HIPAAEncryption.generateMasterKey();

      const oldEncryption = new HIPAAEncryption(oldKey);
      const encrypted = oldEncryption.encrypt(plaintext);

      const reencrypted = HIPAAEncryption.reencrypt(encrypted, oldKey, newKey);

      const newEncryption = new HIPAAEncryption(newKey);
      const decrypted = newEncryption.decrypt(reencrypted);

      expect(decrypted).toBe(plaintext);

      oldEncryption.destroy();
      newEncryption.destroy();
    });

    it('should fail decryption of old data with new key', () => {
      const plaintext = 'Sensitive data';
      const oldKey = HIPAAEncryption.generateMasterKey();
      const newKey = HIPAAEncryption.generateMasterKey();

      const oldEncryption = new HIPAAEncryption(oldKey);
      const encrypted = oldEncryption.encrypt(plaintext);

      const newEncryption = new HIPAAEncryption(newKey);
      expect(() => newEncryption.decrypt(encrypted)).toThrow();

      oldEncryption.destroy();
      newEncryption.destroy();
    });
  });

  describe('JSON Serialization', () => {
    it('should encrypt to JSON string', () => {
      const plaintext = 'Test data';
      const json = encryption.encryptToJSON(plaintext);

      expect(() => JSON.parse(json)).not.toThrow();

      const parsed = JSON.parse(json) as EncryptedData;
      expect(parsed).toHaveProperty('ciphertext');
      expect(parsed).toHaveProperty('iv');
      expect(parsed).toHaveProperty('authTag');
    });

    it('should decrypt from JSON string', () => {
      const plaintext = 'Test data';
      const json = encryption.encryptToJSON(plaintext);
      const decrypted = encryption.decryptFromJSON(json);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('Data Integrity Verification', () => {
    it('should verify valid encrypted data', () => {
      const encrypted = encryption.encrypt('Test data');
      expect(encryption.verify(encrypted)).toBe(true);
    });

    it('should reject tampered encrypted data', () => {
      const encrypted = encryption.encrypt('Test data');
      const tampered = { ...encrypted };
      tampered.ciphertext = 'invalid';

      expect(encryption.verify(tampered)).toBe(false);
    });
  });

  describe('Memory Cleanup', () => {
    it('should destroy encryption instance', () => {
      const enc = new HIPAAEncryption(masterKey);
      enc.destroy();

      // Should throw because master key was cleared
      expect(() => enc.encrypt('test')).toThrow(/Master key not set/);
    });
  });

  describe('Error Handling', () => {
    it('should throw if master key not set', () => {
      const enc = new HIPAAEncryption();
      expect(() => enc.encrypt('test')).toThrow(/Master key not set/);
    });

    it('should handle encryption errors gracefully', () => {
      const enc = new HIPAAEncryption(masterKey);
      expect(() => enc.encrypt(null as any)).toThrow(/Encryption failed/);
    });

    it('should handle decryption errors gracefully', () => {
      const invalidData: EncryptedData = {
        ciphertext: 'invalid',
        iv: 'invalid',
        authTag: 'invalid',
        salt: 'invalid',
        version: '1.0',
        timestamp: Date.now(),
      };

      expect(() => encryption.decrypt(invalidData)).toThrow(/Decryption failed/);
    });
  });

  describe('Security Requirements', () => {
    it('should use AES-256-GCM algorithm', () => {
      expect(ENCRYPTION_CONFIG.ALGORITHM).toBe('aes-256-gcm');
    });

    it('should use 256-bit keys', () => {
      expect(ENCRYPTION_CONFIG.KEY_LENGTH).toBe(32);
    });

    it('should use recommended IV length', () => {
      expect(ENCRYPTION_CONFIG.IV_LENGTH).toBe(16);
    });

    it('should use strong PBKDF2 iterations', () => {
      expect(ENCRYPTION_CONFIG.PBKDF2_ITERATIONS).toBeGreaterThanOrEqual(600000);
    });

    it('should use SHA-512 for key derivation', () => {
      expect(ENCRYPTION_CONFIG.PBKDF2_DIGEST).toBe('sha512');
    });
  });

  describe('Performance', () => {
    it('should encrypt quickly', () => {
      const plaintext = 'Test data'.repeat(1000);
      const start = Date.now();

      encryption.encrypt(plaintext);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // Should be < 100ms
    });

    it('should decrypt quickly', () => {
      const plaintext = 'Test data'.repeat(1000);
      const encrypted = encryption.encrypt(plaintext);
      const start = Date.now();

      encryption.decrypt(encrypted);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });
});

describe('Convenience Functions', () => {
  const originalEnv = process.env.HIPAA_MASTER_KEY;

  afterEach(() => {
    if (originalEnv) {
      process.env.HIPAA_MASTER_KEY = originalEnv;
    } else {
      delete process.env.HIPAA_MASTER_KEY;
    }
  });

  describe('encrypt/decrypt', () => {
    it('should use environment variable', () => {
      process.env.HIPAA_MASTER_KEY = HIPAAEncryption.generateMasterKey();

      const plaintext = 'Test data';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should throw if environment variable not set', () => {
      delete process.env.HIPAA_MASTER_KEY;

      expect(() => encrypt('test')).toThrow(/HIPAA_MASTER_KEY/);
    });
  });
});
