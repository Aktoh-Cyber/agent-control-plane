/**
 * Skill management tool handlers
 * Handles: skill_create, skill_search, skill_create_batch
 */
import { BatchOperations } from '../../optimizations/BatchOperations.js';
import {
  handleSecurityError,
  validateArrayLength,
  validateEnum,
  validateNumericRange,
  validateTaskString,
} from '../../security/input-validation.js';
import type { HandlerContext, MCPToolResponse, ToolDefinition } from './types.js';

export const skillTools: ToolDefinition[] = [
  {
    name: 'skill_create',
    description: 'Create a reusable skill in the skill library',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Skill name' },
        description: { type: 'string', description: 'What the skill does' },
        code: { type: 'string', description: 'Skill implementation code' },
        success_rate: { type: 'number', description: 'Initial success rate' },
      },
      required: ['name', 'description'],
    },
  },
  {
    name: 'skill_search',
    description: 'Search for applicable skills by semantic similarity',
    inputSchema: {
      type: 'object',
      properties: {
        task: { type: 'string', description: 'Task to find skills for' },
        k: { type: 'number', description: 'Number of skills to return', default: 10 },
        min_success_rate: { type: 'number', description: 'Minimum success rate filter' },
      },
      required: ['task'],
    },
  },
  {
    name: 'skill_create_batch',
    description:
      'Batch create multiple skills efficiently using transactions and parallel embedding generation. 3x faster than sequential skill_create calls (304 → 900 ops/sec). 🔄 PARALLEL-SAFE: Can be used alongside other batch operations.',
    inputSchema: {
      type: 'object',
      properties: {
        skills: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Skill name (unique)' },
              description: { type: 'string', description: 'What the skill does' },
              signature: { type: 'object', description: 'Optional function signature' },
              code: { type: 'string', description: 'Skill implementation code' },
              success_rate: {
                type: 'number',
                description: 'Initial success rate (0-1)',
                default: 0.0,
              },
              uses: { type: 'number', description: 'Initial use count', default: 0 },
              avg_reward: { type: 'number', description: 'Average reward', default: 0.0 },
              avg_latency_ms: { type: 'number', description: 'Average latency', default: 0.0 },
              tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Tags for categorization',
              },
              metadata: { type: 'object', description: 'Additional metadata (JSON)' },
            },
            required: ['name', 'description'],
          },
          description: 'Array of skills to create',
          minItems: 1,
          maxItems: 100,
        },
        batch_size: {
          type: 'number',
          description: 'Batch size for processing (default: 32)',
          default: 32,
        },
        format: {
          type: 'string',
          enum: ['concise', 'detailed', 'json'],
          description: 'Response format (default: concise)',
          default: 'concise',
        },
      },
      required: ['skills'],
    },
  },
];

export async function handleSkillCreate(
  args: Record<string, any>,
  context: HandlerContext
): Promise<MCPToolResponse> {
  const skillId = await context.skills.createSkill({
    name: args?.name as string,
    description: args?.description as string,
    signature: { inputs: {}, outputs: {} },
    code: (args?.code as string) || '',
    successRate: (args?.success_rate as number) || 0.0,
    uses: 0,
    avgReward: 0.0,
    avgLatencyMs: 0.0,
  });
  return {
    content: [
      {
        type: 'text',
        text: `✅ Created skill #${skillId}: ${args?.name}`,
      },
    ],
  };
}

export async function handleSkillSearch(
  args: Record<string, any>,
  context: HandlerContext
): Promise<MCPToolResponse> {
  const foundSkills = await context.skills.searchSkills({
    task: args?.task as string,
    k: (args?.k as number) || 10,
    minSuccessRate: (args?.min_success_rate as number) || 0.0,
  });
  return {
    content: [
      {
        type: 'text',
        text:
          `🔍 Found ${foundSkills.length} skills:\n\n` +
          foundSkills
            .map(
              (skill, i) =>
                `${i + 1}. ${skill.name}\n   ${skill.description}\n   Success: ${(skill.successRate * 100).toFixed(1)}%`
            )
            .join('\n\n'),
      },
    ],
  };
}

export async function handleSkillCreateBatch(
  args: Record<string, any>,
  context: HandlerContext
): Promise<MCPToolResponse> {
  try {
    // Validate inputs
    const skillsArray = validateArrayLength(args?.skills, 'skills', 1, 100);
    const batchSize = args?.batch_size
      ? validateNumericRange(args.batch_size, 'batch_size', 1, 100)
      : 32;
    const format = args?.format
      ? validateEnum(args.format, 'format', ['concise', 'detailed', 'json'] as const)
      : 'concise';

    // Validate each skill
    const validatedSkills = skillsArray.map((skill: any, index: number) => {
      const name = validateTaskString(skill.name, `skills[${index}].name`);
      const description = validateTaskString(skill.description, `skills[${index}].description`);
      const successRate =
        skill.success_rate !== undefined
          ? validateNumericRange(skill.success_rate, `skills[${index}].success_rate`, 0, 1)
          : 0.0;

      return {
        name,
        description,
        signature: skill.signature || { inputs: {}, outputs: {} },
        code: skill.code || '',
        successRate,
        uses: skill.uses || 0,
        avgReward: skill.avg_reward || 0.0,
        avgLatencyMs: skill.avg_latency_ms || 0.0,
        tags: skill.tags || [],
        metadata: skill.metadata || {},
      };
    });

    // Use BatchOperations for efficient insertion
    const startTime = Date.now();
    const batchOpsConfig = new BatchOperations(context.db, context.embeddingService, {
      batchSize,
      parallelism: 4,
    });

    const skillIds = await batchOpsConfig.insertSkills(validatedSkills);
    const duration = Date.now() - startTime;

    // Format response
    if (format === 'json') {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                inserted: skillIds.length,
                skill_ids: skillIds,
                duration_ms: duration,
                batch_size: batchSize,
              },
              null,
              2
            ),
          },
        ],
      };
    } else if (format === 'detailed') {
      return {
        content: [
          {
            type: 'text',
            text:
              `✅ Batch skill creation completed!\n\n` +
              `📊 Performance:\n` +
              `   • Skills Created: ${skillIds.length}\n` +
              `   • Duration: ${duration}ms\n` +
              `   • Throughput: ${(skillIds.length / (duration / 1000)).toFixed(1)} skills/sec\n` +
              `   • Batch Size: ${batchSize}\n` +
              `   • Parallelism: 4 workers\n\n` +
              `🆔 Created Skill IDs:\n` +
              skillIds
                .slice(0, 10)
                .map((id, i) => `   ${i + 1}. Skill #${id}: ${validatedSkills[i].name}`)
                .join('\n') +
              (skillIds.length > 10 ? `\n   ... and ${skillIds.length - 10} more skills` : '') +
              `\n\n🧠 All embeddings generated in parallel\n` +
              `💾 Transaction committed successfully`,
          },
        ],
      };
    } else {
      // Concise format (default)
      return {
        content: [
          {
            type: 'text',
            text: `✅ Created ${skillIds.length} skills in ${duration}ms (${(skillIds.length / (duration / 1000)).toFixed(1)} skills/sec)`,
          },
        ],
      };
    }
  } catch (error: any) {
    const safeMessage = handleSecurityError(error);
    return {
      content: [
        {
          type: 'text',
          text:
            `❌ Batch skill creation failed: ${safeMessage}\n\n` +
            `💡 Troubleshooting:\n` +
            `   • Ensure all skills have unique names\n` +
            `   • Verify success_rate is between 0 and 1\n` +
            `   • Check that skills array has 1-100 items\n` +
            `   • Ensure descriptions are not empty`,
        },
      ],
      isError: true,
    };
  }
}
