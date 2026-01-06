/**
 * Global Setup for E2E Tests
 * Runs once before all tests
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export default async function globalSetup() {
  console.log('🚀 Starting E2E Test Global Setup...');

  // Create necessary directories
  const dirs = ['.tmp', '.tmp/test-agentdb', 'test-reports', 'test-results'];

  for (const dir of dirs) {
    const dirPath = path.join(__dirname, '../../', dir);
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`  ✓ Created directory: ${dir}`);
  }

  // Store test start time
  const startTime = Date.now();
  await fs.writeFile(path.join(__dirname, '../../.tmp/test-start-time.txt'), startTime.toString());

  console.log('✅ Global Setup Complete\n');
}
