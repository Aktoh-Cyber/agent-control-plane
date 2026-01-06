#!/usr/bin/env node

/**
 * Environment Validation Script
 *
 * Validates HIPAA encryption environment configuration
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const checks = [];
let errors = 0;
let warnings = 0;

function check(name, test, errorMsg, warningMsg = null) {
  try {
    const result = test();
    if (result === true) {
      checks.push({ name, status: 'pass', message: '✅ Pass' });
      log(`✅ ${name}`, 'green');
    } else if (result === 'warning') {
      checks.push({ name, status: 'warning', message: `⚠️  ${warningMsg}` });
      log(`⚠️  ${name}: ${warningMsg}`, 'yellow');
      warnings++;
    } else {
      throw new Error(errorMsg);
    }
  } catch (error) {
    checks.push({ name, status: 'fail', message: `❌ ${error.message}` });
    log(`❌ ${name}: ${error.message}`, 'red');
    errors++;
  }
}

function main() {
  log('\n='.repeat(60), 'cyan');
  log('  HIPAA Encryption Environment Validation', 'bright');
  log('='.repeat(60), 'cyan');
  log('');

  // Check environment variables
  log('🔍 Checking environment variables...\n', 'blue');

  check(
    'HIPAA_MASTER_KEY exists',
    () => !!process.env.HIPAA_MASTER_KEY,
    'HIPAA_MASTER_KEY environment variable not set'
  );

  check(
    'HIPAA_MASTER_KEY length',
    () => {
      if (!process.env.HIPAA_MASTER_KEY) return false;
      const buffer = Buffer.from(process.env.HIPAA_MASTER_KEY, 'hex');
      return buffer.length === 32;
    },
    'HIPAA_MASTER_KEY must be 32 bytes (64 hex characters)'
  );

  check(
    'HIPAA_MASTER_KEY format',
    () => {
      if (!process.env.HIPAA_MASTER_KEY) return false;
      return /^[0-9a-f]{64}$/i.test(process.env.HIPAA_MASTER_KEY);
    },
    'HIPAA_MASTER_KEY must be valid hex (0-9, a-f)'
  );

  check(
    'HIPAA_KEK exists',
    () => {
      if (!process.env.HIPAA_KEK) return 'warning';
      return true;
    },
    'HIPAA_KEK not set',
    'HIPAA_KEK not set (required for key storage)'
  );

  if (process.env.HIPAA_KEK) {
    check(
      'HIPAA_KEK length',
      () => {
        const buffer = Buffer.from(process.env.HIPAA_KEK, 'hex');
        return buffer.length === 32;
      },
      'HIPAA_KEK must be 32 bytes (64 hex characters)'
    );

    check(
      'HIPAA_KEK format',
      () => /^[0-9a-f]{64}$/i.test(process.env.HIPAA_KEK),
      'HIPAA_KEK must be valid hex (0-9, a-f)'
    );
  }

  // Check file system
  log('\n🔍 Checking file system...\n', 'blue');

  check(
    '.env file exists',
    () => {
      const exists = fs.existsSync('.env');
      if (process.env.NODE_ENV === 'production' && exists) {
        return 'warning';
      }
      return exists || process.env.NODE_ENV === 'production';
    },
    '.env file not found',
    '.env file exists in production (use secrets manager instead)'
  );

  check(
    '.gitignore includes .env',
    () => {
      if (!fs.existsSync('.gitignore')) return 'warning';
      const content = fs.readFileSync('.gitignore', 'utf8');
      return content.includes('.env');
    },
    '.gitignore does not exclude .env files',
    '.gitignore not found or missing .env entry'
  );

  check(
    '.gitignore includes .keys/',
    () => {
      if (!fs.existsSync('.gitignore')) return 'warning';
      const content = fs.readFileSync('.gitignore', 'utf8');
      return content.includes('.keys');
    },
    '.gitignore does not exclude .keys/ directory',
    '.gitignore not found or missing .keys/ entry'
  );

  check(
    'Key storage directory exists',
    () => {
      const keyPath = process.env.KEY_STORAGE_PATH || './.keys';
      return fs.existsSync(keyPath);
    },
    'Key storage directory does not exist'
  );

  check(
    'Key storage directory permissions',
    () => {
      const keyPath = process.env.KEY_STORAGE_PATH || './.keys';
      if (!fs.existsSync(keyPath)) return 'warning';

      const stats = fs.statSync(keyPath);
      const mode = stats.mode & 0o777;

      if (mode > 0o700) {
        return 'warning';
      }
      return true;
    },
    'Key storage directory permissions too permissive',
    'Key storage directory permissions should be 700 (owner only)'
  );

  // Check encryption functionality
  log('\n🔍 Testing encryption functionality...\n', 'blue');

  check(
    'Can initialize encryption',
    () => {
      const { HIPAAEncryption } = require('../src/security/hipaa-encryption');
      const enc = new HIPAAEncryption(process.env.HIPAA_MASTER_KEY);
      enc.destroy();
      return true;
    },
    'Failed to initialize encryption module'
  );

  check(
    'Can encrypt data',
    () => {
      const { HIPAAEncryption } = require('../src/security/hipaa-encryption');
      const enc = new HIPAAEncryption(process.env.HIPAA_MASTER_KEY);
      const encrypted = enc.encrypt('test data');
      enc.destroy();
      return encrypted.ciphertext && encrypted.iv && encrypted.authTag;
    },
    'Failed to encrypt test data'
  );

  check(
    'Can decrypt data',
    () => {
      const { HIPAAEncryption } = require('../src/security/hipaa-encryption');
      const enc = new HIPAAEncryption(process.env.HIPAA_MASTER_KEY);
      const plaintext = 'test data';
      const encrypted = enc.encrypt(plaintext);
      const decrypted = enc.decrypt(encrypted);
      enc.destroy();
      return decrypted === plaintext;
    },
    'Failed to decrypt test data'
  );

  check(
    'Tamper detection works',
    () => {
      const { HIPAAEncryption } = require('../src/security/hipaa-encryption');
      const enc = new HIPAAEncryption(process.env.HIPAA_MASTER_KEY);
      const encrypted = enc.encrypt('test data');

      // Tamper with ciphertext
      encrypted.ciphertext = 'tampered';

      try {
        enc.decrypt(encrypted);
        enc.destroy();
        return false;
      } catch {
        enc.destroy();
        return true; // Expected to fail
      }
    },
    'Tamper detection not working'
  );

  // Security checks
  log('\n🔍 Security checks...\n', 'blue');

  check(
    'Keys are not identical',
    () => {
      if (!process.env.HIPAA_KEK) return true;
      return process.env.HIPAA_MASTER_KEY !== process.env.HIPAA_KEK;
    },
    'HIPAA_MASTER_KEY and HIPAA_KEK must be different'
  );

  check(
    'Keys are not predictable',
    () => {
      const testPatterns = [/^0+$/, /^1+$/, /^(00)+$/, /^(ff)+$/, /^0123456789abcdef/i];

      const masterKey = process.env.HIPAA_MASTER_KEY || '';

      for (const pattern of testPatterns) {
        if (pattern.test(masterKey)) {
          return false;
        }
      }

      return true;
    },
    'Keys appear to be predictable or test values'
  );

  check(
    'Environment is not production with .env',
    () => {
      if (process.env.NODE_ENV === 'production' && fs.existsSync('.env')) {
        return 'warning';
      }
      return true;
    },
    null,
    'Production environment should use secrets manager, not .env file'
  );

  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('  Validation Summary', 'bright');
  log('='.repeat(60), 'cyan');
  log('');

  const passed = checks.filter((c) => c.status === 'pass').length;
  const failed = errors;
  const warned = warnings;

  log(`✅ Passed:   ${passed}`, 'green');
  if (warned > 0) log(`⚠️  Warnings: ${warned}`, 'yellow');
  if (failed > 0) log(`❌ Failed:   ${failed}`, 'red');

  log('');

  if (errors > 0) {
    log('❌ Environment validation FAILED', 'red');
    log('\n📖 See docs/security/ENV_SETUP.md for configuration help\n', 'yellow');
    process.exit(1);
  } else if (warnings > 0) {
    log('⚠️  Environment validation passed with warnings', 'yellow');
    log('\n📖 Review warnings and see docs/security/ENV_SETUP.md\n', 'yellow');
    process.exit(0);
  } else {
    log('✅ Environment validation PASSED', 'green');
    log('\n🎉 Your HIPAA encryption environment is properly configured!\n', 'cyan');
    process.exit(0);
  }
}

// Run validation
main();
