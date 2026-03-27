/**
 * Firestore Sanitizer
 * 
 * Removes undefined values from objects before sending to Firestore.
 * Firestore does not accept undefined values and will throw an error.
 */

/**
 * Sanitizes an object for Firestore by removing all undefined values recursively.
 * 
 * @param data - The data object to sanitize
 * @returns A new object with all undefined values removed
 */
export function sanitizeForFirestore<T extends Record<string, any>>(data: T): Partial<T> {
  if (data === null || data === undefined) {
    return {} as Partial<T>;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data
      .filter(item => item !== undefined)
      .map(item => {
        if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
          return sanitizeForFirestore(item);
        }
        return item;
      }) as any;
  }

  // Handle objects
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      // Skip undefined values
      if (value === undefined) {
        continue;
      }

      // Handle nested objects (but preserve Firestore special types)
      if (value !== null && typeof value === 'object' && !isFirestoreSpecialType(value)) {
        if (Array.isArray(value)) {
          cleaned[key] = value
            .filter(item => item !== undefined)
            .map(item => {
              if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
                return sanitizeForFirestore(item);
              }
              return item;
            });
        } else {
          cleaned[key] = sanitizeForFirestore(value);
        }
      } else {
        cleaned[key] = value;
      }
    }

    return cleaned as Partial<T>;
  }

  // Primitive values
  return data;
}

/**
 * Checks if a value is a Firestore special type (Timestamp, serverTimestamp, etc.)
 * These should not be recursively sanitized.
 */
function isFirestoreSpecialType(value: any): boolean {
  if (!value) return false;
  
  // Check for Firestore Timestamp
  if (value.constructor?.name === 'Timestamp') {
    return true;
  }
  
  // Check for serverTimestamp sentinel
  if (value.constructor?.name === 'FieldValue') {
    return true;
  }
  
  // Check for Date objects
  if (value instanceof Date) {
    return true;
  }
  
  // Check for increment, arrayUnion, arrayRemove
  if (typeof value.isEqual === 'function') {
    return true;
  }
  
  return false;
}

/**
 * Logs sanitization details for debugging
 */
export function sanitizeAndLog<T extends Record<string, any>>(
  data: T,
  context: string
): Partial<T> {
  console.log(`🧹 Sanitizing data for ${context}`);
  
  const originalKeys = Object.keys(data);
  const cleaned = sanitizeForFirestore(data);
  const cleanedKeys = Object.keys(cleaned);
  
  const removedKeys = originalKeys.filter(key => !cleanedKeys.includes(key));
  
  if (removedKeys.length > 0) {
    console.log(`  ⚠️ Removed ${removedKeys.length} undefined field(s): ${removedKeys.join(', ')}`);
  }
  
  console.log(`  ✅ Data sanitized for Firestore (${cleanedKeys.length} fields)`);
  
  return cleaned;
}

/**
 * Validates that an object has no undefined values
 * Useful for debugging
 */
export function validateNoUndefined(data: any, path = 'root'): string[] {
  const errors: string[] = [];

  if (data === undefined) {
    errors.push(`${path} is undefined`);
    return errors;
  }

  if (data === null || typeof data !== 'object') {
    return errors;
  }

  if (Array.isArray(data)) {
    data.forEach((item, index) => {
      errors.push(...validateNoUndefined(item, `${path}[${index}]`));
    });
    return errors;
  }

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) {
      errors.push(`${path}.${key} is undefined`);
    } else if (value !== null && typeof value === 'object' && !isFirestoreSpecialType(value)) {
      errors.push(...validateNoUndefined(value, `${path}.${key}`));
    }
  }

  return errors;
}
