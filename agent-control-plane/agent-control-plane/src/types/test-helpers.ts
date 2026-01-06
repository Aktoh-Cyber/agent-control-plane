/**
 * Test Type Helpers
 * Type-safe utilities specifically for testing
 */

import type { Constructor, JsonObject, JsonValue, TypedRecord } from './utilities.js';

/**
 * Mock function type
 */
export interface MockFunction<TArgs extends unknown[] = unknown[], TReturn = unknown> {
  (...args: TArgs): TReturn;
  mock: {
    calls: TArgs[];
    results: { type: 'return' | 'throw'; value: TReturn | Error }[];
    instances: unknown[];
    lastCall?: TArgs;
  };
  mockReturnValue(value: TReturn): this;
  mockReturnValueOnce(value: TReturn): this;
  mockResolvedValue(value: UnwrapPromise<TReturn>): this;
  mockRejectedValue(error: Error): this;
  mockImplementation(fn: (...args: TArgs) => TReturn): this;
  mockClear(): void;
  mockReset(): void;
}

/**
 * Mock constructor type
 */
export type MockConstructor<T = object> = {
  new (...args: unknown[]): T;
  mock: {
    instances: T[];
  };
  mockImplementation(implementation?: Constructor<T>): this;
  mockClear(): void;
};

/**
 * Unwrap promise type
 */
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

/**
 * Test data builder interface
 */
export interface TestDataBuilder<T> {
  build(): T;
  buildMany(count: number): T[];
}

/**
 * Mock data with metadata
 */
export interface MockData<T = unknown> {
  data: T;
  metadata: {
    createdAt: Date;
    mockType: string;
    mockVersion: string;
  };
}

/**
 * Type-safe mock result
 */
export type MockResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: Error;
    };

/**
 * Schema for JSON input
 */
export interface JsonSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  enum?: JsonValue[];
}

/**
 * Tool input schema
 */
export interface ToolInputSchema extends JsonSchema {
  type: 'object';
  properties: Record<string, JsonSchema>;
  required?: string[];
}

/**
 * MCP tool definition
 */
export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: ToolInputSchema;
}

/**
 * MCP message types
 */
export interface MCPRequest {
  id: string;
  method: string;
  params?: JsonObject;
}

export interface MCPResponse {
  id: string;
  result?: JsonValue;
  error?: {
    code: number;
    message: string;
    data?: JsonValue;
  };
}

export type MCPMessage = MCPRequest | MCPResponse;

/**
 * Type guard for MCP request
 */
export function isMCPRequest(message: MCPMessage): message is MCPRequest {
  return 'method' in message && 'params' in message;
}

/**
 * Type guard for MCP response
 */
export function isMCPResponse(message: MCPMessage): message is MCPResponse {
  return 'result' in message || 'error' in message;
}

/**
 * Database record type with flexible schema
 */
export interface DatabaseRecord {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: JsonValue | Date | undefined;
}

/**
 * Query result type
 */
export interface QueryResult<T extends DatabaseRecord = DatabaseRecord> {
  rows: T[];
  rowCount: number;
}

/**
 * Tool handler function type
 */
export type ToolHandler<TParams extends JsonObject = JsonObject, TResult = JsonValue> = (
  params: TParams
) => Promise<TResult>;

/**
 * Type-safe mock server interface
 */
export interface MockServer {
  connected: boolean;
  initialized: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  initialize(params: JsonObject): Promise<JsonValue>;
  request(method: string, params?: JsonObject): Promise<JsonValue>;
}

/**
 * Type-safe test context
 */
export interface TestContext {
  name: string;
  metadata: TypedRecord<string, JsonValue>;
  data: Map<string, unknown>;
  cleanup: Array<() => void | Promise<void>>;
}

/**
 * Test suite configuration
 */
export interface TestSuiteConfig {
  name: string;
  timeout?: number;
  beforeAll?: () => void | Promise<void>;
  afterAll?: () => void | Promise<void>;
  beforeEach?: () => void | Promise<void>;
  afterEach?: () => void | Promise<void>;
}

/**
 * Spy function type
 */
export interface SpyFunction<TArgs extends unknown[] = unknown[], TReturn = unknown> {
  (...args: TArgs): TReturn;
  spy: {
    called: boolean;
    callCount: number;
    calls: TArgs[];
    lastCall?: TArgs;
  };
}

/**
 * Snapshot data type
 */
export interface Snapshot<T = JsonValue> {
  name: string;
  data: T;
  timestamp: Date;
  version: string;
}

/**
 * Assertion helper types
 */
export interface AssertionResult {
  passed: boolean;
  message?: string;
  expected?: unknown;
  actual?: unknown;
}

/**
 * Type for test metadata
 */
export interface TestMetadata {
  [key: string]: JsonValue;
  testId?: string;
  testName?: string;
  suiteName?: string;
  timestamp?: number;
}

/**
 * Type for task in tests
 */
export interface TestTask {
  id: string;
  title: string;
  description: string;
  type: 'coding' | 'testing' | 'review' | 'research' | 'documentation' | 'deployment';
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  swarmId?: string;
  dependencies: string[];
  tags: string[];
  estimatedTime?: number;
  actualTime?: number;
  result?: JsonValue;
  error?: string;
  metadata: TypedRecord<string, JsonValue>;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * Type for agent in tests
 */
export interface TestAgent {
  id: string;
  type: string;
  name: string;
  status: 'idle' | 'busy' | 'offline';
  capabilities: string[];
  currentTask?: string;
  swarmId?: string;
  metadata: TypedRecord<string, JsonValue>;
  createdAt: Date;
}

/**
 * Type for vector in tests
 */
export interface TestVector {
  id: string;
  embedding: number[];
  metadata: TypedRecord<string, JsonValue>;
  content?: string;
}

/**
 * Type for memory in tests
 */
export interface TestMemory {
  id: string;
  key: string;
  value: JsonValue;
  timestamp: Date;
  ttl?: number;
  metadata: TypedRecord<string, JsonValue>;
}

/**
 * Type for user in tests
 */
export interface TestUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  metadata: TypedRecord<string, JsonValue>;
  createdAt: Date;
}

/**
 * Type for job in tests
 */
export interface TestJob {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  data: JsonObject;
  result?: JsonValue;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * Helper to create type-safe test data
 */
export function createTestData<T>(data: T, mockType: string): MockData<T> {
  return {
    data,
    metadata: {
      createdAt: new Date(),
      mockType,
      mockVersion: '1.0.0',
    },
  };
}

/**
 * Helper to create successful mock result
 */
export function mockSuccess<T>(data: T): MockResult<T> {
  return { success: true, data };
}

/**
 * Helper to create failed mock result
 */
export function mockFailure(error: Error): MockResult<never> {
  return { success: false, error };
}
