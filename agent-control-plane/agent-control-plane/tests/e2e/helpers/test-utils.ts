/**
 * E2E Test Utility Functions
 * Helper functions for common E2E test operations
 */

/**
 * Wait for a condition to become true
 */
export async function waitForCondition(
  condition: () => Promise<boolean> | boolean,
  options: {
    timeout?: number;
    interval?: number;
    errorMessage?: string;
  } = {}
): Promise<void> {
  const {
    timeout = 10000,
    interval = 100,
    errorMessage = 'Timeout waiting for condition',
  } = options;

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await Promise.resolve(condition());
    if (result) {
      return;
    }
    await sleep(interval);
  }

  throw new Error(`${errorMessage} (timeout: ${timeout}ms)`);
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 100,
    maxDelay = 10000,
    backoffFactor = 2,
    onRetry,
  } = options;

  let lastError: Error | undefined;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        onRetry?.(attempt, lastError);
        await sleep(Math.min(delay, maxDelay));
        delay *= backoffFactor;
      }
    }
  }

  throw new Error(`Operation failed after ${maxRetries} retries: ${lastError?.message}`);
}

/**
 * Measure execution time
 */
export async function measureTime<T>(
  operation: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const startTime = Date.now();
  const result = await operation();
  const duration = Date.now() - startTime;

  return { result, duration };
}

/**
 * Execute operations in parallel with timeout
 */
export async function parallelWithTimeout<T>(
  operations: Array<() => Promise<T>>,
  timeout: number
): Promise<T[]> {
  const promises = operations.map(async (op, index) => {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation ${index} timed out`)), timeout)
    );

    return Promise.race([op(), timeoutPromise]);
  });

  return Promise.all(promises);
}

/**
 * Create a test timeout
 */
export function createTimeout(ms: number, message?: string): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(message || `Timeout after ${ms}ms`)), ms)
  );
}

/**
 * Poll for a value
 */
export async function pollForValue<T>(
  getValue: () => Promise<T>,
  predicate: (value: T) => boolean,
  options: {
    timeout?: number;
    interval?: number;
  } = {}
): Promise<T> {
  const { timeout = 10000, interval = 100 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const value = await getValue();
    if (predicate(value)) {
      return value;
    }
    await sleep(interval);
  }

  throw new Error(`Polling timed out after ${timeout}ms`);
}

/**
 * Generate random string
 */
export function randomString(length: number = 10): string {
  return Math.random()
    .toString(36)
    .substring(2, length + 2)
    .padEnd(length, '0');
}

/**
 * Generate random integer
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random vector
 */
export function randomVector(dimensions: number = 128): number[] {
  return Array.from({ length: dimensions }, () => Math.random());
}

/**
 * Generate unique ID
 */
export function uniqueId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${randomString(8)}`;
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Flatten array of arrays
 */
export function flatten<T>(arrays: T[][]): T[] {
  return arrays.reduce((acc, arr) => acc.concat(arr), []);
}

/**
 * Group array by key
 */
export function groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return array.reduce(
    (groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    },
    {} as Record<string, T[]>
  );
}

/**
 * Calculate average
 */
export function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

/**
 * Calculate standard deviation
 */
export function standardDeviation(numbers: number[]): number {
  const avg = average(numbers);
  const squaredDiffs = numbers.map((n) => Math.pow(n - avg, 2));
  return Math.sqrt(average(squaredDiffs));
}

/**
 * Calculate percentile
 */
export function percentile(numbers: number[], p: number): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[index];
}

/**
 * Chunk array into smaller arrays
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Create a range of numbers
 */
export function range(start: number, end: number, step: number = 1): number[] {
  const result: number[] = [];
  for (let i = start; i < end; i += step) {
    result.push(i);
  }
  return result;
}

/**
 * Shuffle array
 */
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Memoize function
 */
export function memoize<T extends (...args: any[]) => any>(func: T): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Create a circuit breaker
 */
export class CircuitBreaker<T> {
  private failures = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private lastFailureTime?: number;

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000
  ) {}

  async execute(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.lastFailureTime && Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failures = 0;
      }
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.threshold) {
        this.state = 'open';
      }

      throw error;
    }
  }

  getState(): string {
    return this.state;
  }

  reset(): void {
    this.failures = 0;
    this.state = 'closed';
    this.lastFailureTime = undefined;
  }
}

/**
 * Create a rate limiter
 */
export class RateLimiter {
  private requests: number[] = [];

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  async acquire(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter((time) => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      await sleep(waitTime);
      return this.acquire();
    }

    this.requests.push(now);
  }

  getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter((time) => now - time < this.windowMs);
    return this.maxRequests - this.requests.length;
  }
}
