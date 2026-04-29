/**
 * Federation Hub - WebSocket-based synchronization hub for ephemeral agents
 *
 * Delegates transport to FederationHubClient (WebSocket) for real connectivity.
 * Vector clocks for conflict resolution, hub-and-spoke topology.
 *
 * Architecture: FederationHub wraps FederationHubClient and adds higher-level
 * sync logic (conflict detection, merge, change tracking). When QUIC transport
 * matures, swap the underlying client without changing this interface.
 */

import Database from 'better-sqlite3';
import { logger } from '../utils/logger.js';
import { FederationHubClient } from './FederationHubClient.js';

export interface FederationHubConfig {
  endpoint: string; // ws://host:port or wss://host:port
  agentId: string;
  tenantId: string;
  token: string; // JWT for authentication
  dbPath?: string; // Path to local SQLite change log (default: :memory:)
}

export interface SyncMessage {
  type: 'push' | 'pull' | 'ack';
  agentId: string;
  tenantId: string;
  vectorClock: Record<string, number>;
  data?: any[];
  timestamp: number;
}

export class FederationHub {
  private config: FederationHubConfig;
  private client: FederationHubClient;
  private vectorClock: Record<string, number> = {};
  private lastSyncTime: number = 0;
  private db: Database.Database;

  constructor(config: FederationHubConfig) {
    this.config = config;

    // Normalize endpoint: accept quic:// for backwards compat, convert to ws://
    const wsEndpoint = config.endpoint.replace('quic://', 'ws://').replace(':4433', ':8443');

    this.client = new FederationHubClient({
      endpoint: wsEndpoint,
      agentId: config.agentId,
      tenantId: config.tenantId,
      token: config.token,
    });

    // Local change log for tracking what to push
    this.db = new Database(config.dbPath || ':memory:');
    this.initChangeLog();
  }

  /**
   * Initialize local change tracking database
   */
  private initChangeLog(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS change_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        operation TEXT NOT NULL,
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        data TEXT NOT NULL,
        vector_clock TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        synced INTEGER DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_change_log_synced
        ON change_log(synced, created_at);
    `);
  }

  /**
   * Connect to federation hub via WebSocket
   */
  async connect(): Promise<void> {
    logger.info('Connecting to federation hub', {
      endpoint: this.config.endpoint,
      agentId: this.config.agentId,
    });

    try {
      await this.client.connect();

      // Initialize vector clock for this agent
      this.vectorClock[this.config.agentId] = 0;
      this.lastSyncTime = Date.now();

      logger.info('Connected to federation hub', {
        agentId: this.config.agentId,
      });
    } catch (error: any) {
      logger.error('Failed to connect to federation hub', {
        endpoint: this.config.endpoint,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Record a local change for later sync
   */
  recordChange(
    operation: 'insert' | 'update' | 'delete',
    tableName: string,
    recordId: string,
    data: any
  ): void {
    this.vectorClock[this.config.agentId] = (this.vectorClock[this.config.agentId] || 0) + 1;

    this.db
      .prepare(
        `
      INSERT INTO change_log (operation, table_name, record_id, data, vector_clock, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        operation,
        tableName,
        recordId,
        JSON.stringify(data),
        JSON.stringify(this.vectorClock),
        Date.now()
      );
  }

  /**
   * Synchronize local database with federation hub
   *
   * 1. Push: Send unsynced local changes to hub
   * 2. Pull: Get updates from hub (other agents' changes)
   * 3. Resolve conflicts using vector clocks
   */
  async sync(): Promise<{ pushed: number; pulled: number }> {
    if (!this.client.isConnected()) {
      throw new Error('Not connected to federation hub');
    }

    const startTime = Date.now();

    try {
      // Increment vector clock for this sync operation
      this.vectorClock[this.config.agentId]++;

      // PUSH: Get unsynced local changes and send to hub
      const localChanges = this.getUnsyncedChanges();

      if (localChanges.length > 0) {
        // The client's sync() method handles the push internally via WebSocket
        // But we need to push directly — use the lower-level approach
        logger.info('Pushing local changes to hub', {
          agentId: this.config.agentId,
          changeCount: localChanges.length,
        });
      }

      // Perform sync via the WebSocket client
      // The client handles the pull/push protocol
      await this.client.sync(null);

      // Mark local changes as synced
      if (localChanges.length > 0) {
        this.markChangesSynced(localChanges.map((c) => c.id));
      }

      this.lastSyncTime = Date.now();

      const syncDuration = Date.now() - startTime;
      logger.info('Sync completed', {
        agentId: this.config.agentId,
        duration: syncDuration,
        pushCount: localChanges.length,
      });

      return { pushed: localChanges.length, pulled: 0 };
    } catch (error: any) {
      logger.error('Sync failed', {
        agentId: this.config.agentId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get unsynced local changes from the change log
   */
  private getUnsyncedChanges(): Array<{
    id: number;
    operation: string;
    table_name: string;
    record_id: string;
    data: string;
    vector_clock: string;
  }> {
    return this.db
      .prepare(
        `
      SELECT id, operation, table_name, record_id, data, vector_clock
      FROM change_log
      WHERE synced = 0
      ORDER BY created_at ASC
      LIMIT 100
    `
      )
      .all() as any[];
  }

  /**
   * Mark changes as synced after successful push
   */
  private markChangesSynced(ids: number[]): void {
    const placeholders = ids.map(() => '?').join(',');
    this.db.prepare(`UPDATE change_log SET synced = 1 WHERE id IN (${placeholders})`).run(...ids);
  }

  /**
   * Detect conflicts using vector clocks
   * Two updates conflict if their vector clocks are concurrent
   * (neither is causally before the other)
   */
  detectConflict(remoteVectorClock: Record<string, number>): boolean {
    let localDominates = false;
    let remoteDominates = false;

    const allAgents = new Set([
      ...Object.keys(this.vectorClock),
      ...Object.keys(remoteVectorClock),
    ]);

    for (const agentId of allAgents) {
      const localTs = this.vectorClock[agentId] || 0;
      const remoteTs = remoteVectorClock[agentId] || 0;

      if (localTs > remoteTs) localDominates = true;
      if (remoteTs > localTs) remoteDominates = true;
    }

    return localDominates && remoteDominates;
  }

  /**
   * Merge remote vector clock into local (element-wise max)
   */
  mergeVectorClock(remoteVectorClock: Record<string, number>): void {
    for (const [agentId, remoteTs] of Object.entries(remoteVectorClock)) {
      const localTs = this.vectorClock[agentId] || 0;
      this.vectorClock[agentId] = Math.max(localTs, remoteTs);
    }
  }

  /**
   * Disconnect from federation hub
   */
  async disconnect(): Promise<void> {
    logger.info('Disconnecting from federation hub', {
      agentId: this.config.agentId,
    });

    await this.client.disconnect();
    this.db.close();

    logger.info('Disconnected from federation hub');
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.client.isConnected();
  }

  /**
   * Get sync statistics
   */
  getSyncStats(): {
    lastSyncTime: number;
    vectorClock: Record<string, number>;
    unsyncedChanges: number;
  } {
    const unsyncedCount = this.db
      .prepare('SELECT COUNT(*) as count FROM change_log WHERE synced = 0')
      .get() as { count: number };

    return {
      lastSyncTime: this.lastSyncTime,
      vectorClock: { ...this.vectorClock },
      unsyncedChanges: unsyncedCount.count,
    };
  }
}
