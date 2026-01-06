/**
 * Mock Redis Client
 * In-memory Redis mock for testing
 */

export class MockRedis {
  private data: Map<string, any> = new Map();
  private expirations: Map<string, number> = new Map();
  private lists: Map<string, any[]> = new Map();
  private sets: Map<string, Set<any>> = new Map();
  private hashes: Map<string, Map<string, any>> = new Map();

  /**
   * Set string value
   */
  async set(key: string, value: any, options?: { EX?: number }): Promise<string> {
    this.data.set(key, value);

    if (options?.EX) {
      this.expirations.set(key, Date.now() + options.EX * 1000);
    }

    return 'OK';
  }

  /**
   * Get string value
   */
  async get(key: string): Promise<any | null> {
    this.checkExpiration(key);
    return this.data.get(key) || null;
  }

  /**
   * Delete key(s)
   */
  async del(...keys: string[]): Promise<number> {
    let count = 0;

    for (const key of keys) {
      if (this.data.delete(key)) count++;
      this.expirations.delete(key);
      this.lists.delete(key);
      this.sets.delete(key);
      this.hashes.delete(key);
    }

    return count;
  }

  /**
   * Check if key exists
   */
  async exists(...keys: string[]): Promise<number> {
    let count = 0;

    for (const key of keys) {
      this.checkExpiration(key);
      if (this.data.has(key)) count++;
    }

    return count;
  }

  /**
   * Set expiration
   */
  async expire(key: string, seconds: number): Promise<number> {
    if (!this.data.has(key)) {
      return 0;
    }

    this.expirations.set(key, Date.now() + seconds * 1000);
    return 1;
  }

  /**
   * Get TTL
   */
  async ttl(key: string): Promise<number> {
    const expiration = this.expirations.get(key);

    if (!expiration) {
      return -1; // No expiration
    }

    const remaining = Math.floor((expiration - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2; // -2 means expired
  }

  /**
   * Push to list (right)
   */
  async rpush(key: string, ...values: any[]): Promise<number> {
    if (!this.lists.has(key)) {
      this.lists.set(key, []);
    }

    const list = this.lists.get(key)!;
    list.push(...values);
    return list.length;
  }

  /**
   * Pop from list (right)
   */
  async rpop(key: string): Promise<any | null> {
    const list = this.lists.get(key);
    return list ? list.pop() || null : null;
  }

  /**
   * Get list range
   */
  async lrange(key: string, start: number, stop: number): Promise<any[]> {
    const list = this.lists.get(key);

    if (!list) {
      return [];
    }

    const end = stop === -1 ? undefined : stop + 1;
    return list.slice(start, end);
  }

  /**
   * Get list length
   */
  async llen(key: string): Promise<number> {
    const list = this.lists.get(key);
    return list ? list.length : 0;
  }

  /**
   * Add to set
   */
  async sadd(key: string, ...members: any[]): Promise<number> {
    if (!this.sets.has(key)) {
      this.sets.set(key, new Set());
    }

    const set = this.sets.get(key)!;
    const initialSize = set.size;

    members.forEach((member) => set.add(member));

    return set.size - initialSize;
  }

  /**
   * Get set members
   */
  async smembers(key: string): Promise<any[]> {
    const set = this.sets.get(key);
    return set ? Array.from(set) : [];
  }

  /**
   * Check if member in set
   */
  async sismember(key: string, member: any): Promise<number> {
    const set = this.sets.get(key);
    return set && set.has(member) ? 1 : 0;
  }

  /**
   * Set hash field
   */
  async hset(key: string, field: string, value: any): Promise<number> {
    if (!this.hashes.has(key)) {
      this.hashes.set(key, new Map());
    }

    const hash = this.hashes.get(key)!;
    const isNew = !hash.has(field);
    hash.set(field, value);

    return isNew ? 1 : 0;
  }

  /**
   * Get hash field
   */
  async hget(key: string, field: string): Promise<any | null> {
    const hash = this.hashes.get(key);
    return hash ? hash.get(field) || null : null;
  }

  /**
   * Get all hash fields
   */
  async hgetall(key: string): Promise<Record<string, any>> {
    const hash = this.hashes.get(key);

    if (!hash) {
      return {};
    }

    const result: Record<string, any> = {};
    hash.forEach((value, field) => {
      result[field] = value;
    });

    return result;
  }

  /**
   * Get all keys matching pattern
   */
  async keys(pattern: string): Promise<string[]> {
    const regex = this.patternToRegex(pattern);
    return Array.from(this.data.keys()).filter((key) => regex.test(key));
  }

  /**
   * Flush all data
   */
  async flushall(): Promise<string> {
    this.data.clear();
    this.expirations.clear();
    this.lists.clear();
    this.sets.clear();
    this.hashes.clear();
    return 'OK';
  }

  /**
   * Check and remove expired keys
   */
  private checkExpiration(key: string): void {
    const expiration = this.expirations.get(key);

    if (expiration && expiration < Date.now()) {
      this.data.delete(key);
      this.expirations.delete(key);
      this.lists.delete(key);
      this.sets.delete(key);
      this.hashes.delete(key);
    }
  }

  /**
   * Convert Redis pattern to regex
   */
  private patternToRegex(pattern: string): RegExp {
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');

    return new RegExp(`^${escaped}$`);
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      keyCount: this.data.size,
      listCount: this.lists.size,
      setCount: this.sets.size,
      hashCount: this.hashes.size,
      expirationCount: this.expirations.size,
    };
  }
}

/**
 * Factory function for creating a mock Redis client
 */
export function createMockRedis(): MockRedis {
  return new MockRedis();
}
