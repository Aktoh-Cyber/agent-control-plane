/**
 * Task Builder - Test Data Factory
 * Fluent API for creating test tasks with realistic defaults
 */

import type { TestTask as Task } from '../../../src/types/test-helpers.js';

export type { Task };

export class TaskBuilder {
  private data: Partial<Task>;
  private static idCounter = 1;

  constructor() {
    this.data = {
      id: `task-${TaskBuilder.idCounter++}`,
      title: `Test Task ${TaskBuilder.idCounter}`,
      description: 'A test task for unit testing',
      type: 'coding',
      status: 'pending',
      priority: 'medium',
      dependencies: [],
      tags: [],
      metadata: {},
      createdAt: new Date(),
    };
  }

  /**
   * Set task ID
   */
  withId(id: string): this {
    this.data.id = id;
    return this;
  }

  /**
   * Set task title
   */
  withTitle(title: string): this {
    this.data.title = title;
    return this;
  }

  /**
   * Set task description
   */
  withDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  /**
   * Set task type
   */
  withType(type: Task['type']): this {
    this.data.type = type;
    return this;
  }

  /**
   * Set task status
   */
  withStatus(status: Task['status']): this {
    this.data.status = status;
    return this;
  }

  /**
   * Set task priority
   */
  withPriority(priority: Task['priority']): this {
    this.data.priority = priority;
    return this;
  }

  /**
   * Assign task to agent
   */
  assignedTo(agentId: string): this {
    this.data.assignedTo = agentId;
    return this;
  }

  /**
   * Add to swarm
   */
  inSwarm(swarmId: string): this {
    this.data.swarmId = swarmId;
    return this;
  }

  /**
   * Add dependency
   */
  dependsOn(taskId: string): this {
    this.data.dependencies = [...(this.data.dependencies || []), taskId];
    return this;
  }

  /**
   * Add tag
   */
  withTag(tag: string): this {
    this.data.tags = [...(this.data.tags || []), tag];
    return this;
  }

  /**
   * Set estimated time
   */
  withEstimatedTime(minutes: number): this {
    this.data.estimatedTime = minutes;
    return this;
  }

  /**
   * Set actual time
   */
  withActualTime(minutes: number): this {
    this.data.actualTime = minutes;
    return this;
  }

  /**
   * Set result
   */
  withResult(result: import('../../../src/types/test-helpers.js').JsonValue): this {
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
  withMetadata(key: string, value: import('../../../src/types/test-helpers.js').JsonValue): this {
    this.data.metadata = { ...this.data.metadata, [key]: value };
    return this;
  }

  /**
   * Create completed task
   */
  asCompleted(): this {
    this.data.status = 'completed';
    this.data.startedAt = new Date(Date.now() - 3600000); // 1 hour ago
    this.data.completedAt = new Date();
    this.data.actualTime = 60;
    return this;
  }

  /**
   * Create in-progress task
   */
  asInProgress(): this {
    this.data.status = 'in_progress';
    this.data.startedAt = new Date();
    return this;
  }

  /**
   * Create failed task
   */
  asFailed(): this {
    this.data.status = 'failed';
    this.data.error = 'Task execution failed';
    this.data.startedAt = new Date(Date.now() - 1800000); // 30 min ago
    return this;
  }

  /**
   * Create high priority task
   */
  asHighPriority(): this {
    this.data.priority = 'high';
    return this;
  }

  /**
   * Create critical priority task
   */
  asCritical(): this {
    this.data.priority = 'critical';
    return this;
  }

  /**
   * Create coding task
   */
  asCodingTask(): this {
    this.data.type = 'coding';
    this.data.tags = ['code', 'implementation'];
    return this;
  }

  /**
   * Create testing task
   */
  asTestingTask(): this {
    this.data.type = 'testing';
    this.data.tags = ['test', 'qa'];
    return this;
  }

  /**
   * Create review task
   */
  asReviewTask(): this {
    this.data.type = 'review';
    this.data.tags = ['review', 'quality'];
    return this;
  }

  /**
   * Build the task object
   */
  build(): Task {
    return this.data as Task;
  }

  /**
   * Create multiple tasks
   */
  buildMany(count: number): Task[] {
    const tasks: Task[] = [];
    for (let i = 0; i < count; i++) {
      tasks.push(new TaskBuilder().build());
    }
    return tasks;
  }

  /**
   * Reset the ID counter
   */
  static resetCounter(): void {
    TaskBuilder.idCounter = 1;
  }
}

/**
 * Factory function for creating a task builder
 */
export function aTask(): TaskBuilder {
  return new TaskBuilder();
}

/**
 * Quick builder functions
 */
export const taskBuilders = {
  coding: () => aTask().asCodingTask().build(),
  testing: () => aTask().asTestingTask().build(),
  review: () => aTask().asReviewTask().build(),
  completed: () => aTask().asCompleted().build(),
  inProgress: () => aTask().asInProgress().build(),
  failed: () => aTask().asFailed().build(),
  critical: () => aTask().asCritical().build(),
  default: () => aTask().build(),
};
