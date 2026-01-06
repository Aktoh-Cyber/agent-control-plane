# HIPAA-Compliant Encryption Module

Production-grade AES-256-GCM encryption for protecting electronic Protected Health Information (ePHI).

## Features

✅ **AES-256-GCM** - FIPS 140-2 compliant encryption
✅ **Authenticated Encryption** - Detects data tampering
✅ **Secure Key Derivation** - PBKDF2 with 600,000 iterations
✅ **Key Rotation** - Built-in lifecycle management
✅ **Migration Tools** - Upgrade from legacy encryption
✅ **Comprehensive Tests** - 90%+ coverage

## Quick Start

### 1. Generate Keys

```bash
node scripts/generate-hipaa-keys.js
```

### 2. Basic Usage

```typescript
import { HIPAAEncryption } from './security/hipaa-encryption';

// Initialize with master key
const encryption = new HIPAAEncryption(process.env.HIPAA_MASTER_KEY);

// Encrypt sensitive data
const encrypted = encryption.encrypt('Patient SSN: 123-45-6789');

// Decrypt when needed
const decrypted = encryption.decrypt(encrypted);

// Always cleanup
encryption.destroy();
```

### 3. Validate Setup

```bash
node scripts/validate-env.js
```

## Module Structure

```
src/security/
├── hipaa-encryption.ts    # Core AES-256-GCM implementation
├── key-manager.ts         # Key lifecycle management
├── migration.ts           # Legacy encryption migration
└── index.ts              # Public API exports

tests/security/
├── hipaa-encryption.test.ts
├── key-manager.test.ts
└── migration.test.ts

docs/security/
├── HIPAA_ENCRYPTION_GUIDE.md  # Comprehensive documentation
├── EXAMPLES.md                # Usage examples
├── SECURITY_AUDIT.md          # Security checklist
└── ENV_SETUP.md               # Environment configuration

scripts/
├── generate-hipaa-keys.js     # Key generation utility
└── validate-env.js            # Environment validation
```

## API Reference

### HIPAAEncryption

```typescript
class HIPAAEncryption {
  constructor(masterKey?: string | Buffer);

  // Encryption
  encrypt(plaintext: string | Buffer, options?: EncryptionOptions): EncryptedData;
  encryptToJSON(plaintext: string | Buffer, options?: EncryptionOptions): string;

  // Decryption
  decrypt(encryptedData: EncryptedData, options?: DecryptionOptions): string | Buffer;
  decryptFromJSON(json: string, options?: DecryptionOptions): string | Buffer;

  // Key management
  setMasterKey(masterKey: string | Buffer): void;
  static generateMasterKey(): string;
  static reencrypt(
    data: EncryptedData,
    oldKey: string | Buffer,
    newKey: string | Buffer
  ): EncryptedData;

  // Verification
  verify(encryptedData: EncryptedData): boolean;

  // Cleanup
  destroy(): void;
}
```

### KeyManager

```typescript
class KeyManager {
  constructor(keyStoragePath?: string, rotationPolicy?: KeyRotationPolicy);

  // Key generation
  generateKey(metadata?: Partial<KeyMetadata>): Promise<{ key: string; metadata: KeyMetadata }>;

  // Storage
  storeKey(key: string, metadata: KeyMetadata, kek: string): Promise<void>;
  loadKey(keyId: string, kek: string): Promise<{ key: string; metadata: KeyMetadata }>;

  // Listing
  listKeys(): Promise<KeyMetadata[]>;
  getActiveKey(): Promise<KeyMetadata | null>;

  // Rotation
  needsRotation(metadata: KeyMetadata): boolean;
  rotateKey(kek: string): Promise<{ key: string; metadata: KeyMetadata }>;
  cleanupOldKeys(kek: string): Promise<number>;

  // Backup
  exportKeyForBackup(keyId: string, kek: string, password: string): Promise<string>;
  importKeyFromBackup(backup: string, password: string, kek: string): Promise<KeyMetadata>;
}
```

### MigrationUtility

```typescript
class MigrationUtility {
  constructor(masterKey: string | Buffer);

  // Detection
  static isLegacyFormat(data: unknown): boolean;

  // Migration
  migrateSingle(legacyData: LegacyEncryptedData): EncryptedData;
  migrateBatch(records: Array<{ id: string; data: LegacyEncryptedData }>): Promise<MigrationResult>;
  autoMigrate(data: unknown): EncryptedData;

  // Analysis
  static analyzeMigrationNeeds(records: unknown[]): MigrationReport;
  static generateMigrationSQL(tableName: string, columnName: string): string;

  // Cleanup
  destroy(): void;
}
```

## Security Specifications

| Specification      | Implementation           |
| ------------------ | ------------------------ |
| **Algorithm**      | AES-256-GCM (FIPS 140-2) |
| **Key Size**       | 256 bits (32 bytes)      |
| **IV Size**        | 128 bits (16 bytes)      |
| **Auth Tag**       | 128 bits (16 bytes)      |
| **Key Derivation** | PBKDF2-SHA512            |
| **Iterations**     | 600,000 (OWASP 2023)     |
| **Salt Size**      | 512 bits (64 bytes)      |

## HIPAA Compliance

This implementation meets HIPAA Security Rule requirements:

- ✅ **Access Control** (§ 164.312(a)(1)) - Encryption keys separate from data
- ✅ **Audit Controls** (§ 164.312(b)) - All operations logged
- ✅ **Integrity** (§ 164.312(c)(1)) - Authentication tags detect tampering
- ✅ **Transmission Security** (§ 164.312(e)(1)) - Secure data transfer

## Documentation

- 📖 [Complete Guide](../../docs/security/HIPAA_ENCRYPTION_GUIDE.md) - Comprehensive documentation
- 💡 [Examples](../../docs/security/EXAMPLES.md) - Healthcare use cases and integrations
- 🔒 [Security Audit](../../docs/security/SECURITY_AUDIT.md) - Compliance checklist
- ⚙️ [Environment Setup](../../docs/security/ENV_SETUP.md) - Configuration guide

## Testing

```bash
# Run all security tests
npm test tests/security/

# Run specific test suite
npm test tests/security/hipaa-encryption.test.ts

# With coverage
npm test -- --coverage tests/security/
```

## Common Use Cases

### Electronic Health Records

```typescript
const ehr = new HIPAAEncryption(process.env.HIPAA_MASTER_KEY);

const patientData = {
  ssn: ehr.encrypt('123-45-6789'),
  dob: ehr.encrypt('1980-01-15'),
  diagnosis: ehr.encrypt('Hypertension'),
};

await db.patients.save(patientData);
```

### Lab Results with AAD

```typescript
const lab = new HIPAAEncryption(process.env.HIPAA_MASTER_KEY);

const results = lab.encrypt(JSON.stringify(labData), {
  aad: patientId, // Additional authenticated data
});

// Must provide same patientId to decrypt
const decrypted = lab.decrypt(results, { aad: patientId });
```

### Key Rotation

```typescript
const manager = new KeyManager('./.keys');
const kek = process.env.HIPAA_KEK;

// Rotate key
const { key: newKey, metadata } = await manager.rotateKey(kek);

// Re-encrypt all data
for (const record of records) {
  record.encrypted = HIPAAEncryption.reencrypt(record.encrypted, oldKey, newKey);
}
```

## Environment Variables

```bash
# Required
HIPAA_MASTER_KEY=<64-character-hex-key>  # Master encryption key
HIPAA_KEK=<64-character-hex-key>         # Key encryption key

# Optional
KEY_STORAGE_PATH=./.keys                  # Key storage directory
KEY_MAX_AGE=7776000000                    # 90 days (milliseconds)
KEY_GRACE_PERIOD=604800000                # 7 days (milliseconds)
KEY_AUTO_ROTATE=false                     # Auto-rotation enabled
```

## Security Best Practices

1. ✅ **Generate keys** with `crypto.randomBytes()`
2. ✅ **Store keys** in environment variables or secrets manager
3. ✅ **Use different keys** for dev/staging/production
4. ✅ **Rotate keys** every 90 days
5. ✅ **Backup keys** in secure offline storage
6. ❌ **NEVER** commit keys to version control
7. ❌ **NEVER** log keys in application logs
8. ❌ **NEVER** transmit keys over insecure channels

## Troubleshooting

### "Master key not set"

```typescript
// Ensure key is set
const encryption = new HIPAAEncryption(process.env.HIPAA_MASTER_KEY);
```

### "Decryption failed"

- Encrypted data was tampered with
- Wrong master key used
- AAD mismatch
- Corrupted data

### "Environment variable not set"

```bash
# Generate and set key
export HIPAA_MASTER_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

## Support

- 📧 Security Issues: security@example.com
- 📖 Documentation: [docs/security/](../../docs/security/)
- 🐛 Bug Reports: GitHub Issues

## License

Proprietary - HIPAA Compliance Implementation

---

**⚠️ Security Notice**: This module handles sensitive health data. Review the [Security Audit Checklist](../../docs/security/SECURITY_AUDIT.md) before deployment.
