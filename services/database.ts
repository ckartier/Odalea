import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  increment,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  onSnapshot,
  runTransaction
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { 
  User, Pet, Message, Post, Comment, Product, ProfessionalProduct, Order,
  Badge, Challenge, Notification, FriendRequest,
  Conversation, ProfessionalData, AnimalSpecies, AnimalBreed
} from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { safeJsonParse } from '@/lib/safe-json';

// Collections
const COLLECTIONS = {
  // Core entities
  USERS: 'users',
  PETS: 'pets',
  PROFESSIONALS: 'professionals',
  PET_SITTERS: 'petSitters',
  
  // Social features
  POSTS: 'posts',
  COMMENTS: 'comments',
  LIKES: 'likes',
  FRIEND_REQUESTS: 'friendRequests',
  
  // Messaging
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  
  // Commerce
  PRODUCTS: 'products',
  PROFESSIONAL_PRODUCTS: 'professionalProducts',
  ORDERS: 'orders',
  PROMO_SUBMISSIONS: 'promoSubmissions',
  
  // Services & Bookings
  BOOKINGS: 'bookings',
  REVIEWS: 'reviews',
  
  // Lost & Found
  LOST_FOUND_REPORTS: 'lostFoundReports',
  
  // Community & Challenges
  CHALLENGES: 'challenges',
  CHALLENGE_SUBMISSIONS: 'challengeSubmissions',
  CHALLENGE_PARTICIPATIONS: 'challengeParticipations',
  USER_CHALLENGES: 'userChallenges',
  BADGES: 'badges',
  USER_BADGES: 'userBadges',
  
  // Health & Care
  HEALTH_RECORDS: 'healthRecords',
  VACCINATIONS: 'vaccinations',
  TREATMENTS: 'treatments',
  MEDICATIONS: 'medications',
  HEALTH_DOCUMENTS: 'healthDocuments',
  HEALTH_REMINDERS: 'healthReminders',
  
  // System
  NOTIFICATIONS: 'notifications',
  EMERGENCY_CONTACTS: 'emergencyContacts',
  ANIMAL_SPECIES: 'animalSpecies',
  ANIMAL_BREEDS: 'animalBreeds',
  // Cat-sitting
  PET_SITTER_PROFILES: 'petSitterProfiles',
  
  // Pet Matching
  PET_LIKES: 'petLikes',
  PET_MATCHES: 'petMatches',
  PET_PASSES: 'petPasses'
} as const;

// User Management
export const userService = {
  // Create or update user
  async saveUser(user: User): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, user.id);
      await setDoc(userRef, {
        ...user,
        updatedAt: serverTimestamp()
      }, { merge: true });
      console.log('✅ User saved successfully');
    } catch (error) {
      console.error('❌ Error saving user:', error);
      throw error;
    }
  },

  // Get user by ID
  async getUser(userId: string): Promise<User | null> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        return { 
          id: userSnap.id, 
          ...data,
          pets: Array.isArray(data.pets) ? data.pets : []
        } as User;
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting user:', error);
      throw error;
    }
  },

  // Get users by IDs
  async getUsers(userIds: string[]): Promise<User[]> {
    try {
      const users: User[] = [];
      for (const userId of userIds) {
        const user = await this.getUser(userId);
        if (user) users.push(user);
      }
      return users;
    } catch (error) {
      console.error('❌ Error getting users:', error);
      throw error;
    }
  },

  // Search users
  async searchUsers(searchTerm: string, limitCount = 20): Promise<User[]> {
    try {
      const usersRef = collection(db, COLLECTIONS.USERS);
      const q = query(
        usersRef,
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\uf8ff'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
    } catch (error) {
      console.error('❌ Error searching users:', error);
      throw error;
    }
  },

  // Get all users (limited)
  async getAllUsers(limitCount = 200): Promise<User[]> {
    try {
      const usersRef = collection(db, COLLECTIONS.USERS);
      const qy = query(usersRef, limit(limitCount));
      const qs = await getDocs(qy);
      return qs.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as User[];
    } catch (error) {
      if (isPermissionDenied(error)) {
        console.log('🔒 getAllUsers: Permission denied, returning empty list (expected with current rules)');
        return [] as User[];
      }
      console.error('❌ Error getting all users:', error);
      throw error;
    }
  },

  // Add friend
  async addFriend(userId: string, friendId: string): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      const friendRef = doc(db, COLLECTIONS.USERS, friendId);
      
      await updateDoc(userRef, {
        friends: arrayUnion(friendId)
      });
      
      await updateDoc(friendRef, {
        friends: arrayUnion(userId)
      });
      
      console.log('✅ Friend added successfully');
    } catch (error) {
      console.error('❌ Error adding friend:', error);
      throw error;
    }
  },

  // Remove friend
  async removeFriend(userId: string, friendId: string): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      const friendRef = doc(db, COLLECTIONS.USERS, friendId);
      
      await updateDoc(userRef, {
        friends: arrayRemove(friendId)
      });
      
      await updateDoc(friendRef, {
        friends: arrayRemove(userId)
      });
      
      console.log('✅ Friend removed successfully');
    } catch (error) {
      console.error('❌ Error removing friend:', error);
      throw error;
    }
  },

  // Delete user
  async deleteUser(userId: string): Promise<void> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await deleteDoc(userRef);
      console.log('✅ User deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      throw error;
    }
  }
};

// Pet Management
export const petService = {
  // Save pet
  async savePet(pet: Pet): Promise<void> {
    try {
      const petRef = doc(db, COLLECTIONS.PETS, pet.id);
      await setDoc(petRef, {
        ...pet,
        updatedAt: serverTimestamp()
      }, { merge: true });
      console.log('✅ Pet saved successfully');
    } catch (error) {
      console.error('❌ Error saving pet:', error);
      throw error;
    }
  },

  // Get pets by owner
  async getPetsByOwner(ownerId: string): Promise<Pet[]> {
    try {
      const petsRef = collection(db, COLLECTIONS.PETS);
      const q = query(petsRef, where('ownerId', '==', ownerId));
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Pet[];
    } catch (error) {
      console.error('❌ Error getting pets:', error);
      throw error;
    }
  },

  // Get nearby pets
  async getNearbyPets(location: { lat: number; lng: number }, radiusKm = 10): Promise<Pet[]> {
    try {
      const { auth } = await import('./firebase');
      if (!auth.currentUser) {
        console.log('⚠️ Skipping getNearbyPets - user not authenticated');
        return [];
      }
      
      // For now, return all pets. In production, use geohash or similar for location queries
      const petsRef = collection(db, COLLECTIONS.PETS);
      const q = query(petsRef, limit(50));
      
      const querySnapshot = await getDocs(q);
      const pets = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Pet[];
      
      console.log(`✅ Loaded ${pets.length} nearby pets`);
      return pets;
    } catch (error: any) {
      console.error('❌ Error getting nearby pets:', error);
      if (isPermissionDenied(error)) {
        console.log('🔒 Returning empty pets due to permission rules');
      }
      return [];
    }
  },

  // Get pet by ID
  async getPet(petId: string): Promise<Pet | null> {
    try {
      const petRef = doc(db, COLLECTIONS.PETS, petId);
      const petSnap = await getDoc(petRef);
      
      if (petSnap.exists()) {
        return { id: petSnap.id, ...petSnap.data() } as Pet;
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting pet:', error);
      return null;
    }
  },

  // Get multiple pets by IDs (batch)
  async getPetsByIds(petIds: string[]): Promise<Map<string, Pet>> {
    try {
      const petsMap = new Map<string, Pet>();
      
      if (!petIds || petIds.length === 0) return petsMap;
      
      // Fetch pets in parallel
      const petPromises = petIds.map(id => this.getPet(id));
      const pets = await Promise.all(petPromises);
      
      pets.forEach((pet, index) => {
        if (pet) {
          petsMap.set(petIds[index], pet);
        }
      });
      
      console.log(`✅ Fetched ${petsMap.size} pets from ${petIds.length} requested`);
      return petsMap;
    } catch (error) {
      console.error('❌ Error getting pets by IDs:', error);
      return new Map();
    }
  }
};

const isPermissionDenied = (e: unknown): boolean => {
  const code = (e as any)?.code ?? '';
  return typeof code === 'string' && code.includes('permission-denied');
};

// Mock data storage keys
const STORAGE_KEYS = {
  POSTS: 'mock_posts',
  COMMENTS: 'mock_comments',
  LIKES: 'mock_likes'
} as const;

// Mock data helpers
const mockDataHelpers = {
  async getPosts(): Promise<Post[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.POSTS);
      return safeJsonParse<Post[]>(stored, []);
    } catch (error) {
      console.error('❌ Error getting mock posts:', error);
      return [];
    }
  },

  async savePosts(posts: Post[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    } catch (error) {
      console.error('❌ Error saving mock posts:', error);
    }
  },

  async getComments(): Promise<Comment[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.COMMENTS);
      return safeJsonParse<Comment[]>(stored, []);
    } catch (error) {
      console.error('❌ Error getting mock comments:', error);
      return [];
    }
  },

  async saveComments(comments: Comment[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(comments));
    } catch (error) {
      console.error('❌ Error saving mock comments:', error);
    }
  },

  async getLikes(): Promise<{ postId: string; userId: string; createdAt: number }[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.LIKES);
      return safeJsonParse<{ postId: string; userId: string; createdAt: number }[]>(stored, []);
    } catch (error) {
      console.error('❌ Error getting mock likes:', error);
      return [];
    }
  },

  async saveLikes(likes: { postId: string; userId: string; createdAt: number }[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LIKES, JSON.stringify(likes));
    } catch (error) {
      console.error('❌ Error saving mock likes:', error);
    }
  }
};

// Check if Firebase is available
const isFirebaseAvailable = () => {
  try {
    return !!db && !!storage;
  } catch {
    return false;
  }
};

// Post Management
export const postService = {
  // Create post
  async createPost(post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (isFirebaseAvailable()) {
      try {
        const postsRef = collection(db, COLLECTIONS.POSTS);
        
        // Filter out undefined values to prevent Firebase errors
        const cleanPost = Object.fromEntries(
          Object.entries(post).filter(([_, value]) => value !== undefined)
        );
        
        const docRef = await addDoc(postsRef, {
          ...cleanPost,
          visibility: cleanPost.visibility || 'public',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          likesCount: 0,
          commentsCount: 0
        });
        
        console.log('✅ Post created successfully (Firebase)');
        return docRef.id;
      } catch (error) {
        console.error('❌ Error creating post (Firebase):', error);
        throw error;
      }
    } else {
      // Mock implementation
      try {
        const posts = await mockDataHelpers.getPosts();
        const newPost: Post = {
          ...post,
          id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          likesCount: 0,
          commentsCount: 0
        };
        
        posts.unshift(newPost); // Add to beginning for chronological order
        await mockDataHelpers.savePosts(posts);
        
        console.log('✅ Post created successfully (Mock)');
        return newPost.id;
      } catch (error) {
        console.error('❌ Error creating post (Mock):', error);
        throw error;
      }
    }
  },

  // Get posts feed
  async getPostsFeed(lastPostId?: string, limitCount = 20): Promise<Post[]> {
    if (isFirebaseAvailable()) {
      try {
        const postsRef = collection(db, COLLECTIONS.POSTS);
        let q = query(
          postsRef,
          where('visibility', '==', 'public'),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );

        if (lastPostId) {
          const lastPostDoc = await getDoc(doc(db, COLLECTIONS.POSTS, lastPostId));
          if (lastPostDoc.exists()) {
            q = query(
              postsRef,
              orderBy('createdAt', 'desc'),
              startAfter(lastPostDoc),
              limit(limitCount)
            );
          }
        }

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
        })) as Post[];
      } catch (error) {
        console.error('❌ Error getting posts feed (Firebase):', error);
        throw error;
      }
    } else {
      // Mock implementation
      try {
        const posts = await mockDataHelpers.getPosts();
        // Sort by creation date (newest first)
        const sortedPosts = posts.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        // Apply pagination
        let startIndex = 0;
        if (lastPostId) {
          const lastPostIndex = sortedPosts.findIndex(p => p.id === lastPostId);
          if (lastPostIndex !== -1) {
            startIndex = lastPostIndex + 1;
          }
        }
        
        return sortedPosts.slice(startIndex, startIndex + limitCount);
      } catch (error) {
        console.error('❌ Error getting posts feed (Mock):', error);
        return [];
      }
    }
  },

  // Get posts by user
  async getPostsByUser(userId: string): Promise<Post[]> {
    try {
      const postsRef = collection(db, COLLECTIONS.POSTS);
      const q = query(
        postsRef,
        where('authorId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
      })) as Post[];
      
      return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('❌ Error getting user posts:', error);
      throw error;
    }
  },

  // Like/Unlike post
  async toggleLike(postId: string, userIdInput: string): Promise<{ liked: boolean; likesCount: number }> {
    const userId = String(userIdInput ?? '').trim();
    if (!postId || !userId) {
      console.error('❌ toggleLike invalid params', { postId, userId });
      throw new Error('Invalid like parameters');
    }

    if (isFirebaseAvailable()) {
      try {
        const likeId = `${postId}_${userId}`;
        const postRef = doc(db, COLLECTIONS.POSTS, postId);
        const likeRef = doc(db, COLLECTIONS.LIKES, likeId);

        const result = await (await import('firebase/firestore')).runTransaction(db as any, async (tx: any) => {
          const postSnap = await tx.get(postRef);
          if (!postSnap.exists()) {
            throw new Error('Post not found');
          }

          const likeSnap = await tx.get(likeRef);
          const alreadyLiked = likeSnap.exists();

          if (alreadyLiked) {
            tx.delete(likeRef);
            tx.update(postRef, { likesCount: increment(-1), updatedAt: serverTimestamp() });
            const newCount = Math.max(0, (postSnap.data()?.likesCount ?? 1) - 1);
            return { liked: false, likesCount: newCount } as const;
          } else {
            tx.set(likeRef, { postId, userId, createdAt: serverTimestamp() }, { merge: true });
            tx.update(postRef, { likesCount: increment(1), updatedAt: serverTimestamp() });
            const newCount = (postSnap.data()?.likesCount ?? 0) + 1;
            return { liked: true, likesCount: newCount } as const;
          }
        });

        return result as { liked: boolean; likesCount: number };
      } catch (error) {
        console.error('❌ Error toggling like (Firebase):', error);
        throw error;
      }
    } else {
      // Mock implementation
      try {
        const [posts, likes] = await Promise.all([
          mockDataHelpers.getPosts(),
          mockDataHelpers.getLikes()
        ]);

        const existingLikeIndex = likes.findIndex(like =>
          like.postId === postId && String(like.userId) === userId
        );
        const isLiked = existingLikeIndex !== -1;

        let newLikesCount = 0;

        if (isLiked) {
          likes.splice(existingLikeIndex, 1);
          const postIndex = posts.findIndex(p => p.id === postId);
          if (postIndex !== -1) {
            posts[postIndex].likesCount = Math.max(0, (posts[postIndex].likesCount ?? 0) - 1);
            posts[postIndex].updatedAt = new Date();
            newLikesCount = posts[postIndex].likesCount;
          }
        } else {
          likes.push({ postId, userId, createdAt: Date.now() });
          const postIndex = posts.findIndex(p => p.id === postId);
          if (postIndex !== -1) {
            posts[postIndex].likesCount = (posts[postIndex].likesCount ?? 0) + 1;
            posts[postIndex].updatedAt = new Date();
            newLikesCount = posts[postIndex].likesCount;
          }
        }

        await Promise.all([
          mockDataHelpers.savePosts(posts),
          mockDataHelpers.saveLikes(likes)
        ]);

        return { liked: !isLiked, likesCount: newLikesCount };
      } catch (error) {
        console.error('❌ Error toggling like (Mock):', error);
        throw error;
      }
    }
  },

  // Check if user liked post
  async isPostLiked(postId: string, userId: string): Promise<boolean> {
    if (isFirebaseAvailable()) {
      try {
        const likeRef = doc(db, COLLECTIONS.LIKES, `${postId}_${userId}`);
        const likeDoc = await getDoc(likeRef);
        return likeDoc.exists();
      } catch (error) {
        console.error('❌ Error checking like status (Firebase):', error);
        return false;
      }
    } else {
      // Mock implementation
      try {
        const likes = await mockDataHelpers.getLikes();
        return likes.some(like => like.postId === postId && like.userId === userId);
      } catch (error) {
        console.error('❌ Error checking like status (Mock):', error);
        return false;
      }
    }
  }
};

// Comment Management
export const commentService = {
  // Add comment
  async addComment(comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (isFirebaseAvailable()) {
      try {
        const commentsRef = collection(db, COLLECTIONS.COMMENTS);
        const docRef = await addDoc(commentsRef, {
          ...comment,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        // Update post comments count if the post exists
        try {
          const postRef = doc(db, COLLECTIONS.POSTS, comment.postId);
          await updateDoc(postRef, {
            commentsCount: increment(1),
            updatedAt: serverTimestamp()
          });
        } catch (e) {
          console.warn('⚠️ Skipping commentsCount update; post not found or not a standard post', String(e));
        }
        
        console.log('✅ Comment added successfully (Firebase)');
        return docRef.id;
      } catch (error) {
        console.error('❌ Error adding comment (Firebase):', error);
        throw error;
      }
    } else {
      // Mock implementation
      try {
        const [comments, posts] = await Promise.all([
          mockDataHelpers.getComments(),
          mockDataHelpers.getPosts()
        ]);
        
        const newComment: Comment = {
          ...comment,
          id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        comments.push(newComment);
        
        // Update post comments count
        const postIndex = posts.findIndex(p => p.id === comment.postId);
        if (postIndex !== -1) {
          posts[postIndex].commentsCount += 1;
          posts[postIndex].updatedAt = new Date();
        }
        
        await Promise.all([
          mockDataHelpers.saveComments(comments),
          mockDataHelpers.savePosts(posts)
        ]);
        
        console.log('✅ Comment added successfully (Mock)');
        return newComment.id;
      } catch (error) {
        console.error('❌ Error adding comment (Mock):', error);
        throw error;
      }
    }
  },

  // Get comments for post
  async getComments(postId: string): Promise<Comment[]> {
    if (isFirebaseAvailable()) {
      try {
        const commentsRef = collection(db, COLLECTIONS.COMMENTS);
        const q = query(
          commentsRef,
          where('postId', '==', postId)
        );
        
        const querySnapshot = await getDocs(q);
        const items = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
        })) as Comment[];
        const toMillis = (val: any): number => {
          if (!val) return 0;
          if (typeof val === 'number') return val;
          if (typeof (val as any)?.toMillis === 'function') return (val as any).toMillis();
          if (typeof (val as any)?.toDate === 'function') return (val as any).toDate().getTime();
          if (val instanceof Date) return val.getTime();
          return 0;
        };
        return items.sort((a: any, b: any) => toMillis(a.createdAt) - toMillis(b.createdAt));
      } catch (error) {
        console.error('❌ Error getting comments (Firebase):', error);
        throw error;
      }
    } else {
      // Mock implementation
      try {
        const comments = await mockDataHelpers.getComments();
        return comments
          .filter(comment => comment.postId === postId)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      } catch (error) {
        console.error('❌ Error getting comments (Mock):', error);
        return [];
      }
    }
  }
};

// File Upload Service
export const uploadService = {
  // Upload image
  async uploadImage(uri: string, path: string): Promise<string> {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const imageRef = ref(storage, path);
      await uploadBytes(imageRef, blob);
      
      const downloadURL = await getDownloadURL(imageRef);
      console.log('✅ Image uploaded successfully');
      return downloadURL;
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      throw error;
    }
  },

  // Delete image
  async deleteImage(path: string): Promise<void> {
    try {
      const imageRef = ref(storage, path);
      await deleteObject(imageRef);
      console.log('✅ Image deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting image:', error);
      throw error;
    }
  }
};

// Real-time listeners
export const realtimeService = {
  // Listen to posts feed
  listenToPostsFeed(callback: (posts: Post[]) => void, limitCount = 20) {
    if (isFirebaseAvailable()) {
      const postsRef = collection(db, COLLECTIONS.POSTS);
      const q = query(
        postsRef,
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      return onSnapshot(q, (querySnapshot) => {
        const posts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
        })) as Post[];
        
        callback(posts);
      });
    } else {
      // Mock implementation - return a function that can be called to unsubscribe
      let intervalId: ReturnType<typeof setInterval>;
      
      const pollForUpdates = async () => {
        try {
          const posts = await postService.getPostsFeed(undefined, limitCount);
          callback(posts);
        } catch (error) {
          console.error('❌ Error polling posts (Mock):', error);
        }
      };
      
      // Initial load
      pollForUpdates();
      
      // Poll every 30 seconds
      intervalId = setInterval(pollForUpdates, 30000);
      
      // Return unsubscribe function
      return () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }
  },

  // Listen to conversations for a user
  listenToConversations(userId: string, callback: (conversations: Conversation[]) => void) {
    if (isFirebaseAvailable()) {
      const conversationsRef = collection(db, COLLECTIONS.CONVERSATIONS);
      const qy = query(
        conversationsRef,
        where('participants', 'array-contains', userId)
      );
      return onSnapshot(qy, (qs) => {
        const items = qs.docs.map(d => ({ id: d.id, ...d.data() })) as Conversation[];
        const toMillis = (val: any): number => {
           if (!val) return 0;
           if (typeof val === 'number') return val;
           if (typeof val?.toMillis === 'function') return val.toMillis();
           if (typeof val?.toDate === 'function') return val.toDate().getTime();
           return 0;
        };
        items.sort((a: any, b: any) => toMillis(b.updatedAt) - toMillis(a.updatedAt));
        callback(items);
      });
    } else {
      let intervalId: ReturnType<typeof setInterval>;
      const poll = async () => {
        try {
          const items = await messagingService.getConversations(userId);
          callback(items);
        } catch (e) {
          console.error('❌ Error polling conversations (Mock):', e);
        }
      };
      poll();
      intervalId = setInterval(poll, 15000);
      return () => clearInterval(intervalId);
    }
  },

  // Listen to messages in a conversation
  listenToMessages(conversationId: string, callback: (messages: Message[]) => void) {
    if (isFirebaseAvailable()) {
      const messagesRef = collection(db, COLLECTIONS.MESSAGES);
      const qy = query(
        messagesRef,
        where('conversationId', '==', conversationId)
      );
      return onSnapshot(qy, (qs) => {
        const items = qs.docs.map(d => ({ id: d.id, ...d.data() })) as Message[];
        const toMillis = (val: any): number => {
           if (!val) return 0;
           if (typeof val === 'number') return val;
           if (typeof val?.toMillis === 'function') return val.toMillis();
           if (typeof val?.toDate === 'function') return val.toDate().getTime();
           return 0;
        };
        items.sort((a: any, b: any) => toMillis(a.timestamp) - toMillis(b.timestamp));
        callback(items);
      });
    } else {
      let intervalId: ReturnType<typeof setInterval>;
      const poll = async () => {
        try {
          const items = await messagingService.getMessages(conversationId, 100);
          callback(items);
        } catch (e) {
          console.error('❌ Error polling messages (Mock):', e);
        }
      };
      poll();
      intervalId = setInterval(poll, 5000);
      return () => clearInterval(intervalId);
    }
  },

  // Mark conversation as read by a user
  async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      const conversationRef = doc(db, COLLECTIONS.CONVERSATIONS, conversationId);
      await updateDoc(conversationRef, {
        [`unreadCount.${userId}`]: 0,
        updatedAt: serverTimestamp(),
      } as any);
    } catch (e) {
      console.error('❌ Error marking conversation as read:', e);
      throw e;
    }
  },

  // Listen to comments
  listenToComments(postId: string, callback: (comments: Comment[]) => void) {
    if (isFirebaseAvailable()) {
      const commentsRef = collection(db, COLLECTIONS.COMMENTS);
      const q = query(
        commentsRef,
        where('postId', '==', postId)
      );
      
      return onSnapshot(q, (querySnapshot) => {
        const items = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
        })) as Comment[];
        const toMillis = (val: any): number => {
          if (!val) return 0;
          if (typeof val === 'number') return val;
          if (typeof (val as any)?.toMillis === 'function') return (val as any).toMillis();
          if (typeof (val as any)?.toDate === 'function') return (val as any).toDate().getTime();
          if (val instanceof Date) return val.getTime();
          return 0;
        };
        const sorted = items.sort((a: any, b: any) => toMillis(a.createdAt) - toMillis(b.createdAt));
        callback(sorted);
      });
    } else {
      // Mock implementation
      let intervalId: ReturnType<typeof setInterval>;
      
      const pollForUpdates = async () => {
        try {
          const comments = await commentService.getComments(postId);
          callback(comments);
        } catch (error) {
          console.error('❌ Error polling comments (Mock):', error);
        }
      };
      
      // Initial load
      pollForUpdates();
      
      // Poll every 10 seconds
      intervalId = setInterval(pollForUpdates, 10000);
      
      // Return unsubscribe function
      return () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }
  }
};

// Professional Services
export const professionalService = {
  // Save professional data
  async saveProfessional(userId: string, professionalData: ProfessionalData): Promise<void> {
    try {
      const professionalRef = doc(db, COLLECTIONS.PROFESSIONALS, userId);
      await setDoc(professionalRef, {
        ...professionalData,
        userId,
        updatedAt: serverTimestamp()
      }, { merge: true });
      console.log('✅ Professional data saved successfully');
    } catch (error) {
      console.error('❌ Error saving professional data:', error);
      throw error;
    }
  },

  // Get professional by user ID
  async getProfessional(userId: string): Promise<ProfessionalData | null> {
    try {
      const professionalRef = doc(db, COLLECTIONS.PROFESSIONALS, userId);
      const professionalSnap = await getDoc(professionalRef);
      
      if (professionalSnap.exists()) {
        return professionalSnap.data() as ProfessionalData;
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting professional data:', error);
      throw error;
    }
  },

  // Get all verified professionals
  async getVerifiedProfessionals(): Promise<ProfessionalData[]> {
    try {
      const professionalsRef = collection(db, COLLECTIONS.PROFESSIONALS);
      const q = query(professionalsRef, where('isVerified', '==', true));
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data()) as ProfessionalData[];
    } catch (error) {
      console.error('❌ Error getting verified professionals:', error);
      if (isPermissionDenied(error)) {
        console.log('🔒 Returning empty professionals due to permission rules');
        return [] as ProfessionalData[];
      }
      throw error;
    }
  },

  // Save professional services
  async saveServices(userId: string, servicesData: any): Promise<void> {
    try {
      const servicesRef = doc(db, COLLECTIONS.PROFESSIONALS, userId);
      await setDoc(servicesRef, {
        services: servicesData,
        updatedAt: serverTimestamp()
      }, { merge: true });
      console.log('✅ Professional services saved successfully');
    } catch (error) {
      console.error('❌ Error saving professional services:', error);
      throw error;
    }
  },

  // Get professional services
  async getServices(userId: string): Promise<any | null> {
    try {
      const servicesRef = doc(db, COLLECTIONS.PROFESSIONALS, userId);
      const servicesSnap = await getDoc(servicesRef);
      
      if (servicesSnap.exists()) {
        const data = servicesSnap.data();
        return data.services || null;
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting professional services:', error);
      if (isPermissionDenied(error)) {
        console.log('🔒 Returning null services due to permission rules');
        return null;
      }
      throw error;
    }
  }
};

// Product Services
export const productService = {
  // Save product
  async saveProduct(product: Product): Promise<void> {
    try {
      const productRef = doc(db, COLLECTIONS.PRODUCTS, product.id);
      await setDoc(productRef, {
        ...product,
        updatedAt: serverTimestamp()
      }, { merge: true });
      console.log('✅ Product saved successfully');
    } catch (error) {
      console.error('❌ Error saving product:', error);
      throw error;
    }
  },

  // Get products by category
  async getProductsByCategory(category: string, limitCount = 20): Promise<Product[]> {
    try {
      const productsRef = collection(db, COLLECTIONS.PRODUCTS);
      const q = query(
        productsRef,
        where('category', '==', category),
        where('inStock', '==', true),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
    } catch (error) {
      if (isPermissionDenied(error)) {
        console.log('🔒 getProductsByCategory: Permission denied, returning empty list (expected - products require admin write)');
        return [] as Product[];
      }
      console.error('❌ Error getting products by category:', error);
      throw error;
    }
  },

  // Search products
  async searchProducts(searchTerm: string, limitCount = 20): Promise<Product[]> {
    try {
      const productsRef = collection(db, COLLECTIONS.PRODUCTS);
      const q = query(
        productsRef,
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\uf8ff'),
        where('inStock', '==', true),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
    } catch (error) {
      console.error('❌ Error searching products:', error);
      if (isPermissionDenied(error)) {
        console.log('🔒 Returning empty products due to permission rules');
        return [] as Product[];
      }
      throw error;
    }
  },

  // Get product by ID
  async getProduct(productId: string): Promise<Product | null> {
    try {
      const productRef = doc(db, COLLECTIONS.PRODUCTS, productId);
      const productSnap = await getDoc(productRef);
      
      if (productSnap.exists()) {
        return { id: productSnap.id, ...productSnap.data() } as Product;
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting product:', error);
      if (isPermissionDenied(error)) {
        console.log('🔒 Returning null product due to permission rules');
        return null;
      }
      throw error;
    }
  }
};

// Professional Product Services
export const professionalProductService = {
  // Save professional product
  async saveProfessionalProduct(product: ProfessionalProduct, sellerId: string): Promise<void> {
    try {
      const productRef = doc(db, COLLECTIONS.PROFESSIONAL_PRODUCTS, product.id);
      await setDoc(productRef, {
        ...product,
        sellerId,
        updatedAt: serverTimestamp()
      }, { merge: true });
      console.log('✅ Professional product saved successfully');
    } catch (error) {
      console.error('❌ Error saving professional product:', error);
      throw error;
    }
  },

  // Get products by seller
  async getProductsBySeller(sellerId: string): Promise<ProfessionalProduct[]> {
    try {
      const productsRef = collection(db, COLLECTIONS.PROFESSIONAL_PRODUCTS);
      const q = query(
        productsRef,
        where('sellerId', '==', sellerId)
      );
      
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ProfessionalProduct[];
      
      // Sort by createdAt descending
      return items.sort((a: any, b: any) => {
        const tA = a.createdAt?.toMillis?.() || a.createdAt?.getTime?.() || 0;
        const tB = b.createdAt?.toMillis?.() || b.createdAt?.getTime?.() || 0;
        return tB - tA;
      });
    } catch (error) {
      console.error('❌ Error getting seller products:', error);
      throw error;
    }
  },

  // Get pending products for approval
  async getPendingProducts(): Promise<ProfessionalProduct[]> {
    try {
      const productsRef = collection(db, COLLECTIONS.PROFESSIONAL_PRODUCTS);
      const q = query(
        productsRef,
        where('status', '==', 'pending')
      );
      
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ProfessionalProduct[];
      
      // Sort by createdAt ascending
      return items.sort((a: any, b: any) => {
        const tA = a.createdAt?.toMillis?.() || a.createdAt?.getTime?.() || 0;
        const tB = b.createdAt?.toMillis?.() || b.createdAt?.getTime?.() || 0;
        return tA - tB;
      });
    } catch (error) {
      console.error('❌ Error getting pending products:', error);
      throw error;
    }
  }
};

// Lost & Found Services
export const lostFoundService = {
  async listReports(): Promise<any[]> {
    try {
      const reportsRef = collection(db, COLLECTIONS.LOST_FOUND_REPORTS);
      const qy = query(reportsRef, orderBy('createdAt', 'desc'));
      const qs = await getDocs(qy);
      return qs.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })) as any[];
    } catch (error) {
      if (isPermissionDenied(error)) {
        console.log('🔒 listReports: Permission denied, returning empty list (expected with current rules)');
        return [] as any[];
      }
      console.error('❌ Error listing lost&found reports:', error);
      return [] as any[];
    }
  },
  async createReport(report: Omit<any, 'id' | 'createdAt' | 'updatedAt' | 'responses'>): Promise<string> {
    try {
      const reportsRef = collection(db, COLLECTIONS.LOST_FOUND_REPORTS);
      const docRef = await addDoc(reportsRef, {
        ...report,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        responses: []
      });
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating lost&found report:', error);
      throw error;
    }
  },
  async respondToReport(reportId: string, response: Omit<any, 'id' | 'createdAt' | 'reportId'>) {
    try {
      const reportRef = doc(db, COLLECTIONS.LOST_FOUND_REPORTS, reportId);
      const reportSnap = await getDoc(reportRef);
      if (!reportSnap.exists()) throw new Error('Report not found');
      const newResponse = { ...response, id: `${Date.now()}`, createdAt: new Date().toISOString(), reportId };
      await updateDoc(reportRef, {
        responses: arrayUnion(newResponse),
        updatedAt: serverTimestamp(),
      });
      return newResponse as any;
    } catch (error) {
      console.error('❌ Error responding to report:', error);
      throw error;
    }
  },
  async updateReportStatus(reportId: string, status: 'lost' | 'found' | 'reunited') {
    try {
      const reportRef = doc(db, COLLECTIONS.LOST_FOUND_REPORTS, reportId);
      await updateDoc(reportRef, { status, updatedAt: serverTimestamp() });
    } catch (error) {
      console.error('❌ Error updating report status:', error);
      throw error;
    }
  },
};

// Cat Sitter Services
export const petSitterService = {
  async saveProfile(userId: string, profile: any): Promise<string> {
    try {
      const refDoc = doc(db, COLLECTIONS.PET_SITTER_PROFILES, userId);
      await setDoc(refDoc, { ...profile, userId, updatedAt: serverTimestamp(), createdAt: serverTimestamp() }, { merge: true });
      return userId;
    } catch (e) {
      console.error('❌ Error saving cat sitter profile:', e);
      throw e;
    }
  },
  async getProfile(userId: string): Promise<any | null> {
    try {
      const refDoc = doc(db, COLLECTIONS.PET_SITTER_PROFILES, userId);
      const snap = await getDoc(refDoc);
      if (snap.exists()) return { id: snap.id, ...snap.data() } as any;
      return null;
    } catch (error) {
      console.error('❌ Error fetching cat sitter profile:', error);
      if (isPermissionDenied(error)) {
        console.log('🔒 Returning null cat sitter profile due to permission rules');
        return null;
      }
      return null;
    }
  },
  async getAllProfiles(limitCount = 100): Promise<any[]> {
    try {
      const { auth } = await import('./firebase');
      if (!auth.currentUser) {
        console.log('⚠️ Skipping getAllProfiles - user not authenticated');
        return [];
      }
      
      console.log('🔄 Fetching all cat sitter profiles');
      const profilesRef = collection(db, COLLECTIONS.PET_SITTER_PROFILES);
      const q = query(profilesRef, where('isActive', '==', true), limit(limitCount));
      const qs = await getDocs(q);
      const profiles = qs.docs.map(d => ({ id: d.id, ...d.data() }));
      console.log(`✅ Loaded ${profiles.length} active cat sitter profiles`);
      return profiles;
    } catch (error) {
      console.error('❌ Error getting all cat sitter profiles:', error);
      if (isPermissionDenied(error)) {
        console.log('🔒 Returning empty profiles due to permission rules');
        return [];
      }
      return [];
    }
  },
  async listBookingsForSitter(sitterUserId: string): Promise<any[]> {
    try {
      const bookingsRef = collection(db, COLLECTIONS.BOOKINGS);
      const qy = query(bookingsRef, where('catSitterId', '==', sitterUserId));
      const qs = await getDocs(qy);
      const items = qs.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      return items.sort((a: any, b: any) => {
         const tA = a.createdAt?.toMillis?.() || 0;
         const tB = b.createdAt?.toMillis?.() || 0;
         return tB - tA;
      });
    } catch (error) {
      console.error('❌ Error listing bookings:', error);
      return [];
    }
  },
  async respondToBooking(bookingId: string, status: 'accepted' | 'declined'): Promise<void> {
    try {
      const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
      await updateDoc(bookingRef, { status, updatedAt: serverTimestamp() });
    } catch (error) {
      console.error('❌ Error responding to booking:', error);
      throw error;
    }
  },
};

// Order Services
export const orderService = {
  // Create order
  async createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const ordersRef = collection(db, COLLECTIONS.ORDERS);
      const docRef = await addDoc(ordersRef, {
        ...order,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Order created successfully');
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating order:', error);
      throw error;
    }
  },

  // Get orders by customer
  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    try {
      const ordersRef = collection(db, COLLECTIONS.ORDERS);
      const q = query(
        ordersRef,
        where('customerId', '==', customerId)
      );
      
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      
      return items.sort((a: any, b: any) => {
        const tA = a.createdAt?.toMillis?.() || 0;
        const tB = b.createdAt?.toMillis?.() || 0;
        return tB - tA;
      });
    } catch (error) {
      console.error('❌ Error getting customer orders:', error);
      if (isPermissionDenied(error)) {
        console.log('🔒 Returning empty orders due to permission rules');
        return [] as Order[];
      }
      throw error;
    }
  },

  // Update order status
  async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    try {
      const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
      await updateDoc(orderRef, {
        status,
        updatedAt: serverTimestamp()
      });
      console.log('✅ Order status updated successfully');
    } catch (error) {
      console.error('❌ Error updating order status:', error);
      throw error;
    }
  }
};

// Messaging Services
export const messagingService = {
  // Create conversation
  async createConversation(participants: string[]): Promise<string> {
    try {
      const conversationsRef = collection(db, COLLECTIONS.CONVERSATIONS);
      const docRef = await addDoc(conversationsRef, {
        participants,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        unreadCount: participants.reduce((acc, userId) => ({ ...acc, [userId]: 0 }), {})
      });
      
      console.log('✅ Conversation created successfully');
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating conversation:', error);
      throw error;
    }
  },

  // Send message
  async sendMessage(message: { senderId: string; receiverId: string; content: string; conversationId: string }): Promise<string> {
    try {
      const messagesRef = collection(db, COLLECTIONS.MESSAGES);
      const docRef = await addDoc(messagesRef, {
        ...message,
        timestamp: serverTimestamp(),
        read: false
      });
      
      // Update conversation with last message and increment unread count for receiver
      const conversationRef = doc(db, COLLECTIONS.CONVERSATIONS, message.conversationId);
      await updateDoc(conversationRef, {
        lastMessage: {
          ...message,
          id: docRef.id,
          timestamp: Date.now()
        },
        [`unreadCount.${message.receiverId}`]: increment(1),
        updatedAt: serverTimestamp()
      } as any);
      
      console.log('✅ Message sent successfully');
      
      // Send push notification to receiver
      try {
        const receiverRef = doc(db, COLLECTIONS.USERS, message.receiverId);
        const receiverSnap = await getDoc(receiverRef);
        if (receiverSnap.exists()) {
          const receiverData = receiverSnap.data();
          const pushToken = receiverData.pushToken;
          
          if (pushToken) {
            const senderRef = doc(db, COLLECTIONS.USERS, message.senderId);
            const senderSnap = await getDoc(senderRef);
            const senderName = senderSnap.exists() ? (senderSnap.data().name || senderSnap.data().pseudo || 'Quelqu\'un') : 'Quelqu\'un';
            
            // Send notification
            await fetch('https://exp.host/--/api/v2/push/send', {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: pushToken,
                sound: 'default',
                title: `Nouveau message de ${senderName}`,
                body: message.content.length > 100 ? message.content.substring(0, 100) + '...' : message.content,
                data: {
                  type: 'message',
                  conversationId: message.conversationId,
                  senderId: message.senderId
                },
              }),
            });
            console.log('✅ Push notification sent to receiver');
          }
        }
      } catch (notifError) {
        console.warn('⚠️ Failed to send push notification:', notifError);
      }
      
      return docRef.id;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    }
  },

  // Get messages for conversation
  async getMessages(conversationId: string, limitCount = 50): Promise<Message[]> {
    try {
      const messagesRef = collection(db, COLLECTIONS.MESSAGES);
      const q = query(
        messagesRef,
        where('conversationId', '==', conversationId)
      );
      
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      
      const toMillis = (val: any): number => {
        if (val == null) return 0;
        if (typeof val === 'number') return val;
        if (typeof (val as any)?.toMillis === 'function') return (val as any).toMillis();
        if (typeof (val as any)?.toDate === 'function') return (val as any).toDate().getTime();
        return 0;
      };
      
      return items
        .sort((a: any, b: any) => toMillis(a.timestamp) - toMillis(b.timestamp))
        .slice(-limitCount);
    } catch (error) {
      console.error('❌ Error getting messages:', error);
      if (isPermissionDenied(error)) {
        console.log('🔒 Returning empty messages due to permission rules');
        return [] as Message[];
      }
      throw error;
    }
  },

  // Get conversations for user
  async getConversations(userId: string): Promise<Conversation[]> {
    try {
      const conversationsRef = collection(db, COLLECTIONS.CONVERSATIONS);
      const q = query(
        conversationsRef,
        where('participants', 'array-contains', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Conversation[];
      
      const toMillis = (val: any): number => {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        if (typeof val?.toMillis === 'function') return val.toMillis();
        if (typeof val?.toDate === 'function') return val.toDate().getTime();
        return 0;
      };
      
      return items.sort((a: any, b: any) => toMillis(b.updatedAt) - toMillis(a.updatedAt));
    } catch (error) {
      console.error('❌ Error getting conversations:', error);
      if (isPermissionDenied(error)) {
        console.log('🔒 Returning empty conversations due to permission rules');
        return [] as Conversation[];
      }
      throw error;
    }
  }
};

// Friend Request Services
export const friendRequestService = {
  // Send friend request (idempotent)
  async sendFriendRequest(senderId: string, receiverId: string): Promise<string> {
    try {
      // Create idempotent docId: alphabetically sorted UIDs
      const docId = [senderId, receiverId].sort().join('_');
      const friendRequestRef = doc(db, COLLECTIONS.FRIEND_REQUESTS, docId);
      
      console.log('🔄 Sending friend request with docId:', docId);
      
      // Check if request already exists
      const existingRequest = await getDoc(friendRequestRef);
      if (existingRequest.exists()) {
        const data = existingRequest.data();
        if (data.status === 'pending') {
          console.log('⚠️ Friend request already exists (pending)');
          throw new Error('Demande d\'ami déjà envoyée');
        } else if (data.status === 'accepted') {
          console.log('⚠️ Users are already friends');
          throw new Error('Vous êtes déjà amis');
        }
        // If rejected, allow to re-send by updating
      }
      
      // Create or update request
      await setDoc(friendRequestRef, {
        senderId,
        receiverId,
        status: 'pending',
        timestamp: serverTimestamp()
      }, { merge: true });
      
      console.log('✅ Friend request sent successfully (idempotent)');
      return docId;
    } catch (error) {
      console.error('❌ Error sending friend request:', error);
      throw error;
    }
  },

  // Respond to friend request
  async respondToFriendRequest(requestId: string, accept: boolean): Promise<void> {
    try {
      const requestRef = doc(db, COLLECTIONS.FRIEND_REQUESTS, requestId);
      await updateDoc(requestRef, {
        status: accept ? 'accepted' : 'rejected',
        respondedAt: serverTimestamp()
      });
      
      console.log('✅ Friend request response updated successfully');
    } catch (error) {
      console.error('❌ Error responding to friend request:', error);
      throw error;
    }
  },

  // Get friend requests for user (received)
  async getFriendRequests(userId: string): Promise<FriendRequest[]> {
    try {
      const friendRequestsRef = collection(db, COLLECTIONS.FRIEND_REQUESTS);
      const q = query(
        friendRequestsRef,
        where('receiverId', '==', userId),
        where('status', '==', 'pending')
      );
      
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FriendRequest[];
      
      const toMillis = (val: any): number => {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        if (typeof val?.toMillis === 'function') return val.toMillis();
        if (typeof val?.toDate === 'function') return val.toDate().getTime();
        return 0;
      };
      
      return items.sort((a: any, b: any) => toMillis(b.timestamp) - toMillis(a.timestamp));
    } catch (error) {
      console.error('❌ Error getting friend requests:', error);
      throw error;
    }
  },

  // Get sent friend requests
  async getSentFriendRequests(userId: string): Promise<FriendRequest[]> {
    try {
      const friendRequestsRef = collection(db, COLLECTIONS.FRIEND_REQUESTS);
      const q = query(
        friendRequestsRef,
        where('senderId', '==', userId),
        where('status', '==', 'pending')
      );
      
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FriendRequest[];
      
      const toMillis = (val: any): number => {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        if (typeof val?.toMillis === 'function') return val.toMillis();
        if (typeof val?.toDate === 'function') return val.toDate().getTime();
        return 0;
      };
      
      return items.sort((a: any, b: any) => toMillis(b.timestamp) - toMillis(a.timestamp));
    } catch (error) {
      console.error('❌ Error getting sent friend requests:', error);
      throw error;
    }
  },

  // Cancel friend request
  async cancelFriendRequest(requestId: string): Promise<void> {
    try {
      const requestRef = doc(db, COLLECTIONS.FRIEND_REQUESTS, requestId);
      await deleteDoc(requestRef);
      console.log('✅ Friend request cancelled successfully');
    } catch (error) {
      console.error('❌ Error cancelling friend request:', error);
      throw error;
    }
  }
};

// Badge Services
export const badgeService = {
  // Get all badges
  async getAllBadges(): Promise<Badge[]> {
    try {
      const badgesRef = collection(db, COLLECTIONS.BADGES);
      const querySnapshot = await getDocs(badgesRef);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Badge[];
    } catch (error) {
      console.error('❌ Error getting badges:', error);
      if (isPermissionDenied(error)) {
        console.log('🔒 Returning empty badges due to permission rules');
        return [] as Badge[];
      }
      throw error;
    }
  },

  // Award badge to user
  async awardBadge(userId: string, badgeId: string): Promise<void> {
    try {
      const userBadgeRef = doc(db, COLLECTIONS.USER_BADGES, `${userId}_${badgeId}`);
      await setDoc(userBadgeRef, {
        userId,
        badgeId,
        earnedAt: serverTimestamp()
      }, { merge: true });
      console.log('✅ Badge awarded successfully');
    } catch (error) {
      console.error('❌ Error awarding badge:', error);
      throw error;
    }
  },

  // Get user badges
  async getUserBadges(userId: string): Promise<Badge[]> {
    try {
      const userBadgesRef = collection(db, COLLECTIONS.USER_BADGES);
      const q = query(userBadgesRef, where('userId', '==', userId));
      
      const querySnapshot = await getDocs(q);
      const badgeIds = querySnapshot.docs.map(doc => doc.data().badgeId);
      
      // Get badge details
      const badges: Badge[] = [];
      for (const badgeId of badgeIds) {
        const badgeRef = doc(db, COLLECTIONS.BADGES, badgeId);
        const badgeSnap = await getDoc(badgeRef);
        if (badgeSnap.exists()) {
          badges.push({ id: badgeSnap.id, ...badgeSnap.data() } as Badge);
        }
      }
      
      return badges;
    } catch (error) {
      console.error('❌ Error getting user badges:', error);
      throw error;
    }
  }
};

// Challenge Services
export const challengeService = {
  // Get active challenges
  async getActiveChallenges(): Promise<Challenge[]> {
    try {
      const challengesRef = collection(db, COLLECTIONS.CHALLENGES);
      const now = new Date();

      // Avoid multiple range filters to prevent composite index requirement
      const qy = query(
        challengesRef,
        where('startDate', '<=', now),
        orderBy('startDate', 'desc' as any),
        limit(50)
      );
      const qs = await getDocs(qy);

      const toMillis = (val: any): number => {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        if (typeof (val as any)?.toMillis === 'function') return (val as any).toMillis();
        if (typeof (val as any)?.toDate === 'function') return (val as any).toDate().getTime();
        if (val instanceof Date) return val.getTime();
        return 0;
      };

      const nowMs = now.getTime();
      const items = qs.docs
        .map(d => ({ id: d.id, ...d.data() })) as Challenge[];

      // Client-side filter: endDate >= now
      const filtered = items.filter((c: any) => toMillis((c as any).endDate) >= nowMs);

      return filtered;
    } catch (error) {
      if (isPermissionDenied(error)) {
        console.log('🔒 getActiveChallenges: Permission denied, returning empty list (expected - challenges require admin write)');
        return [] as Challenge[];
      }
      console.error('❌ Error getting active challenges:', error);
      throw error;
    }
  },

  // Join a challenge for a user
  async joinChallenge(params: { challengeId: string; userId: string }): Promise<string> {
    try {
      const { challengeId, userId } = params;
      const userChallengesRef = collection(db, COLLECTIONS.USER_CHALLENGES);
      const docRef = await addDoc(userChallengesRef, {
        challengeId,
        userId,
        status: 'active',
        startedAt: serverTimestamp(),
        pointsEarned: 0,
        updatedAt: serverTimestamp(),
      });
      try {
        const challengeRef = doc(db, COLLECTIONS.CHALLENGES, challengeId);
        await updateDoc(challengeRef, { participants: increment(1), updatedAt: serverTimestamp() });
      } catch (e) {
        console.warn('⚠️ Could not increment participants on challenge:', String(e));
      }
      return docRef.id;
    } catch (error) {
      console.error('❌ Error joining challenge:', error);
      throw error;
    }
  },

  // Get user challenges
  async getUserChallenges(userId: string): Promise<any[]> {
    try {
      const refCol = collection(db, COLLECTIONS.USER_CHALLENGES);
      const qy = query(refCol, where('userId', '==', userId));
      const qs = await getDocs(qy);
      return qs.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.error('❌ Error fetching user challenges:', e);
      throw e;
    }
  },

  // Submit proof for a joined challenge and create participation
  async submitProof(params: { userChallengeId: string; challengeId: string; userId: string; userName?: string | null; userPhoto?: string | null; proof: { type: 'photo' | 'video' | 'text'; data: string } }): Promise<string> {
    try {
      const { userChallengeId, challengeId, userId, userName, userPhoto, proof } = params;
      const participationsRef = collection(db, COLLECTIONS.CHALLENGE_PARTICIPATIONS);
      const docRef = await addDoc(participationsRef, {
        challengeId,
        userId,
        userName: userName ?? null,
        userPhoto: userPhoto ?? null,
        proof: { ...proof, timestamp: serverTimestamp() },
        status: 'pending',
        yesVotes: 0,
        noVotes: 0,
        totalVotes: 0,
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      try {
        const ucRef = doc(db, COLLECTIONS.USER_CHALLENGES, userChallengeId);
        await updateDoc(ucRef, { status: 'pending_validation', validationStatus: 'pending', updatedAt: serverTimestamp() } as any);
      } catch (e) {
        console.warn('⚠️ Could not update user challenge status:', String(e));
      }
      return docRef.id;
    } catch (error) {
      console.error('❌ Error submitting proof:', error);
      throw error;
    }
  },

  // Vote on a participation
  async voteOnParticipation(params: { participationId: string; voterId: string; vote: 'yes' | 'no' }): Promise<void> {
    const { participationId, voterId, vote } = params;
    try {
      const partRef = doc(db, COLLECTIONS.CHALLENGE_PARTICIPATIONS, participationId);
      await runTransaction(db as any, async (tx: any) => {
        const snap = await tx.get(partRef);
        if (!snap.exists()) throw new Error('Participation not found');
        const data = snap.data() as any;
        const votes: any[] = Array.isArray(data.votes) ? data.votes : [];
        const idx = votes.findIndex((v: any) => v.voterId === voterId);
        let yesVotes = Number(data.yesVotes ?? 0);
        let noVotes = Number(data.noVotes ?? 0);
        let totalVotes = Number(data.totalVotes ?? 0);
        if (idx !== -1) {
          const prev = votes[idx].vote;
          votes[idx] = { voterId, vote, timestamp: Date.now() };
          if (prev !== vote) {
            if (prev === 'yes') { yesVotes--; noVotes++; } else { noVotes--; yesVotes++; }
          }
        } else {
          votes.push({ voterId, vote, timestamp: Date.now() });
          if (vote === 'yes') yesVotes++; else noVotes++;
          totalVotes++;
        }
        let status = data.status;
        if (status === 'pending' && yesVotes >= 3) {
          status = 'approved';
        }
        tx.update(partRef, { votes, yesVotes, noVotes, totalVotes, status, updatedAt: serverTimestamp() });
        if (status === 'approved' && data.status !== 'approved') {
          const userChallengesRef = collection(db, COLLECTIONS.USER_CHALLENGES);
          const ucQuery = query(userChallengesRef, where('userId', '==', data.userId), where('challengeId', '==', data.challengeId));
          const ucSnap = await getDocs(ucQuery);
          if (!ucSnap.empty) {
            const ucRef = doc(db, COLLECTIONS.USER_CHALLENGES, ucSnap.docs[0].id);
            tx.update(ucRef, { status: 'completed', validationStatus: 'approved', completedAt: serverTimestamp(), updatedAt: serverTimestamp() });
          }
        }
      });
      console.log('✅ Vote recorded successfully');
    } catch (e) {
      console.error('❌ Error voting participation:', e);
      throw e;
    }
  },

  // Get participations (optionally by status)
  async getParticipations(filter?: { status?: 'pending' | 'approved' | 'rejected' }): Promise<any[]> {
    try {
      const colRef = collection(db, COLLECTIONS.CHALLENGE_PARTICIPATIONS);
      let qy: any = colRef;
      if (filter?.status) {
        qy = query(colRef, where('status', '==', filter.status));
      }
      const qs = await getDocs(qy);
      return qs.docs.map(d => {
        const data = (d.data() ?? {}) as Record<string, unknown>;
        return { id: d.id, ...data } as any;
      });
    } catch (e) {
      if (isPermissionDenied(e)) {
        console.warn('🔒 getParticipations permission-denied; returning empty array');
        return [] as any[];
      }
      console.error('❌ Error getting participations (unexpected):', e);
      throw e;
    }
  },

  // Build leaderboard from userChallenges
  async getLeaderboard(): Promise<{ userId: string; totalPoints: number }[]> {
    try {
      const refCol = collection(db, COLLECTIONS.USER_CHALLENGES);
      const qs = await getDocs(refCol);
      const agg: Record<string, number> = {};
      qs.docs.forEach(d => {
        const data = d.data() as any;
        if (data.status === 'completed') {
          const pts = Number(data.pointsEarned ?? data.points ?? 0);
          const key = String(data.userId);
          agg[key] = (agg[key] ?? 0) + pts;
        }
      });
      return Object.entries(agg).map(([userId, totalPoints]) => ({ userId, totalPoints })).sort((a, b) => b.totalPoints - a.totalPoints);
    } catch (e) {
      if (isPermissionDenied(e)) {
        console.warn('🔒 getLeaderboard permission-denied; returning empty leaderboard');
        return [] as { userId: string; totalPoints: number }[];
      }
      console.error('❌ Error building leaderboard (unexpected):', e);
      throw e;
    }
  },

  // Create a new challenge
  async createChallenge(challenge: any): Promise<string> {
    try {
      const challengesRef = collection(db, COLLECTIONS.CHALLENGES);
      const docRef = await addDoc(challengesRef, {
        ...challenge,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        participants: 0,
        completions: 0,
      });
      console.log('✅ Challenge created successfully');
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating challenge:', error);
      throw error;
    }
  },

  // Submit challenge entry
  async submitChallenge(submission: any): Promise<string> {
    try {
      const submissionsRef = collection(db, COLLECTIONS.CHALLENGE_SUBMISSIONS);
      const docRef = await addDoc(submissionsRef, {
        ...submission,
        createdAt: serverTimestamp(),
        votes: 0
      });
      console.log('✅ Challenge submission created successfully');
      return docRef.id;
    } catch (error) {
      console.error('❌ Error submitting challenge:', error);
      throw error;
    }
  },

  // Get challenge submissions
  async getChallengeSubmissions(challengeId: string): Promise<any[]> {
    try {
      const submissionsRef = collection(db, COLLECTIONS.CHALLENGE_SUBMISSIONS);
      const qy = query(
        submissionsRef,
        where('challengeId', '==', challengeId)
      );
      const qs = await getDocs(qy);
      const items = qs.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      return items.sort((a: any, b: any) => (b.votes || 0) - (a.votes || 0));
    } catch (error) {
      console.error('❌ Error getting challenge submissions:', error);
      if (isPermissionDenied(error)) {
        console.log('🔒 Returning empty submissions due to permission rules');
        return [] as any[];
      }
      throw error;
    }
  }
};

// Notification Services
export const notificationService = {
  // Create notification
  async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<string> {
    try {
      const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
      const docRef = await addDoc(notificationsRef, {
        ...notification,
        createdAt: serverTimestamp()
      });
      
      console.log('✅ Notification created successfully');
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
  },

  // Get user notifications
  async getUserNotifications(userId: string, limitCount = 50): Promise<Notification[]> {
    try {
      const notificationsRef = collection(db, COLLECTIONS.NOTIFICATIONS);
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      
      return items.sort((a: any, b: any) => {
        const tA = a.createdAt?.toMillis?.() || 0;
        const tB = b.createdAt?.toMillis?.() || 0;
        return tB - tA;
      });
    } catch (error) {
      console.error('❌ Error getting user notifications:', error);
      if (isPermissionDenied(error)) {
        console.log('🔒 Returning empty notifications due to permission rules');
        return [] as Notification[];
      }
      throw error;
    }
  },

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS, notificationId);
      await updateDoc(notificationRef, {
        read: true
      });
      
      console.log('✅ Notification marked as read');
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      throw error;
    }
  }
};

// Animal Species & Breeds Services
export const animalDataService = {
  // Get all animal species
  async getAnimalSpecies(): Promise<AnimalSpecies[]> {
    try {
      const speciesRef = collection(db, COLLECTIONS.ANIMAL_SPECIES);
      const querySnapshot = await getDocs(speciesRef);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AnimalSpecies[];
    } catch (error) {
      console.error('❌ Error getting animal species:', error);
      if (isPermissionDenied(error)) {
        console.log('🔒 Returning empty species due to permission rules');
        return [] as AnimalSpecies[];
      }
      throw error;
    }
  },

  // Get breeds for species
  async getBreedsBySpecies(speciesId: string): Promise<AnimalBreed[]> {
    try {
      const breedsRef = collection(db, COLLECTIONS.ANIMAL_BREEDS);
      const q = query(breedsRef, where('speciesId', '==', speciesId));
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AnimalBreed[];
    } catch (error) {
      console.error('❌ Error getting breeds:', error);
      if (isPermissionDenied(error)) {
        console.log('🔒 Returning empty breeds due to permission rules');
        return [] as AnimalBreed[];
      }
      throw error;
    }
  },

  // Add animal species
  async addAnimalSpecies(species: Omit<AnimalSpecies, 'id'>): Promise<string> {
    try {
      const speciesRef = collection(db, COLLECTIONS.ANIMAL_SPECIES);
      const docRef = await addDoc(speciesRef, species);
      
      console.log('✅ Animal species added successfully');
      return docRef.id;
    } catch (error) {
      console.error('❌ Error adding animal species:', error);
      throw error;
    }
  },

  // Add animal breed
  async addAnimalBreed(breed: Omit<AnimalBreed, 'id'>): Promise<string> {
    try {
      const breedsRef = collection(db, COLLECTIONS.ANIMAL_BREEDS);
      const docRef = await addDoc(breedsRef, breed);
      
      console.log('✅ Animal breed added successfully');
      return docRef.id;
    } catch (error) {
      console.error('❌ Error adding animal breed:', error);
      throw error;
    }
  }
};

// Booking Services
export const bookingService = {
  // Create booking
  async createBooking(booking: any): Promise<string> {
    try {
      const bookingsRef = collection(db, COLLECTIONS.BOOKINGS);
      const docRef = await addDoc(bookingsRef, {
        ...booking,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'pending'
      });
      console.log('✅ Booking created successfully');
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating booking:', error);
      throw error;
    }
  },

  // Get bookings by user
  async getBookingsByUser(userId: string): Promise<any[]> {
    try {
      const bookingsRef = collection(db, COLLECTIONS.BOOKINGS);
      const q = query(
        bookingsRef,
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      return items.sort((a: any, b: any) => {
        const tA = a.createdAt?.toMillis?.() || 0;
        const tB = b.createdAt?.toMillis?.() || 0;
        return tB - tA;
      });
    } catch (error) {
      console.error('❌ Error getting user bookings:', error);
      if (isPermissionDenied(error)) {
        console.log('🔒 Returning empty bookings due to permission rules');
        return [] as any[];
      }
      throw error;
    }
  },

  // Update booking status
  async updateBookingStatus(bookingId: string, status: string): Promise<void> {
    try {
      const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
      await updateDoc(bookingRef, {
        status,
        updatedAt: serverTimestamp()
      });
      console.log('✅ Booking status updated successfully');
    } catch (error) {
      console.error('❌ Error updating booking status:', error);
      throw error;
    }
  },

  // Get booking by ID
  async getBooking(bookingId: string): Promise<any | null> {
    try {
      const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
      const bookingSnap = await getDoc(bookingRef);
      
      if (bookingSnap.exists()) {
        return { id: bookingSnap.id, ...bookingSnap.data() } as any;
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting booking:', error);
      throw error;
    }
  }
};

// Health Records Services
export const healthService = {
  // Save health record
  async saveHealthRecord(petId: string, record: any): Promise<string> {
    try {
      const recordsRef = collection(db, COLLECTIONS.HEALTH_RECORDS);
      const docRef = await addDoc(recordsRef, {
        ...record,
        petId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('✅ Health record saved successfully');
      return docRef.id;
    } catch (error) {
      console.error('❌ Error saving health record:', error);
      throw error;
    }
  },

  // Get health records by pet
  async getHealthRecordsByPet(petId: string): Promise<any[]> {
    try {
      const recordsRef = collection(db, COLLECTIONS.HEALTH_RECORDS);
      const q = query(
        recordsRef,
        where('petId', '==', petId)
      );
      
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      return items.sort((a: any, b: any) => {
        const tA = a.createdAt?.toMillis?.() || 0;
        const tB = b.createdAt?.toMillis?.() || 0;
        return tB - tA;
      });
    } catch (error) {
      console.error('❌ Error getting health records:', error);
      if (isPermissionDenied(error)) {
        console.log('🔒 Returning empty health records due to permission rules');
        return [] as any[];
      }
      throw error;
    }
  },

  // Save vaccination record
  async saveVaccination(petId: string, vaccination: any): Promise<string> {
    try {
      const vaccinationsRef = collection(db, COLLECTIONS.VACCINATIONS);
      const docRef = await addDoc(vaccinationsRef, {
        ...vaccination,
        petId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('✅ Vaccination record saved successfully');
      return docRef.id;
    } catch (error) {
      console.error('❌ Error saving vaccination:', error);
      throw error;
    }
  },

  // Get vaccinations by pet
  async getVaccinationsByPet(petId: string): Promise<any[]> {
    try {
      const vaccinationsRef = collection(db, COLLECTIONS.VACCINATIONS);
      const q = query(
        vaccinationsRef,
        where('petId', '==', petId)
      );
      
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      return items.sort((a: any, b: any) => {
        const tA = a.date ? new Date(a.date).getTime() : 0;
        const tB = b.date ? new Date(b.date).getTime() : 0;
        return tB - tA;
      });
    } catch (error) {
      console.error('❌ Error getting vaccinations:', error);
      if (isPermissionDenied(error)) {
        console.log('🔒 Returning empty vaccinations due to permission rules');
        return [] as any[];
      }
      throw error;
    }
  }
};



// Emergency Services
export const emergencyService = {
  // Save emergency contact
  async saveEmergencyContact(userId: string, contact: any): Promise<string> {
    try {
      const contactsRef = collection(db, COLLECTIONS.EMERGENCY_CONTACTS);
      const docRef = await addDoc(contactsRef, {
        ...contact,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('✅ Emergency contact saved successfully');
      return docRef.id;
    } catch (error) {
      console.error('❌ Error saving emergency contact:', error);
      throw error;
    }
  },

  // Get emergency contacts by user
  async getEmergencyContactsByUser(userId: string): Promise<any[]> {
    try {
      const contactsRef = collection(db, COLLECTIONS.EMERGENCY_CONTACTS);
      const q = query(
        contactsRef,
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
    } catch (error) {
      console.error('❌ Error getting emergency contacts:', error);
      if (isPermissionDenied(error)) {
        console.log('🔒 Returning empty emergency contacts due to permission rules');
        return [] as any[];
      }
      throw error;
    }
  }
};

// Pet Matching Service
export const petMatchingService = {
  // Like a pet
  async likePet(fromPetId: string, toPetId: string, userId: string): Promise<{ matched: boolean; matchId?: string }> {
    try {
      const likeRef = doc(db, COLLECTIONS.PET_LIKES, `${fromPetId}_${toPetId}`);
      await setDoc(likeRef, {
        fromPetId,
        toPetId,
        userId,
        createdAt: serverTimestamp()
      });

      // Check if the other pet already liked this pet
      const reverseLikeRef = doc(db, COLLECTIONS.PET_LIKES, `${toPetId}_${fromPetId}`);
      const reverseLikeSnap = await getDoc(reverseLikeRef);

      if (reverseLikeSnap.exists()) {
        // It's a match!
        const matchId = [fromPetId, toPetId].sort().join('_');
        const matchRef = doc(db, COLLECTIONS.PET_MATCHES, matchId);
        
        await setDoc(matchRef, {
          petIds: [fromPetId, toPetId],
          createdAt: serverTimestamp(),
          lastMessageAt: null,
          messageCount: 0
        });

        console.log('🎉 Pet match created!');
        return { matched: true, matchId };
      }

      return { matched: false };
    } catch (error) {
      console.error('❌ Error liking pet:', error);
      throw error;
    }
  },

  // Pass a pet
  async passPet(fromPetId: string, toPetId: string): Promise<void> {
    try {
      const passRef = doc(db, COLLECTIONS.PET_PASSES, `${fromPetId}_${toPetId}`);
      await setDoc(passRef, {
        fromPetId,
        toPetId,
        createdAt: serverTimestamp()
      });
      console.log('✅ Pet passed');
    } catch (error) {
      console.error('❌ Error passing pet:', error);
      throw error;
    }
  },

  // Get matches for a pet
  async getPetMatches(petId: string): Promise<any[]> {
    try {
      const matchesRef = collection(db, COLLECTIONS.PET_MATCHES);
      const q = query(
        matchesRef,
        where('petIds', 'array-contains', petId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Error getting pet matches:', error);
      if (isPermissionDenied(error)) {
        console.log('🔒 Returning empty matches due to permission rules');
        return [];
      }
      throw error;
    }
  },

  // Get discovery pets (exclude already liked/passed)
  async getDiscoveryPets(petId: string, limitCount = 20): Promise<any[]> {
    try {
      // Get all pets
      const petsRef = collection(db, COLLECTIONS.PETS);
      const q = query(petsRef, limit(limitCount + 50));
      const querySnapshot = await getDocs(q);
      const allPets = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get already liked pets
      const likesRef = collection(db, COLLECTIONS.PET_LIKES);
      const likesQuery = query(
        likesRef,
        where('fromPetId', '==', petId)
      );
      const likesSnapshot = await getDocs(likesQuery);
      const likedPetIds = new Set(likesSnapshot.docs.map(doc => doc.data().toPetId));

      // Get already passed pets
      const passesRef = collection(db, COLLECTIONS.PET_PASSES);
      const passesQuery = query(
        passesRef,
        where('fromPetId', '==', petId)
      );
      const passesSnapshot = await getDocs(passesQuery);
      const passedPetIds = new Set(passesSnapshot.docs.map(doc => doc.data().toPetId));

      // Filter out current pet, liked, and passed pets
      const discoveryPets = allPets
        .filter(pet => 
          pet.id !== petId && 
          !likedPetIds.has(pet.id) && 
          !passedPetIds.has(pet.id)
        )
        .slice(0, limitCount);

      return discoveryPets;
    } catch (error) {
      console.error('❌ Error getting discovery pets:', error);
      if (isPermissionDenied(error)) {
        console.log('🔒 Returning empty discovery pets due to permission rules');
        return [];
      }
      throw error;
    }
  },

  // Unmatch pets
  async unmatchPets(matchId: string): Promise<void> {
    try {
      const matchRef = doc(db, COLLECTIONS.PET_MATCHES, matchId);
      await deleteDoc(matchRef);
      console.log('✅ Pets unmatched');
    } catch (error) {
      console.error('❌ Error unmatching pets:', error);
      throw error;
    }
  },

  // Get likes for a pet
  async getPetLikes(petId: string): Promise<any[]> {
    try {
      const likesRef = collection(db, COLLECTIONS.PET_LIKES);
      const q = query(
        likesRef,
        where('toPetId', '==', petId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Error getting pet likes:', error);
      if (isPermissionDenied(error)) {
        console.log('🔒 Returning empty likes due to permission rules');
        return [];
      }
      throw error;
    }
  }
};

// Review Services
export const reviewService = {
  // Get reviews for cat sitter
  async getReviewsBySitter(sitterId: string): Promise<any[]> {
    try {
      const reviewsRef = collection(db, COLLECTIONS.REVIEWS);
      const q = query(
        reviewsRef,
        where('targetId', '==', sitterId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      if (isPermissionDenied(error)) {
        console.log('🔒 getReviewsBySitter: Permission denied, returning empty list (expected with current rules)');
        return [];
      }
      console.error('❌ Error getting reviews:', error);
      return [];
    }
  },

  // Get reviews by target (supports both specific ID and 'all')
  async getReviewsByTarget(targetId: string, targetType: string): Promise<any[]> {
    try {
      const reviewsRef = collection(db, COLLECTIONS.REVIEWS);
      const constraints: any[] = [where('targetType', '==', targetType)];
      if (targetId !== 'all') {
        constraints.push(where('targetId', '==', targetId));
      }
      const q = query(reviewsRef, ...constraints);
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      const toMillis = (val: any): number => {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        if (typeof (val as any)?.toMillis === 'function') return (val as any).toMillis();
        if (typeof (val as any)?.toDate === 'function') return (val as any).toDate().getTime();
        if (val instanceof Date) return val.getTime();
        return 0;
      };
      return items.sort((a: any, b: any) => toMillis(b.createdAt) - toMillis(a.createdAt));
    } catch (error) {
      if (isPermissionDenied(error)) {
        console.log('🔒 getReviewsByTarget: Permission denied, returning empty list (expected with current rules)');
        return [];
      }
      console.error('❌ Error getting reviews:', error);
      return [];
    }
  },

  // Create review
  async createReview(review: any): Promise<string> {
    try {
      const reviewsRef = collection(db, COLLECTIONS.REVIEWS);
      const docRef = await addDoc(reviewsRef, {
        ...review,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('✅ Review created successfully');
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating review:', error);
      throw error;
    }
  },

  // Get all reviews
  async getAllReviews(limitCount = 100): Promise<any[]> {
    try {
      const reviewsRef = collection(db, COLLECTIONS.REVIEWS);
      const q = query(reviewsRef, orderBy('createdAt', 'desc'), limit(limitCount));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      if (isPermissionDenied(error)) {
        console.log('🔒 getAllReviews: Permission denied, returning empty list (expected with current rules)');
        return [];
      }
      console.error('❌ Error getting reviews:', error);
      return [];
    }
  }
};

// Export all services
export const databaseService = {
  user: userService,
  pet: petService,
  post: postService,
  comment: commentService,
  upload: uploadService,
  realtime: realtimeService,
  professional: professionalService,
  product: productService,
  professionalProduct: professionalProductService,
  order: orderService,
  review: reviewService,
  messaging: messagingService,
  friendRequest: friendRequestService,
  badge: badgeService,
  challenge: challengeService,
  notification: notificationService,
  animalData: animalDataService,
  lostFound: lostFoundService,
  petSitter: petSitterService,
  booking: bookingService,
  health: healthService,
  emergency: emergencyService,
  petMatching: petMatchingService,
};

export default databaseService;