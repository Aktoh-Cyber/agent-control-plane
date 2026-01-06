#!/usr/bin/env node

/**
 * HIPAA Encryption Key Generation Script
 *
 * Generates cryptographically secure encryption keys for HIPAA compliance
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

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

function generateKey() {
  return crypto.randomBytes(32).toString('hex');
}

function main() {
  log('\n='.repeat(60), 'cyan');
  log('  HIPAA Encryption Key Generation', 'bright');
  log('='.repeat(60), 'cyan');

  log('\n📋 Generating cryptographically secure keys...\n', 'blue');

  const masterKey = generateKey();
  const kek = generateKey();

  log('✅ Keys generated successfully!\n', 'green');

  // Display keys
  log('🔑 Master Encryption Key (HIPAA_MASTER_KEY):', 'yellow');
  log(masterKey, 'bright');

  log('\n🔑 Key Encryption Key (HIPAA_KEK):', 'yellow');
  log(kek, 'bright');

  // Create .env.example if it doesn't exist
  const envExamplePath = path.join(process.cwd(), '.env.example');
  const envExample = `# HIPAA Encryption Configuration
# Generated: ${new Date().toISOString()}

# Master encryption key (256-bit hex) - REPLACE WITH YOUR OWN KEY
HIPAA_MASTER_KEY=your_master_key_here

# Key encryption key for key storage - REPLACE WITH YOUR OWN KEY
HIPAA_KEK=your_kek_here

# Key storage directory
KEY_STORAGE_PATH=./.keys

# Rotation policy
KEY_MAX_AGE=7776000000  # 90 days in milliseconds
KEY_GRACE_PERIOD=604800000  # 7 days in milliseconds
KEY_AUTO_ROTATE=false
`;

  if (!fs.existsSync(envExamplePath)) {
    fs.writeFileSync(envExamplePath, envExample);
    log('\n📄 Created .env.example', 'green');
  }

  // Create .env file if it doesn't exist
  const envPath = path.join(process.cwd(), '.env');
  const envExists = fs.existsSync(envPath);

  if (!envExists) {
    const envContent = `# HIPAA Encryption Configuration
# Generated: ${new Date().toISOString()}
# ⚠️ WARNING: DO NOT COMMIT THIS FILE TO VERSION CONTROL

# Master encryption key (256-bit hex)
HIPAA_MASTER_KEY=${masterKey}

# Key encryption key for key storage
HIPAA_KEK=${kek}

# Key storage directory
KEY_STORAGE_PATH=./.keys

# Rotation policy
KEY_MAX_AGE=7776000000  # 90 days in milliseconds
KEY_GRACE_PERIOD=604800000  # 7 days in milliseconds
KEY_AUTO_ROTATE=false
`;

    fs.writeFileSync(envPath, envContent, { mode: 0o600 });
    log('📄 Created .env file with generated keys', 'green');
    log('   File permissions set to 600 (owner read/write only)', 'cyan');
  } else {
    log('\n⚠️  .env file already exists - not overwriting', 'yellow');
    log('   Add keys manually or delete .env to regenerate', 'yellow');
  }

  // Check/update .gitignore
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  const gitignoreEntries = [
    '',
    '# HIPAA Encryption - DO NOT COMMIT',
    '.env',
    '.env.*',
    '!.env.example',
    '.keys/',
    '*.key',
    '*.pem',
  ];

  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');

    if (!gitignoreContent.includes('.env') || !gitignoreContent.includes('.keys/')) {
      fs.appendFileSync(gitignorePath, '\n' + gitignoreEntries.join('\n') + '\n');
      log('\n📄 Updated .gitignore with security entries', 'green');
    } else {
      log('\n✅ .gitignore already contains security entries', 'green');
    }
  } else {
    fs.writeFileSync(gitignorePath, gitignoreEntries.join('\n') + '\n');
    log('\n📄 Created .gitignore with security entries', 'green');
  }

  // Create keys directory
  const keysDir = path.join(process.cwd(), '.keys');
  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true, mode: 0o700 });
    log('📁 Created .keys directory (permissions: 700)', 'green');
  }

  // Print usage instructions
  log('\n' + '='.repeat(60), 'cyan');
  log('  Next Steps', 'bright');
  log('='.repeat(60), 'cyan');

  log('\n1️⃣  Development Setup:', 'blue');
  log('   Keys have been added to .env file', 'cyan');
  log('   Run: npm test tests/security/\n', 'cyan');

  log('2️⃣  Production Setup:', 'blue');
  log('   ⚠️  DO NOT use .env file in production!', 'red');
  log('   Store keys in a secrets manager:', 'cyan');
  log('   - AWS Secrets Manager', 'cyan');
  log('   - HashiCorp Vault', 'cyan');
  log('   - Azure Key Vault\n', 'cyan');

  log('3️⃣  Environment Variables:', 'blue');
  log('   export HIPAA_MASTER_KEY=' + masterKey, 'cyan');
  log('   export HIPAA_KEK=' + kek + '\n', 'cyan');

  log('4️⃣  Verify Setup:', 'blue');
  log('   node scripts/validate-env.js\n', 'cyan');

  log('⚠️  SECURITY WARNINGS:', 'red');
  log('   • NEVER commit .env file to version control', 'yellow');
  log('   • NEVER share keys via email or chat', 'yellow');
  log('   • NEVER log keys in application logs', 'yellow');
  log('   • ALWAYS use different keys for dev/staging/prod', 'yellow');
  log('   • ROTATE keys every 90 days', 'yellow');
  log('   • BACKUP keys in secure offline storage\n', 'yellow');

  log('📖 Documentation:', 'blue');
  log('   • Setup Guide: docs/security/ENV_SETUP.md', 'cyan');
  log('   • Usage Guide: docs/security/HIPAA_ENCRYPTION_GUIDE.md', 'cyan');
  log('   • Examples: docs/security/EXAMPLES.md', 'cyan');
  log('   • Security Audit: docs/security/SECURITY_AUDIT.md\n', 'cyan');

  log('='.repeat(60), 'cyan');
  log('  ✅ Key Generation Complete!', 'green');
  log('='.repeat(60), 'cyan');
  log('');
}

// Run script
main();
