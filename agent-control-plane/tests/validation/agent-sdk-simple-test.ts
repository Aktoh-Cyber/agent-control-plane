// Simple validation that Claude Agent SDK uses agents from .claude/agents/
import { readFileSync } from 'fs';
import { getAgent } from '../src/utils/agentLoader.js';

console.log('\n╔═══════════════════════════════════════════════════════╗');
console.log('║  Agentic Flow v1.1.6 - Agent SDK Validation          ║');
console.log('║  Confirming .claude/agents/ integration              ║');
console.log('╚═══════════════════════════════════════════════════════╝\n');

// Test 1: Load coder agent
console.log('Test 1: Loading coder agent from .claude/agents/core/coder.md');
const coder = getAgent('coder');

if (!coder) {
  console.error('❌ FAILED: Could not load coder agent');
  process.exit(1);
}

console.log(`✅ Agent loaded: ${coder.name}`);
console.log(`✅ Description: ${coder.description}`);
console.log(`✅ System prompt length: ${coder.systemPrompt.length} characters`);
console.log(`✅ System prompt preview: ${coder.systemPrompt.substring(0, 100)}...`);

// Test 2: Verify system prompt contains expected content
console.log('\nTest 2: Verifying agent system prompt from markdown file');
const hasResponsibilities =
  coder.systemPrompt.includes('Core Responsibilities') ||
  coder.systemPrompt.includes('Core responsibilities');
const hasImplementation =
  coder.systemPrompt.includes('Implementation') || coder.systemPrompt.includes('implementation');
const hasCodeQuality = coder.systemPrompt.includes('clean') || coder.systemPrompt.includes('Clean');

if (hasResponsibilities && hasImplementation && hasCodeQuality) {
  console.log('✅ System prompt contains expected content from .claude/agents/core/coder.md');
} else {
  console.error('❌ FAILED: System prompt missing expected content');
  console.error(`  Responsibilities: ${hasResponsibilities}`);
  console.error(`  Implementation: ${hasImplementation}`);
  console.error(`  Code Quality: ${hasCodeQuality}`);
  process.exit(1);
}

// Test 3: Load multiple agents
console.log('\nTest 3: Loading multiple agents from .claude/agents/');
const agentsToTest = ['reviewer', 'tester', 'planner', 'researcher'];
let allLoaded = true;

for (const agentName of agentsToTest) {
  const agent = getAgent(agentName);
  if (!agent) {
    console.error(`❌ FAILED: Could not load ${agentName} agent`);
    allLoaded = false;
  } else {
    console.log(`✅ ${agentName.padEnd(15)} → ${agent.description.substring(0, 50)}...`);
  }
}

if (!allLoaded) {
  process.exit(1);
}

// Test 4: Verify agent structure
console.log('\nTest 4: Verifying AgentDefinition structure');
const requiredFields = ['name', 'description', 'systemPrompt'];
const missingFields = requiredFields.filter((field) => !(field in coder));

if (missingFields.length > 0) {
  console.error(`❌ FAILED: Missing required fields: ${missingFields.join(', ')}`);
  process.exit(1);
}

console.log('✅ All required fields present: name, description, systemPrompt');

// Test 5: Confirm Claude Agent SDK import
console.log('\nTest 5: Confirming Claude Agent SDK integration');
try {
  const { query } = await import('@anthropic-ai/claude-agent-sdk');
  console.log('✅ Claude Agent SDK imported successfully');
  console.log('✅ query() function available');

  // Verify it's the SDK query function, not a custom implementation
  if (typeof query === 'function') {
    console.log('✅ query is a function (from Claude Agent SDK)');
  } else {
    console.error('❌ FAILED: query is not a function');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ FAILED: Could not import Claude Agent SDK');
  console.error(error);
  process.exit(1);
}

// Test 6: Verify claudeAgent uses SDK
console.log('\nTest 6: Verifying claudeAgent.ts uses Claude Agent SDK');
const claudeAgentSource = readFileSync('src/agents/claudeAgent.ts', 'utf-8');

const usesSDK = claudeAgentSource.includes(
  'import { query } from "@anthropic-ai/claude-agent-sdk"'
);
const usesQuery = claudeAgentSource.includes('query({');
const hasAgentDefinition = claudeAgentSource.includes('AgentDefinition');

if (usesSDK && usesQuery && hasAgentDefinition) {
  console.log('✅ claudeAgent.ts imports Claude Agent SDK query function');
  console.log('✅ claudeAgent.ts uses query() function');
  console.log('✅ claudeAgent.ts accepts AgentDefinition parameter');
} else {
  console.error('❌ FAILED: claudeAgent.ts not using Claude Agent SDK correctly');
  console.error(`  SDK Import: ${usesSDK}`);
  console.error(`  Uses query(): ${usesQuery}`);
  console.error(`  Has AgentDefinition: ${hasAgentDefinition}`);
  process.exit(1);
}

// Final Summary
console.log('\n' + '='.repeat(60));
console.log('VALIDATION SUMMARY');
console.log('='.repeat(60) + '\n');

console.log('✅ Agents loaded from .claude/agents/ directory');
console.log('✅ Agent definitions contain proper system prompts');
console.log('✅ Multiple agents load successfully');
console.log('✅ AgentDefinition structure is correct');
console.log('✅ Claude Agent SDK imported and available');
console.log('✅ claudeAgent.ts uses SDK query() function');

console.log('\n🎉 ALL VALIDATIONS PASSED\n');
console.log('Architecture Confirmed:');
console.log('  .claude/agents/*.md → AgentDefinition → Claude Agent SDK query()\n');

process.exit(0);
