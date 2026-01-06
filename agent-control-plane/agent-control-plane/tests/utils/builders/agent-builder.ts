/**
 * Agent Builder - Test Data Factory
 * Fluent API for creating test AI agents with realistic defaults
 */

export interface Agent {
  id: string;
  name: string;
  type: string;
  role: 'researcher' | 'coder' | 'tester' | 'reviewer' | 'architect' | 'coordinator';
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  capabilities: string[];
  model: string;
  temperature: number;
  maxTokens: number;
  swarmId?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  lastActiveAt: Date;
}

export class AgentBuilder {
  private data: Partial<Agent>;
  private static idCounter = 1;

  constructor() {
    this.data = {
      id: `agent-${AgentBuilder.idCounter++}`,
      name: `TestAgent${AgentBuilder.idCounter}`,
      type: 'generic',
      role: 'coder',
      status: 'idle',
      capabilities: ['code', 'test', 'debug'],
      model: 'claude-sonnet-4-5-20250929',
      temperature: 0.7,
      maxTokens: 4096,
      metadata: {},
      createdAt: new Date(),
      lastActiveAt: new Date(),
    };
  }

  /**
   * Set agent ID
   */
  withId(id: string): this {
    this.data.id = id;
    return this;
  }

  /**
   * Set agent name
   */
  withName(name: string): this {
    this.data.name = name;
    return this;
  }

  /**
   * Set agent type
   */
  withType(type: string): this {
    this.data.type = type;
    return this;
  }

  /**
   * Set agent role
   */
  withRole(role: Agent['role']): this {
    this.data.role = role;
    return this;
  }

  /**
   * Set agent status
   */
  withStatus(status: Agent['status']): this {
    this.data.status = status;
    return this;
  }

  /**
   * Add capability
   */
  withCapability(capability: string): this {
    this.data.capabilities = [...(this.data.capabilities || []), capability];
    return this;
  }

  /**
   * Set capabilities
   */
  withCapabilities(capabilities: string[]): this {
    this.data.capabilities = capabilities;
    return this;
  }

  /**
   * Set AI model
   */
  withModel(model: string): this {
    this.data.model = model;
    return this;
  }

  /**
   * Set temperature
   */
  withTemperature(temperature: number): this {
    this.data.temperature = temperature;
    return this;
  }

  /**
   * Set max tokens
   */
  withMaxTokens(maxTokens: number): this {
    this.data.maxTokens = maxTokens;
    return this;
  }

  /**
   * Set swarm ID
   */
  inSwarm(swarmId: string): this {
    this.data.swarmId = swarmId;
    return this;
  }

  /**
   * Add metadata
   */
  withMetadata(key: string, value: any): this {
    this.data.metadata = { ...this.data.metadata, [key]: value };
    return this;
  }

  /**
   * Create researcher agent
   */
  asResearcher(): this {
    this.data.role = 'researcher';
    this.data.capabilities = ['research', 'analysis', 'documentation'];
    this.data.type = 'researcher';
    return this;
  }

  /**
   * Create coder agent
   */
  asCoder(): this {
    this.data.role = 'coder';
    this.data.capabilities = ['code', 'refactor', 'debug'];
    this.data.type = 'coder';
    return this;
  }

  /**
   * Create tester agent
   */
  asTester(): this {
    this.data.role = 'tester';
    this.data.capabilities = ['test', 'validate', 'qa'];
    this.data.type = 'tester';
    return this;
  }

  /**
   * Create reviewer agent
   */
  asReviewer(): this {
    this.data.role = 'reviewer';
    this.data.capabilities = ['review', 'critique', 'security'];
    this.data.type = 'reviewer';
    return this;
  }

  /**
   * Create architect agent
   */
  asArchitect(): this {
    this.data.role = 'architect';
    this.data.capabilities = ['design', 'architecture', 'planning'];
    this.data.type = 'architect';
    return this;
  }

  /**
   * Create running agent
   */
  asRunning(): this {
    this.data.status = 'running';
    this.data.lastActiveAt = new Date();
    return this;
  }

  /**
   * Create failed agent
   */
  asFailed(): this {
    this.data.status = 'failed';
    return this;
  }

  /**
   * Build the agent object
   */
  build(): Agent {
    return this.data as Agent;
  }

  /**
   * Create multiple agents
   */
  buildMany(count: number): Agent[] {
    const agents: Agent[] = [];
    for (let i = 0; i < count; i++) {
      agents.push(new AgentBuilder().build());
    }
    return agents;
  }

  /**
   * Reset the ID counter
   */
  static resetCounter(): void {
    AgentBuilder.idCounter = 1;
  }
}

/**
 * Factory function for creating an agent builder
 */
export function anAgent(): AgentBuilder {
  return new AgentBuilder();
}

/**
 * Quick builder functions
 */
export const agentBuilders = {
  researcher: () => anAgent().asResearcher().build(),
  coder: () => anAgent().asCoder().build(),
  tester: () => anAgent().asTester().build(),
  reviewer: () => anAgent().asReviewer().build(),
  architect: () => anAgent().asArchitect().build(),
  running: () => anAgent().asRunning().build(),
  failed: () => anAgent().asFailed().build(),
  default: () => anAgent().build(),
};
