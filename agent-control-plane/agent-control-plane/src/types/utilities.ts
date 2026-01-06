/**
 * Type Safety Utilities
 * Common type helpers, guards, and utilities for improving type safety
 */

/**
 * Branded types for IDs to prevent mixing different ID types
 */
export type Brand<K, T> = K & { __brand: T };

export type TaskId = Brand<string, 'TaskId'>;
export type AgentId = Brand<string, 'AgentId'>;
export type SwarmId = Brand<string, 'SwarmId'>;
export type UserId = Brand<string, 'UserId'>;
export type SessionId = Brand<string, 'SessionId'>;
export type MemoryKey = Brand<string, 'MemoryKey'>;

/**
 * Create branded ID
 */
export function createBrandedId<T>(id: string): Brand<string, T> {
  return id as Brand<string, T>;
}

/**
 * JSON-serializable types
 */
export type JsonPrimitive = string | number | boolean | null;
export type JsonArray = JsonValue[];
export type JsonObject = { [key: string]: JsonValue };
export type JsonValue = JsonPrimitive | JsonArray | JsonObject;

/**
 * Type-safe Record with known value type
 */
export type TypedRecord<K extends string | number | symbol, V> = Record<K, V>;

/**
 * Make specific properties required
 */
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * Make specific properties optional
 */
export type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Deep partial type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Deep readonly type
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Ensure type is serializable
 */
export type Serializable<T> = T extends JsonValue ? T : never;

/**
 * Type guard for non-null/undefined values
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard for strings
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard for numbers
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Type guard for booleans
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Type guard for objects
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard for arrays
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Type guard for functions
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

/**
 * Type guard for promises
 */
export function isPromise<T>(value: unknown): value is Promise<T> {
  return (
    value instanceof Promise || (isObject(value) && isFunction((value as { then?: unknown }).then))
  );
}

/**
 * Type guard for JSON values
 */
export function isJsonValue(value: unknown): value is JsonValue {
  if (value === null) return true;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return true;
  }
  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }
  if (isObject(value)) {
    return Object.values(value).every(isJsonValue);
  }
  return false;
}

/**
 * Type guard for JSON objects
 */
export function isJsonObject(value: unknown): value is JsonObject {
  return isObject(value) && Object.values(value).every(isJsonValue);
}

/**
 * Type predicate for Record<string, unknown>
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return isObject(value);
}

/**
 * Type predicate for non-empty array
 */
export function isNonEmptyArray<T>(value: T[]): value is [T, ...T[]] {
  return value.length > 0;
}

/**
 * Assert value is defined
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message = 'Value must be defined'
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}

/**
 * Assert value is of type
 */
export function assertType<T>(
  value: unknown,
  guard: (value: unknown) => value is T,
  message = 'Type assertion failed'
): asserts value is T {
  if (!guard(value)) {
    throw new Error(message);
  }
}

/**
 * Safe JSON parse with type validation
 */
export function parseJson<T = JsonValue>(
  json: string,
  validator?: (value: unknown) => value is T
): T {
  const parsed: unknown = JSON.parse(json);

  if (validator && !validator(parsed)) {
    throw new Error('JSON validation failed');
  }

  if (!validator && !isJsonValue(parsed)) {
    throw new Error('Invalid JSON value');
  }

  return parsed as T;
}

/**
 * Safe type cast with runtime validation
 */
export function safeCast<T>(value: unknown, guard: (value: unknown) => value is T, fallback: T): T {
  return guard(value) ? value : fallback;
}

/**
 * Extract keys from object type
 */
export type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

/**
 * Pick properties of specific type
 */
export type PickByType<T, V> = Pick<T, KeysOfType<T, V>>;

/**
 * Omit properties of specific type
 */
export type OmitByType<T, V> = Omit<T, KeysOfType<T, V>>;

/**
 * Function type helpers
 */
export type AsyncFunction<TArgs extends unknown[] = unknown[], TReturn = unknown> = (
  ...args: TArgs
) => Promise<TReturn>;

export type SyncFunction<TArgs extends unknown[] = unknown[], TReturn = unknown> = (
  ...args: TArgs
) => TReturn;

export type AnyFunction<TArgs extends unknown[] = unknown[], TReturn = unknown> =
  | SyncFunction<TArgs, TReturn>
  | AsyncFunction<TArgs, TReturn>;

/**
 * Extract promise type
 */
export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

/**
 * Extract array element type
 */
export type ArrayElement<T> = T extends (infer U)[] ? U : never;

/**
 * Tuple type utilities
 */
export type Head<T extends unknown[]> = T extends [infer H, ...unknown[]] ? H : never;
export type Tail<T extends unknown[]> = T extends [unknown, ...infer R] ? R : never;
export type Last<T extends unknown[]> = T extends [...unknown[], infer L] ? L : never;

/**
 * Constructor type
 */
export type Constructor<T = object, TArgs extends unknown[] = unknown[]> = new (
  ...args: TArgs
) => T;

/**
 * Abstract constructor type
 */
export type AbstractConstructor<T = object, TArgs extends unknown[] = unknown[]> = abstract new (
  ...args: TArgs
) => T;

/**
 * Class type (constructor or abstract constructor)
 */
export type Class<T = object, TArgs extends unknown[] = unknown[]> =
  | Constructor<T, TArgs>
  | AbstractConstructor<T, TArgs>;

/**
 * Ensure all properties are present (no missing keys)
 */
export type Exact<T, U extends T> = T & {
  [K in Exclude<keyof U, keyof T>]: never;
};

/**
 * Make readonly mutable
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

/**
 * Deep mutable
 */
export type DeepMutable<T> = {
  -readonly [P in keyof T]: T[P] extends object ? DeepMutable<T[P]> : T[P];
};
