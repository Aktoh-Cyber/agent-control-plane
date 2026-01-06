/**
 * Skill Library Tests for AgentDB
 * Tests pattern storage, skill search, and skill statistics
 * Lines: ~295
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { TestContext, cleanupTestContext, clearTestData, setupTestContext } from './fixtures';
import { createTestSkill } from './helpers';

let ctx: TestContext;

beforeAll(async () => {
  ctx = await setupTestContext('test-skills.db');
});

afterAll(() => {
  cleanupTestContext(ctx);
});

beforeEach(() => {
  clearTestData(ctx.db);
});

describe('AgentDB Skill Library', () => {
  describe('agentdb_pattern_store', () => {
    it('should store pattern with metadata', async () => {
      const skillId = await createTestSkill(ctx.skills, {
        name: 'test-pattern',
        description: 'Test pattern storage',
        successRate: 0.9,
        avgReward: 0.8,
        avgLatencyMs: 100,
      });

      expect(skillId).toBeGreaterThan(0);

      const skill = ctx.db.prepare('SELECT * FROM skills WHERE id = ?').get(skillId) as any;
      expect(skill.name).toBe('test-pattern');
    });

    it('should store pattern with tags', async () => {
      const skillId = await createTestSkill(ctx.skills, {
        name: 'tagged-pattern',
        description: 'Pattern with tags',
        tags: ['optimization', 'performance'],
      });

      const skill = ctx.db.prepare('SELECT * FROM skills WHERE id = ?').get(skillId) as any;
      expect(skill.tags).toBeDefined();
    });

    it('should enforce unique pattern names', async () => {
      await createTestSkill(ctx.skills, {
        name: 'unique-pattern',
        description: 'First pattern',
      });

      await expect(async () => {
        await createTestSkill(ctx.skills, {
          name: 'unique-pattern',
          description: 'Duplicate pattern',
        });
      }).rejects.toThrow();
    });

    it('should store complex skill signatures', async () => {
      const skillId = await createTestSkill(ctx.skills, {
        name: 'complex-skill',
        description: 'Skill with complex signature',
        signature: {
          inputs: { param1: 'string', param2: 'number' },
          outputs: { result: 'object' },
        },
      });

      const skill = ctx.db.prepare('SELECT * FROM skills WHERE id = ?').get(skillId) as any;
      expect(skill.signature).toBeDefined();
    });
  });

  describe('agentdb_pattern_search', () => {
    beforeEach(async () => {
      await createTestSkill(ctx.skills, {
        name: 'optimization-skill',
        description: 'Optimize database queries',
        successRate: 0.9,
        uses: 10,
        avgReward: 0.85,
        avgLatencyMs: 50,
      });

      await createTestSkill(ctx.skills, {
        name: 'caching-skill',
        description: 'Implement caching strategies',
        successRate: 0.85,
        uses: 8,
        avgReward: 0.8,
        avgLatencyMs: 30,
      });
    });

    it('should search patterns by similarity', async () => {
      const results = await ctx.skills.searchSkills({
        task: 'optimize performance',
        k: 10,
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('similarity');
    });

    it('should filter by minimum success rate', async () => {
      const results = await ctx.skills.searchSkills({
        task: 'optimization',
        k: 10,
        minSuccessRate: 0.88,
      });

      expect(results.every((r) => r.successRate >= 0.88)).toBe(true);
    });

    it('should return top-k results', async () => {
      const results = await ctx.skills.searchSkills({
        task: 'performance',
        k: 1,
      });

      expect(results.length).toBeLessThanOrEqual(1);
    });

    it('should order results by relevance', async () => {
      const results = await ctx.skills.searchSkills({
        task: 'database optimization',
        k: 5,
      });

      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].similarity).toBeGreaterThanOrEqual(results[i].similarity || 0);
      }
    });
  });

  describe('agentdb_pattern_stats', () => {
    it('should return usage statistics', async () => {
      const skillId = await createTestSkill(ctx.skills, {
        name: 'stats-skill',
        description: 'Skill for stats testing',
        successRate: 0.9,
        uses: 100,
        avgReward: 0.85,
        avgLatencyMs: 75,
      });

      const skill = ctx.db.prepare('SELECT * FROM skills WHERE id = ?').get(skillId) as any;
      expect(skill.uses).toBe(100);
      expect(skill.success_rate).toBeCloseTo(0.9);
      expect(skill.avg_reward).toBeCloseTo(0.85);
    });

    it('should return success rate metrics', async () => {
      await createTestSkill(ctx.skills, {
        name: 'high-success',
        description: 'High success rate skill',
        successRate: 0.95,
        uses: 50,
        avgReward: 0.9,
      });

      const skillStats = ctx.db.prepare('SELECT AVG(success_rate) as avg FROM skills').get() as any;
      expect(skillStats.avg).toBeGreaterThan(0);
    });

    it('should return performance metrics', async () => {
      await createTestSkill(ctx.skills, {
        name: 'fast-skill',
        description: 'Fast execution skill',
        successRate: 0.8,
        uses: 20,
        avgReward: 0.75,
        avgLatencyMs: 10,
      });

      const skill = ctx.db.prepare('SELECT * FROM skills WHERE name = ?').get('fast-skill') as any;
      expect(skill.avg_latency_ms).toBeLessThan(100);
    });

    it('should aggregate statistics across skills', async () => {
      await createTestSkill(ctx.skills, {
        name: 'skill-1',
        description: 'First skill',
        successRate: 0.8,
        uses: 50,
      });

      await createTestSkill(ctx.skills, {
        name: 'skill-2',
        description: 'Second skill',
        successRate: 0.9,
        uses: 75,
      });

      const stats = ctx.db
        .prepare(
          `
        SELECT
          COUNT(*) as count,
          AVG(success_rate) as avg_success,
          SUM(uses) as total_uses
        FROM skills
      `
        )
        .get() as any;

      expect(stats.count).toBe(2);
      expect(stats.total_uses).toBe(125);
    });
  });

  describe('Skill Metadata Management', () => {
    it('should store and retrieve skill metadata', async () => {
      const skillId = await createTestSkill(ctx.skills, {
        name: 'metadata-skill',
        description: 'Skill with metadata',
        metadata: {
          version: '1.0.0',
          author: 'test',
          category: 'optimization',
        },
      });

      const skill = ctx.db.prepare('SELECT * FROM skills WHERE id = ?').get(skillId) as any;
      expect(skill.metadata).toContain('version');
    });

    it('should update skill statistics', async () => {
      const skillId = await createTestSkill(ctx.skills, {
        name: 'updateable-skill',
        description: 'Skill that will be updated',
        uses: 10,
        successRate: 0.8,
      });

      ctx.db
        .prepare('UPDATE skills SET uses = ?, success_rate = ? WHERE id = ?')
        .run(20, 0.85, skillId);

      const updated = ctx.db.prepare('SELECT * FROM skills WHERE id = ?').get(skillId) as any;
      expect(updated.uses).toBe(20);
      expect(updated.success_rate).toBeCloseTo(0.85);
    });

    it('should handle skill versioning', async () => {
      const v1 = await createTestSkill(ctx.skills, {
        name: 'versioned-skill-v1',
        description: 'Version 1 of skill',
        metadata: { version: '1.0.0' },
      });

      const v2 = await createTestSkill(ctx.skills, {
        name: 'versioned-skill-v2',
        description: 'Version 2 of skill',
        metadata: { version: '2.0.0', supersedes: v1 },
      });

      expect(v1).toBeGreaterThan(0);
      expect(v2).toBeGreaterThan(0);
    });
  });

  describe('Skill Performance Tracking', () => {
    it('should track skill usage over time', async () => {
      const skillId = await createTestSkill(ctx.skills, {
        name: 'tracked-skill',
        description: 'Skill with usage tracking',
        uses: 0,
      });

      for (let i = 0; i < 5; i++) {
        ctx.db.prepare('UPDATE skills SET uses = uses + 1 WHERE id = ?').run(skillId);
      }

      const skill = ctx.db.prepare('SELECT * FROM skills WHERE id = ?').get(skillId) as any;
      expect(skill.uses).toBe(5);
    });

    it('should calculate moving averages', async () => {
      const skillId = await createTestSkill(ctx.skills, {
        name: 'avg-skill',
        description: 'Skill with averages',
        avgReward: 0.7,
        avgLatencyMs: 100,
      });

      const skill = ctx.db.prepare('SELECT * FROM skills WHERE id = ?').get(skillId) as any;
      expect(skill.avg_reward).toBeDefined();
      expect(skill.avg_latency_ms).toBeDefined();
    });

    it('should identify top-performing skills', async () => {
      await createTestSkill(ctx.skills, {
        name: 'top-skill',
        description: 'Top performer',
        successRate: 0.95,
        avgReward: 0.9,
      });

      await createTestSkill(ctx.skills, {
        name: 'average-skill',
        description: 'Average performer',
        successRate: 0.75,
        avgReward: 0.7,
      });

      const topSkills = ctx.db
        .prepare(
          `
        SELECT * FROM skills
        ORDER BY success_rate DESC, avg_reward DESC
        LIMIT 1
      `
        )
        .all() as any[];

      expect(topSkills[0].name).toBe('top-skill');
    });
  });
});
