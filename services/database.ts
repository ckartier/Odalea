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
import { db, storage, auth } from './firebase'; 
import { 
  User, Pet, Message, Post, Comment, Product, ProfessionalProduct, Order,
  Badge, Challenge, Notification, FriendRequest,
  Conversation, ProfessionalData, AnimalSpecies, AnimalBreed
} from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { safeJsonParse } from '@/lib/safe-json';
import { sanitizeForFirestore, sanitizeAndLog } from '@/lib/firestore-sanitizer';

// --- VALIDATION HELPERS ---

export function validateFirebaseUid(id: string | undefined | null): boolean {
  if (!id || typeof id !== 'string') return false;
  const trimmed = id.trim();
  if (trimmed.length < 20 || trimmed.length > 128) return false;
  if (/^[a-z]+-\d+$/i.test(trimmed)) return false; 
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return false;
  return true;
}

// --- CONSTANTS ---

const COLLECTIONS = {
  USERS: 'users',
  PETS: 'pets',
  PROFESSIONALS: 'professionals',
  PET_SITTER_PROFILES: 'petSitterProfiles',
  POSTS: 'posts',
  COMMENTS: 'comments',
  LIKES: 'likes',
  FRIEND_REQUESTS: 'friendRequests',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
  PRODUCTS: 'products',
  PROFESSIONAL_PRODUCTS: 'professionalProducts',
  ORDERS: 'orders',
  BOOKINGS: 'bookings',
  REVIEWS: 'reviews',
  LOST_FOUND_REPORTS: 'lostFoundReports',
  CHALLENGES: 'challenges',
  CHALLENGE_SUBMISSIONS: 'challengeSubmissions',
  CHALLENGE_PARTICIPATIONS: 'challengeParticipations',
  USER_CHALLENGES: 'userChallenges',
  BADGES: 'badges',
  USER_BADGES: 'userBadges',
  HEALTH_RECORDS: 'healthRecords',
  VACCINATIONS: 'vaccinations',
  EMERGENCY_CONTACTS: 'emergencyContacts',
  ANIMAL_SPECIES: 'animalSpecies',
  ANIMAL_BREEDS: 'animalBreeds',
  NOTIFICATIONS: 'notifications',
  PET_LIKES: 'petLikes',
  PET_MATCHES: 'petMatches',
  PET_PASSES: 'petPasses'
} as const;

// Helper interne pour récupérer l'ID utilisateur en toute sécurité
const getCurrentUserId = () => {
  const user = auth.currentUser;
  if (!user) throw new Error("Action non autorisée : Utilisateur non connecté.");
  return user.uid;
};

const isFirebaseAvailable = () => {
  try {
    return !!db && !!storage;
  } catch {
    return false;
  }
};

const isPermissionDenied = (e: unknown): boolean => {
  const code = (e as any)?.code ?? '';
  return typeof code === 'string' && code.includes('permission-denied');
};

// --- SERVICES ---

export const userService = {
  async saveUser(user: User): Promise<void> {
    try {
      const uid = getCurrentUserId();
      const userRef = doc(db, COLLECTIONS.USERS, uid);
      
      const cleanData = sanitizeAndLog({
        ...user,
        id: uid, 
        updatedAt: serverTimestamp()
      }, 'User');
      
      await setDoc(userRef, cleanData, { merge: true });
      console.log('✅ User saved successfully');
    } catch (error) {
      console.error('❌ Error saving user:', error);
      throw error;
    }
  },

  async getUser(userId: string): Promise<User | null> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        return { id: userSnap.id, ...data, pets: Array.isArray(data.pets) ? data.pets : [] } as User;
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting user:', error);
      throw error;
    }
  },
  
  async searchUsers(searchTerm: string, limitCount = 20): Promise<User[]> {
    try {
        const usersRef = collection(db, COLLECTIONS.USERS);
        const q = query(usersRef, where('name', '>=', searchTerm), where('name', '<=', searchTerm + '\uf8ff'), limit(limitCount));
        const qs = await getDocs(q);
        return qs.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
    } catch (error) { console.error(error); return []; }
  },

  // AJOUT : Fonction manquante demandée par l'erreur
  async getAllUsers(limitCount = 200): Promise<User[]> {
    try {
      const usersRef = collection(db, COLLECTIONS.USERS);
      const q = query(usersRef, limit(limitCount));
      const qs = await getDocs(q);
      return qs.docs.map(d => ({ id: d.id, ...d.data() })) as User[];
    } catch (error) {
      if (isPermissionDenied(error)) {
        console.log('🔒 getAllUsers: Permission denied (expected)');
        return [];
      }
      console.error('❌ Error getting all users:', error);
      return [];
    }
  }
};

export const petService = {
  async savePet(pet: Pet): Promise<void> {
    try {
      const uid = getCurrentUserId();
      const petRef = pet.id ? doc(db, COLLECTIONS.PETS, pet.id) : doc(collection(db, COLLECTIONS.PETS));
      
      const cleanData = sanitizeAndLog({
        ...pet,
        ownerId: uid, 
        updatedAt: serverTimestamp()
      }, 'Pet');
      
      await setDoc(petRef, cleanData, { merge: true });
      console.log('✅ Pet saved successfully');
    } catch (error) {
      console.error('❌ Error saving pet:', error);
      throw error;
    }
  },

  async getPetsByOwner(ownerId: string): Promise<Pet[]> {
    try {
      const petsRef = collection(db, COLLECTIONS.PETS);
      const q = query(petsRef, where('ownerId', '==', ownerId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Pet[];
    } catch (error) {
      console.error('❌ Error getting pets:', error);
      throw error;
    }
  },
  
  async getPet(petId: string): Promise<Pet | null> {
      try {
          const snap = await getDoc(doc(db, COLLECTIONS.PETS, petId));
          return snap.exists() ? { id: snap.id, ...snap.data() } as Pet : null;
      } catch (e) { return null; }
  }
};

export const postService = {
  async createPost(post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
        const uid = getCurrentUserId();
        const postsRef = collection(db, COLLECTIONS.POSTS);
        
        const cleanPost = Object.fromEntries(Object.entries(post).filter(([_, v]) => v !== undefined));

        const postData = sanitizeForFirestore({
            ...cleanPost,
            authorId: uid, 
            visibility: cleanPost.visibility || 'public',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            likesCount: 0,
            commentsCount: 0
        });
        
        const docRef = await addDoc(postsRef, postData);
        return docRef.id;
    } catch (error) {
        console.error('❌ Error creating post:', error);
        throw error;
    }
  },

  async getPostsFeed(lastPostId?: string, limitCount = 20): Promise<Post[]> {
    try {
        const postsRef = collection(db, COLLECTIONS.POSTS);
        let q = query(
            postsRef, 
            where('visibility', '==', 'public'), 
            orderBy('createdAt', 'desc'), 
            limit(limitCount)
        );

        if (lastPostId) {
            const lastDoc = await getDoc(doc(db, COLLECTIONS.POSTS, lastPostId));
            if (lastDoc.exists()) {
                q = query(postsRef, where('visibility', '==', 'public'), orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(limitCount));
            }
        }

        const qs = await getDocs(q);
        return qs.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
        })) as Post[];
    } catch (error) {
        console.error('❌ Error getting feed:', error);
        throw error;
    }
  },

  async toggleLike(postId: string): Promise<boolean> {
      try {
          const uid = getCurrentUserId();
          const likeRef = doc(db, COLLECTIONS.LIKES, `${postId}_${uid}`);
          const postRef = doc(db, COLLECTIONS.POSTS, postId);

          await runTransaction(db, async (transaction) => {
              const likeDoc = await transaction.get(likeRef);
              if (likeDoc.exists()) {
                  transaction.delete(likeRef);
                  transaction.update(postRef, { likesCount: increment(-1) });
              } else {
                  transaction.set(likeRef, { userId: uid, postId, createdAt: serverTimestamp() });
                  transaction.update(postRef, { likesCount: increment(1) });
              }
          });
          return true;
      } catch (e) {
          console.error(e);
          throw e;
      }
  }
};

export const commentService = {
    async addComment(comment: any): Promise<string> {
        try {
            const uid = getCurrentUserId();
            const ref = collection(db, COLLECTIONS.COMMENTS);
            const docRef = await addDoc(ref, {
                ...comment,
                authorId: uid, 
                createdAt: serverTimestamp()
            });
            const postRef = doc(db, COLLECTIONS.POSTS, comment.postId);
            await updateDoc(postRef, { commentsCount: increment(1) });
            return docRef.id;
        } catch (e) { throw e; }
    },
    
    async getComments(postId: string): Promise<Comment[]> {
        const q = query(collection(db, COLLECTIONS.COMMENTS), where('postId', '==', postId));
        const qs = await getDocs(q);
        const comments = qs.docs.map(d => ({ id: d.id, ...d.data() })) as Comment[];
        return comments.sort((a: any, b: any) => a.createdAt - b.createdAt);
    }
};

export const messagingService = {
    async sendMessage(params: { receiverId: string, content: string, conversationId: string }): Promise<string> {
        try {
            const uid = getCurrentUserId();
            if (!params.content.trim()) throw new Error("Message vide");

            const msgData = {
                conversationId: params.conversationId,
                senderId: uid, 
                receiverId: params.receiverId,
                content: params.content,
                timestamp: serverTimestamp(),
                read: false,
                type: 'text'
            };

            const ref = collection(db, COLLECTIONS.MESSAGES);
            const docRef = await addDoc(ref, msgData);

            const convRef = doc(db, COLLECTIONS.CONVERSATIONS, params.conversationId);
            await updateDoc(convRef, {
                lastMessage: { ...msgData, id: docRef.id, timestamp: Date.now() },
                [`unreadCount.${params.receiverId}`]: increment(1),
                updatedAt: serverTimestamp()
            });

            return docRef.id;
        } catch (e) {
            console.error(e);
            throw e;
        }
    },

    async getMessages(conversationId: string, limitCount = 50): Promise<Message[]> {
        const q = query(collection(db, COLLECTIONS.MESSAGES), where('conversationId', '==', conversationId));
        const qs = await getDocs(q);
        const msgs = qs.docs.map(d => ({ id: d.id, ...d.data() })) as Message[];
        return msgs.sort((a: any, b: any) => (a.timestamp?.toMillis?.() || 0) - (b.timestamp?.toMillis?.() || 0));
    },

    async createOrGetConversation(otherUserId: string): Promise<string> {
        const uid = getCurrentUserId();
        const participants = [uid, otherUserId].sort();
        const convId = participants.join('_');
        
        const convRef = doc(db, COLLECTIONS.CONVERSATIONS, convId);
        const snap = await getDoc(convRef);
        
        if (!snap.exists()) {
            await setDoc(convRef, {
                participants,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                unreadCount: { [uid]: 0, [otherUserId]: 0 }
            });
        }
        return convId;
    }
};

export const friendRequestService = {
    async sendFriendRequest(receiverId: string): Promise<string> {
        try {
            const uid = getCurrentUserId();
            const docId = [uid, receiverId].sort().join('_');
            const ref = doc(db, COLLECTIONS.FRIEND_REQUESTS, docId);
            
            await setDoc(ref, {
                senderId: uid, 
                receiverId,
                status: 'pending',
                timestamp: serverTimestamp()
            }, { merge: true });
            
            console.log('✅ Friend request sent');
            return docId;
        } catch (e) {
            console.error(e);
            throw e;
        }
    },
    
    async respondToRequest(requestId: string, accept: boolean): Promise<void> {
        await updateDoc(doc(db, COLLECTIONS.FRIEND_REQUESTS, requestId), {
            status: accept ? 'accepted' : 'rejected',
            respondedAt: serverTimestamp()
        });
    },

    async getReceivedRequests(): Promise<FriendRequest[]> {
        const uid = getCurrentUserId();
        const q = query(collection(db, COLLECTIONS.FRIEND_REQUESTS), where('receiverId', '==', uid), where('status', '==', 'pending'));
        const qs = await getDocs(q);
        return qs.docs.map(d => ({ id: d.id, ...d.data() })) as FriendRequest[];
    }
};

export const bookingService = {
    async createBooking(bookingData: any): Promise<string> {
        try {
            const uid = getCurrentUserId();
            const cleanData = sanitizeForFirestore({
                ...bookingData,
                userId: uid,     
                clientId: uid,   
                status: 'pending',
                createdAt: serverTimestamp()
            });
            
            const ref = collection(db, COLLECTIONS.BOOKINGS);
            const docRef = await addDoc(ref, cleanData);
            return docRef.id;
        } catch (e) {
            console.error("Booking error", e);
            throw e;
        }
    },

    async getUserBookings(): Promise<any[]> {
        const uid = getCurrentUserId();
        const q = query(collection(db, COLLECTIONS.BOOKINGS), where('userId', '==', uid));
        const qs = await getDocs(q);
        return qs.docs.map(d => ({ id: d.id, ...d.data() }));
    }
};

// --- NOUVEAUX SERVICES AJOUTÉS POUR CORRIGER LES ERREURS ---

export const reviewService = {
  // Corrige "Error fetching reviews"
  async getReviewsByTarget(targetId: string, targetType: string): Promise<any[]> {
    try {
      const ref = collection(db, COLLECTIONS.REVIEWS);
      const constraints = [where('targetType', '==', targetType)];
      if (targetId !== 'all') {
          constraints.push(where('targetId', '==', targetId));
      }
      // Nécessite l'index composite (targetId ASC, createdAt DESC) créé précédemment
      const q = query(ref, ...constraints, orderBy('createdAt', 'desc'));
      const qs = await getDocs(q);
      return qs.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error('❌ Error getting reviews:', error);
      return [];
    }
  },

  async createReview(review: any): Promise<string> {
    try {
      const uid = getCurrentUserId();
      const docRef = await addDoc(collection(db, COLLECTIONS.REVIEWS), {
        ...review,
        authorId: uid,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (e) { throw e; }
  }
};

export const lostFoundService = {
  // Corrige "Error fetching lost pets"
  async listReports(): Promise<any[]> {
    try {
      const q = query(collection(db, COLLECTIONS.LOST_FOUND_REPORTS), orderBy('createdAt', 'desc'));
      const qs = await getDocs(q);
      return qs.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error('❌ Error listing reports:', error);
      return [];
    }
  },

  async createReport(report: any): Promise<string> {
    try {
      const uid = getCurrentUserId();
      const docRef = await addDoc(collection(db, COLLECTIONS.LOST_FOUND_REPORTS), {
        ...report,
        reporterId: uid,
        createdAt: serverTimestamp(),
        responses: []
      });
      return docRef.id;
    } catch (e) { throw e; }
  }
};

export const petSitterService = {
  // Corrige "Error fetching cat sitters"
  async getAllProfiles(limitCount = 100): Promise<any[]> {
    try {
      const q = query(collection(db, COLLECTIONS.PET_SITTER_PROFILES), limit(limitCount));
      const qs = await getDocs(q);
      return qs.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error('❌ Error getting sitters:', error);
      return [];
    }
  },

  async getProfile(userId: string): Promise<any | null> {
    try {
      const snap = await getDoc(doc(db, COLLECTIONS.PET_SITTER_PROFILES, userId));
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    } catch (e) { return null; }
  },

  async saveProfile(userId: string, profile: any): Promise<void> {
     try {
       const uid = getCurrentUserId();
       if (userId !== uid) throw new Error("Vous ne pouvez modifier que votre propre profil");
       await setDoc(doc(db, COLLECTIONS.PET_SITTER_PROFILES, uid), { 
         ...profile, 
         userId: uid, 
         updatedAt: serverTimestamp() 
       }, { merge: true });
     } catch (e) { throw e; }
  }
};

export const professionalService = {
    async getVerifiedProfessionals(): Promise<ProfessionalData[]> {
        try {
            const q = query(collection(db, COLLECTIONS.PROFESSIONALS), where('isVerified', '==', true));
            const qs = await getDocs(q);
            return qs.docs.map(d => d.data() as ProfessionalData);
        } catch (e) { return []; }
    }
};

// --- EXPORT GLOBAL FINAL ---

export const databaseService = {
    user: userService,
    pet: petService,
    post: postService,
    comment: commentService,
    messaging: messagingService,
    friendRequest: friendRequestService,
    booking: bookingService,
    // Services ajoutés et nécessaires
    review: reviewService,
    lostFound: lostFoundService,
    petSitter: petSitterService,
    professional: professionalService,
};

export default databaseService;