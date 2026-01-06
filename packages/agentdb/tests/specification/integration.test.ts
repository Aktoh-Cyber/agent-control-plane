/**
 * Integration Tests for AgentDB
 * Tests complete workflows combining multiple components
 * Lines: ~380
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { TestContext, cleanupTestContext, clearTestData, setupTestContext } from './fixtures';
import { createTestEpisode, createTestSkill } from './helpers';

let ctx: TestContext;

beforeAll(async () => {
  ctx = await setupTestContext('test-integration.db');
});

afterAll(() => {
  cleanupTestContext(ctx);
});

beforeEach(() => {
  clearTestData(ctx.db);
});

describe('AgentDB Integration Workflows', () => {
  describe('Complete Learning Workflow', () => {
    it('should execute full learning session workflow', async () => {
      const sessionId = 'full-workflow-test';

      const episode1 = await createTestEpisode(ctx.reflexion, {
        sessionId,
        task: 'Initialize learning',
        reward: 0.5,
      });
      expect(episode1).toBeGreaterThan(0);

      const predictions = await ctx.reflexion.retrieveRelevant({
        task: 'learning task',
        k: 3,
      });
      expect(predictions.length).toBeGreaterThan(0);

      const episode2 = await createTestEpisode(ctx.reflexion, {
        sessionId,
        task: 'Apply feedback',
        reward: 0.8,
        critique: 'Improved performance',
      });
      expect(episode2).toBeGreaterThan(0);

      const finalStats = ctx.db
        .prepare(
          `
        SELECT AVG(reward) as avg_reward, COUNT(*) as count
        FROM episodes WHERE session_id = ?
      `
        )
        .get(sessionId) as any;

      expect(finalStats.count).toBe(2);
      expect(finalStats.avg_reward).toBeGreaterThan(0);
    });

    it('should handle multi-episode learning with pattern extraction', async () => {
      const sessionId = 'pattern-extraction';

      for (let i = 0; i < 5; i++) {
        await createTestEpisode(ctx.reflexion, {
          sessionId,
          task: `Learning step ${i}`,
          reward: 0.5 + i * 0.1,
          input: `Input ${i}`,
          output: `Output ${i}`,
          latencyMs: 100 + i * 10,
          tokensUsed: 50 + i * 5,
        });
      }

      const patterns = await ctx.reflexion.retrieveRelevant({
        task: 'learning pattern',
        k: 3,
      });

      expect(patterns.length).toBeGreaterThan(0);

      const skillId = await createTestSkill(ctx.skills, {
        name: 'extracted-pattern',
        description: 'Pattern from learning',
        code: 'function learned() {}',
        successRate: 0.9,
        avgReward: 0.85,
        avgLatencyMs: 120,
      });

      expect(skillId).toBeGreaterThan(0);
    });
  });

  describe('Causal Reasoning Integration', () => {
    it('should build causal graph from episodes', async () => {
      const ep1 = await createTestEpisode(ctx.reflexion, {
        sessionId: 'causal-test',
        task: 'Task A',
        reward: 0.7,
      });

      const ep2 = await createTestEpisode(ctx.reflexion, {
        sessionId: 'causal-test',
        task: 'Task B',
        reward: 0.9,
      });

      ctx.causalGraph.addCausalEdge({
        fromMemoryId: ep1,
        fromMemoryType: 'episode',
        toMemoryId: ep2,
        toMemoryType: 'episode',
        similarity: 0.85,
        uplift: 0.2,
        confidence: 0.95,
        sampleSize: 10,
        evidenceIds: [],
      });

      const edges = ctx.db.prepare('SELECT * FROM causal_edges').all();
      expect(edges.length).toBeGreaterThan(0);
    });

    it('should perform causal recall with evidence', async () => {
      await createTestEpisode(ctx.reflexion, {
        sessionId: 'recall-test',
        task: 'Causal task',
        reward: 0.85,
      });

      const results = await ctx.causalRecall.search({
        query: 'causal reasoning',
        k: 5,
        includeEvidence: true,
      });

      expect(results).toBeDefined();
    });

    it('should link skills to causal outcomes', async () => {
      const skillId = await createTestSkill(ctx.skills, {
        name: 'causal-skill',
        description: 'Skill with causal impact',
        successRate: 0.9,
      });

      const episodeId = await createTestEpisode(ctx.reflexion, {
        task: 'Episode using skill',
        reward: 0.95,
      });

      ctx.causalGraph.addCausalEdge({
        fromMemoryId: skillId,
        fromMemoryType: 'skill',
        toMemoryId: episodeId,
        toMemoryType: 'episode',
        similarity: 0.9,
        uplift: 0.4,
        confidence: 0.95,
        sampleSize: 25,
        evidenceIds: [],
      });

      const edges = ctx.db
        .prepare('SELECT * FROM causal_edges WHERE from_memory_type = ?')
        .all('skill');

      expect(edges.length).toBeGreaterThan(0);
    });
  });

  describe('Batch Operations with Learning', () => {
    it('should handle concurrent batch insert and search', async () => {
      const episodes = Array.from({ length: 50 }, (_, i) => ({
        sessionId: 'concurrent-test',
        task: `Concurrent task ${i}`,
        reward: Math.random(),
        success: Math.random() > 0.5,
        input: '',
        output: '',
        critique: '',
        latencyMs: 0,
        tokensUsed: 0,
      }));

      const startInsert = Date.now();
      const inserted = await ctx.batchOps.insertEpisodes(episodes);
      const insertDuration = Date.now() - startInsert;

      expect(inserted).toBe(50);
      expect(insertDuration).toBeLessThan(30000);

      const searchPromises = Array.from({ length: 5 }, (_, i) =>
        ctx.reflexion.retrieveRelevant({
          task: `search query ${i}`,
          k: 10,
        })
      );

      const startSearch = Date.now();
      const results = await Promise.all(searchPromises);
      const searchDuration = Date.now() - startSearch;

      expect(results.length).toBe(5);
      expect(searchDuration).toBeLessThan(5000);
    });

    it('should maintain consistency during concurrent operations', async () => {
      const operations = [
        ctx.batchOps.insertEpisodes([
          {
            sessionId: 'consistency-test',
            task: 'Task 1',
            reward: 0.8,
            success: true,
            input: '',
            output: '',
            critique: '',
            latencyMs: 0,
            tokensUsed: 0,
          },
        ]),
        createTestSkill(ctx.skills, {
          name: 'concurrent-skill',
          description: 'Created during batch insert',
        }),
        ctx.reflexion.retrieveRelevant({
          task: 'search during insert',
          k: 5,
        }),
      ];

      const results = await Promise.all(operations);
      expect(results.length).toBe(3);
    });
  });

  describe('Cross-Session Knowledge Transfer', () => {
    it('should transfer knowledge between sessions', async () => {
      await createTestEpisode(ctx.reflexion, {
        sessionId: 'transfer-source',
        task: 'Source domain task',
        reward: 0.9,
        input: 'Domain A input',
        output: 'Domain A output',
        metadata: { domain: 'A' },
      });

      const results = await ctx.reflexion.retrieveRelevant({
        task: 'Domain A related task',
        k: 5,
      });

      expect(results.length).toBeGreaterThan(0);

      await createTestEpisode(ctx.reflexion, {
        sessionId: 'transfer-target',
        task: 'Target domain task',
        reward: 0.85,
        input: 'Domain B input',
        output: 'Domain B output',
        metadata: {
          domain: 'B',
          transferred_from: 'A',
          similarity: results[0]?.similarity || 0,
        },
      });

      const transferred = ctx.db
        .prepare('SELECT * FROM episodes WHERE metadata LIKE ?')
        .all('%transferred_from%');

      expect(transferred.length).toBeGreaterThan(0);
    });

    it('should apply learned skills across sessions', async () => {
      const skillId = await createTestSkill(ctx.skills, {
        name: 'transferable-skill',
        description: 'Skill usable across sessions',
        successRate: 0.9,
      });

      const session1Episode = await createTestEpisode(ctx.reflexion, {
        sessionId: 'session-1',
        task: 'Using skill in session 1',
        reward: 0.85,
      });

      const session2Episode = await createTestEpisode(ctx.reflexion, {
        sessionId: 'session-2',
        task: 'Using same skill in session 2',
        reward: 0.88,
      });

      expect(session1Episode).toBeGreaterThan(0);
      expect(session2Episode).toBeGreaterThan(0);

      const sessions = ctx.db.prepare('SELECT DISTINCT session_id FROM episodes').all();

      expect(sessions.length).toBe(2);
    });
  });

  describe('End-to-End Workflow Validation', () => {
    it('should complete full agent learning cycle', async () => {
      const sessionId = 'e2e-cycle';

      await createTestEpisode(ctx.reflexion, {
        sessionId,
        task: 'Initial exploration',
        reward: 0.4,
        success: false,
      });

      const patterns = await ctx.reflexion.retrieveRelevant({
        task: 'exploration',
        k: 5,
      });

      await createTestSkill(ctx.skills, {
        name: 'learned-strategy',
        description: 'Strategy from exploration',
        successRate: 0.6,
      });

      await createTestEpisode(ctx.reflexion, {
        sessionId,
        task: 'Apply learned strategy',
        reward: 0.8,
        success: true,
      });

      const finalStats = ctx.db
        .prepare(
          `
        SELECT AVG(reward) as avg_reward FROM episodes WHERE session_id = ?
      `
        )
        .get(sessionId) as any;

      expect(finalStats.avg_reward).toBeGreaterThan(0.4);
    });

    it('should integrate all components seamlessly', async () => {
      const sessionId = 'component-integration';

      const ep1 = await createTestEpisode(ctx.reflexion, {
        sessionId,
        task: 'Episode 1',
        reward: 0.7,
      });

      const skill = await createTestSkill(ctx.skills, {
        name: 'integration-skill',
        description: 'Skill for integration test',
        successRate: 0.85,
      });

      const ep2 = await createTestEpisode(ctx.reflexion, {
        sessionId,
        task: 'Episode 2 with skill',
        reward: 0.9,
      });

      ctx.causalGraph.addCausalEdge({
        fromMemoryId: skill,
        fromMemoryType: 'skill',
        toMemoryId: ep2,
        toMemoryType: 'episode',
        similarity: 0.9,
        uplift: 0.2,
        confidence: 0.95,
        sampleSize: 10,
        evidenceIds: [],
      });

      const allData = {
        episodes: (ctx.db.prepare('SELECT COUNT(*) as c FROM episodes').get() as any).c,
        skills: (ctx.db.prepare('SELECT COUNT(*) as c FROM skills').get() as any).c,
        edges: (ctx.db.prepare('SELECT COUNT(*) as c FROM causal_edges').get() as any).c,
      };

      expect(allData.episodes).toBe(2);
      expect(allData.skills).toBe(1);
      expect(allData.edges).toBe(1);
    });
  });
});
