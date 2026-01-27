/**
 * Firestore Data Migration Scripts
 * 
 * These scripts fix data inconsistencies in Firestore:
 * - Messages: Ensure senderId/receiverId are Firebase UIDs
 * - Bookings: Ensure clientId/catSitterId are Firebase UIDs
 * - Pets: Add species/photoURL compatibility fields
 * - Users: Fix activePetId if null
 * 
 * Run with: npx ts-node scripts/migrate-firestore-data.ts
 * 
 * IMPORTANT: These scripts require Firebase Admin SDK.
 * Set GOOGLE_APPLICATION_CREDENTIALS environment variable to your service account key path.
 */

// This file is a reference for running migrations via Firebase Admin SDK
// It cannot be run directly in the React Native app

interface MigrationConfig {
  dryRun: boolean;
  batchSize: number;
}

const defaultConfig: MigrationConfig = {
  dryRun: true, // Set to false to actually apply changes
  batchSize: 500,
};

/**
 * Migration 1: Fix messages senderId/receiverId
 * 
 * Problem: Some messages have non-UID values for senderId/receiverId
 * Solution: Look up correct UIDs from conversation participants
 */
export const migrateMessagesScript = `
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

async function migrateMessages(dryRun = true) {
  console.log('🔄 Starting messages migration (dryRun:', dryRun, ')');
  
  const messagesRef = db.collection('messages');
  const conversationsRef = db.collection('conversations');
  
  // Get all conversations for participant lookup
  const conversationsSnap = await conversationsRef.get();
  const conversationsMap = new Map();
  conversationsSnap.docs.forEach(doc => {
    conversationsMap.set(doc.id, doc.data().participants || []);
  });
  
  // Get all messages
  const messagesSnap = await messagesRef.get();
  let updated = 0;
  let skipped = 0;
  
  const batch = db.batch();
  let batchCount = 0;
  
  for (const doc of messagesSnap.docs) {
    const data = doc.data();
    const { senderId, receiverId, conversationId } = data;
    
    // Check if IDs look valid (28+ chars, alphanumeric)
    const isValidUID = (id) => id && id.length >= 20 && /^[a-zA-Z0-9_]+$/.test(id);
    
    if (isValidUID(senderId) && isValidUID(receiverId)) {
      skipped++;
      continue;
    }
    
    // Try to fix using conversation participants
    const participants = conversationsMap.get(conversationId);
    if (!participants || participants.length !== 2) {
      console.warn('⚠️ Cannot fix message', doc.id, '- conversation not found or invalid');
      skipped++;
      continue;
    }
    
    const updates = {};
    
    if (!isValidUID(senderId)) {
      // Assume sender is first participant if we can't determine
      updates.senderId = participants[0];
      updates.originalSenderId = senderId;
    }
    
    if (!isValidUID(receiverId)) {
      // Assume receiver is the other participant
      const sender = updates.senderId || senderId;
      updates.receiverId = participants.find(p => p !== sender) || participants[1];
      updates.originalReceiverId = receiverId;
    }
    
    if (Object.keys(updates).length > 0) {
      console.log('📝 Fixing message', doc.id, updates);
      
      if (!dryRun) {
        batch.update(doc.ref, updates);
        batchCount++;
        
        if (batchCount >= 500) {
          await batch.commit();
          batchCount = 0;
        }
      }
      updated++;
    }
  }
  
  if (!dryRun && batchCount > 0) {
    await batch.commit();
  }
  
  console.log('✅ Messages migration complete:', { updated, skipped });
}

migrateMessages(process.argv.includes('--apply') ? false : true);
`;

/**
 * Migration 2: Fix bookings clientId/catSitterId
 * 
 * Problem: Some bookings have business keys (e.g., "paris-1") instead of Firebase UIDs
 * Solution: Store business keys in separate fields, use UIDs for auth fields
 */
export const migrateBookingsScript = `
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

async function migrateBookings(dryRun = true) {
  console.log('🔄 Starting bookings migration (dryRun:', dryRun, ')');
  
  const bookingsRef = db.collection('bookings');
  const usersRef = db.collection('users');
  const profilesRef = db.collection('petSitterProfiles');
  
  // Build lookup maps
  const usersSnap = await usersRef.get();
  const usersByEmail = new Map();
  const usersByName = new Map();
  usersSnap.docs.forEach(doc => {
    const data = doc.data();
    if (data.email) usersByEmail.set(data.email.toLowerCase(), doc.id);
    if (data.name) usersByName.set(data.name.toLowerCase(), doc.id);
  });
  
  const profilesSnap = await profilesRef.get();
  const sitterProfiles = new Map();
  profilesSnap.docs.forEach(doc => {
    sitterProfiles.set(doc.id, doc.data().userId || doc.id);
  });
  
  // Get all bookings
  const bookingsSnap = await bookingsRef.get();
  let updated = 0;
  let skipped = 0;
  
  const batch = db.batch();
  let batchCount = 0;
  
  const isBusinessKey = (id) => id && /^[a-z]+-\\d+$/i.test(id);
  const isValidUID = (id) => id && id.length >= 20 && /^[a-zA-Z0-9_]+$/.test(id);
  
  for (const doc of bookingsSnap.docs) {
    const data = doc.data();
    const updates = {};
    
    // Fix clientId
    if (data.clientId && isBusinessKey(data.clientId)) {
      updates.clientIdKey = data.clientId;
      // Try to find the actual user
      if (data.userId && isValidUID(data.userId)) {
        updates.clientId = data.userId;
      }
    }
    
    // Fix catSitterId
    if (data.catSitterId && isBusinessKey(data.catSitterId)) {
      updates.catSitterKey = data.catSitterId;
      // Try to resolve from sitter profiles
      const sitterUID = sitterProfiles.get(data.catSitterId);
      if (sitterUID && isValidUID(sitterUID)) {
        updates.catSitterId = sitterUID;
        updates.sitterId = sitterUID;
      }
    }
    
    // Ensure we have ownerId for rules compatibility
    if (!data.ownerId && data.userId) {
      updates.ownerId = data.userId;
    }
    if (!data.ownerId && data.clientId && isValidUID(data.clientId)) {
      updates.ownerId = data.clientId;
    }
    
    if (Object.keys(updates).length > 0) {
      console.log('📝 Fixing booking', doc.id, updates);
      
      if (!dryRun) {
        batch.update(doc.ref, updates);
        batchCount++;
        
        if (batchCount >= 500) {
          await batch.commit();
          batchCount = 0;
        }
      }
      updated++;
    } else {
      skipped++;
    }
  }
  
  if (!dryRun && batchCount > 0) {
    await batch.commit();
  }
  
  console.log('✅ Bookings migration complete:', { updated, skipped });
}

migrateBookings(process.argv.includes('--apply') ? false : true);
`;

/**
 * Migration 3: Fix pets species/photoURL compatibility
 * 
 * Problem: Some pets use 'type' instead of 'species', 'mainPhoto' instead of 'photoURL'
 * Solution: Add missing fields for backwards compatibility
 */
export const migratePetsScript = `
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

async function migratePets(dryRun = true) {
  console.log('🔄 Starting pets migration (dryRun:', dryRun, ')');
  
  const petsRef = db.collection('pets');
  const petsSnap = await petsRef.get();
  
  let updated = 0;
  let skipped = 0;
  
  const batch = db.batch();
  let batchCount = 0;
  
  for (const doc of petsSnap.docs) {
    const data = doc.data();
    const updates = {};
    
    // Add species if missing (copy from type)
    if (!data.species && data.type) {
      updates.species = data.type;
    }
    
    // Add photoURL if missing (copy from mainPhoto)
    if (!data.photoURL && data.mainPhoto) {
      updates.photoURL = data.mainPhoto;
    }
    
    // Add type if missing (copy from species)
    if (!data.type && data.species) {
      updates.type = data.species;
    }
    
    // Add mainPhoto if missing (copy from photoURL)
    if (!data.mainPhoto && data.photoURL) {
      updates.mainPhoto = data.photoURL;
    }
    
    if (Object.keys(updates).length > 0) {
      console.log('📝 Fixing pet', doc.id, updates);
      
      if (!dryRun) {
        batch.update(doc.ref, updates);
        batchCount++;
        
        if (batchCount >= 500) {
          await batch.commit();
          batchCount = 0;
        }
      }
      updated++;
    } else {
      skipped++;
    }
  }
  
  if (!dryRun && batchCount > 0) {
    await batch.commit();
  }
  
  console.log('✅ Pets migration complete:', { updated, skipped });
}

migratePets(process.argv.includes('--apply') ? false : true);
`;

/**
 * Migration 4: Fix users activePetId
 * 
 * Problem: Some users have null activePetId but own pets
 * Solution: Set activePetId to their first pet
 */
export const fixActivePetIdScript = `
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

async function fixActivePetId(dryRun = true) {
  console.log('🔄 Starting activePetId fix (dryRun:', dryRun, ')');
  
  const usersRef = db.collection('users');
  const petsRef = db.collection('pets');
  
  // Get all pets grouped by owner
  const petsSnap = await petsRef.get();
  const petsByOwner = new Map();
  petsSnap.docs.forEach(doc => {
    const data = doc.data();
    const ownerId = data.ownerId;
    if (ownerId) {
      if (!petsByOwner.has(ownerId)) {
        petsByOwner.set(ownerId, []);
      }
      petsByOwner.get(ownerId).push(doc.id);
    }
  });
  
  // Get users with null activePetId
  const usersSnap = await usersRef.get();
  let updated = 0;
  let skipped = 0;
  
  const batch = db.batch();
  let batchCount = 0;
  
  for (const doc of usersSnap.docs) {
    const data = doc.data();
    
    // Skip if activePetId is already set
    if (data.activePetId) {
      skipped++;
      continue;
    }
    
    // Check if user has pets
    const userPets = petsByOwner.get(doc.id);
    if (!userPets || userPets.length === 0) {
      skipped++;
      continue;
    }
    
    // Set activePetId to first pet
    const firstPetId = userPets[0];
    console.log('📝 Setting activePetId for user', doc.id, '->', firstPetId);
    
    if (!dryRun) {
      batch.update(doc.ref, { activePetId: firstPetId });
      batchCount++;
      
      if (batchCount >= 500) {
        await batch.commit();
        batchCount = 0;
      }
    }
    updated++;
  }
  
  if (!dryRun && batchCount > 0) {
    await batch.commit();
  }
  
  console.log('✅ activePetId fix complete:', { updated, skipped });
}

fixActivePetId(process.argv.includes('--apply') ? false : true);
`;

// Export all migration scripts
export const migrations = {
  messages: migrateMessagesScript,
  bookings: migrateBookingsScript,
  pets: migratePetsScript,
  activePetId: fixActivePetIdScript,
};

console.log(`
===========================================
FIRESTORE DATA MIGRATION SCRIPTS
===========================================

These scripts require Firebase Admin SDK.

To run:
1. Download your service account key from Firebase Console
2. Set environment variable:
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"
3. Create individual script files from the exports above
4. Run with: node migrate-messages.js --apply

Scripts available:
- migrateMessagesScript: Fix senderId/receiverId
- migrateBookingsScript: Fix clientId/catSitterId
- migratePetsScript: Add species/photoURL compatibility
- fixActivePetIdScript: Fix null activePetId

Default is dry-run mode. Add --apply flag to make changes.
===========================================
`);
