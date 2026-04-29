/**
 * Agent Executor
 *
 * Wraps agent execution with streaming support via EventEmitter.
 * Maintains conversation state per conversationId and integrates
 * with the ActionQueue for human-in-the-loop tool approval.
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { createComponentLogger } from '../utils/logger.js';
import { ActionQueue, type ActionResolution } from './action-queue.js';

const logger = createComponentLogger('agent-executor');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Metadata for an agent loaded from the .claude/agents directory. */
export interface AgentDefinition {
  name: string;
  type: string;
  description: string;
  capabilities: string[];
  priority: string;
  /** Raw markdown content of the agent file. */
  systemPrompt: string;
  /** Relative path from the agents root. */
  path: string;
}

/** Events emitted during execution. */
export interface ExecutionEvents {
  chunk: { data: string };
  tool_use: { tool: string; input: Record<string, unknown> };
  action_required: {
    actionId: string;
    description: string;
    tool: string;
    input: Record<string, unknown>;
  };
  complete: { result: ExecutionResult };
  error: { message: string };
}

export interface ExecutionResult {
  output: string;
  agent: string;
  conversationId: string;
  toolsUsed: string[];
  durationMs: number;
}

interface ConversationEntry {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// AgentExecutor
// ---------------------------------------------------------------------------

export class AgentExecutor extends EventEmitter {
  private conversations: Map<string, ConversationEntry[]> = new Map();
  private agentsDir: string;
  private actionQueue: ActionQueue;

  constructor(agentsDir: string, actionQueue: ActionQueue) {
    super();
    this.agentsDir = agentsDir;
    this.actionQueue = actionQueue;
  }

  // -----------------------------------------------------------------------
  // Agent discovery
  // -----------------------------------------------------------------------

  /**
   * List all agents available in the agents directory.
   * Walks subdirectories and parses YAML front-matter from .md files.
   */
  listAgents(): AgentDefinition[] {
    const agents: AgentDefinition[] = [];

    if (!fs.existsSync(this.agentsDir)) {
      logger.warn('Agents directory not found', { agentsDir: this.agentsDir });
      return agents;
    }

    this.walkDir(this.agentsDir, agents);
    return agents;
  }

  /**
   * Get a specific agent definition by name.
   */
  getAgent(name: string): AgentDefinition | undefined {
    return this.listAgents().find((a) => a.name.toLowerCase() === name.toLowerCase());
  }

  // -----------------------------------------------------------------------
  // Execution
  // -----------------------------------------------------------------------

  /**
   * Execute an agent task. Emits streaming events as the agent produces
   * output. Returns the final result.
   */
  async execute(agentName: string, task: string, conversationId: string): Promise<ExecutionResult> {
    const startTime = Date.now();
    const toolsUsed: string[] = [];

    const agent = this.getAgent(agentName);
    if (!agent) {
      const msg = `Agent '${agentName}' not found`;
      this.emit('error', { message: msg });
      throw new Error(msg);
    }

    // Append user message to conversation history
    this.appendToConversation(conversationId, 'user', task);

    logger.info('Starting agent execution', {
      agentName,
      conversationId,
      taskLength: task.length,
    });

    let output = '';

    try {
      // Simulate streaming chunks from agent execution.
      // In production this would invoke the Claude Agent SDK's streaming API
      // or the agentic-flow claudeAgent with an onStream callback.
      output = await this.runAgent(agent, task, conversationId, toolsUsed);

      this.appendToConversation(conversationId, 'assistant', output);

      const result: ExecutionResult = {
        output,
        agent: agentName,
        conversationId,
        toolsUsed,
        durationMs: Date.now() - startTime,
      };

      this.emit('complete', { result });
      logger.info('Agent execution complete', {
        agentName,
        conversationId,
        durationMs: result.durationMs,
      });

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.emit('error', { message });
      logger.error('Agent execution failed', {
        agentName,
        conversationId,
        error: err,
      });
      throw err;
    }
  }

  // -----------------------------------------------------------------------
  // Conversation state
  // -----------------------------------------------------------------------

  getConversation(conversationId: string): ConversationEntry[] {
    return this.conversations.get(conversationId) ?? [];
  }

  clearConversation(conversationId: string): void {
    this.conversations.delete(conversationId);
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  /**
   * Core agent runner. Calls the Anthropic API with the agent's system
   * prompt and streams the response back via EventEmitter chunks.
   * Falls back to a context-aware response if no API key is configured.
   */
  private async runAgent(
    agent: AgentDefinition,
    task: string,
    conversationId: string,
    _toolsUsed: string[]
  ): Promise<string> {
    const history = this.getConversation(conversationId);

    this.emit('chunk', {
      data: `[${agent.name}] Processing task...\n`,
    });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      logger.warn('ANTHROPIC_API_KEY not set — using context-only response');
      const output = `[${agent.name}] No LLM backend configured. Set ANTHROPIC_API_KEY to enable agent responses.\n\nTask received: ${task}`;
      this.emit('chunk', { data: output });
      return output;
    }

    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey });

      const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
      for (const entry of history) {
        messages.push({ role: entry.role, content: entry.content });
      }
      messages.push({ role: 'user', content: task });

      const model = process.env.LLM_MODEL || 'claude-sonnet-4-5-20250514';
      const maxTokens = parseInt(process.env.LLM_MAX_TOKENS || '4096', 10);

      const stream = await client.messages.stream({
        model,
        max_tokens: maxTokens,
        system:
          agent.systemPrompt ||
          `You are ${agent.name}, a ${agent.description}. Respond helpfully and concisely.`,
        messages,
      });

      const chunks: string[] = [];
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          const text = event.delta.text;
          chunks.push(text);
          this.emit('chunk', { data: text });
        }
      }

      return chunks.join('');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('Agent LLM call failed', { agent: agent.name, error: message });
      const fallback = `[${agent.name}] LLM call failed: ${message}\n\nTask: ${task}`;
      this.emit('chunk', { data: fallback });
      return fallback;
    }
  }

  /**
   * Propose an action for human approval via the action queue.
   * Called during agent execution when a tool requires approval.
   */
  async proposeAction(
    actionId: string,
    description: string,
    tool: string,
    input: Record<string, unknown>
  ): Promise<ActionResolution> {
    this.emit('action_required', { actionId, description, tool, input });
    return this.actionQueue.proposeAction(actionId, description, tool, input);
  }

  private appendToConversation(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string
  ): void {
    if (!this.conversations.has(conversationId)) {
      this.conversations.set(conversationId, []);
    }
    this.conversations.get(conversationId)!.push({
      role,
      content,
      timestamp: Date.now(),
    });
  }

  /**
   * Recursively walk the agents directory, parsing .md files.
   */
  private walkDir(dir: string, agents: AgentDefinition[]): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        this.walkDir(fullPath, agents);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const parsed = this.parseAgentFile(fullPath);
        if (parsed) {
          agents.push(parsed);
        }
      }
    }
  }

  /**
   * Parse a single agent .md file with YAML front-matter.
   */
  private parseAgentFile(filePath: string): AgentDefinition | null {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      if (!fmMatch) {
        // No front-matter, treat entire file as system prompt
        const name = path.basename(filePath, '.md');
        return {
          name,
          type: 'generic',
          description: '',
          capabilities: [],
          priority: 'normal',
          systemPrompt: content,
          path: path.relative(this.agentsDir, filePath),
        };
      }

      const frontMatter = fmMatch[1] ?? '';
      const body = fmMatch[2] ?? '';

      // Simple YAML-ish parser for the known fields
      const getString = (key: string): string => {
        const match = frontMatter.match(new RegExp(`^${key}:\\s*['"]?(.+?)['"]?$`, 'm'));
        return match?.[1]?.trim() ?? '';
      };

      const getList = (key: string): string[] => {
        const listMatch = frontMatter.match(
          new RegExp(`^${key}:\\s*\\n((?:\\s+-\\s+.+\\n?)*)`, 'm')
        );
        if (!listMatch?.[1]) return [];
        return listMatch[1]
          .split('\n')
          .map((l) => l.replace(/^\s*-\s*/, '').trim())
          .filter(Boolean);
      };

      return {
        name: getString('name') || path.basename(filePath, '.md'),
        type: getString('type') || 'generic',
        description: getString('description'),
        capabilities: getList('capabilities'),
        priority: getString('priority') || 'normal',
        systemPrompt: body.trim(),
        path: path.relative(this.agentsDir, filePath),
      };
    } catch (err) {
      logger.error('Failed to parse agent file', { filePath, error: err });
      return null;
    }
  }
}
