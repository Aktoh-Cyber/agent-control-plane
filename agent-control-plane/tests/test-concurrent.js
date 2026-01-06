// Test concurrent multi-tool execution with complex workflow
import { query } from '@anthropic-ai/claude-agent-sdk';
import { claudeFlowSdkServer } from './dist/mcp/claudeFlowSdkServer.js';

async function testConcurrentExecution() {
  console.log('⚡ Testing concurrent multi-tool execution...\n');

  try {
    const result = query({
      prompt: `Execute this complex workflow using multiple tools concurrently where possible:

1. Initialize a mesh swarm topology with 5 max agents
2. Store three values in memory:
   - Key: "workflow_start", Value: "2025-10-03T19:08:00Z", Namespace: "test"
   - Key: "coordinator_status", Value: "active", Namespace: "test"
   - Key: "task_priority", Value: "high", Namespace: "test"
3. Spawn 3 agents in parallel: researcher, coder, analyst
4. Search memory for all keys with pattern "workflow*" in namespace "test"
5. Get swarm status with verbose metrics

Execute tools in parallel whenever possible for maximum efficiency.`,
      options: {
        permissionMode: 'bypassPermissions',
        mcpServers: {
          'gendev-sdk': claudeFlowSdkServer,
          gendev: {
            command: 'npx',
            args: ['gendev@alpha', 'mcp', 'start'],
            env: {
              ...process.env,
              MCP_AUTO_START: 'true',
            },
          },
        },
      },
    });

    let toolUseCount = 0;
    for await (const msg of result) {
      if (msg.type === 'assistant') {
        const toolUses = msg.message.content?.filter((c) => c.type === 'tool_use') || [];
        if (toolUses.length > 0) {
          toolUseCount += toolUses.length;
          console.log(`🔧 Tool execution batch: ${toolUses.length} tool(s) used`);
          toolUses.forEach((t) => console.log(`   → ${t.name}`));
        }
        const text =
          msg.message.content?.map((c) => (c.type === 'text' ? c.text : '')).join('') || '';
        if (text) process.stdout.write(text);
      } else if (msg.type === 'system' && msg.subtype === 'init') {
        console.log(`📊 Initialized: ${msg.tools.length} tools, mode: ${msg.permissionMode}\n`);
        console.log('='.repeat(80) + '\n');
      }
    }

    console.log(`\n\n✅ Concurrent execution test completed! Total tool uses: ${toolUseCount}\n`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testConcurrentExecution();
