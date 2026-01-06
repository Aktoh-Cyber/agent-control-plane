/**
 * Model optimizer - handles model selection and cost optimization
 */

import { ModelOptimizer } from '../utils/modelOptimizer.js';

export class OptimizerManager {
  applyOptimization(options: any): void {
    if (!options.optimize || !options.agent || !options.task) {
      return;
    }

    const recommendation = ModelOptimizer.optimize({
      agent: options.agent,
      task: options.task,
      priority: options.optimizePriority || 'balanced',
      maxCostPerTask: options.maxCost,
      requiresTools: true,
    });

    ModelOptimizer.displayRecommendation(recommendation);

    if (!options.provider || options.optimize) {
      options.provider = recommendation.provider;
    }
    if (!options.model || options.optimize) {
      options.model = recommendation.model;
    }

    console.log(`✅ Using optimized model: ${recommendation.modelName}\n`);
  }
}
