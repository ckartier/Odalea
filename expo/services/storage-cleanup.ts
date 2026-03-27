/**
 * Storage Cleanup Service - Odalea
 * 
 * Utilitaires pour la gestion des fichiers orphelins et le nettoyage Storage.
 * Best-effort: les erreurs sont loggées mais ne bloquent pas les opérations principales.
 */

import { storage, db } from './firebase';
import { 
  ref, 
  listAll, 
  getMetadata,
} from 'firebase/storage';
import { 
  collection, 
  doc, 
  getDoc, 
  writeBatch,
  Timestamp,
  addDoc,
} from 'firebase/firestore';
import { deleteStorageFile, deleteStorageFolder } from './storage-utils';

// ============================================================================
// TYPES
// ============================================================================

export interface OrphanedFile {
  path: string;
  url?: string;
  size?: number;
  createdAt?: Date;
  reason: 'no_reference' | 'deleted_parent' | 'expired' | 'unknown';
}

export interface CleanupResult {
  scanned: number;
  deleted: number;
  failed: number;
  orphans: OrphanedFile[];
}

export interface CleanupOptions {
  dryRun?: boolean;
  maxAge?: number; // in days
  logPrefix?: string;
}

// ============================================================================
// CLEANUP ON DELETE OPERATIONS
// ============================================================================

/**
 * Supprime les fichiers Storage associés à un post
 */
export async function cleanupPostMedia(
  postId: string,
  userId: string,
  images?: string[]
): Promise<void> {
  const prefix = '[StorageCleanup][Post]';
  
  try {
    console.log(`${prefix} Cleaning up media for post ${postId}`);
    
    // Delete specific images if provided
    if (images && images.length > 0) {
      await Promise.all(
        images.map(async (url) => {
          const success = await deleteStorageFile(url);
          if (!success) {
            console.warn(`${prefix} Failed to delete: ${url.substring(0, 50)}...`);
            await logOrphanedFile(url, 'deleted_parent');
          }
        })
      );
    }
    
    // Also try to delete the entire post folder
    const folderPath = `users/${userId}/community/${postId}`;
    await deleteStorageFolder(folderPath);
    
    // Legacy path cleanup
    const legacyPath = `users/${userId}/posts/${postId}`;
    await deleteStorageFolder(legacyPath);
    
    console.log(`${prefix} Cleanup complete for post ${postId}`);
  } catch (error) {
    console.error(`${prefix} Error during cleanup:`, error);
  }
}

/**
 * Supprime les fichiers Storage associés à un pet
 */
export async function cleanupPetMedia(
  petId: string,
  userId: string
): Promise<void> {
  const prefix = '[StorageCleanup][Pet]';
  
  try {
    console.log(`${prefix} Cleaning up media for pet ${petId}`);
    
    const folderPath = `users/${userId}/pets/${petId}`;
    const result = await deleteStorageFolder(folderPath);
    
    console.log(`${prefix} Cleanup complete: ${result.deleted} files deleted`);
  } catch (error) {
    console.error(`${prefix} Error during cleanup:`, error);
  }
}

/**
 * Supprime les fichiers Storage associés à un report lost/found
 */
export async function cleanupLostFoundMedia(
  reportId: string,
  userId: string,
  type: 'lost' | 'found'
): Promise<void> {
  const prefix = '[StorageCleanup][LostFound]';
  
  try {
    console.log(`${prefix} Cleaning up media for ${type} report ${reportId}`);
    
    const folderPath = `users/${userId}/${type}/${reportId}`;
    const result = await deleteStorageFolder(folderPath);
    
    // Legacy path cleanup
    const legacyPath = `users/${userId}/lost-found/${reportId}`;
    await deleteStorageFolder(legacyPath);
    
    console.log(`${prefix} Cleanup complete: ${result.deleted} files deleted`);
  } catch (error) {
    console.error(`${prefix} Error during cleanup:`, error);
  }
}

/**
 * Supprime les fichiers Storage associés à une conversation
 */
export async function cleanupConversationMedia(
  conversationId: string,
  userId: string
): Promise<void> {
  const prefix = '[StorageCleanup][Conversation]';
  
  try {
    console.log(`${prefix} Cleaning up media for conversation ${conversationId}`);
    
    const folderPath = `users/${userId}/messages/${conversationId}`;
    const result = await deleteStorageFolder(folderPath);
    
    console.log(`${prefix} Cleanup complete: ${result.deleted} files deleted`);
  } catch (error) {
    console.error(`${prefix} Error during cleanup:`, error);
  }
}

/**
 * Supprime les fichiers Storage associés à un challenge
 */
export async function cleanupChallengeMedia(
  challengeId: string,
  userId: string
): Promise<void> {
  const prefix = '[StorageCleanup][Challenge]';
  
  try {
    console.log(`${prefix} Cleaning up media for challenge ${challengeId}`);
    
    const folderPath = `users/${userId}/challenges/${challengeId}`;
    const result = await deleteStorageFolder(folderPath);
    
    console.log(`${prefix} Cleanup complete: ${result.deleted} files deleted`);
  } catch (error) {
    console.error(`${prefix} Error during cleanup:`, error);
  }
}

/**
 * Supprime les fichiers Storage associés à un user (compte supprimé)
 */
export async function cleanupUserMedia(userId: string): Promise<void> {
  const prefix = '[StorageCleanup][User]';
  
  try {
    console.log(`${prefix} Cleaning up ALL media for user ${userId}`);
    
    const folderPath = `users/${userId}`;
    const result = await deleteStorageFolder(folderPath);
    
    // Also cleanup verifications
    const verificationsPath = `verifications/${userId}`;
    await deleteStorageFolder(verificationsPath);
    
    console.log(`${prefix} Cleanup complete: ${result.deleted} files deleted`);
  } catch (error) {
    console.error(`${prefix} Error during cleanup:`, error);
  }
}

// ============================================================================
// ORPHAN LOGGING
// ============================================================================

/**
 * Log un fichier orphelin dans Firestore pour analyse ultérieure
 */
export async function logOrphanedFile(
  pathOrUrl: string,
  reason: OrphanedFile['reason']
): Promise<void> {
  try {
    const orphansCollection = collection(db, 'storage_orphans');
    
    await addDoc(orphansCollection, {
      path: pathOrUrl,
      reason,
      createdAt: Timestamp.now(),
      status: 'pending',
    });
    
    console.log('[StorageCleanup] Orphan logged:', pathOrUrl.substring(0, 50));
  } catch (error) {
    console.error('[StorageCleanup] Failed to log orphan:', error);
  }
}

/**
 * Marque un fichier orphelin comme traité
 */
export async function markOrphanAsProcessed(orphanId: string): Promise<void> {
  try {
    const orphanRef = doc(db, 'storage_orphans', orphanId);
    const batch = writeBatch(db);
    
    batch.update(orphanRef, {
      status: 'processed',
      processedAt: Timestamp.now(),
    });
    
    await batch.commit();
  } catch (error) {
    console.error('[StorageCleanup] Failed to mark orphan as processed:', error);
  }
}

// ============================================================================
// BATCH CLEANUP (Admin only)
// ============================================================================

/**
 * Scan et nettoie les fichiers orphelins pour un utilisateur
 * Note: Cette fonction est destinée à être utilisée par des admins ou des Cloud Functions
 */
export async function scanUserOrphans(
  userId: string,
  options: CleanupOptions = {}
): Promise<CleanupResult> {
  const { dryRun = true, logPrefix = '[StorageCleanup]' } = options;
  
  const result: CleanupResult = {
    scanned: 0,
    deleted: 0,
    failed: 0,
    orphans: [],
  };
  
  try {
    console.log(`${logPrefix} Scanning orphans for user ${userId} (dryRun: ${dryRun})`);
    
    const userFolderRef = ref(storage, `users/${userId}`);
    const listResult = await listAll(userFolderRef);
    
    // Scan all subfolders
    for (const prefixRef of listResult.prefixes) {
      const subfolderName = prefixRef.name;
      const subfolderRef = ref(storage, `users/${userId}/${subfolderName}`);
      const subListResult = await listAll(subfolderRef);
      
      for (const itemRef of subListResult.items) {
        result.scanned++;
        
        try {
          const metadata = await getMetadata(itemRef);
          const createdAt = new Date(metadata.timeCreated);
          
          // Check if file is orphaned (no reference in Firestore)
          const isOrphaned = await checkIfOrphaned(userId, subfolderName, itemRef.fullPath);
          
          if (isOrphaned) {
            result.orphans.push({
              path: itemRef.fullPath,
              size: metadata.size,
              createdAt,
              reason: 'no_reference',
            });
            
            if (!dryRun) {
              const success = await deleteStorageFile(itemRef.fullPath);
              if (success) {
                result.deleted++;
              } else {
                result.failed++;
              }
            }
          }
        } catch (error) {
          console.error(`${logPrefix} Error processing file:`, itemRef.fullPath, error);
          result.failed++;
        }
      }
    }
    
    console.log(`${logPrefix} Scan complete:`, result);
    return result;
  } catch (error) {
    console.error(`${logPrefix} Error scanning orphans:`, error);
    return result;
  }
}

/**
 * Vérifie si un fichier est orphelin (pas de référence dans Firestore)
 */
async function checkIfOrphaned(
  userId: string,
  folderType: string,
  filePath: string
): Promise<boolean> {
  try {
    switch (folderType) {
      case 'pets': {
        // Extract petId from path
        const match = filePath.match(/pets\/([^/]+)/);
        if (!match) return true;
        const petId = match[1];
        
        const petRef = doc(db, 'pets', petId);
        const petDoc = await getDoc(petRef);
        return !petDoc.exists();
      }
      
      case 'community':
      case 'posts': {
        // Extract postId from path
        const match = filePath.match(/(community|posts)\/([^/]+)/);
        if (!match) return true;
        const postId = match[2];
        
        const postRef = doc(db, 'posts', postId);
        const postDoc = await getDoc(postRef);
        return !postDoc.exists();
      }
      
      case 'lost':
      case 'found':
      case 'lost-found': {
        // Extract reportId from path
        const match = filePath.match(/(lost|found|lost-found)\/([^/]+)/);
        if (!match) return true;
        const reportId = match[2];
        
        const reportRef = doc(db, 'lost_found_reports', reportId);
        const reportDoc = await getDoc(reportRef);
        return !reportDoc.exists();
      }
      
      case 'profile':
      case 'avatar.jpg':
      case 'cover.jpg': {
        // Profile files are never orphaned if user exists
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        return !userDoc.exists();
      }
      
      default:
        // Unknown folder type - consider not orphaned to be safe
        return false;
    }
  } catch (error) {
    console.error('[StorageCleanup] Error checking orphan status:', error);
    return false; // Safe default
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Nettoie les fichiers temporaires vieux de plus de X jours
 */
export async function cleanupOldTempFiles(
  userId: string,
  maxAgeDays: number = 7
): Promise<CleanupResult> {
  const result: CleanupResult = {
    scanned: 0,
    deleted: 0,
    failed: 0,
    orphans: [],
  };
  
  try {
    const tempFolders = ['community', 'posts', 'lost', 'found', 'lost-found'];
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(Date.now() - maxAgeMs);
    
    for (const folder of tempFolders) {
      const folderRef = ref(storage, `users/${userId}/${folder}`);
      
      try {
        const listResult = await listAll(folderRef);
        
        for (const prefixRef of listResult.prefixes) {
          // Check if folder name starts with "temp_" or "post_"
          if (prefixRef.name.startsWith('temp_') || prefixRef.name.startsWith('post_')) {
            const subListResult = await listAll(prefixRef);
            
            for (const itemRef of subListResult.items) {
              result.scanned++;
              
              try {
                const metadata = await getMetadata(itemRef);
                const createdAt = new Date(metadata.timeCreated);
                
                if (createdAt < cutoffDate) {
                  const success = await deleteStorageFile(itemRef.fullPath);
                  if (success) {
                    result.deleted++;
                  } else {
                    result.failed++;
                  }
                }
              } catch {
                result.failed++;
              }
            }
          }
        }
      } catch {
        // Folder might not exist
      }
    }
    
    console.log('[StorageCleanup] Temp cleanup complete:', result);
    return result;
  } catch (error) {
    console.error('[StorageCleanup] Error cleaning temp files:', error);
    return result;
  }
}

export default {
  cleanupPostMedia,
  cleanupPetMedia,
  cleanupLostFoundMedia,
  cleanupConversationMedia,
  cleanupChallengeMedia,
  cleanupUserMedia,
  logOrphanedFile,
  markOrphanAsProcessed,
  scanUserOrphans,
  cleanupOldTempFiles,
};
