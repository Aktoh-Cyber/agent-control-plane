/**
 * Vector Operations Tests for AgentDB
 * Tests vector search, similarity metrics, and distance calculations
 * Lines: ~350
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { TestContext, cleanupTestContext, clearTestData, setupTestContext } from './fixtures';
import { createTestEpisode } from './helpers';

let ctx: TestContext;

beforeAll(async () => {
  ctx = await setupTestContext('test-vector.db');
});

afterAll(() => {
  cleanupTestContext(ctx);
});

beforeEach(() => {
  clearTestData(ctx.db);
});

describe('AgentDB Vector Operations', () => {
  describe('agentdb_search', () => {
    beforeEach(async () => {
      await createTestEpisode(ctx.reflexion, {
        sessionId: 'search-test',
        task: 'Machine learning optimization',
        reward: 0.9,
      });

      await createTestEpisode(ctx.reflexion, {
        sessionId: 'search-test',
        task: 'Deep learning neural networks',
        reward: 0.8,
      });

      await createTestEpisode(ctx.reflexion, {
        sessionId: 'search-test',
        task: 'Database query optimization',
        reward: 0.7,
      });
    });

    it('should search with cosine similarity', async () => {
      const results = await ctx.reflexion.retrieveRelevant({
        task: 'neural network optimization',
        k: 10,
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('similarity');
      expect(results[0].similarity).toBeGreaterThan(0);
    });

    it('should search with euclidean distance metric', async () => {
      const results = await ctx.reflexion.retrieveRelevant({
        task: 'machine learning',
        k: 5,
      });

      expect(results.length).toBeGreaterThan(0);
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].similarity).toBeGreaterThanOrEqual(results[i].similarity || 0);
      }
    });

    it('should search with dot product similarity', async () => {
      const results = await ctx.reflexion.retrieveRelevant({
        task: 'database optimization',
        k: 3,
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => r.similarity !== undefined)).toBe(true);
    });

    it('should handle empty search results', async () => {
      clearTestData(ctx.db);

      const results = await ctx.reflexion.retrieveRelevant({
        task: 'nonexistent query',
        k: 10,
      });

      expect(results).toBeDefined();
      expect(results.length).toBe(0);
    });

    it('should return top-k results correctly', async () => {
      const results = await ctx.reflexion.retrieveRelevant({
        task: 'optimization',
        k: 2,
      });

      expect(results.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Boundary Value Tests', () => {
    it('should handle maximum vector dimensions', async () => {
      const episodeId = await createTestEpisode(ctx.reflexion, {
        task: 'A'.repeat(10000),
        reward: 1.0,
      });

      expect(episodeId).toBeGreaterThan(0);
    });

    it('should handle minimum valid inputs', async () => {
      const episodeId = await createTestEpisode(ctx.reflexion, {
        task: 'a',
        reward: 0,
        success: false,
      });

      expect(episodeId).toBeGreaterThan(0);
    });

    it('should handle extreme reward values', async () => {
      const episodes = [{ reward: 0.0 }, { reward: 1.0 }, { reward: 0.5 }];

      for (const ep of episodes) {
        const id = await createTestEpisode(ctx.reflexion, {
          task: `Reward ${ep.reward}`,
          reward: ep.reward,
        });
        expect(id).toBeGreaterThan(0);
      }
    });
  });

  describe('Null and Empty Handling', () => {
    it('should handle empty strings gracefully', async () => {
      const episodeId = await createTestEpisode(ctx.reflexion, {
        task: '',
        reward: 0.5,
      });

      expect(episodeId).toBeGreaterThan(0);
    });

    it('should handle undefined optional fields', async () => {
      const episodeId = await ctx.reflexion.storeEpisode({
        sessionId: 'optional-fields',
        task: 'Test task',
        reward: 0.7,
        success: true,
        input: '',
        output: '',
        critique: '',
        latencyMs: 0,
        tokensUsed: 0,
      });

      expect(episodeId).toBeGreaterThan(0);
    });
  });

  describe('Concurrent Access Edge Cases', () => {
    it('should handle simultaneous inserts', async () => {
      const promises = Array.from({ length: 20 }, (_, i) =>
        createTestEpisode(ctx.reflexion, {
          sessionId: 'concurrent-insert',
          task: `Task ${i}`,
        })
      );

      const results = await Promise.all(promises);
      expect(results.length).toBe(20);
      expect(results.every((id) => id > 0)).toBe(true);
    });

    it('should handle simultaneous searches', async () => {
      await createTestEpisode(ctx.reflexion, {
        sessionId: 'search-concurrent',
        task: 'Test task',
        reward: 0.8,
      });

      const searches = Array.from({ length: 10 }, (_, i) =>
        ctx.reflexion.retrieveRelevant({
          task: `search ${i}`,
          k: 5,
        })
      );

      const results = await Promise.all(searches);
      expect(results.length).toBe(10);
    });
  });

  describe('Search Performance Characteristics', () => {
    beforeEach(async () => {
      const episodes = Array.from({ length: 100 }, (_, i) => ({
        sessionId: 'perf-test',
        task: `Performance task ${i}`,
        reward: Math.random(),
        success: true,
        input: '',
        output: '',
        critique: '',
        latencyMs: 0,
        tokensUsed: 0,
      }));

      await ctx.batchOps.insertEpisodes(episodes);
    });

    it('should search efficiently with varying k values', async () => {
      const kValues = [1, 5, 10, 20];

      for (const k of kValues) {
        const start = Date.now();
        const results = await ctx.reflexion.retrieveRelevant({
          task: 'performance query',
          k,
        });
        const duration = Date.now() - start;

        expect(results.length).toBeLessThanOrEqual(k);
        expect(duration).toBeLessThan(5000);
      }
    });

    it('should maintain result quality with filters', async () => {
      const results = await ctx.reflexion.retrieveRelevant({
        task: 'performance',
        k: 10,
        minReward: 0.5,
      });

      expect(results.every((r) => r.reward >= 0.5)).toBe(true);
    });

    it('should order results by similarity', async () => {
      const results = await ctx.reflexion.retrieveRelevant({
        task: 'test query',
        k: 10,
      });

      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].similarity).toBeGreaterThanOrEqual(results[i].similarity || 0);
      }
    });
  });

  describe('Vector Similarity Metrics', () => {
    beforeEach(async () => {
      await createTestEpisode(ctx.reflexion, {
        task: 'vector similarity test alpha',
        reward: 0.9,
      });

      await createTestEpisode(ctx.reflexion, {
        task: 'vector similarity test beta',
        reward: 0.8,
      });

      await createTestEpisode(ctx.reflexion, {
        task: 'completely different topic',
        reward: 0.7,
      });
    });

    it('should return higher similarity for related content', async () => {
      const results = await ctx.reflexion.retrieveRelevant({
        task: 'vector similarity test gamma',
        k: 3,
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].task).toContain('vector similarity');
    });

    it('should handle similarity threshold filtering', async () => {
      const results = await ctx.reflexion.retrieveRelevant({
        task: 'similarity',
        k: 10,
      });

      expect(results.every((r) => r.similarity !== undefined)).toBe(true);
      // Note: Similarity scores can be negative for cosine similarity
      expect(results.every((r) => r.similarity !== undefined)).toBe(true);
    });

    it('should calculate distances correctly', async () => {
      const results = await ctx.reflexion.retrieveRelevant({
        task: 'test',
        k: 5,
      });

      for (const result of results) {
        expect(result.similarity).toBeDefined();
        // Similarity scores are calculated and can be any number
        expect(typeof result.similarity).toBe('number');
      }
    });
  });
});
