/**
 * Firebase Storage Service - Odalea
 * 
 * Service unifié pour tous les uploads Storage de l'application.
 * Utilise les utilitaires de storage-utils.ts comme source de vérité.
 */

import { storage, auth } from './firebase';
import { 
  ref, 
  getDownloadURL, 
  listAll,
  StorageReference
} from 'firebase/storage';
import { Platform } from 'react-native';
import { storageLogger } from '@/lib/logger';
import {
  uploadMediaAndGetURL,
  deleteStorageFile,
  deleteStorageFolder,
  deleteMediaFromDocument,
  StoragePaths,
  generateUUID,
  sanitizeForFirestore,
  isFirebaseStorageURL,
  MediaItem,
  UploadResult,
} from './storage-utils';

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  contentType?: string;
}

export class StorageService {
  private static async uriToBlob(uri: string): Promise<Blob> {
    storageLogger.log('📦 Converting URI to blob:', uri.substring(0, 50) + '...');
    
    if (Platform.OS !== 'web' && (uri.startsWith('file://') || uri.startsWith('content://'))) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () {
          if (xhr.status === 200) {
            storageLogger.log('✅ Blob created via XHR, size:', xhr.response?.size || 0);
            resolve(xhr.response as Blob);
          } else {
            storageLogger.error('❌ XHR failed with status:', xhr.status);
            reject(new Error(`XHR failed with status ${xhr.status}`));
          }
        };
        xhr.onerror = function (e) {
          storageLogger.error('❌ XHR error:', e);
          reject(new Error('XHR network error'));
        };
        xhr.responseType = 'blob';
        xhr.open('GET', uri, true);
        xhr.send();
      });
    }
    
    storageLogger.log('📦 Using fetch for web/https URI');
    const response = await fetch(uri);
    if (!response.ok) {
      storageLogger.error('❌ Fetch failed:', response.status, response.statusText);
      throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
    }
    const blob = await response.blob();
    storageLogger.log('✅ Blob created via fetch, size:', blob.size);
    return blob;
  }

  static async uploadImage(
    uri: string,
    path: string,
    options?: UploadOptions
  ): Promise<string> {
    const result = await uploadMediaAndGetURL(uri, path, {
      onProgress: options?.onProgress,
      contentType: options?.contentType,
    });
    return result.downloadURL;
  }

  // ============================================================================
  // USER PROFILE
  // ============================================================================

  static async uploadProfilePicture(
    userId: string,
    uri: string,
    options?: UploadOptions
  ): Promise<string> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Non authentifié. Connectez-vous pour uploader des images.');
    }
    
    if (currentUser.uid !== userId) {
      storageLogger.warn(`⚠️ userId mismatch, using auth UID.`);
    }
    
    const path = StoragePaths.userAvatar(currentUser.uid);
    storageLogger.log('📤 [PROFILE] Upload path:', path);
    return this.uploadImage(uri, path, options);
  }

  static async uploadUserCover(
    userId: string,
    uri: string,
    options?: UploadOptions
  ): Promise<string> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Non authentifié. Connectez-vous pour uploader des images.');
    }
    
    const path = StoragePaths.userCover(currentUser.uid);
    storageLogger.log('📤 [USER COVER] Upload path:', path);
    return this.uploadImage(uri, path, options);
  }

  // ============================================================================
  // PETS
  // ============================================================================

  static async uploadPetPhoto(
    userId: string,
    petId: string,
    uri: string,
    options?: UploadOptions
  ): Promise<string> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Non authentifié. Connectez-vous pour uploader des images.');
    }
    
    if (currentUser.uid !== userId) {
      storageLogger.warn(`⚠️ userId mismatch, using auth UID.`);
    }
    
    const path = StoragePaths.petCover(currentUser.uid, petId);
    storageLogger.log('📤 [PET PHOTO] Upload path:', path);
    return this.uploadImage(uri, path, options);
  }

  static async uploadPetGalleryPhoto(
    userId: string,
    petId: string,
    uri: string,
    options?: UploadOptions
  ): Promise<string> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Non authentifié. Connectez-vous pour uploader des images.');
    }
    
    const uuid = generateUUID();
    const path = StoragePaths.petGallery(currentUser.uid, petId, uuid);
    storageLogger.log('📤 [PET GALLERY] Upload path:', path);
    return this.uploadImage(uri, path, options);
  }

  // ============================================================================
  // COMMUNITY POSTS
  // ============================================================================

  static async uploadPostImage(
    userId: string,
    postId: string,
    uri: string,
    options?: UploadOptions
  ): Promise<string> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Non authentifié. Connectez-vous pour uploader des images.');
    }
    
    if (currentUser.uid !== userId) {
      storageLogger.warn(`⚠️ userId mismatch, using auth UID.`);
    }
    
    const uuid = generateUUID();
    const path = StoragePaths.communityPost(currentUser.uid, postId, uuid);
    storageLogger.log('📤 [POST IMAGE] Upload path:', path);
    return this.uploadImage(uri, path, options);
  }

  static async uploadPostImages(
    userId: string,
    postId: string,
    uris: string[],
    options?: UploadOptions
  ): Promise<string[]> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Non authentifié. Connectez-vous pour uploader des images.');
    }
    
    storageLogger.log(`📤 [POST IMAGES] Uploading ${uris.length} images`);
    
    const results = await Promise.all(
      uris.map(async (uri) => {
        if (isFirebaseStorageURL(uri)) {
          return uri;
        }
        const uuid = generateUUID();
        const path = StoragePaths.communityPost(currentUser.uid, postId, uuid);
        return this.uploadImage(uri, path, options);
      })
    );
    
    storageLogger.log(`✅ [POST IMAGES] All ${results.length} images uploaded`);
    return results;
  }

  // ============================================================================
  // LOST & FOUND
  // ============================================================================

  static async uploadLostFoundImage(
    userId: string,
    reportId: string,
    uri: string,
    type: 'lost' | 'found' = 'lost',
    options?: UploadOptions
  ): Promise<string> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Non authentifié. Connectez-vous pour uploader des images.');
    }
    
    if (currentUser.uid !== userId) {
      storageLogger.warn(`⚠️ userId mismatch, using auth UID.`);
    }
    
    const uuid = generateUUID();
    const path = type === 'lost' 
      ? StoragePaths.lostReport(currentUser.uid, reportId, uuid)
      : StoragePaths.foundReport(currentUser.uid, reportId, uuid);
    
    storageLogger.log(`📤 [LOST/FOUND] Upload path:`, path);
    return this.uploadImage(uri, path, options);
  }

  static async uploadLostFoundImages(
    userId: string,
    reportId: string,
    uris: string[],
    type: 'lost' | 'found' = 'lost',
    options?: UploadOptions
  ): Promise<string[]> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Non authentifié. Connectez-vous pour uploader des images.');
    }
    
    storageLogger.log(`📤 [LOST/FOUND IMAGES] Uploading ${uris.length} images`);
    
    const results = await Promise.all(
      uris.map(async (uri) => {
        if (isFirebaseStorageURL(uri)) {
          return uri;
        }
        return this.uploadLostFoundImage(userId, reportId, uri, type, options);
      })
    );
    
    return results;
  }

  // ============================================================================
  // MESSAGES
  // ============================================================================

  static async uploadMessageAttachment(
    userId: string,
    conversationId: string,
    messageId: string,
    uri: string,
    type: 'image' | 'audio' | 'video' = 'image',
    options?: UploadOptions
  ): Promise<string> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Non authentifié. Connectez-vous pour uploader des fichiers.');
    }
    
    const uuid = generateUUID();
    const ext = type === 'audio' ? 'm4a' : type === 'video' ? 'mp4' : 'jpg';
    const path = StoragePaths.messageAttachment(currentUser.uid, conversationId, messageId, uuid, ext);
    
    storageLogger.log(`📤 [MESSAGE ATTACHMENT] Upload path:`, path);
    return this.uploadImage(uri, path, {
      ...options,
      contentType: type === 'audio' ? 'audio/mp4' : type === 'video' ? 'video/mp4' : 'image/jpeg',
    });
  }

  // ============================================================================
  // CHALLENGES
  // ============================================================================

  static async uploadChallengeProof(
    userId: string,
    challengeId: string,
    uri: string,
    options?: UploadOptions
  ): Promise<string> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Non authentifié. Connectez-vous pour uploader des images.');
    }
    
    const uuid = generateUUID();
    const path = StoragePaths.challengeProof(currentUser.uid, challengeId, uuid);
    
    storageLogger.log(`📤 [CHALLENGE PROOF] Upload path:`, path);
    return this.uploadImage(uri, path, options);
  }

  // ============================================================================
  // VET IA
  // ============================================================================

  static async uploadVetAttachment(
    userId: string,
    sessionId: string,
    messageId: string,
    uri: string,
    options?: UploadOptions
  ): Promise<string> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Non authentifié. Connectez-vous pour uploader des images.');
    }
    
    const uuid = generateUUID();
    const path = StoragePaths.vetAttachment(currentUser.uid, sessionId, messageId, uuid);
    
    storageLogger.log(`📤 [VET ATTACHMENT] Upload path:`, path);
    return this.uploadImage(uri, path, options);
  }

  // ============================================================================
  // SHOP / PRODUCTS
  // ============================================================================

  static async uploadProductImage(
    userId: string,
    productId: string,
    uri: string,
    options?: UploadOptions
  ): Promise<string> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Non authentifié. Connectez-vous pour uploader des images.');
    }
    
    if (currentUser.uid !== userId) {
      storageLogger.warn(`⚠️ userId mismatch, using auth UID.`);
    }
    
    const uuid = generateUUID();
    const path = StoragePaths.shopProduct(productId, uuid);
    
    storageLogger.log(`📤 [PRODUCT IMAGE] Upload path:`, path);
    return this.uploadImage(uri, path, options);
  }

  // ============================================================================
  // VERIFICATION DOCUMENTS
  // ============================================================================

  static async uploadVerificationDocument(
    userId: string,
    filename: string,
    uri: string,
    options?: UploadOptions
  ): Promise<string> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Non authentifié. Connectez-vous pour uploader des documents.');
    }
    
    const path = StoragePaths.verification(currentUser.uid, filename);
    
    storageLogger.log(`📤 [VERIFICATION] Upload path:`, path);
    return this.uploadImage(uri, path, options);
  }

  // ============================================================================
  // DELETE OPERATIONS
  // ============================================================================

  static async deleteImage(url: string): Promise<void> {
    const success = await deleteStorageFile(url);
    if (!success) {
      storageLogger.warn('⚠️ Image deletion may have failed:', url);
    }
  }

  static async deleteFolder(path: string): Promise<void> {
    const result = await deleteStorageFolder(path);
    storageLogger.log(`🗑️ Folder deletion complete: ${result.deleted} deleted, ${result.failed} failed`);
  }

  static async deleteMediaItems(media: MediaItem[] | string[] | undefined): Promise<void> {
    await deleteMediaFromDocument(media, {
      logPrefix: '[StorageService]',
    });
  }

  // ============================================================================
  // LEGACY METHODS (for backwards compatibility)
  // ============================================================================

  static async uploadMultipleImages(
    uris: string[],
    basePath: string,
    options?: UploadOptions
  ): Promise<string[]> {
    try {
      storageLogger.log(`📤 Uploading ${uris.length} images to:`, basePath);
      
      const uploadPromises = uris.map(async (uri, index) => {
        if (isFirebaseStorageURL(uri)) {
          return uri;
        }
        const uuid = generateUUID();
        const path = `${basePath}/${uuid}.jpg`;
        return this.uploadImage(uri, path, options);
      });

      const urls = await Promise.all(uploadPromises);
      storageLogger.log(`✅ All ${urls.length} images uploaded successfully`);
      return urls;
    } catch (error) {
      storageLogger.error('❌ Failed to upload multiple images:', error);
      throw error;
    }
  }

  static getImageUrl(path: string): Promise<string> {
    try {
      const imageRef = ref(storage, path);
      return getDownloadURL(imageRef);
    } catch (error) {
      storageLogger.error('❌ Failed to get image URL:', error);
      throw error;
    }
  }

  static async listImages(path: string): Promise<StorageReference[]> {
    try {
      const folderRef = ref(storage, path);
      const listResult = await listAll(folderRef);
      return listResult.items;
    } catch (error) {
      storageLogger.error('❌ Failed to list images:', error);
      throw error;
    }
  }
}

// Re-export utilities for convenience
export {
  sanitizeForFirestore,
  StoragePaths,
  generateUUID,
  isFirebaseStorageURL,
  deleteStorageFile,
  deleteStorageFolder,
  deleteMediaFromDocument,
};

export type { MediaItem, UploadResult };

export default StorageService;
