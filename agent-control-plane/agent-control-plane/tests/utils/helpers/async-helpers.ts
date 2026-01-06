/**
 * Async Test Helpers
 * Utilities for testing asynchronous code
 */

/**
 * Wait for specified milliseconds
 */
export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wait for condition to become true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: {
    timeout?: number;
    interval?: number;
    message?: string;
  } = {}
): Promise<void> {
  const { timeout = 5000, interval = 100, message } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await wait(interval);
  }

  throw new Error(message || `Condition not met within ${timeout}ms timeout`);
}

/**
 * Retry function until it succeeds or max retries reached
 */
export async function retry<T>(
  fn: () => T | Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    backoff?: 'linear' | 'exponential';
  } = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, backoff = 'exponential' } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        const waitTime =
          backoff === 'exponential' ? delay * Math.pow(2, attempt) : delay * (attempt + 1);

        await wait(waitTime);
      }
    }
  }

  throw new Error(
    `Failed after ${maxRetries + 1} attempts. Last error: ${lastError?.message || lastError}`
  );
}

/**
 * Execute function with timeout
 */
export async function withTimeout<T>(
  fn: () => T | Promise<T>,
  timeout: number,
  timeoutMessage?: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error(timeoutMessage || `Timeout of ${timeout}ms exceeded`)),
      timeout
    )
  );

  return Promise.race([fn(), timeoutPromise]);
}

/**
 * Debounce async function calls
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: NodeJS.Timeout | null = null;
  let resolveQueue: Array<(value: any) => void> = [];
  let rejectQueue: Array<(reason: any) => void> = [];

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise((resolve, reject) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      resolveQueue.push(resolve);
      rejectQueue.push(reject);

      timeoutId = setTimeout(async () => {
        const currentResolveQueue = [...resolveQueue];
        const currentRejectQueue = [...rejectQueue];

        resolveQueue = [];
        rejectQueue = [];

        try {
          const result = await fn(...args);
          currentResolveQueue.forEach((r) => r(result));
        } catch (error) {
          currentRejectQueue.forEach((r) => r(error));
        }
      }, delay);
    });
  };
}

/**
 * Execute promises in parallel with concurrency limit
 */
export async function parallelLimit<T>(
  tasks: Array<() => Promise<T>>,
  limit: number
): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];

  for (const [index, task] of tasks.entries()) {
    const promise = task().then((result) => {
      results[index] = result;
    });

    executing.push(promise);

    if (executing.length >= limit) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex((p) => p === promise),
        1
      );
    }
  }

  await Promise.all(executing);
  return results;
}

/**
 * Race multiple promises with different priorities
 */
export async function raceWithPriority<T>(
  tasks: Array<{ priority: number; task: () => Promise<T> }>
): Promise<T> {
  const sortedTasks = [...tasks].sort((a, b) => b.priority - a.priority);

  return Promise.race(sortedTasks.map(({ task }) => task()));
}

/**
 * Create a deferred promise
 */
export interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
}

export function defer<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: any) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

/**
 * Execute function and measure execution time
 */
export async function measureTime<T>(
  fn: () => T | Promise<T>
): Promise<{ result: T; duration: number }> {
  const startTime = performance.now();
  const result = await fn();
  const duration = performance.now() - startTime;

  return { result, duration };
}

/**
 * Poll function until it returns truthy value or timeout
 */
export async function poll<T>(
  fn: () => T | Promise<T>,
  options: {
    timeout?: number;
    interval?: number;
    validate?: (value: T) => boolean;
  } = {}
): Promise<T> {
  const { timeout = 5000, interval = 100, validate } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await fn();

    if (validate ? validate(result) : result) {
      return result;
    }

    await wait(interval);
  }

  throw new Error(`Polling timed out after ${timeout}ms`);
}

/**
 * Create a mock async function that resolves after delay
 */
export function mockAsyncFn<T>(value: T, delay: number = 100): () => Promise<T> {
  return async () => {
    await wait(delay);
    return value;
  };
}

/**
 * Create a mock async function that rejects after delay
 */
export function mockAsyncError(error: Error | string, delay: number = 100): () => Promise<never> {
  return async () => {
    await wait(delay);
    throw typeof error === 'string' ? new Error(error) : error;
  };
}

/**
 * Async utilities object
 */
export const asyncUtils = {
  wait,
  waitFor,
  retry,
  withTimeout,
  debounceAsync,
  parallelLimit,
  raceWithPriority,
  defer,
  measureTime,
  poll,
  mockAsyncFn,
  mockAsyncError,
};
