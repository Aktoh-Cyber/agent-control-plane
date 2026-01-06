/**
 * Configuration Builder - Test Data Factory
 * Fluent API for creating test configurations with realistic defaults
 */

export interface SwarmConfig {
  id: string;
  topology: 'hierarchical' | 'mesh' | 'star' | 'pipeline';
  maxAgents: number;
  autoScale: boolean;
  coordinator: {
    type: string;
    maxRetries: number;
    timeout: number;
  };
  consensus: {
    enabled: boolean;
    algorithm: 'raft' | 'byzantine' | 'gossip';
    quorum: number;
  };
  memory: {
    enabled: boolean;
    backend: 'redis' | 'agentdb' | 'in-memory';
    namespace: string;
    ttl: number;
  };
  neural: {
    enabled: boolean;
    models: string[];
    autoTrain: boolean;
  };
}

export interface AgentConfig {
  id: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  topK: number;
  systemPrompt?: string;
  tools: string[];
  parallel: boolean;
  streaming: boolean;
  retryConfig: {
    maxRetries: number;
    backoff: 'exponential' | 'linear' | 'fixed';
    initialDelay: number;
  };
}

export class SwarmConfigBuilder {
  private data: Partial<SwarmConfig>;
  private static idCounter = 1;

  constructor() {
    this.data = {
      id: `swarm-config-${SwarmConfigBuilder.idCounter++}`,
      topology: 'mesh',
      maxAgents: 10,
      autoScale: false,
      coordinator: {
        type: 'default',
        maxRetries: 3,
        timeout: 300000,
      },
      consensus: {
        enabled: false,
        algorithm: 'raft',
        quorum: 2,
      },
      memory: {
        enabled: true,
        backend: 'in-memory',
        namespace: 'default',
        ttl: 3600,
      },
      neural: {
        enabled: false,
        models: [],
        autoTrain: false,
      },
    };
  }

  withId(id: string): this {
    this.data.id = id;
    return this;
  }

  withTopology(topology: SwarmConfig['topology']): this {
    this.data.topology = topology;
    return this;
  }

  withMaxAgents(maxAgents: number): this {
    this.data.maxAgents = maxAgents;
    return this;
  }

  withAutoScale(): this {
    this.data.autoScale = true;
    return this;
  }

  withCoordinator(type: string, maxRetries: number, timeout: number): this {
    this.data.coordinator = { type, maxRetries, timeout };
    return this;
  }

  withConsensus(algorithm: SwarmConfig['consensus']['algorithm']): this {
    this.data.consensus = {
      enabled: true,
      algorithm,
      quorum: 2,
    };
    return this;
  }

  withMemory(backend: SwarmConfig['memory']['backend'], namespace: string): this {
    this.data.memory = {
      enabled: true,
      backend,
      namespace,
      ttl: 3600,
    };
    return this;
  }

  withNeural(models: string[]): this {
    this.data.neural = {
      enabled: true,
      models,
      autoTrain: true,
    };
    return this;
  }

  asHierarchical(): this {
    this.data.topology = 'hierarchical';
    this.data.coordinator = {
      type: 'hierarchical',
      maxRetries: 3,
      timeout: 300000,
    };
    return this;
  }

  asMesh(): this {
    this.data.topology = 'mesh';
    this.data.consensus = {
      enabled: true,
      algorithm: 'gossip',
      quorum: 3,
    };
    return this;
  }

  asPipeline(): this {
    this.data.topology = 'pipeline';
    this.data.coordinator = {
      type: 'pipeline',
      maxRetries: 5,
      timeout: 600000,
    };
    return this;
  }

  build(): SwarmConfig {
    return this.data as SwarmConfig;
  }
}

export class AgentConfigBuilder {
  private data: Partial<AgentConfig>;
  private static idCounter = 1;

  constructor() {
    this.data = {
      id: `agent-config-${AgentConfigBuilder.idCounter++}`,
      model: 'claude-sonnet-4-5-20250929',
      temperature: 0.7,
      maxTokens: 4096,
      topP: 1.0,
      topK: 0,
      tools: [],
      parallel: true,
      streaming: false,
      retryConfig: {
        maxRetries: 3,
        backoff: 'exponential',
        initialDelay: 1000,
      },
    };
  }

  withId(id: string): this {
    this.data.id = id;
    return this;
  }

  withModel(model: string): this {
    this.data.model = model;
    return this;
  }

  withTemperature(temperature: number): this {
    this.data.temperature = temperature;
    return this;
  }

  withMaxTokens(maxTokens: number): this {
    this.data.maxTokens = maxTokens;
    return this;
  }

  withSystemPrompt(prompt: string): this {
    this.data.systemPrompt = prompt;
    return this;
  }

  withTool(tool: string): this {
    this.data.tools = [...(this.data.tools || []), tool];
    return this;
  }

  withStreaming(): this {
    this.data.streaming = true;
    return this;
  }

  withRetryConfig(maxRetries: number, backoff: 'exponential' | 'linear' | 'fixed'): this {
    this.data.retryConfig = {
      maxRetries,
      backoff,
      initialDelay: 1000,
    };
    return this;
  }

  asHighCreativity(): this {
    this.data.temperature = 0.9;
    this.data.topP = 0.95;
    return this;
  }

  asLowCreativity(): this {
    this.data.temperature = 0.3;
    this.data.topP = 0.8;
    return this;
  }

  asLongContext(): this {
    this.data.maxTokens = 8192;
    return this;
  }

  build(): AgentConfig {
    return this.data as AgentConfig;
  }
}

/**
 * Factory functions
 */
export function aSwarmConfig(): SwarmConfigBuilder {
  return new SwarmConfigBuilder();
}

export function anAgentConfig(): AgentConfigBuilder {
  return new AgentConfigBuilder();
}

/**
 * Quick builder functions
 */
export const configBuilders = {
  swarmMesh: () => aSwarmConfig().asMesh().build(),
  swarmHierarchical: () => aSwarmConfig().asHierarchical().build(),
  swarmPipeline: () => aSwarmConfig().asPipeline().build(),
  agentHighCreativity: () => anAgentConfig().asHighCreativity().build(),
  agentLowCreativity: () => anAgentConfig().asLowCreativity().build(),
  agentLongContext: () => anAgentConfig().asLongContext().build(),
  defaultSwarm: () => aSwarmConfig().build(),
  defaultAgent: () => anAgentConfig().build(),
};
