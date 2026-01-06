/**
 * Shared Test Helper Functions
 * Provides utilities for creating test data and common test operations
 */

import { ReflexionMemory } from '../../src/controllers/ReflexionMemory';
import { SkillLibrary } from '../../src/controllers/SkillLibrary';

export interface EpisodeData {
  sessionId: string;
  task: string;
  reward: number;
  success: boolean;
  input?: string;
  output?: string;
  critique?: string;
  latencyMs?: number;
  tokensUsed?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface SkillData {
  name: string;
  description: string;
  signature?: Record<string, any>;
  code?: string;
  successRate?: number;
  uses?: number;
  avgReward?: number;
  avgLatencyMs?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export async function createTestEpisode(
  reflexion: ReflexionMemory,
  data: Partial<EpisodeData> = {}
): Promise<number> {
  const defaults: EpisodeData = {
    sessionId: 'test-session',
    task: 'Test task',
    reward: 0.8,
    success: true,
    input: '',
    output: '',
    critique: '',
    latencyMs: 0,
    tokensUsed: 0,
  };

  return reflexion.storeEpisode({ ...defaults, ...data });
}

export async function createTestSkill(
  skills: SkillLibrary,
  data: Partial<SkillData> = {}
): Promise<number> {
  const defaults: SkillData = {
    name: `test-skill-${Date.now()}`,
    description: 'Test skill',
    signature: { inputs: {}, outputs: {} },
    code: '',
    successRate: 0.8,
    uses: 0,
    avgReward: 0.7,
    avgLatencyMs: 0,
  };

  return skills.createSkill({ ...defaults, ...data });
}

export async function createMultipleEpisodes(
  reflexion: ReflexionMemory,
  count: number,
  baseData: Partial<EpisodeData> = {}
): Promise<number[]> {
  const ids: number[] = [];

  for (let i = 0; i < count; i++) {
    const id = await createTestEpisode(reflexion, {
      ...baseData,
      task: baseData.task ? `${baseData.task} ${i}` : `Test task ${i}`,
    });
    ids.push(id);
  }

  return ids;
}

export function generateRandomReward(): number {
  return Math.random();
}

export function generateRandomSuccess(): boolean {
  return Math.random() > 0.5;
}

export function calculateAverage(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function calculatePercentile(values: number[], percentile: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.floor(sorted.length * percentile);
  return sorted[index];
}

export function measureLatency<T>(fn: () => Promise<T>): Promise<{ result: T; latency: number }> {
  return new Promise(async (resolve) => {
    const start = Date.now();
    const result = await fn();
    const latency = Date.now() - start;
    resolve({ result, latency });
  });
}
