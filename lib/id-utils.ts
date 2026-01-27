/**
 * ID Utilities
 * 
 * Utilities for validating and normalizing Firebase UIDs.
 * Firebase UIDs are 28 characters long and contain alphanumeric characters.
 */

/**
 * Validates if a string looks like a Firebase UID
 * Firebase UIDs are typically 28 characters, alphanumeric
 */
export function isValidFirebaseUID(id: string | null | undefined): boolean {
  if (!id || typeof id !== 'string') return false;
  
  // Firebase UIDs are typically 28 chars, alphanumeric
  // But can also be custom IDs set by admin SDK
  const trimmed = id.trim();
  
  // Reject obvious business keys
  if (trimmed.includes('-') && /^[a-z]+-\d+$/i.test(trimmed)) {
    // Pattern like "paris-1", "lyon-2", etc. - these are business keys
    return false;
  }
  
  // Must be at least 10 chars and alphanumeric (with some special chars Firebase allows)
  if (trimmed.length < 10) return false;
  
  // Firebase UIDs are alphanumeric, may contain underscores
  return /^[a-zA-Z0-9_]+$/.test(trimmed);
}

/**
 * Checks if an ID is a business key (not a Firebase UID)
 */
export function isBusinessKey(id: string | null | undefined): boolean {
  if (!id || typeof id !== 'string') return false;
  
  const trimmed = id.trim();
  
  // Pattern like "paris-1", "lyon-2", "sitter-123", etc.
  if (/^[a-z]+-\d+$/i.test(trimmed)) return true;
  
  // Pattern like "pet-1234567890"
  if (/^(pet|user|sitter|booking|msg)-\d+$/i.test(trimmed)) return true;
  
  return false;
}

/**
 * Asserts that an ID is a valid Firebase UID
 * Throws an error if not valid
 */
export function assertValidUID(id: string | null | undefined, context: string): asserts id is string {
  if (!isValidFirebaseUID(id)) {
    const actualValue = id ? `"${id}"` : String(id);
    console.error(`❌ Invalid Firebase UID in ${context}: ${actualValue}`);
    throw new Error(`Invalid Firebase UID in ${context}: expected valid UID, got ${actualValue}`);
  }
}

/**
 * Safely gets a valid UID or returns null
 */
export function getValidUID(id: string | null | undefined): string | null {
  if (isValidFirebaseUID(id)) return id!;
  return null;
}

/**
 * Logs a warning if an ID doesn't look like a valid Firebase UID
 * Returns the ID anyway (for backwards compatibility during migration)
 */
export function warnIfInvalidUID(id: string | null | undefined, context: string): string | null {
  if (!id) return null;
  
  if (!isValidFirebaseUID(id)) {
    console.warn(`⚠️ [${context}] ID "${id}" doesn't look like a valid Firebase UID - may cause permission errors`);
  }
  
  return id;
}

/**
 * Normalizes user IDs in a document
 * Maps business keys to UIDs using a lookup map
 */
export function normalizeUserIds<T extends Record<string, any>>(
  doc: T,
  fields: string[],
  uidLookup?: Map<string, string>
): T {
  const normalized = { ...doc };
  
  for (const field of fields) {
    const value = normalized[field];
    if (!value || typeof value !== 'string') continue;
    
    // If it's already a valid UID, keep it
    if (isValidFirebaseUID(value)) continue;
    
    // Try to look up the correct UID
    if (uidLookup && uidLookup.has(value)) {
      (normalized as any)[field] = uidLookup.get(value);
      console.log(`📝 Normalized ${field}: "${value}" -> "${uidLookup.get(value)}"`);
    } else {
      console.warn(`⚠️ Cannot normalize ${field}: "${value}" - no mapping found`);
    }
  }
  
  return normalized;
}
