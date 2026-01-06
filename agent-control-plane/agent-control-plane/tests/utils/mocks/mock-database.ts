/**
 * Mock Database
 * In-memory database mock for testing
 */

import type { DatabaseRecord, QueryResult } from '../../../src/types/test-helpers.js';

export class MockDatabase {
  private tables: Map<string, Map<string, DatabaseRecord>> = new Map();
  private queries: string[] = [];
  private transactions: boolean = false;

  /**
   * Create a table
   */
  createTable(tableName: string): void {
    if (!this.tables.has(tableName)) {
      this.tables.set(tableName, new Map());
    }
  }

  /**
   * Insert record
   */
  insert<T extends DatabaseRecord>(tableName: string, record: T): T {
    this.ensureTable(tableName);
    const table = this.tables.get(tableName)!;

    if (!record.id) {
      record.id = `${tableName}-${table.size + 1}`;
    }

    table.set(record.id, record);
    this.queries.push(`INSERT INTO ${tableName}`);

    return record;
  }

  /**
   * Find by ID
   */
  findById<T extends DatabaseRecord>(tableName: string, id: string): T | null {
    this.ensureTable(tableName);
    const table = this.tables.get(tableName)!;
    this.queries.push(`SELECT FROM ${tableName} WHERE id=${id}`);

    return (table.get(id) as T) || null;
  }

  /**
   * Find all records
   */
  findAll<T extends DatabaseRecord>(tableName: string): T[] {
    this.ensureTable(tableName);
    const table = this.tables.get(tableName)!;
    this.queries.push(`SELECT * FROM ${tableName}`);

    return Array.from(table.values()) as T[];
  }

  /**
   * Find records matching criteria
   */
  find<T extends DatabaseRecord>(tableName: string, criteria: Partial<T>): T[] {
    this.ensureTable(tableName);
    const table = this.tables.get(tableName)!;
    const criteriaStr = Object.keys(criteria).join(', ');
    this.queries.push(`SELECT FROM ${tableName} WHERE ${criteriaStr}`);

    return Array.from(table.values()).filter((record) => {
      return Object.entries(criteria).every(([key, value]) => record[key] === value);
    }) as T[];
  }

  /**
   * Update record
   */
  update<T extends DatabaseRecord>(tableName: string, id: string, updates: Partial<T>): T | null {
    this.ensureTable(tableName);
    const table = this.tables.get(tableName)!;
    const record = table.get(id);

    if (!record) {
      return null;
    }

    const updated = { ...record, ...updates };
    table.set(id, updated);
    this.queries.push(`UPDATE ${tableName} SET ... WHERE id=${id}`);

    return updated as T;
  }

  /**
   * Delete record
   */
  delete(tableName: string, id: string): boolean {
    this.ensureTable(tableName);
    const table = this.tables.get(tableName)!;
    this.queries.push(`DELETE FROM ${tableName} WHERE id=${id}`);

    return table.delete(id);
  }

  /**
   * Execute raw query (simplified mock)
   */
  async query<T extends DatabaseRecord = DatabaseRecord>(
    sql: string,
    params?: unknown[]
  ): Promise<QueryResult<T>> {
    this.queries.push(sql);

    // Simple mock - just return empty results
    return {
      rows: [],
      rowCount: 0,
    };
  }

  /**
   * Begin transaction
   */
  async beginTransaction(): Promise<void> {
    this.transactions = true;
  }

  /**
   * Commit transaction
   */
  async commit(): Promise<void> {
    this.transactions = false;
  }

  /**
   * Rollback transaction
   */
  async rollback(): Promise<void> {
    this.transactions = false;
  }

  /**
   * Get query history
   */
  getQueryHistory(): string[] {
    return [...this.queries];
  }

  /**
   * Clear query history
   */
  clearQueryHistory(): void {
    this.queries = [];
  }

  /**
   * Count records
   */
  count(tableName: string): number {
    this.ensureTable(tableName);
    return this.tables.get(tableName)!.size;
  }

  /**
   * Clear table
   */
  clearTable(tableName: string): void {
    this.ensureTable(tableName);
    this.tables.get(tableName)!.clear();
  }

  /**
   * Clear all tables
   */
  clearAll(): void {
    this.tables.clear();
    this.queries = [];
  }

  /**
   * Check if table exists
   */
  hasTable(tableName: string): boolean {
    return this.tables.has(tableName);
  }

  /**
   * Ensure table exists
   */
  private ensureTable(tableName: string): void {
    if (!this.tables.has(tableName)) {
      this.createTable(tableName);
    }
  }

  /**
   * Get database statistics
   */
  getStats() {
    return {
      tableCount: this.tables.size,
      totalRecords: Array.from(this.tables.values()).reduce((sum, table) => sum + table.size, 0),
      queryCount: this.queries.length,
      inTransaction: this.transactions,
    };
  }
}

/**
 * Factory function for creating a mock database
 */
export function createMockDatabase(): MockDatabase {
  return new MockDatabase();
}
