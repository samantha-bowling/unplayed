
/**
 * Utility functions for safely handling JSON data with proper type safety
 */

/**
 * Safely extract a number from a JSON object
 * @param obj The source object
 * @param key The property key to access
 * @param fallback Default value to return if property is missing or wrong type
 * @returns The number value or fallback
 */
export function safeGetNumber(obj: unknown, key: string, fallback: number): number {
  if (!obj || typeof obj !== 'object') return fallback;
  const data = obj as Record<string, unknown>;
  const value = data[key];
  
  // Handle different types that could be returned from JSON
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed;
  }
  
  return fallback;
}

/**
 * Safely extract a string from a JSON object
 * @param obj The source object
 * @param key The property key to access
 * @param fallback Default value to return if property is missing or wrong type
 * @returns The string value or fallback
 */
export function safeGetString(obj: unknown, key: string, fallback: string): string {
  if (!obj || typeof obj !== 'object') return fallback;
  const data = obj as Record<string, unknown>;
  const value = data[key];
  
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return fallback;
  
  // Convert to string if it's something else
  return String(value);
}

/**
 * Safely extract a boolean from a JSON object
 * @param obj The source object
 * @param key The property key to access
 * @param fallback Default value to return if property is missing or wrong type
 * @returns The boolean value or fallback
 */
export function safeGetBoolean(obj: unknown, key: string, fallback: boolean): boolean {
  if (!obj || typeof obj !== 'object') return fallback;
  const data = obj as Record<string, unknown>;
  const value = data[key];
  
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  
  return fallback;
}

/**
 * Safely extract a value with a specific type from a JSON object
 * @param obj The source object
 * @param key The property key to access
 * @param fallback Default value to return if property is missing or wrong type
 * @returns The typed value or fallback
 */
export function safeGet<T>(obj: unknown, key: string, fallback: T): T {
  if (!obj || typeof obj !== 'object') return fallback;
  const data = obj as Record<string, unknown>;
  const value = data[key];
  
  if (value === undefined || value === null) return fallback;
  
  // For primitives, we can do basic type checking
  if (typeof value === typeof fallback) {
    return value as T;
  }
  
  return fallback;
}
