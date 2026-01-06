// Tool configuration for Claude Agent SDK
import { defaultClaudeFlowConfig, getClaudeFlowTools } from './claudeFlow.js';

export const enabledTools = [
  'Read',
  'Write',
  'Edit',
  'Bash',
  'Glob',
  'Grep',
  'WebFetch',
  'WebSearch',
] as const;

// Get gendev tools dynamically
const claudeFlowTools = getClaudeFlowTools(defaultClaudeFlowConfig);

export const toolConfig = {
  // Enable all standard tools for full capability
  enableAllTools: true,

  // MCP servers configuration
  mcpServers: {
    gendev: {
      command: 'npx',
      args: ['gendev@alpha', 'mcp', 'start'],
      env: {
        CLAUDE_FLOW_MEMORY_ENABLED: 'true',
        CLAUDE_FLOW_COORDINATION_ENABLED: 'true',
      },
    },
  },

  // Permission mode
  permissionMode: 'default' as const,

  // Additional enabled tools from gendev
  additionalTools: claudeFlowTools,
};
