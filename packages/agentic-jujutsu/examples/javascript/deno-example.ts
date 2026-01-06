#!/usr/bin/env -S deno run --allow-read --allow-run --allow-env
/**
 * Example: Using agentic-jujutsu in Deno
 *
 * Prerequisites:
 *   - Install Jujutsu: https://github.com/jj-vcs/jj
 *   - Deno 1.30+
 *
 * Run:
 *   deno run --allow-read --allow-run --allow-env deno-example.ts
 */

import { JJConfig, JJWrapper } from '../pkg/deno/index.js';

async function main() {
  console.log('🚀 Agentic-Jujutsu Deno Example\n');

  try {
    // Create configuration
    const config = new JJConfig();
    config.with_repo_path('.');
    config.with_verbose(true);
    config.with_timeout(10000);

    console.log('📦 Initializing JJWrapper...');
    const jj = await JJWrapper.new(config);

    // Get repository status
    console.log('\n📊 Repository Status:');
    const status = await jj.status();
    console.log(status.stdout);

    // Get recent operations
    console.log('\n📜 Recent Operations (last 5):');
    const operations = await jj.getOperations(5);
    for (const [idx, op] of operations.entries()) {
      console.log(`\n${idx + 1}. Operation ${op.id.slice(0, 12)}`);
      console.log(`   Type: ${op.operation_type}`);
      console.log(`   User: ${op.user}`);
      console.log(`   Time: ${op.timestamp}`);
      console.log(`   Description: ${op.description}`);
    }

    // Check for conflicts
    console.log('\n⚠️  Checking for conflicts...');
    const conflicts = await jj.getConflicts();
    if (conflicts.length === 0) {
      console.log('✅ No conflicts found');
    } else {
      console.log(`❌ Found ${conflicts.length} conflicts:`);
      for (const conflict of conflicts) {
        console.log(`   - ${conflict.path} (${conflict.num_hunks} hunks)`);
      }
    }

    // List branches
    console.log('\n🌿 Branches:');
    const branches = await jj.branch_list();
    for (const branch of branches) {
      const remote = branch.remote ? ` (remote: ${branch.remote_name})` : '';
      console.log(`   - ${branch.name} → ${branch.target.slice(0, 12)}${remote}`);
    }

    // Execute custom command
    console.log('\n🔧 Custom command (jj log -r @):');
    const logResult = await jj.execute(['log', '-r', '@']);
    console.log(logResult.stdout);

    console.log('\n✅ All operations completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message());
    if (error.is_recoverable?.()) {
      console.log('💡 This error might be recoverable. Try checking your repository state.');
    }
    Deno.exit(1);
  }
}

// Run the example
if (import.meta.main) {
  await main();
}
