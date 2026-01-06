# Mutation Testing - Actionable Recommendations

**Generated**: 2025-12-08
**Status**: Ready for Implementation
**Target Modules**: Security, Config, Errors, ReasoningBank

---

## Executive Summary

Based on analysis of the existing test suite and code structure, this document provides specific, actionable recommendations to maximize mutation testing effectiveness.

### Current State Assessment

**Strengths**:

- ✅ Comprehensive test suite exists for security modules (449 lines for encryption alone)
- ✅ Good coverage of happy path scenarios
- ✅ Error cases are tested
- ✅ Strong type safety with TypeScript

**Improvement Areas**:

- ⚠️ Boundary conditions may not be fully tested
- ⚠️ Logical branch combinations need strengthening
- ⚠️ Some edge cases in key management may be missed
- ⚠️ Error message variations not validated

**Predicted Initial Score**: 75-85%
**Target Score**: 90%+ (Security), 80%+ (Others)

---

## Priority 1: Security Module Improvements

### File: `src/security/hipaa-encryption.ts`

**Expected Weak Spots**:

#### 1. Key Length Validation

**Current Code** (lines 115-119):

```typescript
if (this.masterKey.length !== ENCRYPTION_CONFIG.KEY_LENGTH) {
  throw new Error(`Master key must be ${ENCRYPTION_CONFIG.KEY_LENGTH} bytes...`);
}
```

**Likely Mutation**: `!==` → `===`, `!==` → `>`, `!==` → `<`

**Current Test** (line 59-62):

```typescript
it('should reject invalid key length', () => {
  const shortKey = crypto.randomBytes(16).toString('hex');
  expect(() => new HIPAAEncryption(shortKey)).toThrow(/256 bits/);
});
```

**Recommendation - Add Boundary Tests**:

```typescript
describe('Master Key Length Validation', () => {
  it('should reject key with length 31 bytes (255 bits)', () => {
    const key = crypto.randomBytes(31);
    expect(() => new HIPAAEncryption(key)).toThrow(/must be 32 bytes/);
  });

  it('should reject key with length 33 bytes (264 bits)', () => {
    const key = crypto.randomBytes(33);
    expect(() => new HIPAAEncryption(key)).toThrow(/must be 32 bytes/);
  });

  it('should accept exactly 32 bytes (256 bits)', () => {
    const key = crypto.randomBytes(32);
    expect(() => new HIPAAEncryption(key)).not.toThrow();
  });

  it('should reject zero-length key', () => {
    const key = Buffer.alloc(0);
    expect(() => new HIPAAEncryption(key)).toThrow(/must be 32 bytes/);
  });

  it('should reject very large key (1024 bytes)', () => {
    const key = crypto.randomBytes(1024);
    expect(() => new HIPAAEncryption(key)).toThrow(/must be 32 bytes/);
  });
});
```

#### 2. Key Cache TTL Logic

**Current Code** (lines 150-154):

```typescript
const cached = this.keyCache.get(cacheKey);

if (cached && Date.now() - cached.timestamp < this.KEY_CACHE_TTL) {
  return cached.key;
}
```

**Likely Mutations**:

- `<` → `<=`, `<` → `>`
- `&&` → `||`

**Recommendation - Add Cache Timing Tests**:

```typescript
describe('Key Cache TTL', () => {
  it('should use cached key within TTL', () => {
    const enc = new HIPAAEncryption(masterKey);
    const salt = crypto.randomBytes(64);

    // First derivation (cache miss)
    const key1 = enc['deriveKey'](salt);

    // Second derivation within TTL (cache hit)
    const key2 = enc['deriveKey'](salt);

    expect(key1).toBe(key2); // Same instance
  });

  it('should re-derive key after TTL expires', async () => {
    // Create instance with short TTL
    const enc = new HIPAAEncryption(masterKey);
    enc['KEY_CACHE_TTL'] = 10; // 10ms for testing

    const salt = crypto.randomBytes(64);
    const key1 = enc['deriveKey'](salt);

    // Wait for TTL to expire
    await new Promise((resolve) => setTimeout(resolve, 20));

    const key2 = enc['deriveKey'](salt);

    // Should be equal value but different instance
    expect(key1.equals(key2)).toBe(true);
    expect(key1).not.toBe(key2);
  });

  it('should handle cache exactly at TTL boundary', async () => {
    const enc = new HIPAAEncryption(masterKey);
    enc['KEY_CACHE_TTL'] = 100;

    const salt = crypto.randomBytes(64);
    enc['deriveKey'](salt);

    // Exactly at TTL
    await new Promise((resolve) => setTimeout(resolve, 100));

    const key = enc['deriveKey'](salt);
    expect(key).toBeDefined();
  });
});
```

#### 3. AAD Validation

**Current Code** (lines 211-213, 269-271):

```typescript
if (options.aad) {
  cipher.setAAD(Buffer.from(options.aad, 'utf8'));
}
```

**Current Tests** (lines 209-233):
Tests exist but may miss combinations.

**Recommendation - Strengthen AAD Tests**:

```typescript
describe('Additional Authenticated Data (AAD)', () => {
  it('should succeed with matching AAD', () => {
    const plaintext = 'secret';
    const aad = 'patient-12345';

    const encrypted = encryption.encrypt(plaintext, { aad });
    const decrypted = encryption.decrypt(encrypted, { aad });

    expect(decrypted).toBe(plaintext);
  });

  it('should fail with different AAD', () => {
    const encrypted = encryption.encrypt('secret', { aad: 'aad1' });
    expect(() => encryption.decrypt(encrypted, { aad: 'aad2' })).toThrow(/Decryption failed/);
  });

  it('should fail when AAD required but missing', () => {
    const encrypted = encryption.encrypt('secret', { aad: 'required' });
    expect(() => encryption.decrypt(encrypted)).toThrow(/Decryption failed/);
  });

  it('should fail when AAD provided but not expected', () => {
    const encrypted = encryption.encrypt('secret');
    expect(() => encryption.decrypt(encrypted, { aad: 'unexpected' })).toThrow(/Decryption failed/);
  });

  it('should handle empty string AAD', () => {
    const plaintext = 'secret';
    const encrypted = encryption.encrypt(plaintext, { aad: '' });
    const decrypted = encryption.decrypt(encrypted, { aad: '' });

    expect(decrypted).toBe(plaintext);
  });

  it('should differentiate between empty string and no AAD', () => {
    const encrypted1 = encryption.encrypt('secret');
    const encrypted2 = encryption.encrypt('secret', { aad: '' });

    // Should be different encryptions
    expect(encrypted1.authTag).not.toBe(encrypted2.authTag);
  });

  it('should handle very long AAD', () => {
    const longAAD = 'x'.repeat(10000);
    const plaintext = 'secret';

    const encrypted = encryption.encrypt(plaintext, { aad: longAAD });
    const decrypted = encryption.decrypt(encrypted, { aad: longAAD });

    expect(decrypted).toBe(plaintext);
  });
});
```

### File: `src/security/key-manager.ts`

#### 1. Key Rotation Timing

**Current Code** (lines 246-253):

```typescript
public needsRotation(metadata: KeyMetadata): boolean {
  if (!metadata.expiresAt) {
    return false;
  }

  const now = Date.now();
  return now >= metadata.expiresAt - this.rotationPolicy.gracePeriod;
}
```

**Likely Mutations**: `>=` → `>`, `-` → `+`

**Recommendation - Add Timing Boundary Tests**:

```typescript
describe('Key Rotation Timing', () => {
  it('should not need rotation before grace period', () => {
    const manager = new KeyManager('./.test-keys', {
      maxKeyAge: 1000,
      gracePeriod: 100,
    });

    const metadata: KeyMetadata = {
      keyId: 'test-key',
      version: 1,
      createdAt: Date.now(),
      expiresAt: Date.now() + 1000, // 1 second from now
      active: true,
    };

    expect(manager.needsRotation(metadata)).toBe(false);
  });

  it('should need rotation within grace period', () => {
    const manager = new KeyManager('./.test-keys', {
      maxKeyAge: 1000,
      gracePeriod: 200,
    });

    const metadata: KeyMetadata = {
      keyId: 'test-key',
      version: 1,
      createdAt: Date.now() - 900,
      expiresAt: Date.now() + 100, // Within grace period
      active: true,
    };

    expect(manager.needsRotation(metadata)).toBe(true);
  });

  it('should need rotation exactly at grace period boundary', () => {
    const now = Date.now();
    const gracePeriod = 100;

    const manager = new KeyManager('./.test-keys', {
      maxKeyAge: 1000,
      gracePeriod,
    });

    const metadata: KeyMetadata = {
      keyId: 'test-key',
      version: 1,
      createdAt: now - 900,
      expiresAt: now + gracePeriod, // Exactly at boundary
      active: true,
    };

    expect(manager.needsRotation(metadata)).toBe(true);
  });

  it('should handle key with no expiration', () => {
    const manager = new KeyManager('./.test-keys');

    const metadata: KeyMetadata = {
      keyId: 'test-key',
      version: 1,
      createdAt: Date.now(),
      active: true,
      // No expiresAt
    };

    expect(manager.needsRotation(metadata)).toBe(false);
  });

  it('should need rotation when past expiration', () => {
    const manager = new KeyManager('./.test-keys', {
      maxKeyAge: 1000,
      gracePeriod: 100,
    });

    const metadata: KeyMetadata = {
      keyId: 'test-key',
      version: 1,
      createdAt: Date.now() - 2000,
      expiresAt: Date.now() - 500, // Already expired
      active: true,
    };

    expect(manager.needsRotation(metadata)).toBe(true);
  });
});
```

#### 2. Checksum Validation

**Current Code** (lines 186-190):

```typescript
const checksum = this.calculateChecksum(key);
if (checksum !== keyStorage.checksum) {
  throw new Error('Key integrity check failed - possible corruption');
}
```

**Likely Mutation**: `!==` → `===`

**Recommendation - Add Integrity Tests**:

```typescript
describe('Key Integrity', () => {
  it('should validate correct checksum', async () => {
    const manager = new KeyManager('./.test-keys');
    const { key, metadata } = await manager.generateKey();
    const kek = HIPAAEncryption.generateMasterKey();

    await manager.storeKey(key, metadata, kek);

    const loaded = await manager.loadKey(metadata.keyId, kek);
    expect(loaded.key).toBe(key);
  });

  it('should detect corrupted checksum', async () => {
    const manager = new KeyManager('./.test-keys');
    const { key, metadata } = await manager.generateKey();
    const kek = HIPAAEncryption.generateMasterKey();

    await manager.storeKey(key, metadata, kek);

    // Corrupt the checksum
    const filePath = path.join('./.test-keys', `${metadata.keyId}.json`);
    const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
    data.checksum = '0'.repeat(64); // Invalid checksum
    await fs.writeFile(filePath, JSON.stringify(data));

    await expect(manager.loadKey(metadata.keyId, kek)).rejects.toThrow(/integrity check failed/);
  });

  it('should detect modified key data', async () => {
    const manager = new KeyManager('./.test-keys');
    const { key, metadata } = await manager.generateKey();
    const kek = HIPAAEncryption.generateMasterKey();

    await manager.storeKey(key, metadata, kek);

    // Corrupt the encrypted key
    const filePath = path.join('./.test-keys', `${metadata.keyId}.json`);
    const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
    data.encryptedKey.ciphertext = Buffer.from(data.encryptedKey.ciphertext, 'base64')
      .reverse()
      .toString('base64');
    await fs.writeFile(filePath, JSON.stringify(data));

    await expect(manager.loadKey(metadata.keyId, kek)).rejects.toThrow(
      /Decryption failed|integrity/
    );
  });
});
```

---

## Priority 2: Configuration Module

### File: `src/config/validator.ts`

**Recommendations**:

```typescript
describe('Configuration Validation Edge Cases', () => {
  it('should validate minimum values', () => {
    const config = { maxAgents: 0 };
    expect(validateConfig(config)).toHaveProperty('maxAgents', 1);
  });

  it('should validate maximum values', () => {
    const config = { maxAgents: 10000 };
    expect(validateConfig(config)).toHaveProperty('maxAgents', 1000);
  });

  it('should handle negative values', () => {
    const config = { timeout: -100 };
    expect(() => validateConfig(config)).toThrow(/positive/);
  });

  it('should validate type conversions', () => {
    const config = { maxAgents: '5' };
    expect(validateConfig(config).maxAgents).toBe(5);
  });

  it('should reject invalid types', () => {
    const config = { maxAgents: 'invalid' };
    expect(() => validateConfig(config)).toThrow(/must be number/);
  });
});
```

---

## Priority 3: Error Handling Module

### File: `src/errors/base.ts`

**Recommendations**:

```typescript
describe('Error Construction', () => {
  it('should preserve error message exactly', () => {
    const message = 'Exact error message';
    const error = new CustomError(message);
    expect(error.message).toBe(message);
  });

  it('should handle empty error message', () => {
    const error = new CustomError('');
    expect(error.message).toBe('');
  });

  it('should maintain error stack trace', () => {
    const error = new CustomError('test');
    expect(error.stack).toContain('CustomError');
    expect(error.stack).toContain('test');
  });

  it('should support error chaining', () => {
    const cause = new Error('Root cause');
    const error = new CustomError('Wrapper', { cause });
    expect(error.cause).toBe(cause);
  });
});
```

---

## General Test Improvements

### 1. Arithmetic Operators

**Pattern to Test**:

```typescript
// Any code with +, -, *, /
const result = value1 + value2;
const scaled = amount * factor;
```

**Add Tests**:

```typescript
it('should handle zero addition', () => {
  expect(add(5, 0)).toBe(5);
});

it('should handle negative numbers', () => {
  expect(add(5, -3)).toBe(2);
});

it('should handle overflow', () => {
  expect(add(Number.MAX_SAFE_INTEGER, 1)).toBe(Number.MAX_SAFE_INTEGER + 1);
});
```

### 2. Logical Operators

**Pattern to Test**:

```typescript
// Any code with &&, ||
if (conditionA && conditionB) {
}
if (conditionA || conditionB) {
}
```

**Add Tests**:

```typescript
// Test all 4 combinations
it('should handle true && true', () => {});
it('should handle true && false', () => {});
it('should handle false && true', () => {});
it('should handle false && false', () => {});
```

### 3. Equality Operators

**Pattern to Test**:

```typescript
// Any code with ===, !==, ==, !=
if (value === expected) {
}
if (count !== 0) {
}
```

**Add Tests**:

```typescript
it('should detect exact equality', () => {
  expect(compare(5, 5)).toBe(true);
});

it('should detect inequality', () => {
  expect(compare(5, 6)).toBe(false);
});

it('should handle type differences', () => {
  expect(compare(5, '5')).toBe(false);
});
```

### 4. Conditional Expressions

**Pattern to Test**:

```typescript
const result = condition ? valueA : valueB;
```

**Add Tests**:

```typescript
it('should return first value when true', () => {
  expect(conditional(true)).toBe(valueA);
});

it('should return second value when false', () => {
  expect(conditional(false)).toBe(valueB);
});
```

---

## Mutation Testing Workflow

### Step 1: Baseline (Week 1)

```bash
# Run initial tests
npm run mutation:security

# Review results
open test-reports/mutation/mutation-report.html

# Identify top 10 weak spots
cat test-reports/mutation/weak-spots-*.md
```

### Step 2: Improvement (Week 2-3)

For each survived mutant:

1. **Analyze**: Why did it survive?
2. **Categorize**: Critical, Important, or Acceptable?
3. **Test**: Add specific test case
4. **Verify**: Re-run mutation tests
5. **Document**: Note the improvement

### Step 3: Maintenance (Ongoing)

```bash
# Weekly checks
npm run mutation:incremental

# Before releases
npm run mutation:full

# Monitor trends
cat test-reports/mutation/archives/*.json | jq '.mutationScore'
```

---

## Success Metrics

### Target Scores by Module

| Module                  | Current (Est) | Target | Timeline |
| ----------------------- | ------------- | ------ | -------- |
| **hipaa-encryption.ts** | 85%           | 90%+   | Week 2   |
| **key-manager.ts**      | 75%           | 85%+   | Week 3   |
| **validator.ts**        | 70%           | 80%+   | Week 3   |
| **errors/**             | 65%           | 75%+   | Week 4   |
| **Overall**             | 75%           | 80%+   | Month 1  |

### Weekly Improvement Goals

- **Week 1**: Establish baseline, identify top 20 weak spots
- **Week 2**: Achieve 80%+ on security module
- **Week 3**: Achieve 80%+ on config module
- **Week 4**: Achieve 75%+ overall

---

## Implementation Checklist

- [ ] Install Stryker dependencies (`npm run mutation:install`)
- [ ] Run baseline mutation tests (`npm run mutation:security`)
- [ ] Review HTML report and identify survived mutants
- [ ] Implement boundary condition tests for key validation
- [ ] Implement cache timing tests
- [ ] Strengthen AAD validation tests
- [ ] Add key rotation timing tests
- [ ] Add checksum validation tests
- [ ] Re-run mutation tests and verify improvement
- [ ] Document improvements in git commit
- [ ] Set up weekly mutation test runs
- [ ] Integrate into PR workflow

---

## Next Steps

1. **Immediate**: Run `npm run mutation:security` to get baseline
2. **This Week**: Implement priority 1 recommendations
3. **Next Week**: Achieve 85%+ on security module
4. **Month 1**: Achieve 80%+ overall score

---

**Generated by**: Mutation Testing Specialist
**Hive Mind Session**: mutation-testing-recommendations
**Status**: Ready for implementation
