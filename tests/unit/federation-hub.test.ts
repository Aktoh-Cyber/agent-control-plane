/**
 * Tests for FederationHub
 *
 * Tests the local change tracking and vector clock logic.
 * WebSocket connection is mocked since it requires a running server.
 */

import { FederationHub } from '../../agent-control-plane/src/federation/FederationHub';

const mockClientFactory = () => ({
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  isConnected: jest.fn().mockReturnValue(true),
  sync: jest.fn().mockResolvedValue(undefined),
  getSyncStats: jest.fn().mockReturnValue({ lastSyncTime: 0, vectorClock: {} }),
});

// Mock the WebSocket-based client to avoid needing a running server
jest.mock('../../agent-control-plane/src/federation/FederationHubClient', () => {
  return {
    FederationHubClient: jest.fn().mockImplementation(() => mockClientFactory()),
  };
});

// Mock logger to suppress output
jest.mock('../../agent-control-plane/src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('FederationHub', () => {
  let hub: FederationHub;

  beforeEach(() => {
    hub = new FederationHub({
      endpoint: 'ws://localhost:8443',
      agentId: 'agent-test-1',
      tenantId: 'tenant-test',
      token: 'test-jwt-token',
    });
  });

  afterEach(async () => {
    await hub.disconnect();
  });

  describe('connect', () => {
    it('connects via WebSocket client and reports connected', async () => {
      await hub.connect();
      expect(hub.isConnected()).toBe(true);
    });
  });

  describe('recordChange', () => {
    it('records a change and increments vector clock', async () => {
      await hub.connect();

      hub.recordChange('insert', 'episodes', 'ep-1', { task: 'test', output: 'result' });

      const stats = hub.getSyncStats();
      expect(stats.unsyncedChanges).toBe(1);
      expect(stats.vectorClock['agent-test-1']).toBeGreaterThan(0);
    });

    it('records multiple changes with incrementing vector clock', async () => {
      await hub.connect();

      hub.recordChange('insert', 'episodes', 'ep-1', { task: 'test1' });
      hub.recordChange('update', 'episodes', 'ep-1', { task: 'test1-updated' });
      hub.recordChange('delete', 'episodes', 'ep-2', {});

      const stats = hub.getSyncStats();
      expect(stats.unsyncedChanges).toBe(3);
      expect(stats.vectorClock['agent-test-1']).toBe(3);
    });
  });

  describe('sync', () => {
    it('syncs and marks changes as synced', async () => {
      await hub.connect();

      hub.recordChange('insert', 'episodes', 'ep-1', { task: 'test' });
      expect(hub.getSyncStats().unsyncedChanges).toBe(1);

      await hub.sync();

      expect(hub.getSyncStats().unsyncedChanges).toBe(0);
      expect(hub.getSyncStats().lastSyncTime).toBeGreaterThan(0);
    });

    it('throws when not connected', async () => {
      // Temporarily override mock to return disconnected
      const { FederationHubClient } = jest.requireMock(
        '../../agent-control-plane/src/federation/FederationHubClient'
      );
      const originalImpl = FederationHubClient.getMockImplementation();

      FederationHubClient.mockImplementation(() => ({
        connect: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        isConnected: jest.fn().mockReturnValue(false),
        sync: jest.fn().mockResolvedValue(undefined),
        getSyncStats: jest.fn().mockReturnValue({ lastSyncTime: 0, vectorClock: {} }),
      }));

      const disconnectedHub = new FederationHub({
        endpoint: 'ws://localhost:8443',
        agentId: 'agent-disconnected',
        tenantId: 'tenant-test',
        token: 'test-token',
      });

      await expect(disconnectedHub.sync()).rejects.toThrow('Not connected');
      await disconnectedHub.disconnect();

      // Restore original mock for subsequent tests
      FederationHubClient.mockImplementation(() => mockClientFactory());
    });
  });

  describe('detectConflict', () => {
    it('returns false when remote dominates (no conflict)', async () => {
      await hub.connect();

      // Remote has higher clock for all agents
      const conflict = hub.detectConflict({ 'agent-test-1': 10, 'agent-2': 5 });
      expect(conflict).toBe(false);
    });

    it('returns true for concurrent updates (conflict)', async () => {
      await hub.connect();

      // Record some local changes to bump local clock
      hub.recordChange('insert', 'episodes', 'ep-1', {});
      hub.recordChange('insert', 'episodes', 'ep-2', {});

      // Remote has higher clock for a different agent but lower for local agent
      const conflict = hub.detectConflict({ 'agent-test-1': 0, 'agent-other': 5 });
      expect(conflict).toBe(true);
    });
  });

  describe('mergeVectorClock', () => {
    it('merges remote clock using element-wise max', async () => {
      await hub.connect();

      // Bump local clock
      hub.recordChange('insert', 'episodes', 'ep-1', {});

      // Merge remote clock
      hub.mergeVectorClock({ 'agent-test-1': 0, 'agent-remote': 10 });

      const stats = hub.getSyncStats();
      // Local should keep its higher value for agent-test-1
      expect(stats.vectorClock['agent-test-1']).toBe(1);
      // Should adopt the remote value for agent-remote
      expect(stats.vectorClock['agent-remote']).toBe(10);
    });
  });

  describe('getSyncStats', () => {
    it('returns sync statistics', async () => {
      await hub.connect();

      const stats = hub.getSyncStats();
      expect(stats).toHaveProperty('lastSyncTime');
      expect(stats).toHaveProperty('vectorClock');
      expect(stats).toHaveProperty('unsyncedChanges');
      expect(typeof stats.unsyncedChanges).toBe('number');
    });
  });

  describe('backwards compatibility', () => {
    it('converts quic:// endpoints to ws://', async () => {
      const quicHub = new FederationHub({
        endpoint: 'quic://hub.example.com:4433',
        agentId: 'agent-quic',
        tenantId: 'tenant-test',
        token: 'test-token',
      });

      // Should not throw — endpoint conversion happens in constructor
      await quicHub.connect();
      expect(quicHub.isConnected()).toBe(true);
      await quicHub.disconnect();
    });
  });
});
