import { storage } from './firebase';
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
import * as FileSystem from 'expo-file-system';

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
    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      return await response.blob();
    }

    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64' as any,
    });

    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: 'image/jpeg' });
  }

  static async uploadImage(
    uri: string,
    path: string,
    options?: UploadOptions
  ): Promise<string> {
    try {
      console.log('📤 Uploading image to:', path);
      
      const blob = await this.uriToBlob(uri);
      const storageRef = ref(storage, path);

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
              console.log('✅ Upload complete:', downloadURL);
              resolve(downloadURL);
            }
          );
        });
      } else {
        const snapshot = await uploadBytes(storageRef, blob, {
          contentType: options?.contentType || 'image/jpeg',
        });
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log('✅ Upload complete:', downloadURL);
        return downloadURL;
      }
    } catch (error) {
      console.error('❌ Failed to upload image:', error);
      throw error;
    }
  }

  static async uploadProfilePicture(
    userId: string,
    uri: string,
    options?: UploadOptions
  ): Promise<string> {
    const timestamp = Date.now();
    const path = `users/${userId}/profile/${timestamp}.jpg`;
    return this.uploadImage(uri, path, options);
  }

  static async uploadPetPhoto(
    userId: string,
    petId: string,
    uri: string,
    options?: UploadOptions
  ): Promise<string> {
    const timestamp = Date.now();
    const path = `users/${userId}/pets/${petId}/${timestamp}.jpg`;
    return this.uploadImage(uri, path, options);
  }

  static async uploadProductImage(
    userId: string,
    productId: string,
    uri: string,
    options?: UploadOptions
  ): Promise<string> {
    const timestamp = Date.now();
    const path = `users/${userId}/products/${productId}/${timestamp}.jpg`;
    return this.uploadImage(uri, path, options);
  }

  static async uploadPostImage(
    userId: string,
    postId: string,
    uri: string,
    options?: UploadOptions
  ): Promise<string> {
    const timestamp = Date.now();
    const path = `users/${userId}/posts/${postId}/${timestamp}.jpg`;
    return this.uploadImage(uri, path, options);
  }

  static async uploadLostFoundImage(
    userId: string,
    reportId: string,
    uri: string,
    options?: UploadOptions
  ): Promise<string> {
    const timestamp = Date.now();
    const path = `users/${userId}/lost-found/${reportId}/${timestamp}.jpg`;
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
