/**
 * Firebase Storage Utilities - Source de vérité unique pour Odalea
 * 
 * Ce fichier contient tous les utilitaires nécessaires pour:
 * - Upload de médias vers Firebase Storage
 * - Sanitization des données pour Firestore
 * - Gestion des chemins Storage standardisés
 * - Suppression et nettoyage des fichiers
 */

import { storage, auth } from './firebase';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject,
  listAll,
} from 'firebase/storage';
import { Platform } from 'react-native';
import { Timestamp } from 'firebase/firestore';

// ============================================================================
// TYPES
// ============================================================================

export interface MediaItem {
  url: string;
  path: string;
  type: 'image' | 'video' | 'audio' | 'document';
  width?: number;
  height?: number;
  size?: number;
  contentType?: string;
  uploadedAt: number;
}

export interface UploadResult {
  downloadURL: string;
  storagePath: string;
  size: number;
  contentType: string;
}

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  contentType?: string;
  maxRetries?: number;
}

// ============================================================================
// CHEMINS STORAGE OFFICIELS
// ============================================================================

export const StoragePaths = {
  // Users
  userAvatar: (uid: string) => `users/${uid}/avatar.jpg`,
  userCover: (uid: string) => `users/${uid}/cover.jpg`,
  
  // Pets
  petCover: (uid: string, petId: string) => `users/${uid}/pets/${petId}/cover.jpg`,
  petGallery: (uid: string, petId: string, uuid: string) => `users/${uid}/pets/${petId}/gallery/${uuid}.jpg`,
  
  // Community Posts
  communityPost: (uid: string, postId: string, uuid: string) => `users/${uid}/community/${postId}/${uuid}.jpg`,
  
  // Lost & Found
  lostReport: (uid: string, lostId: string, uuid: string) => `users/${uid}/lost/${lostId}/${uuid}.jpg`,
  foundReport: (uid: string, foundId: string, uuid: string) => `users/${uid}/found/${foundId}/${uuid}.jpg`,
  
  // Messages
  messageAttachment: (uid: string, conversationId: string, messageId: string, uuid: string, ext: string = 'jpg') => 
    `users/${uid}/messages/${conversationId}/${messageId}/${uuid}.${ext}`,
  
  // Challenges
  challengeProof: (uid: string, challengeId: string, uuid: string) => `users/${uid}/challenges/${challengeId}/${uuid}.jpg`,
  
  // Shop (admin only)
  shopProduct: (productId: string, uuid: string) => `shop/products/${productId}/${uuid}.jpg`,
  shopBanner: (uuid: string) => `shop/banners/${uuid}.jpg`,
  
  // Vet IA (optional attachments)
  vetAttachment: (uid: string, sessionId: string, messageId: string, uuid: string) => 
    `users/${uid}/vet/${sessionId}/${messageId}/${uuid}.jpg`,
  
  // Professional verification
  verification: (uid: string, filename: string) => `verifications/${uid}/${filename}`,
  
  // Notifications (admin only)
  notificationAsset: (uuid: string) => `notifications/assets/${uuid}.jpg`,
} as const;

// ============================================================================
// SANITIZATION POUR FIRESTORE
// ============================================================================

/**
 * Sanitize un objet pour Firestore:
 * - Supprime toutes les clés undefined
 * - Convertit Date en Timestamp
 * - Garantit un objet sérialisable
 */
export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj
      .filter(item => item !== undefined)
      .map(item => {
        if (typeof item === 'object' && item !== null) {
          return sanitizeForFirestore(item);
        }
        return item;
      }) as unknown as T;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  // Handle Date conversion
  if (obj instanceof Date) {
    return Timestamp.fromDate(obj) as unknown as T;
  }

  // Handle Timestamp (keep as is)
  if (obj instanceof Timestamp) {
    return obj as unknown as T;
  }

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Skip undefined values
    if (value === undefined) {
      continue;
    }

    // Handle null (keep as is for Firestore)
    if (value === null) {
      sanitized[key] = null;
      continue;
    }

    // Handle Date
    if (value instanceof Date) {
      sanitized[key] = Timestamp.fromDate(value);
      continue;
    }

    // Handle Timestamp
    if (value instanceof Timestamp) {
      sanitized[key] = value;
      continue;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      sanitized[key] = value
        .filter(item => item !== undefined)
        .map(item => {
          if (typeof item === 'object' && item !== null) {
            return sanitizeForFirestore(item);
          }
          return item;
        });
      continue;
    }

    // Handle nested objects
    if (typeof value === 'object') {
      sanitized[key] = sanitizeForFirestore(value);
      continue;
    }

    // Keep primitive values
    sanitized[key] = value;
  }

  return sanitized as T;
}

/**
 * Valide qu'un objet ne contient pas de valeurs undefined
 */
export function validateNoUndefined(obj: Record<string, any>, path: string = ''): string[] {
  const errors: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;

    if (value === undefined) {
      errors.push(`undefined value at: ${currentPath}`);
    } else if (typeof value === 'object' && value !== null && !(value instanceof Date) && !(value instanceof Timestamp)) {
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (item === undefined) {
            errors.push(`undefined value at: ${currentPath}[${index}]`);
          } else if (typeof item === 'object' && item !== null) {
            errors.push(...validateNoUndefined(item, `${currentPath}[${index}]`));
          }
        });
      } else {
        errors.push(...validateNoUndefined(value, currentPath));
      }
    }
  }

  return errors;
}

// ============================================================================
// UPLOAD UTILITIES
// ============================================================================

/**
 * Convertit une URI locale en Blob pour l'upload
 */
async function uriToBlob(uri: string): Promise<Blob> {
  console.log('[Storage] 📦 Converting URI to blob:', uri.substring(0, 50) + '...');
  
  // Handle web URLs directly
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    console.log('[Storage] 📦 Using fetch for web URL');
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
    }
    const blob = await response.blob();
    console.log('[Storage] ✅ Blob created via fetch, size:', blob.size);
    return blob;
  }
  
  // Handle native URIs (file://, content://)
  if (Platform.OS !== 'web' && (uri.startsWith('file://') || uri.startsWith('content://'))) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        if (xhr.status === 200) {
          console.log('[Storage] ✅ Blob created via XHR, size:', xhr.response?.size || 0);
          resolve(xhr.response as Blob);
        } else {
          console.error('[Storage] ❌ XHR failed with status:', xhr.status);
          reject(new Error(`XHR failed with status ${xhr.status}`));
        }
      };
      xhr.onerror = function (e) {
        console.error('[Storage] ❌ XHR error:', e);
        reject(new Error('XHR network error'));
      };
      xhr.responseType = 'blob';
      xhr.open('GET', uri, true);
      xhr.send();
    });
  }
  
  // Fallback to fetch for other URIs
  console.log('[Storage] 📦 Using fetch fallback');
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
  }
  const blob = await response.blob();
  console.log('[Storage] ✅ Blob created via fetch fallback, size:', blob.size);
  return blob;
}

/**
 * Détermine le content type basé sur l'extension
 */
function getContentType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  const contentTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'heic': 'image/heic',
    'mp4': 'video/mp4',
    'mov': 'video/quicktime',
    'm4a': 'audio/mp4',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'pdf': 'application/pdf',
  };
  return contentTypes[ext || ''] || 'application/octet-stream';
}

/**
 * Upload un média vers Firebase Storage avec retry
 * 
 * @param localUri - URI locale du fichier (file://, content://, ou https://)
 * @param storagePath - Chemin Storage complet (utiliser StoragePaths)
 * @param options - Options d'upload (progress callback, contentType, retries)
 * @returns Promise<UploadResult> avec downloadURL, storagePath, size, contentType
 */
export async function uploadMediaAndGetURL(
  localUri: string,
  storagePath: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const { onProgress, contentType: customContentType, maxRetries = 1 } = options;
  const startTime = Date.now();
  
  console.log('[Storage] 📤 [UPLOAD START]');
  console.log('[Storage] 📤 Path:', storagePath);
  console.log('[Storage] 📤 URI:', localUri.substring(0, 100));
  console.log('[Storage] 📤 Platform:', Platform.OS);
  
  // Verify authentication
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error('[Storage] ❌ User not authenticated');
    throw new Error('Vous devez être connecté pour uploader des fichiers');
  }
  console.log('[Storage] 👤 User authenticated:', currentUser.uid);
  
  // Validate URI
  if (!localUri || localUri.trim() === '') {
    throw new Error('URI is empty or invalid');
  }
  
  // If URI is already a Firebase Storage URL, return it as-is
  if (localUri.includes('firebasestorage.googleapis.com')) {
    console.log('[Storage] ⏭️ URI is already a Firebase Storage URL, skipping upload');
    return {
      downloadURL: localUri,
      storagePath: '',
      size: 0,
      contentType: 'image/jpeg',
    };
  }
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[Storage] 🔄 Retry attempt ${attempt}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      }
      
      // Convert URI to blob
      const blob = await uriToBlob(localUri);
      
      if (!blob || blob.size === 0) {
        throw new Error('Blob is empty or invalid');
      }
      
      console.log('[Storage] 📤 Blob ready, size:', blob.size, 'type:', blob.type);
      
      // Create storage reference
      const storageRef = ref(storage, storagePath);
      const finalContentType = customContentType || blob.type || getContentType(storagePath);
      
      console.log('[Storage] 📤 Storage ref created, contentType:', finalContentType);
      
      // Upload with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, blob, {
        contentType: finalContentType,
      });
      
      const downloadURL = await new Promise<string>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress: UploadProgress = {
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
            };
            onProgress?.(progress);
            console.log(`[Storage] 📊 Progress: ${progress.progress.toFixed(1)}%`);
          },
          (error) => {
            console.error('[Storage] ❌ Upload error:', error);
            reject(error);
          },
          async () => {
            try {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(url);
            } catch (error) {
              reject(error);
            }
          }
        );
      });
      
      const duration = Date.now() - startTime;
      console.log(`[Storage] ✅ [UPLOAD SUCCESS] Duration: ${duration}ms`);
      console.log('[Storage] ✅ Download URL:', downloadURL.substring(0, 80) + '...');
      
      return {
        downloadURL,
        storagePath,
        size: blob.size,
        contentType: finalContentType,
      };
      
    } catch (error: any) {
      lastError = error;
      console.error(`[Storage] ❌ Upload attempt ${attempt + 1} failed:`, error?.message || error);
      
      // Don't retry for certain errors
      if (error?.code === 'storage/unauthorized' || 
          error?.code === 'storage/unauthenticated' ||
          error?.code === 'storage/canceled') {
        break;
      }
    }
  }
  
  // All retries failed
  const duration = Date.now() - startTime;
  console.error(`[Storage] ❌ [UPLOAD FAILED] After ${maxRetries + 1} attempts, duration: ${duration}ms`);
  
  // Provide user-friendly error messages
  const errorCode = (lastError as any)?.code;
  switch (errorCode) {
    case 'storage/unauthorized':
      throw new Error('Accès refusé. Vérifiez votre connexion et réessayez.');
    case 'storage/unauthenticated':
      throw new Error('Vous devez être connecté.');
    case 'storage/canceled':
      throw new Error('Upload annulé.');
    case 'storage/quota-exceeded':
      throw new Error('Quota de stockage dépassé.');
    case 'storage/retry-limit-exceeded':
      throw new Error('Trop de tentatives. Réessayez plus tard.');
    default:
      throw lastError || new Error('Erreur inconnue lors de l\'upload');
  }
}

/**
 * Upload multiple fichiers en parallèle
 */
export async function uploadMultipleMedia(
  files: { localUri: string; storagePath: string }[],
  options: Omit<UploadOptions, 'onProgress'> & {
    onProgress?: (fileIndex: number, progress: UploadProgress) => void;
  } = {}
): Promise<UploadResult[]> {
  console.log(`[Storage] 📤 Uploading ${files.length} files`);
  
  const results = await Promise.all(
    files.map(async (file, index) => {
      return uploadMediaAndGetURL(file.localUri, file.storagePath, {
        ...options,
        onProgress: (progress) => options.onProgress?.(index, progress),
      });
    })
  );
  
  console.log(`[Storage] ✅ All ${results.length} files uploaded`);
  return results;
}

// ============================================================================
// DELETE UTILITIES
// ============================================================================

/**
 * Supprime un fichier Storage par son path ou URL
 */
export async function deleteStorageFile(pathOrUrl: string): Promise<boolean> {
  try {
    console.log('[Storage] 🗑️ Deleting file:', pathOrUrl.substring(0, 50) + '...');
    
    let storagePath = pathOrUrl;
    
    // Extract path from URL if needed
    if (pathOrUrl.includes('firebasestorage.googleapis.com')) {
      const match = pathOrUrl.match(/\/o\/([^?]+)/);
      if (match) {
        storagePath = decodeURIComponent(match[1]);
      }
    }
    
    const fileRef = ref(storage, storagePath);
    await deleteObject(fileRef);
    
    console.log('[Storage] ✅ File deleted successfully');
    return true;
  } catch (error: any) {
    if (error?.code === 'storage/object-not-found') {
      console.log('[Storage] ⚠️ File not found (already deleted?)');
      return true; // Consider it a success if file doesn't exist
    }
    console.error('[Storage] ❌ Delete failed:', error);
    return false;
  }
}

/**
 * Supprime tous les fichiers dans un dossier Storage
 */
export async function deleteStorageFolder(folderPath: string): Promise<{ deleted: number; failed: number }> {
  try {
    console.log('[Storage] 🗑️ Deleting folder:', folderPath);
    
    const folderRef = ref(storage, folderPath);
    const listResult = await listAll(folderRef);
    
    let deleted = 0;
    let failed = 0;
    
    // Delete all files in the folder
    await Promise.all(
      listResult.items.map(async (itemRef) => {
        try {
          await deleteObject(itemRef);
          deleted++;
        } catch (error) {
          console.error('[Storage] ❌ Failed to delete:', itemRef.fullPath, error);
          failed++;
        }
      })
    );
    
    // Recursively delete subfolders
    for (const prefixRef of listResult.prefixes) {
      const subResult = await deleteStorageFolder(prefixRef.fullPath);
      deleted += subResult.deleted;
      failed += subResult.failed;
    }
    
    console.log(`[Storage] ✅ Folder deleted: ${deleted} files, ${failed} failed`);
    return { deleted, failed };
  } catch (error: any) {
    if (error?.code === 'storage/object-not-found') {
      console.log('[Storage] ⚠️ Folder not found (already deleted?)');
      return { deleted: 0, failed: 0 };
    }
    console.error('[Storage] ❌ Delete folder failed:', error);
    return { deleted: 0, failed: 1 };
  }
}

/**
 * Supprime les médias associés à un document Firestore
 * Best-effort: log les erreurs mais ne bloque pas
 */
export async function deleteMediaFromDocument(
  media: MediaItem[] | string[] | undefined,
  options: { logPrefix?: string; markOrphaned?: (path: string) => void } = {}
): Promise<void> {
  if (!media || media.length === 0) return;
  
  const { logPrefix = '[Storage]', markOrphaned } = options;
  
  console.log(`${logPrefix} 🗑️ Deleting ${media.length} media items`);
  
  await Promise.all(
    media.map(async (item) => {
      const path = typeof item === 'string' ? item : item.path;
      if (!path) return;
      
      const success = await deleteStorageFile(path);
      if (!success && markOrphaned) {
        markOrphaned(path);
      }
    })
  );
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Génère un UUID unique pour les noms de fichiers
 */
export function generateUUID(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Vérifie si une URL est une URL Firebase Storage valide
 */
export function isFirebaseStorageURL(url: string): boolean {
  return url.includes('firebasestorage.googleapis.com');
}

/**
 * Crée un MediaItem à partir d'un résultat d'upload
 */
export function createMediaItem(
  uploadResult: UploadResult,
  type: MediaItem['type'] = 'image',
  dimensions?: { width: number; height: number }
): MediaItem {
  return sanitizeForFirestore({
    url: uploadResult.downloadURL,
    path: uploadResult.storagePath,
    type,
    width: dimensions?.width,
    height: dimensions?.height,
    size: uploadResult.size,
    contentType: uploadResult.contentType,
    uploadedAt: Date.now(),
  });
}
