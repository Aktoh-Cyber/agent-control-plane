/**
 * Budget Enforcement
 *
 * In-memory budget store that tracks spend per org/user and enforces
 * hard/soft limits. Periods reset automatically.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BudgetPeriod = 'monthly' | 'weekly';

export interface Budget {
  orgId: string;
  /** When null, applies org-wide. When set, applies to a specific user. */
  userId: string | null;
  period: BudgetPeriod;
  limitUsd: number;
  limitTokens?: number;
  currentUsd: number;
  currentTokens: number;
  /** Thresholds (0-1) at which alert callbacks are invoked. */
  alertThresholds: number[];
  /** If true, requests are rejected once 100% of budget is consumed. */
  hardCap: boolean;
  periodStart: Date;
}

export interface BudgetCheckResult {
  allowed: boolean;
  remaining: number;
  percentUsed: number;
}

export type BudgetInput = Omit<Budget, 'currentUsd' | 'currentTokens' | 'periodStart'>;

// ---------------------------------------------------------------------------
// Default budgets by tier
// ---------------------------------------------------------------------------

export const DEFAULT_BUDGETS: Record<string, Omit<BudgetInput, 'orgId' | 'userId'>> = {
  free: {
    period: 'monthly',
    limitUsd: 5,
    limitTokens: 1_000_000,
    alertThresholds: [0.5, 0.8],
    hardCap: true,
  },
  pro: {
    period: 'monthly',
    limitUsd: 100,
    limitTokens: 20_000_000,
    alertThresholds: [0.5, 0.8],
    hardCap: true,
  },
  enterprise: {
    period: 'monthly',
    limitUsd: 10_000,
    limitTokens: 500_000_000,
    alertThresholds: [0.5, 0.8, 0.95],
    hardCap: false,
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function budgetKey(orgId: string, userId: string | null): string {
  return userId ? `${orgId}::${userId}` : orgId;
}

function periodStartDate(period: BudgetPeriod): Date {
  const now = new Date();
  if (period === 'weekly') {
    const day = now.getDay(); // 0=Sunday
    const diff = now.getDate() - day;
    return new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
  }
  // monthly
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

function isPeriodExpired(budget: Budget): boolean {
  const currentPeriodStart = periodStartDate(budget.period);
  return budget.periodStart < currentPeriodStart;
}

// ---------------------------------------------------------------------------
// Alert callback type
// ---------------------------------------------------------------------------

export type BudgetAlertCallback = (budget: Budget, threshold: number, percentUsed: number) => void;

// ---------------------------------------------------------------------------
// In-memory Budget Store
// ---------------------------------------------------------------------------

export class BudgetStore {
  private budgets: Map<string, Budget> = new Map();
  private alertCallback: BudgetAlertCallback | null = null;
  /** Track which thresholds have already fired for a budget to avoid repeat alerts. */
  private firedAlerts: Map<string, Set<number>> = new Map();

  /** Register a callback for budget threshold alerts. */
  onAlert(callback: BudgetAlertCallback): void {
    this.alertCallback = callback;
  }

  /** Create or replace a budget. */
  set(input: BudgetInput): Budget {
    const key = budgetKey(input.orgId, input.userId);
    const budget: Budget = {
      ...input,
      currentUsd: 0,
      currentTokens: 0,
      periodStart: periodStartDate(input.period),
    };
    this.budgets.set(key, budget);
    this.firedAlerts.set(key, new Set());
    return budget;
  }

  /** Get the budget for an org (and optionally user). */
  get(orgId: string, userId?: string | null): Budget | undefined {
    // Try user-specific first, then fall back to org-wide
    if (userId) {
      const userBudget = this.budgets.get(budgetKey(orgId, userId));
      if (userBudget) return this.maybeReset(userBudget);
    }
    const orgBudget = this.budgets.get(budgetKey(orgId, null));
    return orgBudget ? this.maybeReset(orgBudget) : undefined;
  }

  /** Delete a budget. */
  delete(orgId: string, userId?: string | null): boolean {
    const key = budgetKey(orgId, userId ?? null);
    this.firedAlerts.delete(key);
    return this.budgets.delete(key);
  }

  /** List all budgets for an org. */
  listByOrg(orgId: string): Budget[] {
    const result: Budget[] = [];
    for (const budget of this.budgets.values()) {
      if (budget.orgId === orgId) {
        result.push(this.maybeReset(budget));
      }
    }
    return result;
  }

  /**
   * Check whether a planned spend is within budget.
   * Returns remaining budget and percent used.
   */
  checkBudget(orgId: string, userId: string | null, estimatedCostUsd: number): BudgetCheckResult {
    const budget = this.get(orgId, userId);

    // No budget configured -- allow by default
    if (!budget) {
      return { allowed: true, remaining: Infinity, percentUsed: 0 };
    }

    const projectedUsd = budget.currentUsd + estimatedCostUsd;
    const percentUsed = (projectedUsd / budget.limitUsd) * 100;
    const remaining = Math.max(0, budget.limitUsd - budget.currentUsd);

    if (budget.hardCap && projectedUsd > budget.limitUsd) {
      return { allowed: false, remaining, percentUsed };
    }

    return { allowed: true, remaining, percentUsed };
  }

  /**
   * Record actual spend against a budget.
   * Fires alert callbacks when thresholds are crossed.
   */
  recordSpend(orgId: string, userId: string | null, costUsd: number, tokens: number): void {
    const budget = this.get(orgId, userId);
    if (!budget) return;

    budget.currentUsd += costUsd;
    budget.currentTokens += tokens;

    // Check alert thresholds
    this.checkAlerts(budget);
  }

  /**
   * Get overall budget status for an org (org-wide budget).
   */
  getBudgetStatus(orgId: string): Budget | undefined {
    return this.get(orgId, null);
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  /** Reset counters if the current period has elapsed. */
  private maybeReset(budget: Budget): Budget {
    if (isPeriodExpired(budget)) {
      budget.currentUsd = 0;
      budget.currentTokens = 0;
      budget.periodStart = periodStartDate(budget.period);
      // Clear fired alerts for new period
      const key = budgetKey(budget.orgId, budget.userId);
      this.firedAlerts.set(key, new Set());
    }
    return budget;
  }

  /** Fire alert callbacks when thresholds are crossed. */
  private checkAlerts(budget: Budget): void {
    if (!this.alertCallback) return;

    const key = budgetKey(budget.orgId, budget.userId);
    const fired = this.firedAlerts.get(key) ?? new Set();
    const percentUsed = budget.currentUsd / budget.limitUsd;

    for (const threshold of budget.alertThresholds) {
      if (percentUsed >= threshold && !fired.has(threshold)) {
        fired.add(threshold);
        this.alertCallback(budget, threshold, percentUsed * 100);
      }
    }

    this.firedAlerts.set(key, fired);
  }
}

// ---------------------------------------------------------------------------
// Singleton instance
// ---------------------------------------------------------------------------

export const budgetManager = new BudgetStore();
