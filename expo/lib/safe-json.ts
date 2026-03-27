/**
 * Safely parse JSON with error handling
 * Returns defaultValue if parsing fails
 */
export function safeJsonParse<T>(jsonString: string | null | undefined, defaultValue: T): T {
  if (!jsonString) {
    return defaultValue;
  }

  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.warn('⚠️ JSON parse error:', error);
    console.warn('⚠️ Failed to parse:', jsonString?.substring(0, 100));
    return defaultValue;
  }
}

/**
 * Safely stringify JSON with error handling
 * Returns empty string if stringification fails
 */
export function safeJsonStringify(value: any): string {
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.error('❌ JSON stringify error:', error);
    return '';
  }
}
