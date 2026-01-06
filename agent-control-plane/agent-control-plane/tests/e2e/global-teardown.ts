/**
 * Global Teardown for E2E Tests
 * Runs once after all tests complete
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export default async function globalTeardown() {
  console.log('\n🧹 Starting E2E Test Global Teardown...');

  // Calculate total test duration
  try {
    const startTimeStr = await fs.readFile(
      path.join(__dirname, '../../.tmp/test-start-time.txt'),
      'utf-8'
    );
    const startTime = parseInt(startTimeStr, 10);
    const duration = Date.now() - startTime;
    console.log(`  ⏱️  Total test duration: ${(duration / 1000).toFixed(2)}s`);
  } catch (error) {
    console.log('  ⚠️  Could not calculate test duration');
  }

  // Optional: Cleanup temporary files
  // Uncomment if you want to clean up after tests
  /*
  try {
    await fs.rm(path.join(__dirname, '../../.tmp'), { recursive: true, force: true });
    console.log('  ✓ Cleaned up temporary files');
  } catch (error) {
    console.log('  ⚠️  Failed to cleanup temporary files');
  }
  */

  console.log('✅ Global Teardown Complete');
}
