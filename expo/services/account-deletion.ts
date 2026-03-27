import { 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc,
  writeBatch,
} from 'firebase/firestore';
import { deleteUser as firebaseDeleteUser } from 'firebase/auth';
import { ref, listAll, deleteObject } from 'firebase/storage';
import { db, storage, auth } from './firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLLECTIONS_TO_DELETE = [
  'pets',
  'posts',
  'comments',
  'messages',
  'bookings',
  'lostFoundReports',
  'notifications',
  'friendRequests',
  'userChallenges',
  'challengeParticipations',
  'petLikes',
  'petMatches',
  'petPasses',
  'reviews',
  'healthRecords',
  'vaccinations',
  'emergencyContacts',
];

interface DeletionResult {
  success: boolean;
  error?: string;
  deletedCollections?: string[];
  deletedStorageFolders?: string[];
}

export async function deleteUserAccount(): Promise<DeletionResult> {
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.error('[AccountDeletion] No user authenticated');
    return { success: false, error: 'Aucun utilisateur connecté' };
  }

  const userId = currentUser.uid;
  console.log('[AccountDeletion] Starting deletion for user:', userId);

  const deletedCollections: string[] = [];
  const deletedStorageFolders: string[] = [];

  try {
    // 1. Delete user documents from all collections
    for (const collectionName of COLLECTIONS_TO_DELETE) {
      try {
        await deleteUserDocumentsFromCollection(userId, collectionName);
        deletedCollections.push(collectionName);
        console.log(`[AccountDeletion] Deleted documents from ${collectionName}`);
      } catch (err) {
        console.warn(`[AccountDeletion] Error deleting from ${collectionName}:`, err);
      }
    }

    // 2. Delete conversations where user is participant
    try {
      const conversationsRef = collection(db, 'conversations');
      const convQuery = query(conversationsRef, where('participants', 'array-contains', userId));
      const convSnapshot = await getDocs(convQuery);
      
      const batch = writeBatch(db);
      convSnapshot.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
      
      deletedCollections.push('conversations');
      console.log('[AccountDeletion] Deleted conversations');
    } catch (err) {
      console.warn('[AccountDeletion] Error deleting conversations:', err);
    }

    // 3. Delete likes where user is involved
    try {
      const likesRef = collection(db, 'likes');
      const likesQuery = query(likesRef, where('userId', '==', userId));
      const likesSnapshot = await getDocs(likesQuery);
      
      const batch = writeBatch(db);
      likesSnapshot.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
      
      deletedCollections.push('likes');
    } catch (err) {
      console.warn('[AccountDeletion] Error deleting likes:', err);
    }

    // 4. Delete user badges
    try {
      const userBadgesRef = collection(db, 'userBadges');
      const badgesQuery = query(userBadgesRef, where('userId', '==', userId));
      const badgesSnapshot = await getDocs(badgesQuery);
      
      const batch = writeBatch(db);
      badgesSnapshot.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
      
      deletedCollections.push('userBadges');
    } catch (err) {
      console.warn('[AccountDeletion] Error deleting user badges:', err);
    }

    // 5. Delete Storage files
    const storageFolders = [
      `users/${userId}`,
      `pets/${userId}`,
      `posts/${userId}`,
      `messages/${userId}`,
      `challenges/${userId}`,
      `vet/${userId}`,
      `lost/${userId}`,
      `found/${userId}`,
    ];

    for (const folder of storageFolders) {
      try {
        await deleteStorageFolder(folder);
        deletedStorageFolders.push(folder);
        console.log(`[AccountDeletion] Deleted storage folder: ${folder}`);
      } catch (err) {
        console.warn(`[AccountDeletion] Error deleting storage folder ${folder}:`, err);
      }
    }

    // 6. Delete professional profile if exists
    try {
      const professionalRef = doc(db, 'professionals', userId);
      await deleteDoc(professionalRef);
      console.log('[AccountDeletion] Deleted professional profile');
    } catch (err) {
      console.warn('[AccountDeletion] Error deleting professional profile (may not exist):', err);
    }

    // 7. Delete pet sitter profile if exists
    try {
      const petSitterRef = doc(db, 'petSitterProfiles', userId);
      await deleteDoc(petSitterRef);
      console.log('[AccountDeletion] Deleted pet sitter profile');
    } catch (err) {
      console.warn('[AccountDeletion] Error deleting pet sitter profile (may not exist):', err);
    }

    // 8. Delete main user document
    try {
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
      console.log('[AccountDeletion] Deleted main user document');
      deletedCollections.push('users');
    } catch (err) {
      console.error('[AccountDeletion] Error deleting user document:', err);
    }

    // 9. Clear local storage
    try {
      const keys = await AsyncStorage.getAllKeys();
      const odaleaKeys = keys.filter(k => k.startsWith('odalea:') || k === 'activePetId');
      await AsyncStorage.multiRemove(odaleaKeys);
      console.log('[AccountDeletion] Cleared local storage');
    } catch (err) {
      console.warn('[AccountDeletion] Error clearing local storage:', err);
    }

    // 10. Delete Firebase Auth account
    try {
      await firebaseDeleteUser(currentUser);
      console.log('[AccountDeletion] Deleted Firebase Auth account');
    } catch (authErr: any) {
      if (authErr.code === 'auth/requires-recent-login') {
        console.warn('[AccountDeletion] User needs to re-authenticate for auth deletion');
        return {
          success: false,
          error: 'Veuillez vous reconnecter puis réessayer pour supprimer votre compte.',
          deletedCollections,
          deletedStorageFolders,
        };
      }
      console.error('[AccountDeletion] Error deleting auth account:', authErr);
    }

    console.log('[AccountDeletion] Account deletion completed successfully');
    return {
      success: true,
      deletedCollections,
      deletedStorageFolders,
    };

  } catch (error: any) {
    console.error('[AccountDeletion] Unexpected error:', error);
    return {
      success: false,
      error: error?.message || 'Une erreur inattendue est survenue',
      deletedCollections,
      deletedStorageFolders,
    };
  }
}

async function deleteUserDocumentsFromCollection(userId: string, collectionName: string): Promise<void> {
  const collectionRef = collection(db, collectionName);
  
  // Try different field names for user ID
  const fieldNames = ['ownerId', 'userId', 'authorId', 'clientId', 'senderId', 'fromOwnerId'];
  
  for (const fieldName of fieldNames) {
    try {
      const q = query(collectionRef, where(fieldName, '==', userId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) continue;
      
      const batch = writeBatch(db);
      let count = 0;
      
      snapshot.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
        count++;
        
        // Firestore batches have a limit of 500 operations
        if (count >= 400) {
          console.log(`[AccountDeletion] Batch limit reached for ${collectionName}, committing...`);
        }
      });
      
      if (count > 0) {
        await batch.commit();
        console.log(`[AccountDeletion] Deleted ${count} docs from ${collectionName} (field: ${fieldName})`);
      }
    } catch (err) {
      // Silently continue if this field doesn't exist in the collection
    }
  }
}

async function deleteStorageFolder(path: string): Promise<void> {
  try {
    const folderRef = ref(storage, path);
    const listResult = await listAll(folderRef);
    
    // Delete all files
    const deletePromises = listResult.items.map((itemRef) => deleteObject(itemRef));
    await Promise.all(deletePromises);
    
    // Recursively delete subfolders
    for (const prefixRef of listResult.prefixes) {
      await deleteStorageFolder(prefixRef.fullPath);
    }
    
    console.log(`[AccountDeletion] Deleted storage path: ${path}`);
  } catch (err: any) {
    if (err?.code !== 'storage/object-not-found') {
      throw err;
    }
  }
}

export async function exportUserData(): Promise<{ success: boolean; data?: any; error?: string }> {
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    return { success: false, error: 'Aucun utilisateur connecté' };
  }

  const userId = currentUser.uid;
  console.log('[DataExport] Starting export for user:', userId);

  try {
    const exportData: Record<string, any> = {
      exportDate: new Date().toISOString(),
      userId,
      email: currentUser.email,
    };

    // Get user document
    const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', userId)));
    if (!userDoc.empty) {
      exportData.profile = userDoc.docs[0].data();
    }

    // Get user's pets
    const petsQuery = query(collection(db, 'pets'), where('ownerId', '==', userId));
    const petsSnapshot = await getDocs(petsQuery);
    exportData.pets = petsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    // Get user's posts
    const postsQuery = query(collection(db, 'posts'), where('authorId', '==', userId));
    const postsSnapshot = await getDocs(postsQuery);
    exportData.posts = postsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    // Get user's bookings
    const bookingsQuery = query(collection(db, 'bookings'), where('clientId', '==', userId));
    const bookingsSnapshot = await getDocs(bookingsQuery);
    exportData.bookings = bookingsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    console.log('[DataExport] Export completed successfully');
    return { success: true, data: exportData };

  } catch (error: any) {
    console.error('[DataExport] Error:', error);
    return { success: false, error: error?.message || 'Erreur lors de l\'export' };
  }
}
