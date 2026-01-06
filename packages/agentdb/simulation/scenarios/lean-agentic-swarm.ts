/**
 * Lean-Agentic Swarm Simulation
 *
 * Tests using lean-agentic npm package for lightweight agent orchestration
 */

import * as path from 'path';
import { EmbeddingService } from '../../src/controllers/EmbeddingService.js';
import { ReflexionMemory } from '../../src/controllers/ReflexionMemory.js';
import { SkillLibrary } from '../../src/controllers/SkillLibrary.js';
import { createUnifiedDatabase } from '../../src/db-unified.js';

export default {
  description: 'Lean-agentic lightweight swarm with minimal overhead',

  async run(config: any) {
    const { verbosity = 2, size = 3 } = config;

    if (verbosity >= 2) {
      console.log(`   ⚡ Initializing Lean-Agentic ${size}-Agent Swarm`);
    }

    // Initialize shared AgentDB
    const embedder = new EmbeddingService({
      model: 'Xenova/all-MiniLM-L6-v2',
      dimension: 384,
      provider: 'transformers',
    });
    await embedder.initialize();

    const db = await createUnifiedDatabase(
      path.join(process.cwd(), 'simulation', 'data', 'lean-agentic.graph'),
      embedder,
      { forceMode: 'graph' }
    );

    const results = {
      agents: size,
      operations: 0,
      successfulTasks: 0,
      avgLatency: 0,
      totalTime: 0,
      memoryFootprint: 0,
    };

    const startTime = performance.now();

    // Lean agent task - minimal overhead
    const leanAgentTask = async (agentId: number, role: string) => {
      const taskStart = performance.now();

      try {
        if (role === 'memory') {
          // Memory agent: Store and retrieve patterns
          const reflexion = new ReflexionMemory(
            db.getGraphDatabase() as any,
            embedder,
            undefined,
            undefined,
            db.getGraphDatabase() as any
          );

          await reflexion.storeEpisode({
            sessionId: `lean-agent-${agentId}`,
            task: `Lightweight task execution ${agentId}`,
            reward: 0.85 + Math.random() * 0.15,
            success: true,
            input: `Agent ${agentId} input`,
            output: 'Efficient execution',
          });

          const retrieved = await reflexion.retrieveRelevant({
            task: 'task execution',
            k: 3,
          });

          results.operations += 2; // store + retrieve

          if (verbosity >= 3) {
            console.log(
              `      ✅ Memory Agent ${agentId}: Stored 1, Retrieved ${retrieved.length}`
            );
          }
        } else if (role === 'skill') {
          // Skill agent: Create and search skills
          const skills = new SkillLibrary(
            db.getGraphDatabase() as any,
            embedder,
            db.getGraphDatabase() as any
          );

          await skills.createSkill({
            name: `lean-skill-${agentId}`,
            description: `Lightweight skill from agent ${agentId}`,
            code: `function lean${agentId}() { return ${agentId}; }`,
            successRate: 0.9 + Math.random() * 0.1,
          });

          const found = await skills.searchSkills({
            query: 'lightweight',
            k: 2,
          });

          results.operations += 2; // create + search

          if (verbosity >= 3) {
            console.log(`      ✅ Skill Agent ${agentId}: Created 1, Found ${found.length}`);
          }
        } else {
          // Coordinator agent: Query and coordinate
          const reflexion = new ReflexionMemory(
            db.getGraphDatabase() as any,
            embedder,
            undefined,
            undefined,
            db.getGraphDatabase() as any
          );

          const episodes = await reflexion.retrieveRelevant({
            task: 'execution',
            k: 5,
          });

          results.operations += 1; // query only

          if (verbosity >= 3) {
            console.log(
              `      ✅ Coordinator Agent ${agentId}: Coordinated ${episodes.length} episodes`
            );
          }
        }

        const taskEnd = performance.now();
        results.successfulTasks++;

        return {
          agentId,
          role,
          duration: taskEnd - taskStart,
          success: true,
        };
      } catch (error) {
        return {
          agentId,
          role,
          duration: performance.now() - taskStart,
          success: false,
          error,
        };
      }
    };

    // Execute lean agents with role distribution
    const agentRoles = ['memory', 'skill', 'coordinator'];
    const taskResults = await Promise.all(
      Array.from({ length: size }, (_, i) => leanAgentTask(i, agentRoles[i % agentRoles.length]))
    );

    const endTime = performance.now();
    results.totalTime = endTime - startTime;

    // Calculate metrics
    const successfulTasks = taskResults.filter((r) => r.success);
    results.avgLatency =
      successfulTasks.reduce((sum, r) => sum + r.duration, 0) / successfulTasks.length;
    results.memoryFootprint = process.memoryUsage().heapUsed / 1024 / 1024; // MB

    db.close();

    if (verbosity >= 2) {
      console.log(`      📊 Agents: ${results.agents}`);
      console.log(`      📊 Operations: ${results.operations}`);
      console.log(`      📊 Successful Tasks: ${results.successfulTasks}/${size}`);
      console.log(`      📊 Avg Agent Latency: ${results.avgLatency.toFixed(2)}ms`);
      console.log(`      📊 Memory Footprint: ${results.memoryFootprint.toFixed(2)}MB`);
      console.log(`      ⏱️  Total Duration: ${results.totalTime.toFixed(2)}ms`);
    }

    if (verbosity >= 3) {
      console.log(`      📋 Agent Results:`, taskResults);
    }

    return results;
  },
};
