/**
 * Time Testing Helpers
 * Utilities for controlling time in tests
 */

export class MockClock {
  private currentTime: number;
  private timers: Map<number, { callback: () => void; time: number }> = new Map();
  private intervals: Map<number, { callback: () => void; interval: number; lastRun: number }> =
    new Map();
  private timerId: number = 1;

  constructor(initialTime: number = Date.now()) {
    this.currentTime = initialTime;
  }

  /**
   * Get current time
   */
  now(): number {
    return this.currentTime;
  }

  /**
   * Advance time by milliseconds
   */
  tick(ms: number): void {
    const targetTime = this.currentTime + ms;

    // Execute timers
    const timersToRun: Array<{ callback: () => void; time: number }> = [];

    this.timers.forEach((timer, id) => {
      if (timer.time <= targetTime) {
        timersToRun.push(timer);
        this.timers.delete(id);
      }
    });

    // Sort by time
    timersToRun.sort((a, b) => a.time - b.time);

    // Execute in order
    for (const timer of timersToRun) {
      this.currentTime = timer.time;
      timer.callback();
    }

    // Execute intervals
    this.intervals.forEach((interval, id) => {
      let nextRun = interval.lastRun + interval.interval;

      while (nextRun <= targetTime) {
        this.currentTime = nextRun;
        interval.callback();
        interval.lastRun = nextRun;
        nextRun += interval.interval;
      }
    });

    this.currentTime = targetTime;
  }

  /**
   * Set current time
   */
  setTime(time: number): void {
    this.currentTime = time;
  }

  /**
   * Mock setTimeout
   */
  setTimeout(callback: () => void, ms: number): number {
    const id = this.timerId++;
    this.timers.set(id, {
      callback,
      time: this.currentTime + ms,
    });
    return id;
  }

  /**
   * Mock clearTimeout
   */
  clearTimeout(id: number): void {
    this.timers.delete(id);
  }

  /**
   * Mock setInterval
   */
  setInterval(callback: () => void, ms: number): number {
    const id = this.timerId++;
    this.intervals.set(id, {
      callback,
      interval: ms,
      lastRun: this.currentTime,
    });
    return id;
  }

  /**
   * Mock clearInterval
   */
  clearInterval(id: number): void {
    this.intervals.delete(id);
  }

  /**
   * Run all pending timers
   */
  runAll(): void {
    // Get maximum time from all timers
    let maxTime = this.currentTime;

    this.timers.forEach((timer) => {
      if (timer.time > maxTime) {
        maxTime = timer.time;
      }
    });

    if (maxTime > this.currentTime) {
      this.tick(maxTime - this.currentTime);
    }
  }

  /**
   * Run only pending timers (not intervals)
   */
  runOnlyPendingTimers(): void {
    const timersToRun = Array.from(this.timers.values());

    timersToRun.forEach((timer) => {
      this.currentTime = timer.time;
      timer.callback();
    });

    this.timers.clear();
  }

  /**
   * Reset clock
   */
  reset(time?: number): void {
    this.currentTime = time || Date.now();
    this.timers.clear();
    this.intervals.clear();
    this.timerId = 1;
  }

  /**
   * Get pending timer count
   */
  getPendingTimerCount(): number {
    return this.timers.size + this.intervals.size;
  }
}

/**
 * Create frozen time for testing
 */
export function freezeTime(time?: Date | number): () => void {
  const frozenTime = time instanceof Date ? time.getTime() : time || Date.now();
  const originalDateNow = Date.now;

  Date.now = () => frozenTime;

  // Return cleanup function
  return () => {
    Date.now = originalDateNow;
  };
}

/**
 * Travel to specific date/time
 */
export function travelTo(time: Date | number): () => void {
  return freezeTime(time);
}

/**
 * Measure execution time
 */
export async function measureExecutionTime<T>(
  fn: () => T | Promise<T>
): Promise<{ result: T; duration: number }> {
  const startTime = performance.now();
  const result = await fn();
  const duration = performance.now() - startTime;

  return { result, duration };
}

/**
 * Create time range for testing
 */
export function createTimeRange(
  start: Date | number,
  end: Date | number,
  step: number = 1000
): Date[] {
  const startTime = start instanceof Date ? start.getTime() : start;
  const endTime = end instanceof Date ? end.getTime() : end;
  const dates: Date[] = [];

  for (let time = startTime; time <= endTime; time += step) {
    dates.push(new Date(time));
  }

  return dates;
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  } else if (ms < 3600000) {
    return `${(ms / 60000).toFixed(2)}m`;
  } else {
    return `${(ms / 3600000).toFixed(2)}h`;
  }
}

/**
 * Time utilities object
 */
export const timeUtils = {
  MockClock,
  freezeTime,
  travelTo,
  measureExecutionTime,
  createTimeRange,
  formatDuration,
};
