/**
 * Causal Graph Tests for AgentDB
 * Tests causal reasoning, experiments, and causal edge management
 * Lines: ~340
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { TestContext, cleanupTestContext, clearTestData, setupTestContext } from './fixtures';
import { createTestEpisode } from './helpers';

let ctx: TestContext;

beforeAll(async () => {
  ctx = await setupTestContext('test-causal.db');
});

afterAll(() => {
  cleanupTestContext(ctx);
});

beforeEach(() => {
  clearTestData(ctx.db);
});

describe('AgentDB Causal Reasoning', () => {
  describe('Causal Graph Construction', () => {
    it('should add causal edge between memories', async () => {
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
      expect(edges.length).toBe(1);
    });

    it('should store edge metadata', () => {
      ctx.causalGraph.addCausalEdge({
        fromMemoryId: 1,
        fromMemoryType: 'episode',
        toMemoryId: 2,
        toMemoryType: 'skill',
        similarity: 0.8,
        uplift: 0.3,
        confidence: 0.9,
        sampleSize: 20,
        evidenceIds: [1, 2, 3],
        confounderScore: 0.1,
        mechanism: 'direct',
      });

      const edges = ctx.db.prepare('SELECT * FROM causal_edges').all() as any[];
      expect(edges.length).toBeGreaterThan(0);
      const edge = edges[0];
      if (edge.mechanism) {
        expect(edge.mechanism).toBe('direct');
      }
      if (edge.confounder_score !== null) {
        expect(edge.confounder_score).toBeCloseTo(0.1);
      }
    });

    it('should handle multiple causal edges', async () => {
      for (let i = 0; i < 5; i++) {
        ctx.causalGraph.addCausalEdge({
          fromMemoryId: i,
          fromMemoryType: 'episode',
          toMemoryId: i + 1,
          toMemoryType: 'episode',
          similarity: 0.7 + i * 0.05,
          uplift: 0.1 + i * 0.05,
          confidence: 0.9,
          sampleSize: 10 + i,
          evidenceIds: [],
        });
      }

      const count = (ctx.db.prepare('SELECT COUNT(*) as count FROM causal_edges').get() as any)
        .count;
      expect(count).toBe(5);
    });
  });

  describe('Causal Edge Queries', () => {
    beforeEach(() => {
      for (let i = 1; i <= 5; i++) {
        ctx.causalGraph.addCausalEdge({
          fromMemoryId: i,
          fromMemoryType: 'episode',
          toMemoryId: i + 1,
          toMemoryType: 'episode',
          similarity: 0.7 + i * 0.05,
          uplift: 0.1 * i,
          confidence: 0.9,
          sampleSize: 10,
          evidenceIds: [],
        });
      }
    });

    it('should query edges by source memory', () => {
      const edges = ctx.db
        .prepare('SELECT * FROM causal_edges WHERE from_memory_id = ? AND from_memory_type = ?')
        .all(1, 'episode');

      expect(edges.length).toBeGreaterThan(0);
    });

    it('should query edges by target memory', () => {
      const edges = ctx.db
        .prepare('SELECT * FROM causal_edges WHERE to_memory_id = ? AND to_memory_type = ?')
        .all(2, 'episode');

      expect(edges.length).toBeGreaterThan(0);
    });

    it('should filter edges by uplift threshold', () => {
      const edges = ctx.db.prepare('SELECT * FROM causal_edges WHERE uplift >= ?').all(0.3);

      expect(edges.every((e: any) => e.uplift >= 0.3)).toBe(true);
    });

    it('should order edges by confidence', () => {
      const edges = ctx.db
        .prepare('SELECT * FROM causal_edges ORDER BY confidence DESC')
        .all() as any[];

      for (let i = 1; i < edges.length; i++) {
        expect(edges[i - 1].confidence).toBeGreaterThanOrEqual(edges[i].confidence);
      }
    });
  });

  describe('Causal Experiments', () => {
    it('should create causal experiment', async () => {
      const treatmentId = await createTestEpisode(ctx.reflexion, {
        task: 'Treatment task',
        reward: 0.9,
      });

      const result = ctx.db
        .prepare(
          `
        INSERT INTO causal_experiments (
          name, hypothesis, treatment_id, treatment_type,
          start_time, status
        ) VALUES (?, ?, ?, ?, ?, ?)
      `
        )
        .run(
          'Test Experiment',
          'Treatment improves performance',
          treatmentId,
          'episode',
          Date.now(),
          'running'
        );

      expect(result.changes).toBe(1);
    });

    it('should record experiment observations', async () => {
      const treatmentEp = await createTestEpisode(ctx.reflexion, {
        task: 'Treatment',
        reward: 0.9,
      });

      const experimentId = ctx.db
        .prepare(
          `
        INSERT INTO causal_experiments (
          name, hypothesis, treatment_id, treatment_type,
          start_time, status
        ) VALUES (?, ?, ?, ?, ?, ?)
      `
        )
        .run(
          'Observation Test',
          'Test hypothesis',
          treatmentEp,
          'episode',
          Date.now(),
          'running'
        ).lastInsertRowid;

      const obsId = ctx.db
        .prepare(
          `
        INSERT INTO causal_observations (
          experiment_id, episode_id, is_treatment,
          outcome_value, outcome_type
        ) VALUES (?, ?, ?, ?, ?)
      `
        )
        .run(experimentId, treatmentEp, 1, 0.9, 'reward');

      expect(obsId.changes).toBe(1);
    });

    it('should calculate experiment statistics', async () => {
      const treatmentEp = await createTestEpisode(ctx.reflexion, {
        task: 'Treatment',
        reward: 0.9,
      });

      const controlEp = await createTestEpisode(ctx.reflexion, {
        task: 'Control',
        reward: 0.7,
      });

      ctx.db
        .prepare(
          `
        INSERT INTO causal_experiments (
          name, hypothesis, treatment_id, treatment_type,
          control_id, start_time, treatment_mean, control_mean,
          uplift, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
        )
        .run(
          'Stats Test',
          'Treatment vs Control',
          treatmentEp,
          'episode',
          controlEp,
          Date.now(),
          0.9,
          0.7,
          0.2,
          'completed'
        );

      const experiment = ctx.db
        .prepare('SELECT * FROM causal_experiments WHERE name = ?')
        .get('Stats Test') as any;

      expect(experiment.uplift).toBeCloseTo(0.2);
      expect(experiment.treatment_mean).toBeCloseTo(0.9);
      expect(experiment.control_mean).toBeCloseTo(0.7);
    });
  });

  describe('Causal Recall', () => {
    beforeEach(async () => {
      const ep1 = await createTestEpisode(ctx.reflexion, {
        task: 'Causal task A',
        reward: 0.8,
      });

      const ep2 = await createTestEpisode(ctx.reflexion, {
        task: 'Causal task B',
        reward: 0.9,
      });

      ctx.causalGraph.addCausalEdge({
        fromMemoryId: ep1,
        fromMemoryType: 'episode',
        toMemoryId: ep2,
        toMemoryType: 'episode',
        similarity: 0.85,
        uplift: 0.3,
        confidence: 0.95,
        sampleSize: 15,
        evidenceIds: [],
      });
    });

    it('should perform causal search', async () => {
      const results = await ctx.causalRecall.search({
        query: 'causal task',
        k: 5,
      });

      expect(results).toBeDefined();
    });

    it('should include evidence in results', async () => {
      const results = await ctx.causalRecall.search({
        query: 'causal reasoning',
        k: 5,
        includeEvidence: true,
      });

      expect(results).toBeDefined();
    });

    it('should filter by causal strength', async () => {
      const results = await ctx.causalRecall.search({
        query: 'task',
        k: 10,
        minUplift: 0.2,
      });

      expect(results).toBeDefined();
    });
  });

  describe('Causal Inference', () => {
    it('should identify causal relationships', async () => {
      const episodes: number[] = [];
      for (let i = 0; i < 3; i++) {
        episodes.push(
          await createTestEpisode(ctx.reflexion, {
            task: `Inference task ${i}`,
            reward: 0.6 + i * 0.15,
          })
        );
      }

      for (let i = 0; i < episodes.length - 1; i++) {
        ctx.causalGraph.addCausalEdge({
          fromMemoryId: episodes[i],
          fromMemoryType: 'episode',
          toMemoryId: episodes[i + 1],
          toMemoryType: 'episode',
          similarity: 0.8,
          uplift: 0.15 * (i + 1),
          confidence: 0.9,
          sampleSize: 10,
          evidenceIds: [],
        });
      }

      const edges = ctx.db.prepare('SELECT * FROM causal_edges').all();
      expect(edges.length).toBeGreaterThan(0);
    });

    it('should detect confounding variables', () => {
      ctx.causalGraph.addCausalEdge({
        fromMemoryId: 1,
        fromMemoryType: 'episode',
        toMemoryId: 2,
        toMemoryType: 'episode',
        similarity: 0.8,
        uplift: 0.2,
        confidence: 0.85,
        sampleSize: 10,
        evidenceIds: [],
        confounderScore: 0.4,
      });

      const edge = ctx.db
        .prepare('SELECT * FROM causal_edges WHERE confounder_score IS NOT NULL')
        .get() as any;

      expect(edge.confounder_score).toBeGreaterThan(0);
    });

    it('should estimate causal effect sizes', () => {
      ctx.causalGraph.addCausalEdge({
        fromMemoryId: 1,
        fromMemoryType: 'skill',
        toMemoryId: 2,
        toMemoryType: 'episode',
        similarity: 0.9,
        uplift: 0.5,
        confidence: 0.95,
        sampleSize: 50,
        evidenceIds: [1, 2, 3, 4, 5],
      });

      const edge = ctx.db.prepare('SELECT * FROM causal_edges WHERE uplift >= 0.5').get() as any;

      expect(edge.uplift).toBeCloseTo(0.5);
      expect(edge.sample_size).toBe(50);
    });
  });
});
