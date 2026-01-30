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
import { db, storage, auth } from './firebase'; // Assurez-vous que le chemin est correct
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
  if (/^[a-z]+-\d+$/i.test(trimmed)) return false; // Rejet des clés business type "paris-1"
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return false;
  return true;
}

// --- CONSTANTS ---

const COLLECTIONS = {
  USERS: 'users',
  PETS: 'pets',
  PROFESSIONALS: 'professionals',
  PET_SITTER_PROFILES: 'petSitterProfiles', // Unifié
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
      // Sécurité : on force l'ID du document à être l'UID de l'auth
      const userRef = doc(db, COLLECTIONS.USERS, uid);
      
      const cleanData = sanitizeAndLog({
        ...user,
        id: uid, // Force l'ID
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
  
  // Note: searchUsers et getAllUsers restent identiques à votre version précédente
  async searchUsers(searchTerm: string, limitCount = 20): Promise<User[]> {
    try {
        const usersRef = collection(db, COLLECTIONS.USERS);
        const q = query(usersRef, where('name', '>=', searchTerm), where('name', '<=', searchTerm + '\uf8ff'), limit(limitCount));
        const qs = await getDocs(q);
        return qs.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
    } catch (error) { console.error(error); return []; }
  }
};

export const petService = {
  async savePet(pet: Pet): Promise<void> {
    try {
      const uid = getCurrentUserId();
      // Si c'est un nouvel animal (pas d'ID), Firestore en génère un
      const petRef = pet.id ? doc(db, COLLECTIONS.PETS, pet.id) : doc(collection(db, COLLECTIONS.PETS));
      
      const cleanData = sanitizeAndLog({
        ...pet,
        ownerId: uid, // SÉCURITÉ : Force le propriétaire
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
        
        // Nettoyage des undefined
        const cleanPost = Object.fromEntries(Object.entries(post).filter(([_, v]) => v !== undefined));

        const postData = sanitizeForFirestore({
            ...cleanPost,
            authorId: uid, // SÉCURITÉ
            visibility: cleanPost.visibility || 'public',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            likesCount: 0,
            commentsCount: 0
        });
        
        const docRef = await addDoc(postsRef, postData);
        console.log('✅ Post created');
        return docRef.id;
    } catch (error) {
        console.error('❌ Error creating post:', error);
        throw error;
    }
  },

  async getPostsFeed(lastPostId?: string, limitCount = 20): Promise<Post[]> {
    try {
        const postsRef = collection(db, COLLECTIONS.POSTS);
        // Requête standard pour le feed public
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
                authorId: uid, // SÉCURITÉ
                createdAt: serverTimestamp()
            });
            // Mise à jour compteur
            const postRef = doc(db, COLLECTIONS.POSTS, comment.postId);
            await updateDoc(postRef, { commentsCount: increment(1) });
            return docRef.id;
        } catch (e) { throw e; }
    },
    
    async getComments(postId: string): Promise<Comment[]> {
        const q = query(collection(db, COLLECTIONS.COMMENTS), where('postId', '==', postId));
        const qs = await getDocs(q);
        // Tri client-side simple
        const comments = qs.docs.map(d => ({ id: d.id, ...d.data() })) as Comment[];
        return comments.sort((a: any, b: any) => a.createdAt - b.createdAt);
    }
};

export const messagingService = {
    async sendMessage(params: { receiverId: string, content: string, conversationId: string }): Promise<string> {
        try {
            const uid = getCurrentUserId();
            // Validation simple
            if (!params.content.trim()) throw new Error("Message vide");

            const msgData = {
                conversationId: params.conversationId,
                senderId: uid, // SÉCURITÉ
                receiverId: params.receiverId,
                content: params.content,
                timestamp: serverTimestamp(),
                read: false,
                type: 'text'
            };

            const ref = collection(db, COLLECTIONS.MESSAGES);
            const docRef = await addDoc(ref, msgData);

            // Mise à jour conversation
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
        // Tri par date
        return msgs.sort((a: any, b: any) => (a.timestamp?.toMillis?.() || 0) - (b.timestamp?.toMillis?.() || 0));
    },

    // Crée une conv ou retourne l'existante entre 2 users
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
                senderId: uid, // SÉCURITÉ: Indispensable pour la règle Firestore
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
            // Nettoyage et sécurité
            const cleanData = sanitizeForFirestore({
                ...bookingData,
                userId: uid,     // SÉCURITÉ : Le client est forcément celui connecté
                clientId: uid,   // Compatibilité
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

// Export global simplifié
export const databaseService = {
    user: userService,
    pet: petService,
    post: postService,
    comment: commentService,
    messaging: messagingService,
    friendRequest: friendRequestService,
    booking: bookingService,
    // Ajoutez ici les autres services si nécessaires (health, etc.) en suivant le modèle sécurisé ci-dessus
};

export default databaseService;