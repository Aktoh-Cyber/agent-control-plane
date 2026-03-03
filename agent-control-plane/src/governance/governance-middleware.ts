/**
 * Governance Middleware
 *
 * Express middleware that intercepts LLM requests and enforces
 * model policies, cost limits, and data-sensitivity checks.
 */

import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { budgetManager } from './budget-manager.js';
import {
  getPolicyForRequest,
  policyStore,
  sensitivityAllowed,
  type SensitivityLevel,
} from './model-policies.js';

// ---------------------------------------------------------------------------
// Identity type (mirrors @horsemen/auth HorsemenIdentity)
// Defined locally to avoid cross-project import.
// ---------------------------------------------------------------------------

export interface HorsemenIdentity {
  sub: string;
  email: string;
  orgId: string;
  teamId?: string;
  roles: string[];
  iat: number;
  exp: number;
  rawToken: string;
}

// ---------------------------------------------------------------------------
// Extended request type expected by upstream auth middleware
// ---------------------------------------------------------------------------

export interface GovernedRequest extends Request {
  identity?: HorsemenIdentity;
  /** Set by this middleware if the request passes governance checks. */
  governancePolicy?: {
    policyId: string;
    allowedModels: string[];
    maxCostPerRequest: number;
    sensitivityLevel: SensitivityLevel;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Rough per-token cost lookup (USD). Intentionally conservative. */
const MODEL_COST_PER_1K_INPUT: Record<string, number> = {
  'claude-3.5-sonnet': 0.003,
  'claude-3.5-haiku': 0.00025,
  'gpt-4o': 0.005,
  'gpt-4o-mini': 0.00015,
  '@cf/meta/llama-3.1-8b-instruct': 0.0,
};

const DEFAULT_COST_PER_1K = 0.003;

/**
 * Estimate the cost (USD) for a request based on model and input size.
 * This is a best-effort heuristic; real costs come from the provider.
 */
export function estimateCost(model: string, inputTokenEstimate: number): number {
  const costPer1K = MODEL_COST_PER_1K_INPUT[model] ?? DEFAULT_COST_PER_1K;
  return (inputTokenEstimate / 1000) * costPer1K;
}

/**
 * Very rough token count from a string (1 token ~ 4 chars).
 */
function roughTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Check whether a model name matches the allowed list.
 * Supports wildcard '*' to allow all models.
 */
function isModelAllowed(model: string, allowedModels: string[]): boolean {
  if (allowedModels.includes('*')) return true;
  // Case-insensitive comparison and prefix matching for versioned models
  const normalised = model.toLowerCase();
  return allowedModels.some((allowed) => {
    const normAllowed = allowed.toLowerCase();
    return normalised === normAllowed || normalised.startsWith(normAllowed + '-');
  });
}

function isModelDenied(model: string, deniedModels: string[]): boolean {
  if (deniedModels.length === 0) return false;
  const normalised = model.toLowerCase();
  return deniedModels.some((denied) => {
    const normDenied = denied.toLowerCase();
    return normalised === normDenied || normalised.startsWith(normDenied + '-');
  });
}

// ---------------------------------------------------------------------------
// Middleware factory
// ---------------------------------------------------------------------------

/**
 * Returns Express middleware that enforces LLM governance policies.
 *
 * The middleware expects:
 * - `req.identity` to be set by upstream auth middleware.
 * - The request body to contain `model` (string) and optionally `messages`
 *   (array of objects with `content` strings) for cost estimation.
 *
 * On violation it returns 403 with structured error.
 */
export function governanceMiddleware(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const govReq = req as GovernedRequest;
    const identity = govReq.identity;

    // If no identity, let auth middleware handle it
    if (!identity) {
      next();
      return;
    }

    const { orgId, roles } = identity;

    // Resolve effective policy
    const policy = getPolicyForRequest(policyStore, orgId, roles);

    // Extract requested model from body
    const body = req.body as Record<string, unknown> | undefined;
    const requestedModel = (body?.model as string) ?? '';

    if (!requestedModel) {
      // No model in request -- nothing to govern, pass through
      next();
      return;
    }

    // --- Check 1: Model deny list ---
    if (isModelDenied(requestedModel, policy.deniedModels)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'MODEL_BLOCKED',
          reason: `Model '${requestedModel}' is explicitly denied by your organisation policy.`,
          allowedModels: policy.allowedModels,
        },
      });
      return;
    }

    // --- Check 2: Model allow list ---
    if (!isModelAllowed(requestedModel, policy.allowedModels)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'MODEL_BLOCKED',
          reason: `Model '${requestedModel}' is not in your allowed models list.`,
          allowedModels: policy.allowedModels,
        },
      });
      return;
    }

    // --- Check 3: Estimated cost ---
    const messages = body?.messages as Array<{ content?: string }> | undefined;
    let inputText = '';
    if (Array.isArray(messages)) {
      inputText = messages.map((m) => (typeof m.content === 'string' ? m.content : '')).join(' ');
    }
    const tokenEstimate = roughTokenCount(inputText) || 100; // minimum 100 tokens
    const estimated = estimateCost(requestedModel, tokenEstimate);

    if (estimated > policy.maxCostPerRequest) {
      res.status(403).json({
        success: false,
        error: {
          code: 'COST_LIMIT_EXCEEDED',
          reason: `Estimated cost $${estimated.toFixed(4)} exceeds per-request limit $${policy.maxCostPerRequest.toFixed(4)}.`,
          estimatedCost: estimated,
          maxCostPerRequest: policy.maxCostPerRequest,
        },
      });
      return;
    }

    // --- Check 4: Budget check ---
    const budgetCheck = budgetManager.checkBudget(orgId, identity.sub, estimated);
    if (!budgetCheck.allowed) {
      res.status(403).json({
        success: false,
        error: {
          code: 'BUDGET_EXCEEDED',
          reason: `Organisation budget is ${budgetCheck.percentUsed.toFixed(1)}% used. Remaining: $${budgetCheck.remaining.toFixed(4)}.`,
          remaining: budgetCheck.remaining,
          percentUsed: budgetCheck.percentUsed,
        },
      });
      return;
    }

    // --- Check 5: Sensitivity level ---
    const requestedSensitivity = (body?.sensitivityLevel as SensitivityLevel) ?? 'public';
    if (!sensitivityAllowed(policy.sensitivityLevel, requestedSensitivity)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'SENSITIVITY_VIOLATION',
          reason: `Requested sensitivity '${requestedSensitivity}' exceeds policy maximum '${policy.sensitivityLevel}'.`,
          policySensitivityLevel: policy.sensitivityLevel,
        },
      });
      return;
    }

    // All checks passed -- attach policy metadata and continue
    govReq.governancePolicy = {
      policyId: policy.id,
      allowedModels: policy.allowedModels,
      maxCostPerRequest: policy.maxCostPerRequest,
      sensitivityLevel: policy.sensitivityLevel,
    };

    next();
  };
}
