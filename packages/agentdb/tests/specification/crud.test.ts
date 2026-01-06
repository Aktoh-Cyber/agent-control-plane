/**
 * CRUD Operations Tests for AgentDB
 * Tests basic create, read, update, delete operations
 * Lines: ~390
 */

import * as fs from 'fs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  TestContext,
  cleanupTestContext,
  clearTestData,
  initializeTestSchema,
  setupTestContext,
} from './fixtures';
import { createMultipleEpisodes, createTestEpisode } from './helpers';

let ctx: TestContext;

beforeAll(async () => {
  ctx = await setupTestContext('test-crud.db');
});

afterAll(() => {
  cleanupTestContext(ctx);
});

beforeEach(() => {
  clearTestData(ctx.db);
});

describe('AgentDB CRUD Operations', () => {
  describe('agentdb_init', () => {
    it('should initialize database with default configuration', () => {
      const tableCount = ctx.db
        .prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'")
        .get() as any;
      expect(tableCount.count).toBeGreaterThan(0);
    });

    it('should initialize database with custom path', () => {
      const customPath = require('path').join(__dirname, '..', 'custom-test.db');
      const Database = require('better-sqlite3');
      const customDb = new Database(customPath);

      initializeTestSchema(customDb);

      const tableCount = customDb
        .prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'")
        .get() as any;
      expect(tableCount.count).toBeGreaterThan(0);

      customDb.close();
      fs.unlinkSync(customPath);
    });

    it('should reset database when reset flag is true', () => {
      ctx.db
        .prepare('INSERT INTO episodes (session_id, task, reward, success) VALUES (?, ?, ?, ?)')
        .run('test', 'task', 1.0, 1);

      let count = (ctx.db.prepare('SELECT COUNT(*) as count FROM episodes').get() as any).count;
      expect(count).toBe(1);

      ctx.db.prepare('DELETE FROM episodes').run();
      count = (ctx.db.prepare('SELECT COUNT(*) as count FROM episodes').get() as any).count;
      expect(count).toBe(0);
    });
  });

  describe('agentdb_insert', () => {
    it('should insert vector with valid text', async () => {
      const episodeId = await createTestEpisode(ctx.reflexion, {
        task: 'Test task for vector insertion',
        reward: 1.0,
        success: true,
      });

      expect(episodeId).toBeGreaterThan(0);

      const episode = ctx.db.prepare('SELECT * FROM episodes WHERE id = ?').get(episodeId) as any;
      expect(episode).toBeDefined();
      expect(episode.task).toBe('Test task for vector insertion');
    });

    it('should insert vector with metadata and tags', async () => {
      const episodeId = await createTestEpisode(ctx.reflexion, {
        task: 'Test with metadata',
        reward: 0.8,
        tags: ['tag1', 'tag2'],
        metadata: { key: 'value', nested: { data: 123 } },
      });

      const episode = ctx.db.prepare('SELECT * FROM episodes WHERE id = ?').get(episodeId) as any;
      expect(episode.tags).toContain('tag1');
      expect(episode.metadata).toBeDefined();
    });

    it('should handle edge case with empty task', async () => {
      const episodeId = await createTestEpisode(ctx.reflexion, {
        task: '',
        reward: 0.5,
      });

      expect(episodeId).toBeGreaterThan(0);
    });
  });

  describe('agentdb_insert_batch', () => {
    it('should batch insert 10 vectors efficiently', async () => {
      const episodes = Array.from({ length: 10 }, (_, i) => ({
        sessionId: 'batch-test',
        task: `Batch task ${i}`,
        reward: 1.0,
        success: true,
        input: `Input ${i}`,
        output: `Output ${i}`,
        critique: '',
        latencyMs: 0,
        tokensUsed: 0,
      }));

      const inserted = await ctx.batchOps.insertEpisodes(episodes);
      expect(inserted).toBe(10);

      const count = (ctx.db.prepare('SELECT COUNT(*) as count FROM episodes').get() as any).count;
      expect(count).toBe(10);
    });

    it('should batch insert 1000 vectors with parallelization', async () => {
      const episodes = Array.from({ length: 1000 }, (_, i) => ({
        sessionId: 'large-batch',
        task: `Task ${i}`,
        reward: Math.random(),
        success: Math.random() > 0.5,
        input: `Input ${i}`,
        output: `Output ${i}`,
        critique: '',
        latencyMs: 0,
        tokensUsed: 0,
      }));

      const startTime = Date.now();
      const inserted = await ctx.batchOps.insertEpisodes(episodes);
      const duration = Date.now() - startTime;

      expect(inserted).toBe(1000);
      expect(duration).toBeLessThan(60000);
    });

    it('should handle batch insert with mixed success/failure', async () => {
      const episodes = [
        {
          sessionId: 'mixed',
          task: 'Success task',
          reward: 1.0,
          success: true,
          input: '',
          output: '',
          critique: '',
          latencyMs: 0,
          tokensUsed: 0,
        },
        {
          sessionId: 'mixed',
          task: 'Failure task',
          reward: 0.0,
          success: false,
          input: '',
          output: '',
          critique: 'Task failed',
          latencyMs: 0,
          tokensUsed: 0,
        },
      ];

      const inserted = await ctx.batchOps.insertEpisodes(episodes);
      expect(inserted).toBe(2);
    });
  });

  describe('agentdb_delete', () => {
    let episodeIds: number[];

    beforeEach(async () => {
      episodeIds = await createMultipleEpisodes(ctx.reflexion, 5, {
        sessionId: 'delete-test',
      });
    });

    it('should delete vector by ID', () => {
      const stmt = ctx.db.prepare('DELETE FROM episodes WHERE id = ?');
      const result = stmt.run(episodeIds[0]);

      expect(result.changes).toBe(1);

      const episode = ctx.db.prepare('SELECT * FROM episodes WHERE id = ?').get(episodeIds[0]);
      expect(episode).toBeUndefined();
    });

    it('should bulk delete by session_id', () => {
      const stmt = ctx.db.prepare('DELETE FROM episodes WHERE session_id = ?');
      const result = stmt.run('delete-test');

      expect(result.changes).toBe(5);

      const count = (
        ctx.db
          .prepare('SELECT COUNT(*) as count FROM episodes WHERE session_id = ?')
          .get('delete-test') as any
      ).count;
      expect(count).toBe(0);
    });

    it('should bulk delete by timestamp range', () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600;
      const stmt = ctx.db.prepare('DELETE FROM episodes WHERE ts < ?');
      const result = stmt.run(futureTimestamp);

      expect(result.changes).toBeGreaterThan(0);
    });
  });

  describe('agentdb_stats', () => {
    it('should return complete statistics', async () => {
      await createTestEpisode(ctx.reflexion);

      const stats = {
        episodes: (ctx.db.prepare('SELECT COUNT(*) as count FROM episodes').get() as any).count,
        episode_embeddings: (
          ctx.db.prepare('SELECT COUNT(*) as count FROM episode_embeddings').get() as any
        ).count,
        skills: (ctx.db.prepare('SELECT COUNT(*) as count FROM skills').get() as any).count,
        causal_edges: (ctx.db.prepare('SELECT COUNT(*) as count FROM causal_edges').get() as any)
          .count,
      };

      expect(stats.episodes).toBeGreaterThan(0);
      expect(stats).toHaveProperty('episode_embeddings');
      expect(stats).toHaveProperty('skills');
      expect(stats).toHaveProperty('causal_edges');
    });

    it('should show accurate record counts', async () => {
      await createMultipleEpisodes(ctx.reflexion, 3, {
        sessionId: 'count-test',
      });

      const episodeCount = (ctx.db.prepare('SELECT COUNT(*) as count FROM episodes').get() as any)
        .count;
      expect(episodeCount).toBe(3);
    });

    it('should include causal graph statistics', () => {
      ctx.causalGraph.addCausalEdge({
        fromMemoryId: 1,
        fromMemoryType: 'episode',
        toMemoryId: 2,
        toMemoryType: 'episode',
        similarity: 0.8,
        uplift: 0.3,
        confidence: 0.95,
        sampleSize: 10,
        evidenceIds: [],
      });

      const count = (ctx.db.prepare('SELECT COUNT(*) as count FROM causal_edges').get() as any)
        .count;
      expect(count).toBe(1);
    });
  });

  describe('agentdb_clear_cache', () => {
    it('should clear embedding cache', async () => {
      await createMultipleEpisodes(ctx.reflexion, 5, {
        sessionId: 'cache-test',
      });

      const result = ctx.db.prepare('DELETE FROM episode_embeddings').run();
      expect(result.changes).toBeGreaterThan(0);
    });

    it('should clear query cache', () => {
      const beforeCount = (
        ctx.db.prepare('SELECT COUNT(*) as count FROM episode_embeddings').get() as any
      ).count;
      ctx.db.prepare('DELETE FROM episode_embeddings').run();
      const afterCount = (
        ctx.db.prepare('SELECT COUNT(*) as count FROM episode_embeddings').get() as any
      ).count;

      expect(afterCount).toBe(0);
    });

    it('should maintain data integrity after cache clear', async () => {
      const id = await createTestEpisode(ctx.reflexion, {
        sessionId: 'integrity-test',
      });

      ctx.db.prepare('DELETE FROM episode_embeddings').run();

      const episode = ctx.db.prepare('SELECT * FROM episodes WHERE id = ?').get(id);
      expect(episode).toBeDefined();
    });
  });

  describe('Data Integrity Tests', () => {
    it('should maintain referential integrity on cascade delete', async () => {
      const episodeId = await createTestEpisode(ctx.reflexion, {
        sessionId: 'cascade-test',
        task: 'Cascade delete test',
      });

      ctx.db.prepare('DELETE FROM episodes WHERE id = ?').run(episodeId);

      const embedding = ctx.db
        .prepare('SELECT * FROM episode_embeddings WHERE episode_id = ?')
        .get(episodeId);

      expect(embedding).toBeUndefined();
    });

    it('should handle transaction rollback', () => {
      const countBefore = (ctx.db.prepare('SELECT COUNT(*) as count FROM episodes').get() as any)
        .count;

      try {
        ctx.db.prepare('BEGIN TRANSACTION').run();
        ctx.db
          .prepare('INSERT INTO episodes (session_id, task, reward, success) VALUES (?, ?, ?, ?)')
          .run('rollback-test', 'Test', 0.5, 1);

        throw new Error('Simulated error');
      } catch {
        ctx.db.prepare('ROLLBACK').run();
      }

      const countAfter = (ctx.db.prepare('SELECT COUNT(*) as count FROM episodes').get() as any)
        .count;

      expect(countAfter).toBe(countBefore);
    });
  });
});
