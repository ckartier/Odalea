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
      const cleanData = sanitizeAndLog({ ...user, id: uid, updatedAt: serverTimestamp() }, 'User');
      await setDoc(userRef, cleanData, { merge: true });
    } catch (error) { console.error(error); throw error; }
  },

  async getUser(userId: string): Promise<User | null> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        // Récupérer les animaux associés pour l'affichage
        const petsQuery = query(collection(db, COLLECTIONS.PETS), where('ownerId', '==', userId));
        const petsSnap = await getDocs(petsQuery);
        const realPets = petsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        return { id: userSnap.id, ...userData, pets: realPets } as User;
      }
      return null;
    } catch (error) { console.error(error); throw error; }
  },
  
  async searchUsers(searchTerm: string, limitCount = 20): Promise<User[]> {
    try {
        const q = query(collection(db, COLLECTIONS.USERS), where('name', '>=', searchTerm), where('name', '<=', searchTerm + '\uf8ff'), limit(limitCount));
        const qs = await getDocs(q);
        return qs.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
    } catch (error) { return []; }
  },

  async getAllUsers(limitCount = 200): Promise<User[]> {
    try {
      const q = query(collection(db, COLLECTIONS.USERS), limit(limitCount));
      const qs = await getDocs(q);
      return qs.docs.map(d => ({ id: d.id, ...d.data() })) as User[];
    } catch (error) { return []; }
  }
};

export const petService = {
  async savePet(pet: Pet): Promise<void> {
    try {
      const uid = getCurrentUserId();
      const petRef = pet.id ? doc(db, COLLECTIONS.PETS, pet.id) : doc(collection(db, COLLECTIONS.PETS));
      const cleanData = sanitizeAndLog({ ...pet, ownerId: uid, updatedAt: serverTimestamp() }, 'Pet');
      await setDoc(petRef, cleanData, { merge: true });
    } catch (error) { console.error(error); throw error; }
  },

  async getPetsByOwner(ownerId: string): Promise<Pet[]> {
    try {
      const q = query(collection(db, COLLECTIONS.PETS), where('ownerId', '==', ownerId));
      const qs = await getDocs(q);
      return qs.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Pet[];
    } catch (error) { throw error; }
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
        const docRef = await addDoc(collection(db, COLLECTIONS.POSTS), postData);
        return docRef.id;
    } catch (error) { console.error(error); throw error; }
  },

  async getPostsFeed(lastPostId?: string, limitCount = 20): Promise<Post[]> {
    try {
        const postsRef = collection(db, COLLECTIONS.POSTS);
        let q = query(postsRef, where('visibility', '==', 'public'), orderBy('createdAt', 'desc'), limit(limitCount));

        if (lastPostId) {
            const lastDoc = await getDoc(doc(db, COLLECTIONS.POSTS, lastPostId));
            if (lastDoc.exists()) {
                q = query(postsRef, where('visibility', '==', 'public'), orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(limitCount));
            }
        }
        const qs = await getDocs(q);
        return qs.docs.map(doc => ({
            id: doc.id, ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
        })) as Post[];
    } catch (error) { console.error(error); throw error; }
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
      } catch (e) { console.error(e); throw e; }
  }
};

// --- REALTIME SERVICE (Ajouté pour corriger les erreurs de listener) ---
export const realtimeService = {
  listenToPostsFeed(callback: (posts: Post[]) => void, limitCount = 20) {
    const q = query(collection(db, COLLECTIONS.POSTS), orderBy('createdAt', 'desc'), limit(limitCount));
    return onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id, ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
      })) as Post[];
      callback(posts);
    });
  },

  listenToConversations(userId: string, callback: (conversations: Conversation[]) => void) {
    const q = query(collection(db, COLLECTIONS.CONVERSATIONS), where('participants', 'array-contains', userId));
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Conversation[];
      callback(items.sort((a:any, b:any) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0)));
    });
  },

  listenToMessages(conversationId: string, callback: (messages: Message[]) => void) {
    const q = query(collection(db, COLLECTIONS.MESSAGES), where('conversationId', '==', conversationId));
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[];
      callback(items.sort((a:any, b:any) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0)));
    });
  }
};

export const commentService = {
    async addComment(comment: any): Promise<string> {
        try {
            const uid = getCurrentUserId();
            const docRef = await addDoc(collection(db, COLLECTIONS.COMMENTS), {
                ...comment, authorId: uid, createdAt: serverTimestamp()
            });
            await updateDoc(doc(db, COLLECTIONS.POSTS, comment.postId), { commentsCount: increment(1) });
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

            const docRef = await addDoc(collection(db, COLLECTIONS.MESSAGES), msgData);
            await updateDoc(doc(db, COLLECTIONS.CONVERSATIONS, params.conversationId), {
                lastMessage: { ...msgData, id: docRef.id, timestamp: Date.now() },
                [`unreadCount.${params.receiverId}`]: increment(1),
                updatedAt: serverTimestamp()
            });
            return docRef.id;
        } catch (e) { throw e; }
    },

    async getMessages(conversationId: string): Promise<Message[]> {
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

// --- ORDER SERVICE (Ajouté pour corriger Error fetching orders) ---
export const orderService = {
  async createOrder(order: any): Promise<string> {
    try {
      const uid = getCurrentUserId();
      const docRef = await addDoc(collection(db, COLLECTIONS.ORDERS), {
        ...order, customerId: uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (e) { throw e; }
  },
  
  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    try {
      const q = query(collection(db, COLLECTIONS.ORDERS), where('customerId', '==', customerId));
      const qs = await getDocs(q);
      return qs.docs.map(d => ({ id: d.id, ...d.data() })) as Order[];
    } catch (e) { console.error(e); return []; }
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
            return docId;
        } catch (e) { throw e; }
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
            const docRef = await addDoc(collection(db, COLLECTIONS.BOOKINGS), cleanData);
            return docRef.id;
        } catch (e) { console.error("Booking error", e); throw e; }
    },

    // --- RENOMMÉ pour corriger "getBookingsByUser is not a function" ---
    async getBookingsByUser(userId: string): Promise<any[]> {
        // userId param is ignored for security, using current auth user
        const uid = getCurrentUserId();
        const q = query(collection(db, COLLECTIONS.BOOKINGS), where('userId', '==', uid));
        const qs = await getDocs(q);
        return qs.docs.map(d => ({ id: d.id, ...d.data() }));
    }
};

export const reviewService = {
  async getReviewsByTarget(targetId: string, targetType: string): Promise<any[]> {
    try {
      const constraints = [where('targetType', '==', targetType)];
      if (targetId !== 'all') constraints.push(where('targetId', '==', targetId));
      const q = query(collection(db, COLLECTIONS.REVIEWS), ...constraints, orderBy('createdAt', 'desc'));
      const qs = await getDocs(q);
      return qs.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) { return []; }
  },
  async createReview(review: any): Promise<string> {
    try {
      const uid = getCurrentUserId();
      const docRef = await addDoc(collection(db, COLLECTIONS.REVIEWS), {
        ...review, authorId: uid, createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (e) { throw e; }
  }
};

export const lostFoundService = {
  async listReports(): Promise<any[]> {
    try {
      const q = query(collection(db, COLLECTIONS.LOST_FOUND_REPORTS), orderBy('createdAt', 'desc'));
      const qs = await getDocs(q);
      return qs.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) { return []; }
  },
  async createReport(report: any): Promise<string> {
    try {
      const uid = getCurrentUserId();
      const docRef = await addDoc(collection(db, COLLECTIONS.LOST_FOUND_REPORTS), {
        ...report, reporterId: uid, createdAt: serverTimestamp(), responses: []
      });
      return docRef.id;
    } catch (e) { throw e; }
  }
};

export const petSitterService = {
  async getAllProfiles(limitCount = 100): Promise<any[]> {
    try {
      const q = query(collection(db, COLLECTIONS.PET_SITTER_PROFILES), limit(limitCount));
      const qs = await getDocs(q);
      return qs.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) { return []; }
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
       if (userId !== uid) throw new Error("Modification interdite");
       await setDoc(doc(db, COLLECTIONS.PET_SITTER_PROFILES, uid), { 
         ...profile, userId: uid, updatedAt: serverTimestamp() 
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
    review: reviewService,
    lostFound: lostFoundService,
    petSitter: petSitterService,
    professional: professionalService,
    order: orderService,
    realtime: realtimeService, // Indispensable pour éviter le crash
};

export default databaseService;