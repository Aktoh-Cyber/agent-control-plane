# HIPAA Encryption Examples

## Table of Contents

1. [Basic Encryption](#basic-encryption)
2. [Healthcare Use Cases](#healthcare-use-cases)
3. [Database Integration](#database-integration)
4. [API Integration](#api-integration)
5. [Key Management](#key-management)
6. [Migration Scenarios](#migration-scenarios)

## Basic Encryption

### Simple Encrypt/Decrypt

```typescript
import { HIPAAEncryption } from '../src/security/hipaa-encryption';

// Generate and store master key (do once)
const masterKey = HIPAAEncryption.generateMasterKey();
console.log('Store this securely:', masterKey);

// Initialize
const encryption = new HIPAAEncryption(masterKey);

// Encrypt
const plaintext = 'Patient SSN: 123-45-6789';
const encrypted = encryption.encrypt(plaintext);
console.log('Encrypted:', encrypted);

// Decrypt
const decrypted = encryption.decrypt(encrypted);
console.log('Decrypted:', decrypted);

// Cleanup
encryption.destroy();
```

### Using Environment Variables

```typescript
// .env file
// HIPAA_MASTER_KEY=a1b2c3d4e5f6...

import { encrypt, decrypt } from '../src/security/hipaa-encryption';

const encrypted = encrypt('Sensitive data');
const decrypted = decrypt(encrypted);
```

## Healthcare Use Cases

### Electronic Health Records (EHR)

```typescript
interface PatientRecord {
  id: string;
  firstName: string;
  lastName: string;
  ssn: string; // Sensitive - must encrypt
  dateOfBirth: string; // Sensitive - must encrypt
  medicalHistory: string[]; // Sensitive - must encrypt
  medications: string[]; // Sensitive - must encrypt
  insuranceNumber: string; // Sensitive - must encrypt
}

class EHRService {
  private encryption: HIPAAEncryption;

  constructor(masterKey: string) {
    this.encryption = new HIPAAEncryption(masterKey);
  }

  encryptPatientRecord(record: PatientRecord): EncryptedPatientRecord {
    return {
      id: record.id, // Not encrypted - used for lookup
      firstName: record.firstName, // Not encrypted - for display
      lastName: record.lastName, // Not encrypted - for display
      // Encrypt all ePHI
      ssn: this.encryption.encrypt(record.ssn),
      dateOfBirth: this.encryption.encrypt(record.dateOfBirth),
      medicalHistory: this.encryption.encrypt(JSON.stringify(record.medicalHistory)),
      medications: this.encryption.encrypt(JSON.stringify(record.medications)),
      insuranceNumber: this.encryption.encrypt(record.insuranceNumber),
    };
  }

  decryptPatientRecord(encrypted: EncryptedPatientRecord): PatientRecord {
    return {
      id: encrypted.id,
      firstName: encrypted.firstName,
      lastName: encrypted.lastName,
      ssn: this.encryption.decrypt(encrypted.ssn) as string,
      dateOfBirth: this.encryption.decrypt(encrypted.dateOfBirth) as string,
      medicalHistory: JSON.parse(this.encryption.decrypt(encrypted.medicalHistory) as string),
      medications: JSON.parse(this.encryption.decrypt(encrypted.medications) as string),
      insuranceNumber: this.encryption.decrypt(encrypted.insuranceNumber) as string,
    };
  }

  destroy() {
    this.encryption.destroy();
  }
}

// Usage
const ehr = new EHRService(process.env.HIPAA_MASTER_KEY!);

const patient: PatientRecord = {
  id: 'patient-001',
  firstName: 'John',
  lastName: 'Doe',
  ssn: '123-45-6789',
  dateOfBirth: '1980-01-15',
  medicalHistory: ['Hypertension', 'Type 2 Diabetes'],
  medications: ['Metformin', 'Lisinopril'],
  insuranceNumber: 'INS-987654321',
};

const encrypted = ehr.encryptPatientRecord(patient);
const decrypted = ehr.decryptPatientRecord(encrypted);
```

### Lab Results

```typescript
interface LabResult {
  patientId: string;
  testType: string;
  results: {
    test: string;
    value: number;
    unit: string;
  }[];
  timestamp: number;
}

class LabResultsService {
  private encryption: HIPAAEncryption;

  constructor(masterKey: string) {
    this.encryption = new HIPAAEncryption(masterKey);
  }

  encryptLabResult(result: LabResult): EncryptedData {
    // Use patient ID as AAD for additional security
    return this.encryption.encrypt(JSON.stringify(result), {
      aad: result.patientId,
    });
  }

  decryptLabResult(encrypted: EncryptedData, patientId: string): LabResult {
    // Must provide correct patient ID to decrypt
    const json = this.encryption.decrypt(encrypted, { aad: patientId }) as string;
    return JSON.parse(json);
  }
}

// Usage
const labService = new LabResultsService(process.env.HIPAA_MASTER_KEY!);

const result: LabResult = {
  patientId: 'patient-001',
  testType: 'Lipid Panel',
  results: [
    { test: 'Total Cholesterol', value: 200, unit: 'mg/dL' },
    { test: 'LDL', value: 120, unit: 'mg/dL' },
    { test: 'HDL', value: 55, unit: 'mg/dL' },
  ],
  timestamp: Date.now(),
};

const encrypted = labService.encryptLabResult(result);

// Decryption requires correct patient ID
try {
  const decrypted = labService.decryptLabResult(encrypted, 'patient-001'); // Success
  const invalid = labService.decryptLabResult(encrypted, 'wrong-id'); // Fails
} catch (error) {
  console.error('Patient ID mismatch - access denied');
}
```

## Database Integration

### PostgreSQL

```typescript
import { Pool } from 'pg';
import { HIPAAEncryption } from '../src/security/hipaa-encryption';

class SecurePatientRepository {
  private pool: Pool;
  private encryption: HIPAAEncryption;

  constructor(dbConfig: any, masterKey: string) {
    this.pool = new Pool(dbConfig);
    this.encryption = new HIPAAEncryption(masterKey);
  }

  async savePatient(patient: PatientRecord): Promise<void> {
    const encrypted = {
      id: patient.id,
      first_name: patient.firstName,
      last_name: patient.lastName,
      ssn_encrypted: this.encryption.encryptToJSON(patient.ssn),
      dob_encrypted: this.encryption.encryptToJSON(patient.dateOfBirth),
      medical_history_encrypted: this.encryption.encryptToJSON(
        JSON.stringify(patient.medicalHistory)
      ),
    };

    await this.pool.query(
      `INSERT INTO patients (id, first_name, last_name, ssn_encrypted, dob_encrypted, medical_history_encrypted)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         ssn_encrypted = EXCLUDED.ssn_encrypted,
         dob_encrypted = EXCLUDED.dob_encrypted,
         medical_history_encrypted = EXCLUDED.medical_history_encrypted`,
      [
        encrypted.id,
        encrypted.first_name,
        encrypted.last_name,
        encrypted.ssn_encrypted,
        encrypted.dob_encrypted,
        encrypted.medical_history_encrypted,
      ]
    );
  }

  async getPatient(id: string): Promise<PatientRecord | null> {
    const result = await this.pool.query('SELECT * FROM patients WHERE id = $1', [id]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];

    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      ssn: this.encryption.decryptFromJSON(row.ssn_encrypted) as string,
      dateOfBirth: this.encryption.decryptFromJSON(row.dob_encrypted) as string,
      medicalHistory: JSON.parse(
        this.encryption.decryptFromJSON(row.medical_history_encrypted) as string
      ),
    };
  }

  async destroy() {
    await this.pool.end();
    this.encryption.destroy();
  }
}
```

### MongoDB

```typescript
import { MongoClient, Collection } from 'mongodb';
import { HIPAAEncryption } from '../src/security/hipaa-encryption';

class SecureMongoRepository {
  private collection: Collection;
  private encryption: HIPAAEncryption;

  constructor(collection: Collection, masterKey: string) {
    this.collection = collection;
    this.encryption = new HIPAAEncryption(masterKey);
  }

  async savePatient(patient: PatientRecord): Promise<void> {
    const encrypted = {
      _id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      encrypted: {
        ssn: this.encryption.encrypt(patient.ssn),
        dateOfBirth: this.encryption.encrypt(patient.dateOfBirth),
        medicalHistory: this.encryption.encrypt(JSON.stringify(patient.medicalHistory)),
      },
      updatedAt: new Date(),
    };

    await this.collection.updateOne({ _id: patient.id }, { $set: encrypted }, { upsert: true });
  }

  async getPatient(id: string): Promise<PatientRecord | null> {
    const doc = await this.collection.findOne({ _id: id });

    if (!doc) return null;

    return {
      id: doc._id,
      firstName: doc.firstName,
      lastName: doc.lastName,
      ssn: this.encryption.decrypt(doc.encrypted.ssn) as string,
      dateOfBirth: this.encryption.decrypt(doc.encrypted.dateOfBirth) as string,
      medicalHistory: JSON.parse(this.encryption.decrypt(doc.encrypted.medicalHistory) as string),
    };
  }
}
```

## API Integration

### Express.js Middleware

```typescript
import express from 'express';
import { HIPAAEncryption } from '../src/security/hipaa-encryption';

// Encryption middleware
const encryptionMiddleware = (masterKey: string) => {
  const encryption = new HIPAAEncryption(masterKey);

  return (req: any, res: any, next: any) => {
    req.encryption = encryption;
    next();
  };
};

const app = express();
app.use(express.json());
app.use(encryptionMiddleware(process.env.HIPAA_MASTER_KEY!));

// Create patient record
app.post('/api/patients', async (req, res) => {
  try {
    const patient = req.body;

    // Encrypt sensitive fields
    const encrypted = {
      ...patient,
      ssn: req.encryption.encrypt(patient.ssn),
      dateOfBirth: req.encryption.encrypt(patient.dateOfBirth),
    };

    await db.patients.save(encrypted);

    res.json({ success: true, patientId: patient.id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save patient record' });
  }
});

// Get patient record
app.get('/api/patients/:id', async (req, res) => {
  try {
    const encrypted = await db.patients.findById(req.params.id);

    if (!encrypted) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Decrypt sensitive fields
    const patient = {
      ...encrypted,
      ssn: req.encryption.decrypt(encrypted.ssn),
      dateOfBirth: req.encryption.decrypt(encrypted.dateOfBirth),
    };

    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve patient record' });
  }
});
```

### GraphQL

```typescript
import { GraphQLObjectType, GraphQLString } from 'graphql';
import { HIPAAEncryption } from '../src/security/hipaa-encryption';

const encryption = new HIPAAEncryption(process.env.HIPAA_MASTER_KEY!);

const PatientType = new GraphQLObjectType({
  name: 'Patient',
  fields: {
    id: { type: GraphQLString },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    ssn: {
      type: GraphQLString,
      resolve: (parent) => encryption.decrypt(parent.ssnEncrypted),
    },
    dateOfBirth: {
      type: GraphQLString,
      resolve: (parent) => encryption.decrypt(parent.dobEncrypted),
    },
  },
});

const mutations = {
  createPatient: {
    type: PatientType,
    args: {
      firstName: { type: GraphQLString },
      lastName: { type: GraphQLString },
      ssn: { type: GraphQLString },
      dateOfBirth: { type: GraphQLString },
    },
    resolve: async (_, args) => {
      const encrypted = {
        id: generateId(),
        firstName: args.firstName,
        lastName: args.lastName,
        ssnEncrypted: encryption.encrypt(args.ssn),
        dobEncrypted: encryption.encrypt(args.dateOfBirth),
      };

      await db.patients.save(encrypted);
      return encrypted;
    },
  },
};
```

## Key Management

### Key Rotation Example

```typescript
import { KeyManager, HIPAAEncryption } from '../src/security';

async function rotateEncryptionKeys() {
  const kek = process.env.HIPAA_KEK!;
  const keyManager = new KeyManager('./.keys');

  // Get current active key
  const oldKeyMeta = await keyManager.getActiveKey();

  if (!oldKeyMeta) {
    console.log('No active key found');
    return;
  }

  // Check if rotation is needed
  if (!keyManager.needsRotation(oldKeyMeta)) {
    console.log('Key rotation not needed yet');
    return;
  }

  console.log('Starting key rotation...');

  // Generate new key
  const { key: newKey, metadata: newKeyMeta } = await keyManager.rotateKey(kek);

  // Load old key
  const { key: oldKey } = await keyManager.loadKey(oldKeyMeta.keyId, kek);

  // Re-encrypt all data
  const patients = await db.patients.findAll();

  for (const patient of patients) {
    const reencrypted = {
      ...patient,
      ssn: HIPAAEncryption.reencrypt(patient.ssn, oldKey, newKey),
      dob: HIPAAEncryption.reencrypt(patient.dob, oldKey, newKey),
    };

    await db.patients.update(patient.id, reencrypted);
  }

  console.log(`✅ Rotated ${patients.length} patient records`);

  // Cleanup old keys
  const deleted = await keyManager.cleanupOldKeys(kek);
  console.log(`🗑️  Deleted ${deleted} expired keys`);
}

// Run monthly
setInterval(rotateEncryptionKeys, 30 * 24 * 60 * 60 * 1000);
```

## Migration Scenarios

### Database Migration

```typescript
import { MigrationUtility } from '../src/security/migration';

async function migrateDatabase() {
  const migration = new MigrationUtility(process.env.HIPAA_MASTER_KEY!);

  // Fetch all records
  const patients = await db.query('SELECT * FROM patients WHERE migration_status = $1', [
    'pending',
  ]);

  const records = patients.rows.map((p) => ({
    id: p.id,
    data: { data: p.ssn_legacy }, // Legacy base64 format
  }));

  console.log(`Migrating ${records.length} records...`);

  // Migrate with progress
  const result = await migration.migrateBatch(records, (processed, total) => {
    const percent = ((processed / total) * 100).toFixed(1);
    console.log(`Progress: ${percent}% (${processed}/${total})`);
  });

  // Update database
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const encrypted = migration.migrateSingle(record.data);

    await db.query('UPDATE patients SET ssn_encrypted = $1, migration_status = $2 WHERE id = $3', [
      JSON.stringify(encrypted),
      'completed',
      record.id,
    ]);
  }

  console.log(`\n✅ Success: ${result.migrated} records migrated`);
  console.log(`❌ Failed: ${result.failed} records`);
  console.log(`⏱️  Duration: ${result.duration}ms`);

  if (result.errors.length > 0) {
    console.error('Errors:', result.errors);
  }

  migration.destroy();
}
```

### Gradual Migration

```typescript
class HybridEncryptionService {
  private newEncryption: HIPAAEncryption;
  private migration: MigrationUtility;

  constructor(masterKey: string) {
    this.newEncryption = new HIPAAEncryption(masterKey);
    this.migration = new MigrationUtility(masterKey);
  }

  // Automatically detect and handle both formats
  decrypt(data: unknown): string {
    if (MigrationUtility.isLegacyFormat(data)) {
      // Legacy format - decrypt and automatically migrate
      const plaintext = this.migration.decryptLegacy(data);
      console.log('Legacy format detected - consider migrating');
      return plaintext;
    }

    // New format
    return this.newEncryption.decrypt(data as EncryptedData) as string;
  }

  encrypt(plaintext: string): EncryptedData {
    // Always use new format for encryption
    return this.newEncryption.encrypt(plaintext);
  }

  destroy() {
    this.newEncryption.destroy();
    this.migration.destroy();
  }
}

// Usage - supports both old and new formats
const service = new HybridEncryptionService(process.env.HIPAA_MASTER_KEY!);

const patient = await db.patients.findOne({ id: 'patient-001' });

// Automatically handles both formats
const ssn = service.decrypt(patient.ssn);

// Always saves in new format
const updated = {
  ...patient,
  ssn: service.encrypt(ssn), // Now in new format
};

await db.patients.save(updated);
```

## Additional Resources

- See [HIPAA_ENCRYPTION_GUIDE.md](./HIPAA_ENCRYPTION_GUIDE.md) for comprehensive documentation
- See [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) for audit checklist
- Run tests: `npm test tests/security/`
