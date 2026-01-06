#!/usr/bin/env node

// Contract Validation Script
// Validates all contract specifications and Pact files

const { readFileSync, readdirSync } = require('fs');
const { join } = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const SCHEMAS_DIR = join(__dirname, 'schemas');
const PACTS_DIR = join(__dirname, 'pacts');

class ContractValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.validated = 0;
  }

  validateSchemas() {
    console.log('Validating JSON Schemas...\n');

    const schemaFiles = readdirSync(SCHEMAS_DIR).filter((f) => f.endsWith('.json'));

    schemaFiles.forEach((file) => {
      const path = join(SCHEMAS_DIR, file);
      try {
        const schema = JSON.parse(readFileSync(path, 'utf-8'));

        // Validate schema structure
        if (!schema.$schema) {
          this.warnings.push(`${file}: Missing $schema property`);
        }

        if (!schema.title) {
          this.warnings.push(`${file}: Missing title property`);
        }

        // Try to compile schema
        ajv.compile(schema);

        console.log(`✓ ${file}`);
        this.validated++;
      } catch (error) {
        this.errors.push(`${file}: ${error.message}`);
        console.log(`✗ ${file}`);
      }
    });

    console.log(`\nValidated ${this.validated} schemas\n`);
  }

  validatePacts() {
    console.log('Validating Pact files...\n');

    try {
      const pactFiles = readdirSync(PACTS_DIR).filter((f) => f.endsWith('.json'));

      pactFiles.forEach((file) => {
        const path = join(PACTS_DIR, file);
        try {
          const pact = JSON.parse(readFileSync(path, 'utf-8'));

          // Validate Pact structure
          if (!pact.consumer || !pact.provider) {
            this.errors.push(`${file}: Missing consumer or provider`);
            return;
          }

          if (!pact.interactions || !Array.isArray(pact.interactions)) {
            this.errors.push(`${file}: Missing or invalid interactions`);
            return;
          }

          // Validate each interaction
          pact.interactions.forEach((interaction, idx) => {
            if (!interaction.description) {
              this.warnings.push(`${file}: Interaction ${idx} missing description`);
            }

            if (!interaction.request || !interaction.response) {
              this.errors.push(`${file}: Interaction ${idx} missing request or response`);
            }
          });

          console.log(`✓ ${file} (${pact.interactions.length} interactions)`);
          this.validated++;
        } catch (error) {
          this.errors.push(`${file}: ${error.message}`);
          console.log(`✗ ${file}`);
        }
      });

      console.log(`\nValidated ${pactFiles.length} Pact files\n`);
    } catch (error) {
      // Pacts directory might not exist yet
      console.log('No Pact files found (run contracts:generate first)\n');
    }
  }

  validateContractCoverage() {
    console.log('Checking contract coverage...\n');

    const TARGET_MCP_TOOLS = 213;
    const TARGET_API_ENDPOINTS = 50;
    const TARGET_SERVICES = 15;

    try {
      const pactFiles = readdirSync(PACTS_DIR).filter((f) => f.endsWith('.json'));
      const coverage = (pactFiles.length / TARGET_MCP_TOOLS) * 100;

      console.log(
        `MCP Tools Coverage: ${pactFiles.length}/${TARGET_MCP_TOOLS} (${coverage.toFixed(1)}%)`
      );

      if (coverage < 95) {
        this.warnings.push(`MCP tool coverage below target (95%): ${coverage.toFixed(1)}%`);
      }
    } catch (error) {
      this.warnings.push('Could not calculate coverage - pacts directory not found');
    }

    console.log('');
  }

  validateVersionConsistency() {
    console.log('Checking version consistency...\n');

    const packageJson = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8'));
    const expectedVersion = packageJson.version;

    console.log(`Expected version: ${expectedVersion}\n`);

    // Check contract config
    try {
      const configPath = join(__dirname, 'contract-test.config.ts');
      const configContent = readFileSync(configPath, 'utf-8');

      if (!configContent.includes(expectedVersion)) {
        this.warnings.push(`contract-test.config.ts version mismatch`);
      } else {
        console.log(`✓ contract-test.config.ts`);
      }
    } catch (error) {
      this.errors.push('Could not validate config version');
    }

    console.log('');
  }

  printReport() {
    console.log('=====================================');
    console.log('Contract Validation Report');
    console.log('=====================================\n');

    console.log(`Validated: ${this.validated} items`);
    console.log(`Errors: ${this.errors.length}`);
    console.log(`Warnings: ${this.warnings.length}\n`);

    if (this.errors.length > 0) {
      console.log('ERRORS:');
      this.errors.forEach((error) => console.log(`  ✗ ${error}`));
      console.log('');
    }

    if (this.warnings.length > 0) {
      console.log('WARNINGS:');
      this.warnings.forEach((warning) => console.log(`  ⚠ ${warning}`));
      console.log('');
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✓ All validations passed!\n');
      return 0;
    } else if (this.errors.length === 0) {
      console.log('✓ Validation passed with warnings\n');
      return 0;
    } else {
      console.log('✗ Validation failed\n');
      return 1;
    }
  }

  run() {
    this.validateSchemas();
    this.validatePacts();
    this.validateContractCoverage();
    this.validateVersionConsistency();
    return this.printReport();
  }
}

// Run validation
const validator = new ContractValidator();
const exitCode = validator.run();
process.exit(exitCode);
