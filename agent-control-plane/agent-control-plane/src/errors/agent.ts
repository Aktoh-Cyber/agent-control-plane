/**
 * Agent Error Types
 *
 * Comprehensive error hierarchy for agent operations including:
 * - Agent lifecycle errors
 * - Coordination errors
 * - Swarm errors
 * - Task execution errors
 * - Communication errors
 */

import { ErrorCategory, ErrorMetadata, ErrorSeverity, OperationalError } from './base';

/**
 * Error code ranges: 7000-7999
 */
export enum AgentErrorCode {
  // Agent lifecycle: 7000-7099
  AGENT_ERROR = 'AGT_7000',
  AGENT_NOT_FOUND = 'AGT_7001',
  AGENT_CREATION_FAILED = 'AGT_7002',
  AGENT_INITIALIZATION_FAILED = 'AGT_7003',
  AGENT_ALREADY_EXISTS = 'AGT_7004',
  AGENT_TERMINATION_FAILED = 'AGT_7005',
  AGENT_SUSPENDED = 'AGT_7006',
  AGENT_TIMEOUT = 'AGT_7007',

  // Coordination: 7100-7199
  COORDINATION_ERROR = 'AGT_7100',
  COORDINATION_FAILED = 'AGT_7101',
  TOPOLOGY_INVALID = 'AGT_7102',
  CONSENSUS_FAILED = 'AGT_7103',
  SYNC_FAILED = 'AGT_7104',
  LEADER_ELECTION_FAILED = 'AGT_7105',
  QUORUM_NOT_REACHED = 'AGT_7106',

  // Swarm: 7200-7299
  SWARM_ERROR = 'AGT_7200',
  SWARM_NOT_FOUND = 'AGT_7201',
  SWARM_INITIALIZATION_FAILED = 'AGT_7202',
  SWARM_CAPACITY_EXCEEDED = 'AGT_7203',
  SWARM_DEGRADED = 'AGT_7204',
  SWARM_PARTITION = 'AGT_7205',

  // Task execution: 7300-7399
  TASK_ERROR = 'AGT_7300',
  TASK_NOT_FOUND = 'AGT_7301',
  TASK_EXECUTION_FAILED = 'AGT_7302',
  TASK_TIMEOUT = 'AGT_7303',
  TASK_CANCELLED = 'AGT_7304',
  TASK_REJECTED = 'AGT_7305',
  TASK_DEPENDENCY_FAILED = 'AGT_7306',
  TASK_VALIDATION_FAILED = 'AGT_7307',

  // Communication: 7400-7499
  COMMUNICATION_ERROR = 'AGT_7400',
  MESSAGE_DELIVERY_FAILED = 'AGT_7401',
  MESSAGE_TIMEOUT = 'AGT_7402',
  CHANNEL_CLOSED = 'AGT_7403',
  PROTOCOL_MISMATCH = 'AGT_7404',
  SERIALIZATION_FAILED = 'AGT_7405',
  DESERIALIZATION_FAILED = 'AGT_7406',

  // Memory & State: 7500-7599
  STATE_ERROR = 'AGT_7500',
  INVALID_STATE = 'AGT_7501',
  STATE_CORRUPTION = 'AGT_7502',
  MEMORY_EXCEEDED = 'AGT_7503',
  MEMORY_SYNC_FAILED = 'AGT_7504',

  // General: 7900-7999
  AGENT_UNAVAILABLE = 'AGT_7900',
  RESOURCE_EXHAUSTED = 'AGT_7901',
  CAPABILITY_NOT_SUPPORTED = 'AGT_7902',
}

/**
 * Base agent error
 */
export class AgentError extends OperationalError {
  constructor(
    message: string,
    code: AgentErrorCode,
    options?: {
      agentId?: string;
      severity?: ErrorSeverity;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(message, code, ErrorCategory.AGENT, {
      ...options,
      httpStatus: 500,
      metadata: {
        ...options?.metadata,
        agentId: options?.agentId,
      },
    });
  }
}

/**
 * Agent lifecycle errors
 */
export class AgentNotFoundError extends AgentError {
  constructor(
    agentId: string,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Agent not found: ${agentId}`, AgentErrorCode.AGENT_NOT_FOUND, {
      ...options,
      agentId,
      severity: ErrorSeverity.MEDIUM,
      httpStatus: 404,
    });
  }
}

export class AgentCreationFailedError extends AgentError {
  constructor(
    agentType: string,
    reason: string,
    options?: {
      agentId?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(
      `Failed to create agent of type '${agentType}': ${reason}`,
      AgentErrorCode.AGENT_CREATION_FAILED,
      {
        ...options,
        severity: ErrorSeverity.HIGH,
        metadata: {
          ...options?.metadata,
          agentType,
          reason,
        },
      }
    );
  }
}

export class AgentInitializationFailedError extends AgentError {
  constructor(
    agentId: string,
    reason: string,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Agent initialization failed: ${reason}`, AgentErrorCode.AGENT_INITIALIZATION_FAILED, {
      ...options,
      agentId,
      severity: ErrorSeverity.HIGH,
      metadata: {
        ...options?.metadata,
        reason,
      },
    });
  }
}

export class AgentAlreadyExistsError extends AgentError {
  constructor(
    agentId: string,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Agent already exists: ${agentId}`, AgentErrorCode.AGENT_ALREADY_EXISTS, {
      ...options,
      agentId,
      severity: ErrorSeverity.LOW,
      httpStatus: 409,
    });
  }
}

export class AgentTimeoutError extends AgentError {
  constructor(
    agentId: string,
    operation: string,
    timeout: number,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Agent timeout during ${operation} after ${timeout}ms`, AgentErrorCode.AGENT_TIMEOUT, {
      ...options,
      agentId,
      severity: ErrorSeverity.MEDIUM,
      metadata: {
        ...options?.metadata,
        operation,
        timeout,
      },
    });
  }
}

/**
 * Coordination errors
 */
export class CoordinationError extends AgentError {
  constructor(
    message: string,
    code: AgentErrorCode = AgentErrorCode.COORDINATION_ERROR,
    options?: {
      swarmId?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(message, code, {
      ...options,
      severity: ErrorSeverity.HIGH,
      metadata: {
        ...options?.metadata,
        swarmId: options?.swarmId,
      },
    });
  }
}

export class TopologyInvalidError extends CoordinationError {
  constructor(
    topology: string,
    reason: string,
    options?: {
      swarmId?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Invalid topology '${topology}': ${reason}`, AgentErrorCode.TOPOLOGY_INVALID, {
      ...options,
      metadata: {
        ...options?.metadata,
        topology,
        reason,
      },
    });
  }
}

export class ConsensusFailedError extends CoordinationError {
  constructor(
    reason: string,
    options?: {
      swarmId?: string;
      round?: number;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Consensus failed: ${reason}`, AgentErrorCode.CONSENSUS_FAILED, {
      ...options,
      severity: ErrorSeverity.CRITICAL,
      metadata: {
        ...options?.metadata,
        reason,
        round: options?.round,
      },
    });
  }
}

export class LeaderElectionFailedError extends CoordinationError {
  constructor(
    reason: string,
    options?: {
      swarmId?: string;
      candidates?: string[];
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Leader election failed: ${reason}`, AgentErrorCode.LEADER_ELECTION_FAILED, {
      ...options,
      metadata: {
        ...options?.metadata,
        reason,
        candidates: options?.candidates,
      },
    });
  }
}

export class QuorumNotReachedError extends CoordinationError {
  constructor(
    required: number,
    actual: number,
    options?: {
      swarmId?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Quorum not reached: ${actual}/${required} agents`, AgentErrorCode.QUORUM_NOT_REACHED, {
      ...options,
      metadata: {
        ...options?.metadata,
        requiredQuorum: required,
        actualCount: actual,
      },
    });
  }
}

/**
 * Swarm errors
 */
export class SwarmError extends AgentError {
  constructor(
    message: string,
    code: AgentErrorCode = AgentErrorCode.SWARM_ERROR,
    options?: {
      swarmId?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(message, code, {
      ...options,
      metadata: {
        ...options?.metadata,
        swarmId: options?.swarmId,
      },
    });
  }
}

export class SwarmNotFoundError extends SwarmError {
  constructor(
    swarmId: string,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Swarm not found: ${swarmId}`, AgentErrorCode.SWARM_NOT_FOUND, {
      ...options,
      swarmId,
      severity: ErrorSeverity.MEDIUM,
      httpStatus: 404,
    });
  }
}

export class SwarmCapacityExceededError extends SwarmError {
  constructor(
    swarmId: string,
    capacity: number,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Swarm capacity exceeded: ${capacity} agents`, AgentErrorCode.SWARM_CAPACITY_EXCEEDED, {
      ...options,
      swarmId,
      severity: ErrorSeverity.HIGH,
      metadata: {
        ...options?.metadata,
        capacity,
      },
    });
  }
}

export class SwarmPartitionError extends SwarmError {
  constructor(
    swarmId: string,
    partitions: number,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(
      `Swarm network partition detected: ${partitions} partitions`,
      AgentErrorCode.SWARM_PARTITION,
      {
        ...options,
        swarmId,
        severity: ErrorSeverity.CRITICAL,
        metadata: {
          ...options?.metadata,
          partitionCount: partitions,
        },
      }
    );
  }
}

/**
 * Task execution errors
 */
export class TaskError extends AgentError {
  constructor(
    message: string,
    code: AgentErrorCode = AgentErrorCode.TASK_ERROR,
    options?: {
      taskId?: string;
      agentId?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(message, code, {
      ...options,
      metadata: {
        ...options?.metadata,
        taskId: options?.taskId,
      },
    });
  }
}

export class TaskNotFoundError extends TaskError {
  constructor(
    taskId: string,
    options?: {
      agentId?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Task not found: ${taskId}`, AgentErrorCode.TASK_NOT_FOUND, {
      ...options,
      taskId,
      severity: ErrorSeverity.MEDIUM,
      httpStatus: 404,
    });
  }
}

export class TaskExecutionFailedError extends TaskError {
  constructor(
    taskId: string,
    reason: string,
    options?: {
      agentId?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Task execution failed: ${reason}`, AgentErrorCode.TASK_EXECUTION_FAILED, {
      ...options,
      taskId,
      severity: ErrorSeverity.HIGH,
      metadata: {
        ...options?.metadata,
        reason,
      },
    });
  }
}

export class TaskTimeoutError extends TaskError {
  constructor(
    taskId: string,
    timeout: number,
    options?: {
      agentId?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Task timeout after ${timeout}ms`, AgentErrorCode.TASK_TIMEOUT, {
      ...options,
      taskId,
      severity: ErrorSeverity.MEDIUM,
      metadata: {
        ...options?.metadata,
        timeout,
      },
    });
  }
}

export class TaskCancelledError extends TaskError {
  constructor(
    taskId: string,
    reason?: string,
    options?: {
      agentId?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Task cancelled${reason ? `: ${reason}` : ''}`, AgentErrorCode.TASK_CANCELLED, {
      ...options,
      taskId,
      severity: ErrorSeverity.LOW,
      metadata: {
        ...options?.metadata,
        reason,
      },
    });
  }
}

export class TaskDependencyFailedError extends TaskError {
  constructor(
    taskId: string,
    dependencyTaskId: string,
    options?: {
      agentId?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Task dependency failed: ${dependencyTaskId}`, AgentErrorCode.TASK_DEPENDENCY_FAILED, {
      ...options,
      taskId,
      severity: ErrorSeverity.HIGH,
      metadata: {
        ...options?.metadata,
        dependencyTaskId,
      },
    });
  }
}

/**
 * Communication errors
 */
export class CommunicationError extends AgentError {
  constructor(
    message: string,
    code: AgentErrorCode = AgentErrorCode.COMMUNICATION_ERROR,
    options?: {
      fromAgentId?: string;
      toAgentId?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(message, code, {
      ...options,
      metadata: {
        ...options?.metadata,
        fromAgentId: options?.fromAgentId,
        toAgentId: options?.toAgentId,
      },
    });
  }
}

export class MessageDeliveryFailedError extends CommunicationError {
  constructor(
    fromAgentId: string,
    toAgentId: string,
    reason: string,
    options?: {
      messageId?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(
      `Message delivery failed from ${fromAgentId} to ${toAgentId}: ${reason}`,
      AgentErrorCode.MESSAGE_DELIVERY_FAILED,
      {
        ...options,
        fromAgentId,
        toAgentId,
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          ...options?.metadata,
          messageId: options?.messageId,
          reason,
        },
      }
    );
  }
}

export class ChannelClosedError extends CommunicationError {
  constructor(
    channelId: string,
    options?: {
      agentId?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Communication channel closed: ${channelId}`, AgentErrorCode.CHANNEL_CLOSED, {
      ...options,
      severity: ErrorSeverity.MEDIUM,
      metadata: {
        ...options?.metadata,
        channelId,
      },
    });
  }
}

/**
 * State errors
 */
export class StateError extends AgentError {
  constructor(
    message: string,
    code: AgentErrorCode = AgentErrorCode.STATE_ERROR,
    options?: {
      agentId?: string;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(message, code, {
      ...options,
      severity: ErrorSeverity.HIGH,
    });
  }
}

export class InvalidStateError extends StateError {
  constructor(
    agentId: string,
    currentState: string,
    expectedState: string,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(
      `Invalid agent state: expected '${expectedState}', got '${currentState}'`,
      AgentErrorCode.INVALID_STATE,
      {
        ...options,
        agentId,
        metadata: {
          ...options?.metadata,
          currentState,
          expectedState,
        },
      }
    );
  }
}

export class MemoryExceededError extends StateError {
  constructor(
    agentId: string,
    used: number,
    limit: number,
    options?: {
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(
      `Agent memory exceeded: ${used} bytes (limit: ${limit} bytes)`,
      AgentErrorCode.MEMORY_EXCEEDED,
      {
        ...options,
        agentId,
        severity: ErrorSeverity.CRITICAL,
        metadata: {
          ...options?.metadata,
          memoryUsed: used,
          memoryLimit: limit,
        },
      }
    );
  }
}

/**
 * Resource exhausted error
 */
export class ResourceExhaustedError extends AgentError {
  constructor(
    resource: string,
    options?: {
      agentId?: string;
      available?: number;
      required?: number;
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Resource exhausted: ${resource}`, AgentErrorCode.RESOURCE_EXHAUSTED, {
      ...options,
      severity: ErrorSeverity.HIGH,
      httpStatus: 503,
      metadata: {
        ...options?.metadata,
        resource,
        available: options?.available,
        required: options?.required,
      },
    });
  }
}

/**
 * Capability not supported error
 */
export class CapabilityNotSupportedError extends AgentError {
  constructor(
    agentId: string,
    capability: string,
    options?: {
      supportedCapabilities?: string[];
      metadata?: ErrorMetadata;
      cause?: Error;
    }
  ) {
    super(`Capability not supported: ${capability}`, AgentErrorCode.CAPABILITY_NOT_SUPPORTED, {
      ...options,
      agentId,
      severity: ErrorSeverity.MEDIUM,
      httpStatus: 501,
      metadata: {
        ...options?.metadata,
        capability,
        supportedCapabilities: options?.supportedCapabilities,
      },
    });
  }
}
