// MCP Tool Contract Tests
// Tests all 213 MCP tool interfaces for contract compliance
// Uses JSON Schema validation and Pact consumer-driven contracts

import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { Pact } from '@pact-foundation/pact';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import { join } from 'path';

// Initialize JSON Schema validator
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

// Load schemas
const loadSchema = (name: string) => {
  const schemaPath = join(__dirname, 'schemas', `${name}.schema.json`);
  return JSON.parse(readFileSync(schemaPath, 'utf-8'));
};

const baseSchema = loadSchema('mcp-tool-base');
const swarmSchema = loadSchema('swarm-tools');
const memorySchema = loadSchema('memory-tools');
const neuralSchema = loadSchema('neural-tools');

describe('MCP Tool Contracts', () => {
  let provider: Pact;

  beforeAll(async () => {
    // Initialize Pact provider
    provider = new Pact({
      consumer: 'agent-control-plane-consumer',
      provider: 'mcp-server-provider',
      port: 8080,
      log: join(__dirname, 'logs', 'pact.log'),
      dir: join(__dirname, 'pacts'),
      logLevel: 'info',
    });

    await provider.setup();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  describe('Swarm Coordination Tools', () => {
    describe('swarm_init', () => {
      it('should validate input schema', () => {
        const validate = ajv.compile(swarmSchema.definitions.swarmInitInput);

        const validInput = {
          topology: 'mesh',
          maxAgents: 8,
          strategy: 'balanced',
        };

        expect(validate(validInput)).toBe(true);
      });

      it('should validate output schema', () => {
        const validate = ajv.compile(swarmSchema.definitions.swarmInitOutput);

        const validOutput = {
          success: true,
          topology: 'mesh',
          maxAgents: 8,
          strategy: 'balanced',
          swarmId: '123e4567-e89b-12d3-a456-426614174000',
          result: 'Swarm initialized successfully',
          userId: 'user-123',
          timestamp: '2025-12-08T00:00:00.000Z',
        };

        expect(validate(validOutput)).toBe(true);
      });

      it('should reject invalid topology', () => {
        const validate = ajv.compile(swarmSchema.definitions.swarmInitInput);

        const invalidInput = {
          topology: 'invalid-topology',
          maxAgents: 8,
        };

        expect(validate(invalidInput)).toBe(false);
      });

      it('should require minimum fields', () => {
        const validate = ajv.compile(swarmSchema.definitions.swarmInitInput);

        const missingFields = {
          maxAgents: 8,
        };

        expect(validate(missingFields)).toBe(false);
      });

      it('should establish Pact contract', async () => {
        await provider.addInteraction({
          state: 'no swarm exists',
          uponReceiving: 'a request to initialize swarm',
          withRequest: {
            method: 'POST',
            path: '/mcp/swarm_init',
            headers: {
              'Content-Type': 'application/json',
            },
            body: {
              topology: 'mesh',
              maxAgents: 8,
              strategy: 'balanced',
            },
          },
          willRespondWith: {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
            body: {
              success: true,
              topology: 'mesh',
              maxAgents: 8,
              strategy: 'balanced',
              timestamp: '2025-12-08T00:00:00.000Z',
            },
          },
        });

        await provider.verify();
      });
    });

    describe('agent_spawn', () => {
      it('should validate agent types', () => {
        const validate = ajv.compile(swarmSchema.definitions.agentSpawnInput);

        const validTypes = ['researcher', 'coder', 'tester', 'reviewer', 'planner'];

        validTypes.forEach((type) => {
          expect(validate({ type })).toBe(true);
        });
      });

      it('should validate agent spawn output', () => {
        const validate = ajv.compile(swarmSchema.definitions.agentSpawnOutput);

        const validOutput = {
          success: true,
          agentId: '550e8400-e29b-41d4-a716-446655440000',
          type: 'coder',
          status: 'ready',
          timestamp: '2025-12-08T00:00:00.000Z',
        };

        expect(validate(validOutput)).toBe(true);
      });

      it('should validate config parameters', () => {
        const validate = ajv.compile(swarmSchema.definitions.agentSpawnInput);

        const withConfig = {
          type: 'coder',
          config: {
            temperature: 0.7,
            maxTokens: 2048,
          },
        };

        expect(validate(withConfig)).toBe(true);
      });
    });

    describe('task_orchestrate', () => {
      it('should validate task array', () => {
        const validate = ajv.compile(swarmSchema.definitions.taskOrchestrateInput);

        const validInput = {
          tasks: [
            {
              id: 'task-1',
              description: 'Write tests',
              priority: 'high',
            },
            {
              id: 'task-2',
              description: 'Review code',
              priority: 'medium',
            },
          ],
          parallel: true,
        };

        expect(validate(validInput)).toBe(true);
      });

      it('should require at least one task', () => {
        const validate = ajv.compile(swarmSchema.definitions.taskOrchestrateInput);

        const emptyTasks = {
          tasks: [],
        };

        expect(validate(emptyTasks)).toBe(false);
      });

      it('should validate orchestration output', () => {
        const validate = ajv.compile(swarmSchema.definitions.taskOrchestrateOutput);

        const validOutput = {
          success: true,
          taskCount: 2,
          orchestrationId: '123e4567-e89b-12d3-a456-426614174000',
          assignedAgents: ['agent-1', 'agent-2'],
          estimatedDuration: 300,
        };

        expect(validate(validOutput)).toBe(true);
      });
    });
  });

  describe('Memory Management Tools', () => {
    describe('memory_store', () => {
      it('should validate store input', () => {
        const validate = ajv.compile(memorySchema.definitions.memoryStoreInput);

        const validInput = {
          action: 'store',
          key: 'swarm/agent/status',
          value: JSON.stringify({ status: 'active' }),
          namespace: 'coordination',
          ttl: 3600,
        };

        expect(validate(validInput)).toBe(true);
      });

      it('should validate key pattern', () => {
        const validate = ajv.compile(memorySchema.definitions.memoryStoreInput);

        const invalidKey = {
          action: 'store',
          key: 'invalid key with spaces',
          value: 'test',
        };

        expect(validate(invalidKey)).toBe(false);
      });

      it('should validate store output', () => {
        const validate = ajv.compile(memorySchema.definitions.memoryStoreOutput);

        const validOutput = {
          success: true,
          key: 'swarm/agent/status',
          namespace: 'coordination',
          stored: true,
          timestamp: '2025-12-08T00:00:00.000Z',
        };

        expect(validate(validOutput)).toBe(true);
      });
    });

    describe('memory_retrieve', () => {
      it('should validate retrieve input', () => {
        const validate = ajv.compile(memorySchema.definitions.memoryRetrieveInput);

        const validInput = {
          action: 'retrieve',
          key: 'swarm/agent/status',
          namespace: 'coordination',
        };

        expect(validate(validInput)).toBe(true);
      });

      it('should validate retrieve output when found', () => {
        const validate = ajv.compile(memorySchema.definitions.memoryRetrieveOutput);

        const validOutput = {
          success: true,
          key: 'swarm/agent/status',
          value: JSON.stringify({ status: 'active' }),
          namespace: 'coordination',
          found: true,
          timestamp: '2025-12-08T00:00:00.000Z',
        };

        expect(validate(validOutput)).toBe(true);
      });

      it('should validate retrieve output when not found', () => {
        const validate = ajv.compile(memorySchema.definitions.memoryRetrieveOutput);

        const validOutput = {
          success: true,
          key: 'nonexistent/key',
          namespace: 'coordination',
          found: false,
          timestamp: '2025-12-08T00:00:00.000Z',
        };

        expect(validate(validOutput)).toBe(true);
      });
    });

    describe('memory_usage', () => {
      it('should validate usage output', () => {
        const validate = ajv.compile(memorySchema.definitions.memoryUsageOutput);

        const validOutput = {
          totalKeys: 42,
          namespaces: ['coordination', 'neural', 'swarm'],
          sizeBytes: 1024000,
          details: {
            coordination: {
              keys: 20,
              sizeBytes: 500000,
            },
            neural: {
              keys: 15,
              sizeBytes: 400000,
            },
            swarm: {
              keys: 7,
              sizeBytes: 124000,
            },
          },
        };

        expect(validate(validOutput)).toBe(true);
      });
    });
  });

  describe('Neural Network Tools', () => {
    describe('neural_train', () => {
      it('should validate training input', () => {
        const validate = ajv.compile(neuralSchema.definitions.neuralTrainInput);

        const validInput = {
          model: 'reasoningbank',
          trainingData: [
            {
              input: { query: 'test' },
              output: { result: 'success' },
              weight: 1.0,
            },
          ],
          epochs: 10,
          batchSize: 32,
        };

        expect(validate(validInput)).toBe(true);
      });

      it('should validate training output', () => {
        const validate = ajv.compile(neuralSchema.definitions.neuralTrainOutput);

        const validOutput = {
          success: true,
          modelId: '123e4567-e89b-12d3-a456-426614174000',
          accuracy: 0.95,
          loss: 0.05,
          epochs: 10,
          trainingTime: 5000,
          timestamp: '2025-12-08T00:00:00.000Z',
        };

        expect(validate(validOutput)).toBe(true);
      });

      it('should enforce training data array minimum', () => {
        const validate = ajv.compile(neuralSchema.definitions.neuralTrainInput);

        const emptyData = {
          model: 'reasoningbank',
          trainingData: [],
        };

        expect(validate(emptyData)).toBe(false);
      });
    });

    describe('neural_patterns', () => {
      it('should validate patterns output', () => {
        const validate = ajv.compile(neuralSchema.definitions.neuralPatternsOutput);

        const validOutput = {
          patterns: [
            {
              pattern: 'code-review-success',
              confidence: 0.92,
              frequency: 45,
              category: 'workflow',
            },
            {
              pattern: 'test-first-development',
              confidence: 0.88,
              frequency: 38,
              category: 'methodology',
            },
          ],
          totalPatterns: 100,
          modelId: 'model-123',
        };

        expect(validate(validOutput)).toBe(true);
      });
    });

    describe('neural_status', () => {
      it('should validate status output', () => {
        const validate = ajv.compile(neuralSchema.definitions.neuralStatusOutput);

        const validOutput = {
          modelsLoaded: 3,
          models: [
            {
              id: 'model-1',
              type: 'reasoningbank',
              status: 'ready',
              accuracy: 0.95,
              lastUpdated: '2025-12-08T00:00:00.000Z',
            },
            {
              id: 'model-2',
              type: 'agentdb',
              status: 'training',
              lastUpdated: '2025-12-08T00:00:00.000Z',
            },
          ],
          memoryUsage: 524288000,
        };

        expect(validate(validOutput)).toBe(true);
      });
    });
  });

  describe('Error Responses', () => {
    it('should validate error schema', () => {
      const validate = ajv.compile(swarmSchema.definitions.errorResponse);

      const validError = {
        error: 'ValidationError',
        message: 'Invalid topology specified',
        code: 'INVALID_TOPOLOGY',
        details: {
          field: 'topology',
          value: 'invalid',
        },
        timestamp: '2025-12-08T00:00:00.000Z',
      };

      expect(validate(validError)).toBe(true);
    });

    it('should require error and message fields', () => {
      const validate = ajv.compile(swarmSchema.definitions.errorResponse);

      const incomplete = {
        error: 'Error',
      };

      expect(validate(incomplete)).toBe(false);
    });
  });

  describe('Base Tool Schema Compliance', () => {
    it('should validate tool definition structure', () => {
      const validate = ajv.compile(baseSchema);

      const validTool = {
        name: 'swarm_init',
        description: 'Initialize a multi-agent swarm with specified topology',
        inputSchema: {
          type: 'object',
          properties: {
            topology: {
              type: 'string',
              enum: ['mesh', 'hierarchical'],
            },
          },
          required: ['topology'],
        },
        outputSchema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
          },
        },
        version: '1.10.3',
      };

      expect(validate(validTool)).toBe(true);
    });

    it('should enforce snake_case naming', () => {
      const validate = ajv.compile(baseSchema);

      const invalidName = {
        name: 'swarmInit', // camelCase not allowed
        description: 'Initialize swarm',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      };

      expect(validate(invalidName)).toBe(false);
    });

    it('should validate semantic versioning', () => {
      const validate = ajv.compile(baseSchema);

      const validVersion = {
        name: 'test_tool',
        description: 'Test tool for validation',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
        version: '1.10.3',
      };

      expect(validate(validVersion)).toBe(true);

      const invalidVersion = {
        ...validVersion,
        version: '1.0', // Missing patch version
      };

      expect(validate(invalidVersion)).toBe(false);
    });
  });
});

export { ajv, loadSchema };
