/**
 * Job Builder - Test Data Factory
 * Fluent API for creating test jobs with realistic defaults
 */

export interface Job {
  id: string;
  name: string;
  type: 'swarm' | 'pipeline' | 'workflow' | 'batch';
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  tasks: string[];
  agents: string[];
  topology?: 'hierarchical' | 'mesh' | 'star' | 'pipeline';
  config: {
    parallel: boolean;
    maxRetries: number;
    timeout: number;
    autoScale: boolean;
  };
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
  metrics: {
    startTime?: Date;
    endTime?: Date;
    duration?: number;
    tokensUsed?: number;
    cost?: number;
  };
  result?: any;
  error?: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

export class JobBuilder {
  private data: Partial<Job>;
  private static idCounter = 1;

  constructor() {
    this.data = {
      id: `job-${JobBuilder.idCounter++}`,
      name: `Test Job ${JobBuilder.idCounter}`,
      type: 'swarm',
      status: 'queued',
      tasks: [],
      agents: [],
      config: {
        parallel: true,
        maxRetries: 3,
        timeout: 300000, // 5 minutes
        autoScale: false,
      },
      progress: {
        total: 0,
        completed: 0,
        failed: 0,
      },
      metrics: {},
      metadata: {},
      createdAt: new Date(),
    };
  }

  /**
   * Set job ID
   */
  withId(id: string): this {
    this.data.id = id;
    return this;
  }

  /**
   * Set job name
   */
  withName(name: string): this {
    this.data.name = name;
    return this;
  }

  /**
   * Set job type
   */
  withType(type: Job['type']): this {
    this.data.type = type;
    return this;
  }

  /**
   * Set job status
   */
  withStatus(status: Job['status']): this {
    this.data.status = status;
    return this;
  }

  /**
   * Add task
   */
  withTask(taskId: string): this {
    this.data.tasks = [...(this.data.tasks || []), taskId];
    this.data.progress = {
      ...this.data.progress!,
      total: (this.data.tasks || []).length,
    };
    return this;
  }

  /**
   * Add tasks
   */
  withTasks(taskIds: string[]): this {
    this.data.tasks = taskIds;
    this.data.progress = {
      ...this.data.progress!,
      total: taskIds.length,
    };
    return this;
  }

  /**
   * Add agent
   */
  withAgent(agentId: string): this {
    this.data.agents = [...(this.data.agents || []), agentId];
    return this;
  }

  /**
   * Add agents
   */
  withAgents(agentIds: string[]): this {
    this.data.agents = agentIds;
    return this;
  }

  /**
   * Set topology
   */
  withTopology(topology: Job['topology']): this {
    this.data.topology = topology;
    return this;
  }

  /**
   * Set parallel execution
   */
  withParallel(parallel: boolean): this {
    this.data.config = { ...this.data.config!, parallel };
    return this;
  }

  /**
   * Set max retries
   */
  withMaxRetries(maxRetries: number): this {
    this.data.config = { ...this.data.config!, maxRetries };
    return this;
  }

  /**
   * Set timeout
   */
  withTimeout(timeout: number): this {
    this.data.config = { ...this.data.config!, timeout };
    return this;
  }

  /**
   * Enable auto-scaling
   */
  withAutoScale(): this {
    this.data.config = { ...this.data.config!, autoScale: true };
    return this;
  }

  /**
   * Set progress
   */
  withProgress(total: number, completed: number, failed: number): this {
    this.data.progress = { total, completed, failed };
    return this;
  }

  /**
   * Set metrics
   */
  withMetrics(metrics: Partial<Job['metrics']>): this {
    this.data.metrics = { ...this.data.metrics, ...metrics };
    return this;
  }

  /**
   * Set result
   */
  withResult(result: any): this {
    this.data.result = result;
    return this;
  }

  /**
   * Set error
   */
  withError(error: string): this {
    this.data.error = error;
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
   * Create running job
   */
  asRunning(): this {
    this.data.status = 'running';
    this.data.metrics = {
      ...this.data.metrics,
      startTime: new Date(),
    };
    return this;
  }

  /**
   * Create completed job
   */
  asCompleted(): this {
    this.data.status = 'completed';
    const startTime = new Date(Date.now() - 600000); // 10 min ago
    const endTime = new Date();
    this.data.metrics = {
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime(),
      tokensUsed: 50000,
      cost: 0.25,
    };
    this.data.progress = {
      ...this.data.progress!,
      completed: this.data.progress!.total,
    };
    return this;
  }

  /**
   * Create failed job
   */
  asFailed(): this {
    this.data.status = 'failed';
    this.data.error = 'Job execution failed';
    this.data.progress = {
      ...this.data.progress!,
      failed: this.data.progress!.total - this.data.progress!.completed,
    };
    return this;
  }

  /**
   * Create swarm job
   */
  asSwarmJob(): this {
    this.data.type = 'swarm';
    this.data.topology = 'mesh';
    return this;
  }

  /**
   * Create pipeline job
   */
  asPipelineJob(): this {
    this.data.type = 'pipeline';
    this.data.topology = 'pipeline';
    this.data.config = { ...this.data.config!, parallel: false };
    return this;
  }

  /**
   * Build the job object
   */
  build(): Job {
    return this.data as Job;
  }

  /**
   * Create multiple jobs
   */
  buildMany(count: number): Job[] {
    const jobs: Job[] = [];
    for (let i = 0; i < count; i++) {
      jobs.push(new JobBuilder().build());
    }
    return jobs;
  }

  /**
   * Reset the ID counter
   */
  static resetCounter(): void {
    JobBuilder.idCounter = 1;
  }
}

/**
 * Factory function for creating a job builder
 */
export function aJob(): JobBuilder {
  return new JobBuilder();
}

/**
 * Quick builder functions
 */
export const jobBuilders = {
  swarm: () => aJob().asSwarmJob().build(),
  pipeline: () => aJob().asPipelineJob().build(),
  running: () => aJob().asRunning().build(),
  completed: () => aJob().asCompleted().build(),
  failed: () => aJob().asFailed().build(),
  default: () => aJob().build(),
};
