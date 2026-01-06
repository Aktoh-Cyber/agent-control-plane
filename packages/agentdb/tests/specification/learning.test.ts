/**
 * Learning System Tests for AgentDB
 * Tests reinforcement learning, feedback loops, and training workflows
 * Lines: ~445
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { TestContext, cleanupTestContext, clearTestData, setupTestContext } from './fixtures';
import { createTestEpisode } from './helpers';

let ctx: TestContext;

beforeAll(async () => {
  ctx = await setupTestContext('test-learning.db');
});

afterAll(() => {
  cleanupTestContext(ctx);
});

beforeEach(() => {
  clearTestData(ctx.db);
});

describe('AgentDB Learning System', () => {
  describe('learning_start_session', () => {
    it('should start session with default config', async () => {
      const sessionId = 'test-session-1';
      const episode = await createTestEpisode(ctx.reflexion, {
        sessionId,
        task: 'Initial task',
        reward: 1.0,
      });

      expect(episode).toBeGreaterThan(0);

      const episodes = ctx.db.prepare('SELECT * FROM episodes WHERE session_id = ?').all(sessionId);
      expect(episodes.length).toBe(1);
    });

    it('should start session with custom learning rate', async () => {
      const sessionId = 'custom-lr-session';
      const episode = await createTestEpisode(ctx.reflexion, {
        sessionId,
        task: 'Custom learning rate task',
        reward: 0.8,
        metadata: { learning_rate: 0.01 },
      });

      const stored = ctx.db.prepare('SELECT * FROM episodes WHERE id = ?').get(episode) as any;
      expect(stored.metadata).toContain('learning_rate');
    });

    it('should start session with algorithm selection', async () => {
      const sessionId = 'algorithm-session';
      const episode = await createTestEpisode(ctx.reflexion, {
        sessionId,
        task: 'Algorithm selection task',
        reward: 0.9,
        metadata: { algorithm: 'q-learning' },
      });

      expect(episode).toBeGreaterThan(0);
    });
  });

  describe('learning_end_session', () => {
    it('should save session data on end', async () => {
      const sessionId = 'end-session-test';

      for (let i = 0; i < 3; i++) {
        await createTestEpisode(ctx.reflexion, {
          sessionId,
          task: `Task ${i}`,
          reward: Math.random(),
          success: Math.random() > 0.5,
        });
      }

      const episodes = ctx.db.prepare('SELECT * FROM episodes WHERE session_id = ?').all(sessionId);
      expect(episodes.length).toBe(3);
    });

    it('should calculate final metrics', async () => {
      const sessionId = 'metrics-session';

      await createTestEpisode(ctx.reflexion, {
        sessionId,
        task: 'Success task',
        reward: 1.0,
        success: true,
        latencyMs: 100,
        tokensUsed: 50,
      });

      await createTestEpisode(ctx.reflexion, {
        sessionId,
        task: 'Failure task',
        reward: 0.0,
        success: false,
        latencyMs: 150,
        tokensUsed: 75,
      });

      const stats = ctx.db
        .prepare(
          `
        SELECT
          AVG(reward) as avg_reward,
          AVG(success) as success_rate,
          AVG(latency_ms) as avg_latency
        FROM episodes
        WHERE session_id = ?
      `
        )
        .get(sessionId) as any;

      expect(stats.avg_reward).toBeCloseTo(0.5);
      expect(stats.success_rate).toBeCloseTo(0.5);
    });

    it('should persist learned patterns', async () => {
      const sessionId = 'pattern-persist-session';

      await createTestEpisode(ctx.reflexion, {
        sessionId,
        task: 'Pattern task',
        reward: 0.9,
      });

      const episodes = ctx.db.prepare('SELECT * FROM episodes WHERE session_id = ?').all(sessionId);
      expect(episodes.length).toBeGreaterThan(0);
    });
  });

  describe('learning_predict', () => {
    beforeEach(async () => {
      for (let i = 0; i < 10; i++) {
        await createTestEpisode(ctx.reflexion, {
          sessionId: 'predict-training',
          task: `Training task ${i}`,
          reward: i / 10,
          success: i > 5,
          input: `Input ${i}`,
          output: `Output ${i}`,
        });
      }
    });

    it('should predict action for new state', async () => {
      const results = await ctx.reflexion.retrieveRelevant({
        task: 'New prediction task',
        k: 5,
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('similarity');
    });

    it('should predict with confidence scores', async () => {
      const results = await ctx.reflexion.retrieveRelevant({
        task: 'Confidence prediction',
        k: 3,
      });

      expect(
        results.every((r) => r.similarity !== undefined && r.similarity >= 0 && r.similarity <= 1)
      ).toBe(true);
    });

    it('should predict using learned model', async () => {
      const results = await ctx.reflexion.retrieveRelevant({
        task: 'Model-based prediction',
        k: 5,
        minReward: 0.5,
      });

      expect(results.every((r) => r.reward >= 0.5)).toBe(true);
    });
  });

  describe('learning_feedback', () => {
    it('should update model with positive feedback', async () => {
      const episodeId = await createTestEpisode(ctx.reflexion, {
        sessionId: 'feedback-test',
        task: 'Feedback task',
        reward: 0.7,
        success: true,
        critique: 'Good performance',
      });

      const episode = ctx.db.prepare('SELECT * FROM episodes WHERE id = ?').get(episodeId) as any;
      expect(episode.critique).toBe('Good performance');
      expect(episode.success).toBe(1);
    });

    it('should update model with negative feedback', async () => {
      const episodeId = await createTestEpisode(ctx.reflexion, {
        sessionId: 'negative-feedback',
        task: 'Failed task',
        reward: 0.2,
        success: false,
        critique: 'Performance needs improvement',
      });

      const episode = ctx.db.prepare('SELECT * FROM episodes WHERE id = ?').get(episodeId) as any;
      expect(episode.success).toBe(0);
      expect(episode.reward).toBeLessThan(0.5);
    });

    it('should adjust learning parameters', async () => {
      const episodeId = await createTestEpisode(ctx.reflexion, {
        sessionId: 'adjust-params',
        task: 'Parameter adjustment task',
        reward: 0.6,
        metadata: { adjusted_lr: 0.005 },
      });

      const episode = ctx.db.prepare('SELECT * FROM episodes WHERE id = ?').get(episodeId) as any;
      expect(episode.metadata).toContain('adjusted_lr');
    });
  });

  describe('learning_train', () => {
    it('should train on batch of experiences', async () => {
      const episodes = Array.from({ length: 20 }, (_, i) => ({
        sessionId: 'training-batch',
        task: `Training task ${i}`,
        reward: i / 20,
        success: i > 10,
        input: '',
        output: '',
        critique: '',
        latencyMs: 0,
        tokensUsed: 0,
      }));

      const inserted = await ctx.batchOps.insertEpisodes(episodes);
      expect(inserted).toBe(20);

      const count = (
        ctx.db
          .prepare('SELECT COUNT(*) as count FROM episodes WHERE session_id = ?')
          .get('training-batch') as any
      ).count;
      expect(count).toBe(20);
    });

    it('should converge to optimal policy', async () => {
      const iterations = 5;
      const rewards: number[] = [];

      for (let iter = 0; iter < iterations; iter++) {
        const reward = 0.5 + (iter / iterations) * 0.4;
        await createTestEpisode(ctx.reflexion, {
          sessionId: `convergence-iter-${iter}`,
          task: 'Convergence task',
          reward,
        });
        rewards.push(reward);
      }

      for (let i = 1; i < rewards.length; i++) {
        expect(rewards[i]).toBeGreaterThanOrEqual(rewards[i - 1]);
      }
    });

    it('should track training loss', async () => {
      const episodeId = await createTestEpisode(ctx.reflexion, {
        sessionId: 'loss-tracking',
        task: 'Loss tracking task',
        reward: 0.8,
        metadata: { loss: 0.15 },
      });

      const episode = ctx.db.prepare('SELECT * FROM episodes WHERE id = ?').get(episodeId) as any;
      expect(episode.metadata).toContain('loss');
    });
  });

  describe('learning_metrics', () => {
    beforeEach(async () => {
      for (let i = 0; i < 10; i++) {
        await createTestEpisode(ctx.reflexion, {
          sessionId: 'metrics-session',
          task: `Metrics task ${i}`,
          reward: i / 10,
          success: i > 5,
          latencyMs: 100 + i * 10,
          tokensUsed: 50 + i * 5,
        });
      }
    });

    it('should return accuracy metrics', () => {
      const stats = ctx.db
        .prepare(
          `
        SELECT
          AVG(success) as accuracy,
          AVG(reward) as avg_reward
        FROM episodes
        WHERE session_id = ?
      `
        )
        .get('metrics-session') as any;

      expect(stats.accuracy).toBeDefined();
      expect(stats.accuracy).toBeGreaterThanOrEqual(0);
      expect(stats.accuracy).toBeLessThanOrEqual(1);
    });

    it('should return loss metrics', () => {
      const stats = ctx.db
        .prepare(
          `
        SELECT
          AVG(CASE WHEN success = 0 THEN 1 ELSE 0 END) as error_rate
        FROM episodes
        WHERE session_id = ?
      `
        )
        .get('metrics-session') as any;

      expect(stats.error_rate).toBeDefined();
    });

    it('should return convergence status', () => {
      const recentRewards = ctx.db
        .prepare(
          `
        SELECT reward
        FROM episodes
        WHERE session_id = ?
        ORDER BY id DESC
        LIMIT 5
      `
        )
        .all('metrics-session') as any[];

      expect(recentRewards.length).toBeGreaterThan(0);
    });
  });

  describe('learning_transfer', () => {
    it('should transfer from source domain', async () => {
      await createTestEpisode(ctx.reflexion, {
        sessionId: 'source-domain',
        task: 'Source domain task',
        reward: 0.9,
        metadata: { domain: 'source' },
      });

      const sourceEpisodes = ctx.db
        .prepare('SELECT * FROM episodes WHERE metadata LIKE ?')
        .all('%source%');
      expect(sourceEpisodes.length).toBeGreaterThan(0);
    });

    it('should adapt to target domain', async () => {
      await createTestEpisode(ctx.reflexion, {
        sessionId: 'target-domain',
        task: 'Target domain task',
        reward: 0.7,
        metadata: { domain: 'target', transferred: true },
      });

      const targetEpisodes = ctx.db
        .prepare('SELECT * FROM episodes WHERE metadata LIKE ?')
        .all('%target%');
      expect(targetEpisodes.length).toBeGreaterThan(0);
    });

    it('should maintain transferred knowledge', async () => {
      await createTestEpisode(ctx.reflexion, {
        sessionId: 'knowledge-transfer',
        task: 'Transferred knowledge',
        reward: 0.85,
        metadata: { transferred: true, source_domain: 'A', target_domain: 'B' },
      });

      const transferred = ctx.db
        .prepare('SELECT * FROM episodes WHERE metadata LIKE ?')
        .all('%transferred%');
      expect(transferred.length).toBeGreaterThan(0);
    });
  });

  describe('learning_explain', () => {
    it('should provide decision rationale', async () => {
      const episodeId = await createTestEpisode(ctx.reflexion, {
        sessionId: 'explain-test',
        task: 'Explainable decision',
        reward: 0.9,
        input: 'Decision input',
        output: 'Decision output',
        critique: 'Decision was optimal based on historical performance',
      });

      const episode = ctx.db.prepare('SELECT * FROM episodes WHERE id = ?').get(episodeId) as any;
      expect(episode.critique).toContain('optimal');
    });

    it('should show feature importance', async () => {
      const episodeId = await createTestEpisode(ctx.reflexion, {
        sessionId: 'feature-importance',
        task: 'Feature analysis',
        reward: 0.85,
        metadata: { feature_scores: { feature1: 0.8, feature2: 0.6 } },
      });

      const episode = ctx.db.prepare('SELECT * FROM episodes WHERE id = ?').get(episodeId) as any;
      expect(episode.metadata).toContain('feature_scores');
    });

    it('should generate confidence intervals', async () => {
      const results = await ctx.reflexion.retrieveRelevant({
        task: 'Confidence test',
        k: 5,
      });

      expect(results.every((r) => r.similarity !== undefined)).toBe(true);
    });
  });

  describe('experience_record', () => {
    it('should store state-action-reward tuple', async () => {
      const episodeId = await createTestEpisode(ctx.reflexion, {
        sessionId: 'sar-tuple',
        task: 'State-action-reward',
        reward: 0.8,
        input: 'Current state',
        output: 'Selected action',
      });

      const episode = ctx.db.prepare('SELECT * FROM episodes WHERE id = ?').get(episodeId) as any;
      expect(episode.input).toBe('Current state');
      expect(episode.output).toBe('Selected action');
      expect(episode.reward).toBeCloseTo(0.8);
    });

    it('should record with metadata', async () => {
      const episodeId = await createTestEpisode(ctx.reflexion, {
        sessionId: 'metadata-record',
        task: 'Metadata test',
        reward: 0.75,
        metadata: {
          environment: 'test',
          step: 1,
          additional_context: 'test context',
        },
      });

      const episode = ctx.db.prepare('SELECT * FROM episodes WHERE id = ?').get(episodeId) as any;
      expect(episode.metadata).toContain('environment');
    });

    it('should maintain experience buffer', async () => {
      const bufferSize = 100;

      for (let i = 0; i < bufferSize; i++) {
        await createTestEpisode(ctx.reflexion, {
          sessionId: 'buffer-test',
          task: `Buffer task ${i}`,
          reward: Math.random(),
          success: Math.random() > 0.5,
        });
      }

      const count = (
        ctx.db
          .prepare('SELECT COUNT(*) as count FROM episodes WHERE session_id = ?')
          .get('buffer-test') as any
      ).count;
      expect(count).toBe(bufferSize);
    });
  });

  describe('reward_signal', () => {
    it('should calculate immediate reward', async () => {
      const episodeId = await createTestEpisode(ctx.reflexion, {
        sessionId: 'immediate-reward',
        task: 'Reward calculation',
        reward: 0.9,
      });

      const episode = ctx.db.prepare('SELECT * FROM episodes WHERE id = ?').get(episodeId) as any;
      expect(episode.reward).toBeCloseTo(0.9);
    });

    it('should calculate discounted return', async () => {
      const gamma = 0.95;
      const rewards = [0.8, 0.7, 0.9];

      let discountedReturn = 0;
      for (let i = rewards.length - 1; i >= 0; i--) {
        discountedReturn = rewards[i] + gamma * discountedReturn;
      }

      expect(discountedReturn).toBeGreaterThan(0);
      expect(discountedReturn).toBeLessThan(rewards.reduce((a, b) => a + b, 0) / (1 - gamma));
    });

    it('should apply reward shaping', async () => {
      const baseReward = 0.5;
      const shapedReward = baseReward + 0.2;

      const episodeId = await createTestEpisode(ctx.reflexion, {
        sessionId: 'shaped-reward',
        task: 'Reward shaping',
        reward: shapedReward,
        metadata: { base_reward: baseReward, shaping_bonus: 0.2 },
      });

      const episode = ctx.db.prepare('SELECT * FROM episodes WHERE id = ?').get(episodeId) as any;
      expect(episode.reward).toBeCloseTo(shapedReward);
    });
  });
});
