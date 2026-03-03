/**
 * Audit Instrumentation
 *
 * Express middleware and helper functions that emit audit events
 * for API calls, tool invocations, LLM calls, conversations,
 * deployments, and admin actions.
 */

import type { NextFunction, Request, Response } from 'express';
import { createHash } from 'node:crypto';
import { emitAuditEvent, type AuditIdentity, type SensitivityLevel } from './audit-events.js';

// ---------------------------------------------------------------------------
// Identity extraction from Express request
// ---------------------------------------------------------------------------

interface IdentityRequest extends Request {
  identity?: {
    sub: string;
    orgId: string;
    roles?: string[];
  };
}

function extractIdentity(req: Request): AuditIdentity | undefined {
  const identityReq = req as IdentityRequest;
  const identity = identityReq.identity;
  if (!identity) return undefined;

  return {
    sub: identity.sub,
    orgId: identity.orgId,
    roles: identity.roles,
    ipAddress:
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress,
  };
}

// ---------------------------------------------------------------------------
// Express middleware
// ---------------------------------------------------------------------------

/**
 * Express middleware that emits an audit event for every API request.
 * Should be mounted after auth middleware so identity is available.
 */
export function auditMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    const identity = extractIdentity(req);

    // Capture the original end to emit audit event after response is sent
    const originalEnd = res.end;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res.end = function (this: Response, ...args: any[]): Response {
      const duration = Date.now() - startTime;

      emitAuditEvent(
        'agent_action',
        {
          action: `${req.method} ${req.path}`,
          resource: req.baseUrl + req.path,
          detailsJson: {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            durationMs: duration,
            userAgent: req.headers['user-agent'],
            query: req.query,
          },
          sensitivityLevel: 'internal',
        },
        identity
      );

      return originalEnd.apply(this, args);
    } as typeof res.end;

    next();
  };
}

// ---------------------------------------------------------------------------
// Tool invocation auditing
// ---------------------------------------------------------------------------

/**
 * Audit a tool invocation. Call this when a tool is invoked by an agent.
 */
export function auditToolInvocation(
  toolId: string,
  agentId: string,
  input: Record<string, unknown>,
  output: Record<string, unknown>,
  identity?: AuditIdentity
): void {
  emitAuditEvent(
    'tool_invocation',
    {
      action: `tool.invoke.${toolId}`,
      resource: `tool/${toolId}`,
      agentId,
      detailsJson: {
        toolId,
        inputKeys: Object.keys(input),
        outputKeys: Object.keys(output),
        inputSize: JSON.stringify(input).length,
        outputSize: JSON.stringify(output).length,
      },
      sensitivityLevel: 'internal',
    },
    identity
  );
}

// ---------------------------------------------------------------------------
// LLM call auditing
// ---------------------------------------------------------------------------

/**
 * Hash a prompt string using SHA-256 for audit logging without storing
 * the full prompt text.
 */
function hashPrompt(prompt: string): string {
  return createHash('sha256').update(prompt).digest('hex');
}

/**
 * Audit an LLM API call. Hashes the prompt rather than storing it in full.
 */
export function auditLLMCall(
  model: string,
  provider: string,
  prompt: string,
  tokens: { input: number; output: number },
  costUsd: number,
  identity?: AuditIdentity
): void {
  emitAuditEvent(
    'llm_request',
    {
      action: `llm.call.${provider}.${model}`,
      resource: `llm/${provider}/${model}`,
      detailsJson: {
        model,
        provider,
        promptHash: hashPrompt(prompt),
        promptLength: prompt.length,
        inputTokens: tokens.input,
        outputTokens: tokens.output,
        totalTokens: tokens.input + tokens.output,
        costUsd,
      },
      sensitivityLevel: 'confidential',
    },
    identity
  );
}

// ---------------------------------------------------------------------------
// Agent conversation auditing
// ---------------------------------------------------------------------------

/**
 * Audit an agent conversation event. Records message count rather than
 * conversation content.
 */
export function auditAgentConversation(
  agentId: string,
  messageCount: number,
  identity?: AuditIdentity
): void {
  emitAuditEvent(
    'agent_conversation',
    {
      action: 'agent.conversation',
      resource: `agent/${agentId}/conversation`,
      agentId,
      detailsJson: {
        messageCount,
      },
      sensitivityLevel: 'internal',
    },
    identity
  );
}

// ---------------------------------------------------------------------------
// Deployment action auditing
// ---------------------------------------------------------------------------

/**
 * Audit a deployment action (deploy, rollback, scale, etc.).
 */
export function auditDeploymentAction(
  action: string,
  target: string,
  identity?: AuditIdentity
): void {
  emitAuditEvent(
    'deployment_action',
    {
      action: `deployment.${action}`,
      resource: target,
      detailsJson: {
        deploymentAction: action,
        target,
      },
      sensitivityLevel: 'confidential',
    },
    identity
  );
}

// ---------------------------------------------------------------------------
// Admin action auditing
// ---------------------------------------------------------------------------

/**
 * Audit an admin action that changes configuration, roles, or policies.
 * Records before/after state for change tracking.
 */
export function auditAdminAction(
  action: string,
  resource: string,
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
  identity?: AuditIdentity
): void {
  emitAuditEvent(
    'admin_action',
    {
      action: `admin.${action}`,
      resource,
      detailsJson: {
        adminAction: action,
        before,
        after,
      },
      sensitivityLevel: 'restricted',
    },
    identity
  );
}

// ---------------------------------------------------------------------------
// Auth event auditing
// ---------------------------------------------------------------------------

/**
 * Audit an authentication event (login, logout, or failed attempt).
 */
export function auditAuthEvent(
  eventType: 'auth_login' | 'auth_logout' | 'auth_failed',
  details: {
    method?: string;
    reason?: string;
    sensitivityLevel?: SensitivityLevel;
  },
  identity?: AuditIdentity
): void {
  emitAuditEvent(
    eventType,
    {
      action: eventType.replace('_', '.'),
      resource: 'auth',
      detailsJson: {
        method: details.method,
        reason: details.reason,
      },
      sensitivityLevel: details.sensitivityLevel ?? 'confidential',
    },
    identity
  );
}
