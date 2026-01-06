/**
 * Custom Assertion Helpers
 * Enhanced assertions for common test scenarios
 */

/**
 * Assert that value is defined (not null or undefined)
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message?: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message || `Expected value to be defined, got ${value}`);
  }
}

/**
 * Assert that array contains item
 */
export function assertContains<T>(array: T[], item: T, message?: string): void {
  if (!array.includes(item)) {
    throw new Error(message || `Expected array to contain ${item}, but it didn't`);
  }
}

/**
 * Assert that array does not contain item
 */
export function assertNotContains<T>(array: T[], item: T, message?: string): void {
  if (array.includes(item)) {
    throw new Error(message || `Expected array not to contain ${item}, but it did`);
  }
}

/**
 * Assert that value is within range
 */
export function assertInRange(value: number, min: number, max: number, message?: string): void {
  if (value < min || value > max) {
    throw new Error(message || `Expected ${value} to be between ${min} and ${max}`);
  }
}

/**
 * Assert that objects are deeply equal
 */
export function assertDeepEqual(actual: any, expected: any, message?: string): void {
  const actualStr = JSON.stringify(actual, null, 2);
  const expectedStr = JSON.stringify(expected, null, 2);

  if (actualStr !== expectedStr) {
    throw new Error(
      message || `Objects are not deeply equal:\nActual: ${actualStr}\nExpected: ${expectedStr}`
    );
  }
}

/**
 * Assert that string matches regex
 */
export function assertMatches(value: string, pattern: RegExp, message?: string): void {
  if (!pattern.test(value)) {
    throw new Error(message || `Expected "${value}" to match pattern ${pattern}`);
  }
}

/**
 * Assert that function throws
 */
export async function assertThrows(
  fn: () => any | Promise<any>,
  expectedError?: string | RegExp | ErrorConstructor,
  message?: string
): Promise<void> {
  let thrown = false;
  let error: any;

  try {
    await fn();
  } catch (e) {
    thrown = true;
    error = e;
  }

  if (!thrown) {
    throw new Error(message || 'Expected function to throw, but it did not');
  }

  if (expectedError) {
    if (typeof expectedError === 'string') {
      if (error.message !== expectedError) {
        throw new Error(`Expected error message "${expectedError}", got "${error.message}"`);
      }
    } else if (expectedError instanceof RegExp) {
      if (!expectedError.test(error.message)) {
        throw new Error(`Expected error message to match ${expectedError}, got "${error.message}"`);
      }
    } else if (typeof expectedError === 'function') {
      if (!(error instanceof expectedError)) {
        throw new Error(
          `Expected error to be instance of ${expectedError.name}, got ${error.constructor.name}`
        );
      }
    }
  }
}

/**
 * Assert that function does not throw
 */
export async function assertDoesNotThrow(
  fn: () => any | Promise<any>,
  message?: string
): Promise<void> {
  try {
    await fn();
  } catch (error: any) {
    throw new Error(message || `Expected function not to throw, but it threw: ${error.message}`);
  }
}

/**
 * Assert that promise resolves within timeout
 */
export async function assertResolvesWithin(
  promise: Promise<any>,
  timeout: number,
  message?: string
): Promise<void> {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout exceeded')), timeout)
  );

  try {
    await Promise.race([promise, timeoutPromise]);
  } catch (error: any) {
    if (error.message === 'Timeout exceeded') {
      throw new Error(
        message || `Expected promise to resolve within ${timeout}ms, but it timed out`
      );
    }
    throw error;
  }
}

/**
 * Assert that value has expected type
 */
export function assertType(value: any, expectedType: string, message?: string): void {
  const actualType = typeof value;

  if (actualType !== expectedType) {
    throw new Error(message || `Expected type ${expectedType}, got ${actualType}`);
  }
}

/**
 * Assert that value is instance of class
 */
export function assertInstanceOf<T>(
  value: any,
  constructor: new (...args: any[]) => T,
  message?: string
): asserts value is T {
  if (!(value instanceof constructor)) {
    throw new Error(
      message ||
        `Expected value to be instance of ${constructor.name}, got ${value?.constructor?.name || typeof value}`
    );
  }
}

/**
 * Assert that array has expected length
 */
export function assertLength(array: any[], expectedLength: number, message?: string): void {
  if (array.length !== expectedLength) {
    throw new Error(message || `Expected array length ${expectedLength}, got ${array.length}`);
  }
}

/**
 * Assert that array is empty
 */
export function assertEmpty(array: any[], message?: string): void {
  if (array.length !== 0) {
    throw new Error(message || `Expected array to be empty, but it has ${array.length} items`);
  }
}

/**
 * Assert that array is not empty
 */
export function assertNotEmpty(array: any[], message?: string): void {
  if (array.length === 0) {
    throw new Error(message || 'Expected array not to be empty, but it is');
  }
}

/**
 * Assert that object has property
 */
export function assertHasProperty(obj: any, property: string, message?: string): void {
  if (!(property in obj)) {
    throw new Error(message || `Expected object to have property "${property}", but it doesn't`);
  }
}

/**
 * Assert that all items in array match predicate
 */
export function assertAll<T>(array: T[], predicate: (item: T) => boolean, message?: string): void {
  const failedItems = array.filter((item) => !predicate(item));

  if (failedItems.length > 0) {
    throw new Error(
      message || `Expected all items to match predicate, but ${failedItems.length} items failed`
    );
  }
}

/**
 * Assert that at least one item in array matches predicate
 */
export function assertSome<T>(array: T[], predicate: (item: T) => boolean, message?: string): void {
  if (!array.some(predicate)) {
    throw new Error(message || 'Expected at least one item to match predicate, but none did');
  }
}

/**
 * Assertion utilities object
 */
export const assert = {
  defined: assertDefined,
  contains: assertContains,
  notContains: assertNotContains,
  inRange: assertInRange,
  deepEqual: assertDeepEqual,
  matches: assertMatches,
  throws: assertThrows,
  doesNotThrow: assertDoesNotThrow,
  resolvesWithin: assertResolvesWithin,
  type: assertType,
  instanceOf: assertInstanceOf,
  length: assertLength,
  empty: assertEmpty,
  notEmpty: assertNotEmpty,
  hasProperty: assertHasProperty,
  all: assertAll,
  some: assertSome,
};
