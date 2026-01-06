# HIPAA Encryption Implementation Guide

## Overview

This module provides production-grade AES-256-GCM encryption meeting HIPAA security requirements for protecting electronic Protected Health Information (ePHI).

## Features

- **AES-256-GCM Encryption** - FIPS 140-2 compliant algorithm
- **Authenticated Encryption** - Detects tampering with authentication tags
- **Key Derivation** - Secure PBKDF2 with 600,000 iterations
- **Key Rotation** - Built-in support for rotating encryption keys
- **Key Management** - Secure storage and lifecycle management
- **Migration Tools** - Utilities for upgrading legacy encryption

## Quick Start

### Installation

```bash
npm install
```

### Basic Usage

```typescript
import { HIPAAEncryption } from './src/security/hipaa-encryption';

// Generate a master key (do this once, store securely)
const masterKey = HIPAAEncryption.generateMasterKey();
console.log('Master Key:', masterKey);
// Store this in environment variable: HIPAA_MASTER_KEY

// Initialize encryption
const encryption = new HIPAAEncryption(masterKey);

// Encrypt sensitive data
const patientData = 'Patient SSN: 123-45-6789';
const encrypted = encryption.encrypt(patientData);

// Decrypt when needed
const decrypted = encryption.decrypt(encrypted);
console.log('Decrypted:', decrypted); // 'Patient SSN: 123-45-6789'

// Always cleanup
encryption.destroy();
```

### Using Environment Variables

```typescript
import { encrypt, decrypt } from './src/security/hipaa-encryption';

// Set HIPAA_MASTER_KEY in your environment
// export HIPAA_MASTER_KEY=<your-generated-key>

// Use convenience functions (automatically uses env var)
const encrypted = encrypt('Sensitive health data');
const decrypted = decrypt(encrypted);
```

## Security Requirements Met

### HIPAA Technical Safeguards (45 CFR § 164.312)

- ✅ **Access Control** - Encryption keys stored separately from data
- ✅ **Encryption & Decryption** - AES-256-GCM for data at rest
- ✅ **Integrity Controls** - Authentication tags detect tampering
- ✅ **Transmission Security** - Supports encrypted data transfer

### Implementation Details

| Requirement    | Implementation                    |
| -------------- | --------------------------------- |
| Algorithm      | AES-256-GCM (FIPS 140-2)          |
| Key Size       | 256 bits (32 bytes)               |
| IV Size        | 128 bits (16 bytes)               |
| Auth Tag       | 128 bits (16 bytes)               |
| Key Derivation | PBKDF2-SHA512, 600,000 iterations |
| Salt Size      | 512 bits (64 bytes)               |

## Advanced Usage

### With Additional Authenticated Data (AAD)

AAD provides context that's authenticated but not encrypted:

```typescript
const patientId = 'patient-12345';
const diagnosis = 'Diagnosis: Hypertension';

// Encrypt with AAD
const encrypted = encryption.encrypt(diagnosis, {
  aad: patientId,
});

// Must provide same AAD to decrypt
const decrypted = encryption.decrypt(encrypted, {
  aad: patientId,
});

// Wrong AAD fails decryption
try {
  encryption.decrypt(encrypted, { aad: 'wrong-id' });
} catch (error) {
  console.log('AAD mismatch - decryption failed');
}
```

### JSON Serialization

For storing encrypted data in databases:

```typescript
// Encrypt to JSON string
const json = encryption.encryptToJSON('Medical record');

// Store in database
await db.patients.update({
  medicalRecord: json,
});

// Retrieve and decrypt
const record = await db.patients.findOne({ id: patientId });
const decrypted = encryption.decryptFromJSON(record.medicalRecord);
```

### Data Integrity Verification

Verify encrypted data without decrypting:

```typescript
const encrypted = encryption.encrypt('Sensitive data');

// Verify integrity
if (encryption.verify(encrypted)) {
  console.log('Data is valid and unmodified');
} else {
  console.log('Data has been tampered with');
}
```

## Key Management

### Generating Keys

```typescript
import { KeyManager, generateKey } from './src/security/key-manager';

// Generate master key with metadata
const { key, metadata } = await generateKey({
  purpose: 'production-ehr-encryption',
});

console.log('Key ID:', metadata.keyId);
console.log('Master Key:', key); // Store this securely!
```

### Secure Key Storage

```typescript
import { KeyManager, getKEK } from './src/security/key-manager';

// Initialize key manager
const keyManager = new KeyManager('./.keys', {
  maxKeyAge: 90 * 24 * 60 * 60 * 1000, // 90 days
  autoRotate: false,
  gracePeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
});

// Generate KEK (Key Encryption Key) - store in HSM or secrets manager
const kek = getKEK(); // From HIPAA_KEK environment variable

// Generate and store master key
const { key, metadata } = await keyManager.generateKey({
  purpose: 'patient-data-encryption',
});

await keyManager.storeKey(key, metadata, kek);

// Load key when needed
const { key: loadedKey } = await keyManager.loadKey(metadata.keyId, kek);
```

### Key Rotation

```typescript
// Check if rotation needed
const activeKey = await keyManager.getActiveKey();
if (activeKey && keyManager.needsRotation(activeKey)) {
  console.log('Key rotation recommended');

  // Rotate key
  const { key: newKey, metadata: newMeta } = await keyManager.rotateKey(kek);

  // Re-encrypt all data with new key
  await reencryptDatabase(activeKey.keyId, newMeta.keyId);
}

// Cleanup old keys beyond grace period
const deleted = await keyManager.cleanupOldKeys(kek);
console.log(`Deleted ${deleted} expired keys`);
```

### Key Backup and Recovery

```typescript
// Export key for backup
const backupPassword = 'secure-backup-password-from-admin';
const backup = await keyManager.exportKeyForBackup(metadata.keyId, kek, backupPassword);

// Store backup in secure location (offline storage, vault, etc.)
await secureStorage.store('key-backup.enc', backup);

// Import key from backup (disaster recovery)
const backupData = await secureStorage.retrieve('key-backup.enc');
const imported = await keyManager.importKeyFromBackup(backupData, backupPassword, kek);

console.log('Restored key:', imported.keyId);
```

## Migration from Legacy Encryption

### Analyzing Migration Needs

```typescript
import { MigrationUtility } from './src/security/migration';

// Analyze existing data
const records = await db.patients.findAll();
const report = MigrationUtility.analyzeMigrationNeeds(records.map((r) => r.encryptedData));

console.log(`Total records: ${report.total}`);
console.log(`Legacy format: ${report.legacy}`);
console.log(`Already migrated: ${report.migrated}`);
console.log(`Unknown format: ${report.unknown}`);
```

### Batch Migration

```typescript
const migration = new MigrationUtility(masterKey);

// Fetch records to migrate
const legacyRecords = await db.patients
  .find({ migrationStatus: 'pending' })
  .map((r) => ({ id: r.id, data: r.encryptedData }));

// Migrate with progress tracking
const result = await migration.migrateBatch(legacyRecords, (processed, total) => {
  console.log(`Progress: ${processed}/${total}`);
});

console.log(`✅ Migrated: ${result.migrated}`);
console.log(`❌ Failed: ${result.failed}`);
console.log(`⏱️ Duration: ${result.duration}ms`);

if (!result.success) {
  console.error('Errors:', result.errors);
}

migration.destroy();
```

### Database Migration Script

```typescript
// Generate SQL migration script
const sql = MigrationUtility.generateMigrationSQL('patients', 'medical_data');

console.log(sql);
// Execute this SQL to prepare database, then run migration code
```

## Environment Configuration

### Required Environment Variables

```bash
# Master encryption key (256-bit hex)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
export HIPAA_MASTER_KEY=<your-64-character-hex-key>

# Key Encryption Key (for key storage)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
export HIPAA_KEK=<your-64-character-hex-key>
```

### Key Generation Script

Create `scripts/generate-keys.js`:

```javascript
const crypto = require('crypto');

console.log('=== HIPAA Encryption Keys ===\n');

const masterKey = crypto.randomBytes(32).toString('hex');
const kek = crypto.randomBytes(32).toString('hex');

console.log('Add these to your .env file:\n');
console.log(`HIPAA_MASTER_KEY=${masterKey}`);
console.log(`HIPAA_KEK=${kek}`);
console.log('\n⚠️  IMPORTANT: Store these securely! Never commit to git.');
```

Run: `node scripts/generate-keys.js`

### Production Deployment

**NEVER hardcode keys in source code!**

Use a secrets management solution:

1. **AWS Secrets Manager**

```typescript
import { SecretsManager } from 'aws-sdk';

const client = new SecretsManager({ region: 'us-east-1' });
const secret = await client.getSecretValue({ SecretId: 'hipaa-master-key' }).promise();
const masterKey = JSON.parse(secret.SecretString).masterKey;
```

2. **HashiCorp Vault**

```typescript
import vault from 'node-vault';

const client = vault({ endpoint: 'https://vault.example.com' });
const secret = await client.read('secret/data/hipaa-keys');
const masterKey = secret.data.data.masterKey;
```

3. **Azure Key Vault**

```typescript
import { SecretClient } from '@azure/keyvault-secrets';

const client = new SecretClient(vaultUrl, credential);
const secret = await client.getSecret('hipaa-master-key');
const masterKey = secret.value;
```

## Best Practices

### 1. Key Security

- ✅ Generate keys with cryptographic randomness
- ✅ Store keys in environment variables or secrets managers
- ✅ Use different keys for development, staging, production
- ✅ Rotate keys every 90 days
- ✅ Backup keys in secure offline storage
- ❌ NEVER commit keys to version control
- ❌ NEVER log keys in application logs
- ❌ NEVER transmit keys over insecure channels

### 2. Data Protection

- ✅ Encrypt all ePHI at rest
- ✅ Use AAD for record identifiers
- ✅ Verify encrypted data integrity before processing
- ✅ Implement audit logging for encryption/decryption
- ✅ Clear sensitive data from memory after use
- ❌ Don't store plaintext and encrypted data together
- ❌ Don't reuse IVs (handled automatically)

### 3. Error Handling

```typescript
try {
  const encrypted = encryption.encrypt(sensitiveData);
  await db.save(encrypted);
} catch (error) {
  // Log error without sensitive data
  logger.error('Encryption failed', {
    errorType: error.name,
    timestamp: Date.now(),
    // Don't log plaintext data!
  });
  throw new EncryptionError('Failed to protect sensitive data');
}
```

### 4. Testing

```typescript
describe('ePHI Encryption', () => {
  it('should encrypt patient SSN', () => {
    const encryption = new HIPAAEncryption(testMasterKey);
    const ssn = '123-45-6789';

    const encrypted = encryption.encrypt(ssn);

    // Verify encrypted data doesn't contain plaintext
    expect(encrypted.ciphertext).not.toContain('123');
    expect(encrypted.ciphertext).not.toContain('45');
    expect(encrypted.ciphertext).not.toContain('6789');

    encryption.destroy();
  });
});
```

### 5. Performance Optimization

```typescript
// Reuse encryption instance
class PatientService {
  private encryption: HIPAAEncryption;

  constructor() {
    this.encryption = new HIPAAEncryption(process.env.HIPAA_MASTER_KEY);
  }

  async savePatient(data: PatientData) {
    // Encrypt sensitive fields
    const encrypted = {
      ...data,
      ssn: this.encryption.encrypt(data.ssn),
      medicalHistory: this.encryption.encrypt(JSON.stringify(data.medicalHistory)),
    };

    return db.patients.save(encrypted);
  }

  destroy() {
    this.encryption.destroy();
  }
}
```

## Compliance Checklist

- [ ] Master key generated with cryptographic randomness
- [ ] Keys stored in secure secrets manager (not in code)
- [ ] Different keys for each environment
- [ ] Key rotation policy implemented (90 days)
- [ ] Key backup and recovery procedures documented
- [ ] All ePHI encrypted with AES-256-GCM
- [ ] Authentication tags verified on decryption
- [ ] Audit logging for encryption operations
- [ ] Access controls limit who can decrypt
- [ ] Incident response plan for key compromise
- [ ] Regular security audits scheduled
- [ ] Staff training on encryption procedures

## Troubleshooting

### "Master key not set"

```typescript
// Ensure master key is set before use
const encryption = new HIPAAEncryption(process.env.HIPAA_MASTER_KEY);
// Or call setMasterKey()
encryption.setMasterKey(masterKey);
```

### "Decryption failed (possible tampering)"

- Encrypted data was modified
- Wrong master key used
- AAD mismatch
- Corrupted data

```typescript
// Verify data integrity first
if (!encryption.verify(encrypted)) {
  logger.error('Data integrity check failed');
  throw new Error('Encrypted data has been tampered with');
}
```

### "HIPAA_MASTER_KEY environment variable not set"

```bash
# Development
export HIPAA_MASTER_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Production - use secrets manager
```

## Support and Security

### Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** open a public GitHub issue
2. Email security@yourdomain.com with details
3. Include reproduction steps if possible
4. Allow 90 days for patch before disclosure

### References

- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/)
- [NIST SP 800-38D (GCM)](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [FIPS 140-2](https://csrc.nist.gov/publications/detail/fips/140/2/final)

## License

Proprietary - HIPAA Compliance Implementation
