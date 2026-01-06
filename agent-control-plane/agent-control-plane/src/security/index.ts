/**
 * HIPAA Security Module
 *
 * Production-grade encryption and key management for HIPAA compliance
 *
 * @module security
 */

export {
  ENCRYPTION_CONFIG,
  HIPAAEncryption,
  decrypt,
  encrypt,
  getDefaultEncryption,
  type EncryptedData,
  type EncryptionOptions,
  type KeyDerivationOptions,
} from './hipaa-encryption';

export {
  KeyManager,
  generateKey,
  getKEK,
  type KeyMetadata,
  type KeyRotationPolicy,
  type KeyStorage,
} from './key-manager';

export { MigrationUtility } from './migration';
