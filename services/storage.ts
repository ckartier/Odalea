import { storage, auth } from './firebase';
import { 
  ref, 
  uploadBytes, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject,
  listAll,
  StorageReference
} from 'firebase/storage';
import { Platform } from 'react-native';
import { storageLogger } from '@/lib/logger';

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
    try {
      storageLogger.log('📤 [UPLOAD START] Path:', path);
      storageLogger.log('📤 [UPLOAD START] URI:', uri.substring(0, 100));
      storageLogger.log('📤 [UPLOAD START] Platform:', Platform.OS);
      
      const currentUser = auth.currentUser;
      storageLogger.log('👤 [UPLOAD] Current user:', currentUser?.uid ? 'authenticated' : 'NOT AUTHENTICATED');
      
      if (!currentUser) {
        throw new Error('Vous devez être connecté pour uploader des images');
      }
      
      if (!uri || uri.trim() === '') {
        throw new Error('URI is empty or invalid');
      }
      
      const blob = await this.uriToBlob(uri);
      storageLogger.log('📤 [UPLOAD] Blob ready, size:', blob.size, 'type:', blob.type);
      
      if (!blob || blob.size === 0) {
        throw new Error('Blob is empty or invalid');
      }
      
      const storageRef = ref(storage, path);
      storageLogger.log('📤 [UPLOAD] Storage ref created:', path);
      storageLogger.log('📤 [UPLOAD] Storage bucket:', storage.app.options.storageBucket);

      if (options?.onProgress) {
        const uploadTask = uploadBytesResumable(storageRef, blob, {
          contentType: options.contentType || 'image/jpeg',
        });

        return new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = {
                bytesTransferred: snapshot.bytesTransferred,
                totalBytes: snapshot.totalBytes,
                progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
              };
              options.onProgress?.(progress);
              storageLogger.log(`📊 Upload progress: ${progress.progress.toFixed(2)}%`);
            },
            (error) => {
              storageLogger.error('❌ Upload error:', error);
              reject(error);
            },
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              storageLogger.log('✅ [UPLOAD SUCCESS]');
              if (!downloadURL.startsWith('https://')) {
                storageLogger.warn('⚠️ [UPLOAD] URL is not https');
              }
              resolve(downloadURL);
            }
          );
        });
      } else {
        storageLogger.log('📤 [UPLOAD] Starting uploadBytes...');
        const snapshot = await uploadBytes(storageRef, blob, {
          contentType: options?.contentType || 'image/jpeg',
        });
        storageLogger.log('📤 [UPLOAD] uploadBytes complete, getting URL...');
        const downloadURL = await getDownloadURL(snapshot.ref);
        storageLogger.log('✅ [UPLOAD SUCCESS]');
        if (!downloadURL.startsWith('https://')) {
          storageLogger.warn('⚠️ [UPLOAD] URL is not https');
        }
        return downloadURL;
      }
    } catch (error: any) {
      storageLogger.error('❌ [UPLOAD FAILED] Error:', error?.message || 'Unknown error', error?.code || 'N/A');
      
      if (error?.code === 'storage/unauthorized') {
        throw new Error('Accès refusé. Vérifiez votre connexion et réessayez.');
      } else if (error?.code === 'storage/canceled') {
        throw new Error('Upload annulé.');
      } else if (error?.code === 'storage/unknown') {
        throw new Error('Erreur inconnue lors de l\'upload. Vérifiez votre connexion.');
      } else if (error?.code === 'storage/object-not-found') {
        throw new Error('Objet non trouvé.');
      } else if (error?.code === 'storage/bucket-not-found') {
        throw new Error('Bucket Storage introuvable.');
      } else if (error?.code === 'storage/project-not-found') {
        throw new Error('Projet Firebase introuvable.');
      } else if (error?.code === 'storage/quota-exceeded') {
        throw new Error('Quota de stockage dépassé.');
      } else if (error?.code === 'storage/unauthenticated') {
        throw new Error('Vous devez être connecté.');
      } else if (error?.code === 'storage/retry-limit-exceeded') {
        throw new Error('Trop de tentatives. Réessayez plus tard.');
      }
      
      throw error;
    }
  }

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
    
    const timestamp = Date.now();
    const path = `users/${currentUser.uid}/profile/${timestamp}.jpg`;
    return this.uploadImage(uri, path, options);
  }

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
    
    const timestamp = Date.now();
    const path = `users/${currentUser.uid}/pets/${petId}/${timestamp}.jpg`;
    storageLogger.log('📤 [PET PHOTO] Upload path:', path);
    return this.uploadImage(uri, path, options);
  }

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
    
    const timestamp = Date.now();
    const path = `users/${currentUser.uid}/products/${productId}/${timestamp}.jpg`;
    return this.uploadImage(uri, path, options);
  }

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
    
    const timestamp = Date.now();
    const path = `users/${currentUser.uid}/posts/${postId}/${timestamp}.jpg`;
    return this.uploadImage(uri, path, options);
  }

  static async uploadLostFoundImage(
    userId: string,
    reportId: string,
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
    
    const timestamp = Date.now();
    const path = `users/${currentUser.uid}/lost-found/${reportId}/${timestamp}.jpg`;
    return this.uploadImage(uri, path, options);
  }

  static async deleteImage(url: string): Promise<void> {
    try {
      storageLogger.log('🗑️ Deleting image');
      const imageRef = ref(storage, url);
      await deleteObject(imageRef);
      storageLogger.log('✅ Image deleted successfully');
    } catch (error) {
      storageLogger.error('❌ Failed to delete image:', error);
      throw error;
    }
  }

  static async deleteFolder(path: string): Promise<void> {
    try {
      storageLogger.log('🗑️ Deleting folder:', path);
      const folderRef = ref(storage, path);
      const listResult = await listAll(folderRef);

      const deletePromises = listResult.items.map((itemRef) =>
        deleteObject(itemRef)
      );

      await Promise.all(deletePromises);
      storageLogger.log('✅ Folder deleted successfully');
    } catch (error) {
      storageLogger.error('❌ Failed to delete folder:', error);
      throw error;
    }
  }

  static async uploadMultipleImages(
    uris: string[],
    basePath: string,
    options?: UploadOptions
  ): Promise<string[]> {
    try {
      storageLogger.log(`📤 Uploading ${uris.length} images to:`, basePath);
      
      const uploadPromises = uris.map((uri, index) => {
        const timestamp = Date.now();
        const path = `${basePath}/${timestamp}_${index}.jpg`;
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

export default StorageService;
