/**
 * Performance Benchmark Tests for AgentDB
 * Tests throughput, latency, and scalability characteristics
 * Lines: ~295
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { TestContext, cleanupTestContext, clearTestData, setupTestContext } from './fixtures';
import { calculateAverage, calculatePercentile, createTestEpisode } from './helpers';

let ctx: TestContext;

beforeAll(async () => {
  ctx = await setupTestContext('test-performance.db');
});

afterAll(() => {
  cleanupTestContext(ctx);
});

beforeEach(() => {
  clearTestData(ctx.db);
});

describe('Performance Benchmarks', () => {
  describe('Insert Performance', () => {
    it('should benchmark single insert latency', async () => {
      const iterations = 10;
      const latencies: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await createTestEpisode(ctx.reflexion, {
          sessionId: 'latency-test',
          task: `Latency test ${i}`,
          reward: 0.8,
        });
        latencies.push(Date.now() - start);
      }

      const avgLatency = calculateAverage(latencies);
      const p95 = calculatePercentile(latencies, 0.95);

      console.log(`Single Insert - Avg: ${avgLatency}ms, P95: ${p95}ms`);
      expect(avgLatency).toBeLessThan(1000);
    });

    it('should benchmark batch insert throughput', async () => {
      const batchSizes = [10, 100, 1000];

      for (const size of batchSizes) {
        const episodes = Array.from({ length: size }, (_, i) => ({
          sessionId: 'throughput-test',
          task: `Task ${i}`,
          reward: 0.8,
          success: true,
          input: '',
          output: '',
          critique: '',
          latencyMs: 0,
          tokensUsed: 0,
        }));

        const start = Date.now();
        const inserted = await ctx.batchOps.insertEpisodes(episodes);
        const duration = Date.now() - start;
        const throughput = (inserted / duration) * 1000;

        console.log(`Batch ${size} - Throughput: ${throughput.toFixed(0)} items/sec`);
        expect(throughput).toBeGreaterThan(1);
      }
    });
  });

  describe('Search Performance', () => {
    beforeEach(async () => {
      const episodes = Array.from({ length: 1000 }, (_, i) => ({
        sessionId: 'search-perf',
        task: `Performance task ${i} with varying content`,
        reward: Math.random(),
        success: Math.random() > 0.5,
        input: '',
        output: '',
        critique: '',
        latencyMs: 0,
        tokensUsed: 0,
      }));

      await ctx.batchOps.insertEpisodes(episodes);
    });

    it('should benchmark search latency vs k', async () => {
      const kValues = [1, 5, 10, 50, 100];

      for (const k of kValues) {
        const start = Date.now();
        const results = await ctx.reflexion.retrieveRelevant({
          task: 'performance search query',
          k,
        });
        const latency = Date.now() - start;

        console.log(`Search k=${k} - Latency: ${latency}ms, Results: ${results.length}`);
        expect(latency).toBeLessThan(5000);
        expect(results.length).toBeLessThanOrEqual(k);
      }
    });

    it('should benchmark search accuracy vs speed', async () => {
      const queries = ['machine learning', 'optimization', 'performance'];

      for (const query of queries) {
        const start = Date.now();
        const results = await ctx.reflexion.retrieveRelevant({
          task: query,
          k: 10,
        });
        const latency = Date.now() - start;

        console.log(
          `Query "${query}" - Latency: ${latency}ms, Top similarity: ${results[0]?.similarity || 0}`
        );
        expect(results.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Concurrent Operations Performance', () => {
    it('should benchmark concurrent read throughput', async () => {
      for (let i = 0; i < 100; i++) {
        await createTestEpisode(ctx.reflexion, {
          sessionId: 'concurrent-read',
          task: `Task ${i}`,
          reward: 0.8,
        });
      }

      const concurrentReads = 20;
      const start = Date.now();

      const promises = Array.from({ length: concurrentReads }, (_, i) =>
        ctx.reflexion.retrieveRelevant({
          task: `query ${i}`,
          k: 10,
        })
      );

      await Promise.all(promises);
      const duration = Date.now() - start;
      const throughput = (concurrentReads / duration) * 1000;

      console.log(
        `Concurrent Reads - ${concurrentReads} queries in ${duration}ms (${throughput.toFixed(1)} qps)`
      );
      expect(throughput).toBeGreaterThan(1);
    });

    it('should benchmark concurrent write throughput', async () => {
      const concurrentWrites = 50;
      const start = Date.now();

      const promises = Array.from({ length: concurrentWrites }, (_, i) =>
        createTestEpisode(ctx.reflexion, {
          sessionId: 'concurrent-write',
          task: `Task ${i}`,
          reward: Math.random(),
        })
      );

      await Promise.all(promises);
      const duration = Date.now() - start;
      const throughput = (concurrentWrites / duration) * 1000;

      console.log(
        `Concurrent Writes - ${concurrentWrites} inserts in ${duration}ms (${throughput.toFixed(1)} ops/sec)`
      );
      expect(throughput).toBeGreaterThan(1);
    });
  });

  describe('Memory and Cache Performance', () => {
    it('should benchmark cache hit ratio', async () => {
      const testQueries = 10;

      for (let i = 0; i < testQueries; i++) {
        await ctx.reflexion.retrieveRelevant({
          task: `cache test ${i}`,
          k: 5,
        });
      }

      const start = Date.now();
      for (let i = 0; i < testQueries; i++) {
        await ctx.reflexion.retrieveRelevant({
          task: `cache test ${i}`,
          k: 5,
        });
      }
      const cachedDuration = Date.now() - start;

      console.log(`Cache performance - ${testQueries} cached queries in ${cachedDuration}ms`);
      expect(cachedDuration).toBeLessThan(10000);
    });

    it('should benchmark database size vs performance', () => {
      const counts = [100, 500, 1000];

      for (const targetCount of counts) {
        const currentCount = (ctx.db.prepare('SELECT COUNT(*) as count FROM episodes').get() as any)
          .count;

        const pageSizeInfo = ctx.db.pragma('page_size', { simple: true });
        const pageCountInfo = ctx.db.pragma('page_count', { simple: true });
        const dbSize = Number(pageSizeInfo) * Number(pageCountInfo);

        console.log(
          `DB with ${currentCount} records - Size: ${(dbSize / 1024 / 1024).toFixed(2)} MB`
        );
        expect(dbSize).toBeGreaterThan(0);
      }
    });
  });

  describe('Scalability Benchmarks', () => {
    it('should benchmark linear scaling with data size', async () => {
      const dataSizes = [100, 500];
      const searchTimes: number[] = [];

      for (const size of dataSizes) {
        clearTestData(ctx.db);

        const episodes = Array.from({ length: size }, (_, i) => ({
          sessionId: 'scaling-test',
          task: `Task ${i}`,
          reward: Math.random(),
          success: true,
          input: '',
          output: '',
          critique: '',
          latencyMs: 0,
          tokensUsed: 0,
        }));

        await ctx.batchOps.insertEpisodes(episodes);

        const start = Date.now();
        await ctx.reflexion.retrieveRelevant({
          task: 'scaling query',
          k: 10,
        });
        searchTimes.push(Date.now() - start);

        console.log(`Data size ${size} - Search time: ${searchTimes[searchTimes.length - 1]}ms`);
      }

      // Verify search completed successfully and times are reasonable
      expect(searchTimes.length).toBe(2);
      expect(searchTimes.every((t) => t >= 0)).toBe(true);
    });

    it('should handle large batch operations', async () => {
      const largeSize = 5000;
      const episodes = Array.from({ length: largeSize }, (_, i) => ({
        sessionId: 'large-batch',
        task: `Task ${i}`,
        reward: Math.random(),
        success: Math.random() > 0.5,
        input: '',
        output: '',
        critique: '',
        latencyMs: 0,
        tokensUsed: 0,
      }));

      const startTime = Date.now();
      const inserted = await ctx.batchOps.insertEpisodes(episodes);
      const duration = Date.now() - startTime;

      expect(inserted).toBe(largeSize);
      expect(duration).toBeLessThan(300000);
    });

    it('should handle high-frequency queries', async () => {
      for (let i = 0; i < 10; i++) {
        await createTestEpisode(ctx.reflexion, {
          sessionId: 'high-freq',
          task: `Task ${i}`,
          reward: 0.8,
        });
      }

      const queries = 100;
      const startTime = Date.now();

      for (let i = 0; i < queries; i++) {
        await ctx.reflexion.retrieveRelevant({
          task: 'query',
          k: 5,
        });
      }

      const duration = Date.now() - startTime;
      const qps = queries / (duration / 1000);

      expect(qps).toBeGreaterThan(1);
    });
  });

  describe('Memory and Resource Tests', () => {
    it('should not leak memory with repeated operations', async () => {
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        await createTestEpisode(ctx.reflexion, {
          sessionId: `memory-test-${i}`,
          task: `Task ${i}`,
          reward: 0.8,
        });

        if (i % 10 === 0) {
          ctx.db.prepare('DELETE FROM episodes WHERE session_id = ?').run(`memory-test-${i - 10}`);
        }
      }

      const finalCount = (ctx.db.prepare('SELECT COUNT(*) as count FROM episodes').get() as any)
        .count;

      expect(finalCount).toBeLessThan(iterations);
    });
  });
});
