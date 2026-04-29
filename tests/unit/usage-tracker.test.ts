/**
 * Tests for SQLite-backed UsageTracker (EventStore)
 */

import {
  EventStore,
  type UsageEventInput,
} from '../../agent-control-plane/src/governance/usage-tracker';

function makeEvent(overrides: Partial<UsageEventInput> = {}): UsageEventInput {
  return {
    orgId: 'org-1',
    userId: 'user-1',
    agentId: 'scout',
    model: 'claude-sonnet-4-5-20250514',
    provider: 'anthropic',
    inputTokens: 100,
    outputTokens: 50,
    costUsd: 0.001,
    latencyMs: 200,
    status: 'success',
    ...overrides,
  };
}

describe('EventStore (SQLite-backed)', () => {
  let store: EventStore;

  beforeEach(() => {
    store = new EventStore(); // in-memory SQLite
  });

  afterEach(() => {
    store.close();
  });

  it('tracks a usage event and assigns id + timestamp', () => {
    const event = store.trackUsage(makeEvent());
    expect(event.id).toBeTruthy();
    expect(event.timestamp).toBeInstanceOf(Date);
    expect(event.orgId).toBe('org-1');
    expect(store.size).toBe(1);
  });

  it('persists events across queries (not just in-memory array)', () => {
    store.trackUsage(makeEvent());
    store.trackUsage(makeEvent({ userId: 'user-2' }));
    store.trackUsage(makeEvent({ orgId: 'org-2' }));

    expect(store.size).toBe(3);
    expect(store.getUsageByOrg('org-1').length).toBe(2);
    expect(store.getUsageByOrg('org-2').length).toBe(1);
  });

  it('filters by date with getUsageByOrg', async () => {
    store.trackUsage(makeEvent());
    // Wait long enough to guarantee a different millisecond timestamp
    await new Promise((r) => setTimeout(r, 50));
    const cutoff = new Date(Date.now() + 1); // 1ms in the future from now
    await new Promise((r) => setTimeout(r, 50));
    store.trackUsage(makeEvent({ model: 'gpt-4' }));

    const allEvents = store.getUsageByOrg('org-1');
    const recentEvents = store.getUsageByOrg('org-1', cutoff);

    expect(allEvents.length).toBe(2);
    expect(recentEvents.length).toBe(1);
    expect(recentEvents[0].model).toBe('gpt-4');
  });

  it('filters by user', () => {
    store.trackUsage(makeEvent({ userId: 'alice' }));
    store.trackUsage(makeEvent({ userId: 'alice' }));
    store.trackUsage(makeEvent({ userId: 'bob' }));

    expect(store.getUsageByUser('alice').length).toBe(2);
    expect(store.getUsageByUser('bob').length).toBe(1);
    expect(store.getUsageByUser('charlie').length).toBe(0);
  });

  it('generates correct usage summary', () => {
    store.trackUsage(
      makeEvent({
        costUsd: 0.01,
        inputTokens: 100,
        outputTokens: 50,
        model: 'claude-sonnet-4-5-20250514',
      })
    );
    store.trackUsage(
      makeEvent({
        costUsd: 0.02,
        inputTokens: 200,
        outputTokens: 100,
        model: 'claude-sonnet-4-5-20250514',
      })
    );
    store.trackUsage(
      makeEvent({ costUsd: 0.05, inputTokens: 500, outputTokens: 200, model: 'gpt-4' })
    );

    const summary = store.getUsageSummary('org-1');

    expect(summary.eventCount).toBe(3);
    expect(summary.totalCost).toBeCloseTo(0.08);
    expect(summary.totalTokens).toBe(1150); // 100+50 + 200+100 + 500+200
    expect(Object.keys(summary.byModel).length).toBe(2);
    expect(summary.byModel['claude-sonnet-4-5-20250514'].count).toBe(2);
    expect(summary.byModel['gpt-4'].count).toBe(1);
  });

  it('returns empty summary for unknown org', () => {
    const summary = store.getUsageSummary('org-unknown');
    expect(summary.eventCount).toBe(0);
    expect(summary.totalCost).toBe(0);
    expect(summary.totalTokens).toBe(0);
    expect(Object.keys(summary.byModel).length).toBe(0);
  });

  it('clears all events', () => {
    store.trackUsage(makeEvent());
    store.trackUsage(makeEvent());
    expect(store.size).toBe(2);

    store.clear();
    expect(store.size).toBe(0);
  });

  it('handles events with null agentId and toolId', () => {
    const event = store.trackUsage(makeEvent({ agentId: undefined, toolId: undefined }));
    const retrieved = store.getUsageByOrg('org-1');
    expect(retrieved.length).toBe(1);
    expect(retrieved[0].agentId).toBeUndefined();
    expect(retrieved[0].toolId).toBeUndefined();
  });

  it('handles error status', () => {
    store.trackUsage(makeEvent({ status: 'error', costUsd: 0 }));
    const events = store.getUsageByOrg('org-1');
    expect(events[0].status).toBe('error');
  });
});
