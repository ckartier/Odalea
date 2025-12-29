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
    console.log('📦 Converting URI to blob:', uri.substring(0, 50) + '...');
    
    if (Platform.OS !== 'web' && (uri.startsWith('file://') || uri.startsWith('content://'))) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () {
          if (xhr.status === 200) {
            console.log('✅ Blob created via XHR, size:', xhr.response?.size || 0);
            resolve(xhr.response as Blob);
          } else {
            console.error('❌ XHR failed with status:', xhr.status);
            reject(new Error(`XHR failed with status ${xhr.status}`));
          }
        };
        xhr.onerror = function (e) {
          console.error('❌ XHR error:', e);
          reject(new Error('XHR network error'));
        };
        xhr.responseType = 'blob';
        xhr.open('GET', uri, true);
        xhr.send();
      });
    }
    
    console.log('📦 Using fetch for web/https URI');
    const response = await fetch(uri);
    if (!response.ok) {
      console.error('❌ Fetch failed:', response.status, response.statusText);
      throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
    }
    const blob = await response.blob();
    console.log('✅ Blob created via fetch, size:', blob.size);
    return blob;
  }

  static async uploadImage(
    uri: string,
    path: string,
    options?: UploadOptions
  ): Promise<string> {
    try {
      console.log('📤 [UPLOAD START] Path:', path);
      console.log('📤 [UPLOAD START] URI:', uri.substring(0, 100));
      console.log('📤 [UPLOAD START] Platform:', Platform.OS);
      
      const currentUser = auth.currentUser;
      console.log('👤 [UPLOAD] Current user:', currentUser?.uid || 'NOT AUTHENTICATED');
      
      if (!currentUser) {
        throw new Error('Vous devez être connecté pour uploader des images');
      }
      
      if (!uri || uri.trim() === '') {
        throw new Error('URI is empty or invalid');
      }
      
      const blob = await this.uriToBlob(uri);
      console.log('📤 [UPLOAD] Blob ready, size:', blob.size, 'type:', blob.type);
      
      if (!blob || blob.size === 0) {
        throw new Error('Blob is empty or invalid');
      }
      
      const storageRef = ref(storage, path);
      console.log('📤 [UPLOAD] Storage ref created:', path);
      console.log('📤 [UPLOAD] Storage bucket:', storage.app.options.storageBucket);
      console.log('📤 [UPLOAD] Full path:', storageRef.fullPath);
      console.log('📤 [UPLOAD] Bucket:', storageRef.bucket);

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
              console.log(`📊 Upload progress: ${progress.progress.toFixed(2)}%`);
            },
            (error) => {
              console.error('❌ Upload error:', error);
              reject(error);
            },
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log('✅ [UPLOAD SUCCESS] Download URL:', downloadURL);
              if (!downloadURL.startsWith('https://')) {
                console.warn('⚠️ [UPLOAD] URL is not https:', downloadURL);
              }
              resolve(downloadURL);
            }
          );
        });
      } else {
        console.log('📤 [UPLOAD] Starting uploadBytes...');
        const snapshot = await uploadBytes(storageRef, blob, {
          contentType: options?.contentType || 'image/jpeg',
        });
        console.log('📤 [UPLOAD] uploadBytes complete, getting URL...');
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log('✅ [UPLOAD SUCCESS] Download URL:', downloadURL);
        if (!downloadURL.startsWith('https://')) {
          console.warn('⚠️ [UPLOAD] URL is not https:', downloadURL);
        }
        return downloadURL;
      }
    } catch (error: any) {
      console.error('❌ [UPLOAD FAILED] Error details:');
      console.error('  - Message:', error?.message || 'Unknown error');
      console.error('  - Code:', error?.code || 'N/A');
      console.error('  - Name:', error?.name || 'N/A');
      console.error('  - Auth user:', auth.currentUser?.uid || 'none');
      console.error('  - Storage bucket:', storage.app.options.storageBucket || 'none');
      
      if (error?.customData) {
        console.error('  - CustomData:', JSON.stringify(error.customData, null, 2));
      }
      if (error?.serverResponse) {
        console.error('  - ServerResponse:', JSON.stringify(error.serverResponse, null, 2));
      }
      
      console.error('  - Stack:', error?.stack?.substring(0, 500));
      
      if (error?.code === 'storage/unauthorized') {
        const detailMsg = `Accès refusé au Storage Firebase.\n\nPath: ${path}\nUtilisateur: ${auth.currentUser?.uid || 'non connecté'}\n\nVérifiez que:\n1. Vous êtes bien connecté\n2. Le path correspond à votre UID\n3. Les règles Storage autorisent l'accès`;
        console.error('💡 [STORAGE/UNAUTHORIZED]:', detailMsg);
        throw new Error('Accès refusé. Vérifiez votre connexion et réessayez.');
      } else if (error?.code === 'storage/canceled') {
        throw new Error('Upload annulé.');
      } else if (error?.code === 'storage/unknown') {
        const userMsg = auth.currentUser ? `Utilisateur: ${auth.currentUser.uid}` : 'Non authentifié';
        const detailMsg = `Erreur inconnue lors de l'upload.\n${userMsg}\nBucket: ${storage.app.options.storageBucket || 'non configuré'}\n\nVérifiez:\n1. Votre connexion internet\n2. Les règles Firebase Storage\n3. Que le bucket existe`;
        console.error('💡 Détails complets:', detailMsg);
        throw new Error(detailMsg);
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
      console.warn(`⚠️ userId mismatch: store=${userId}, auth=${currentUser.uid}. Using auth UID.`);
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
      console.warn(`⚠️ userId mismatch: store=${userId}, auth=${currentUser.uid}. Using auth UID.`);
    }
    
    const timestamp = Date.now();
    const path = `users/${currentUser.uid}/pets/${petId}/${timestamp}.jpg`;
    console.log('📤 [PET PHOTO] Upload path:', path);
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
      console.warn(`⚠️ userId mismatch: store=${userId}, auth=${currentUser.uid}. Using auth UID.`);
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
      console.warn(`⚠️ userId mismatch: store=${userId}, auth=${currentUser.uid}. Using auth UID.`);
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
      console.warn(`⚠️ userId mismatch: store=${userId}, auth=${currentUser.uid}. Using auth UID.`);
    }
    
    const timestamp = Date.now();
    const path = `users/${currentUser.uid}/lost-found/${reportId}/${timestamp}.jpg`;
    return this.uploadImage(uri, path, options);
  }

  static async deleteImage(url: string): Promise<void> {
    try {
      console.log('🗑️ Deleting image:', url);
      const imageRef = ref(storage, url);
      await deleteObject(imageRef);
      console.log('✅ Image deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete image:', error);
      throw error;
    }
  }

  static async deleteFolder(path: string): Promise<void> {
    try {
      console.log('🗑️ Deleting folder:', path);
      const folderRef = ref(storage, path);
      const listResult = await listAll(folderRef);

      const deletePromises = listResult.items.map((itemRef) =>
        deleteObject(itemRef)
      );

      await Promise.all(deletePromises);
      console.log('✅ Folder deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete folder:', error);
      throw error;
    }
  }

  static async uploadMultipleImages(
    uris: string[],
    basePath: string,
    options?: UploadOptions
  ): Promise<string[]> {
    try {
      console.log(`📤 Uploading ${uris.length} images to:`, basePath);
      
      const uploadPromises = uris.map((uri, index) => {
        const timestamp = Date.now();
        const path = `${basePath}/${timestamp}_${index}.jpg`;
        return this.uploadImage(uri, path, options);
      });

      const urls = await Promise.all(uploadPromises);
      console.log(`✅ All ${urls.length} images uploaded successfully`);
      return urls;
    } catch (error) {
      console.error('❌ Failed to upload multiple images:', error);
      throw error;
    }
  }

  static getImageUrl(path: string): Promise<string> {
    try {
      const imageRef = ref(storage, path);
      return getDownloadURL(imageRef);
    } catch (error) {
      console.error('❌ Failed to get image URL:', error);
      throw error;
    }
  }

  static async listImages(path: string): Promise<StorageReference[]> {
    try {
      const folderRef = ref(storage, path);
      const listResult = await listAll(folderRef);
      return listResult.items;
    } catch (error) {
      console.error('❌ Failed to list images:', error);
      throw error;
    }
  }
}

export default StorageService;
