const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const DRY_RUN = process.argv.includes('--dry-run');
const SAFE_EMAIL = 'amandine@gmail.com';

const isValidUID = (id) => /^[a-zA-Z0-9]{28}$/.test(id);

const log = (type, msg) => {
  const prefix = { info: '📋', success: '✅', error: '❌', warning: '⚠️' }[type] || '•';
  console.log(`${prefix} ${msg}`);
};

async function findUserByEmail(email) {
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    return userRecord.uid;
  } catch {
    return null;
  }
}

async function cleanupUsers() {
  log('info', '--- CLEANUP USERS ---');
  const safeUid = await findUserByEmail(SAFE_EMAIL);
  log('info', `Safe UID (${SAFE_EMAIL}): ${safeUid}`);

  const usersSnap = await db.collection('users').get();
  const toDelete = [];

  usersSnap.forEach(doc => {
    const id = doc.id;
    if (!isValidUID(id)) {
      toDelete.push({ id, reason: 'invalid UID format' });
    } else if (id === safeUid) {
      log('success', `Keeping safe user: ${id}`);
    }
  });

  log('warning', `Found ${toDelete.length} users to delete`);
  toDelete.forEach(u => log('info', `  - ${u.id} (${u.reason})`));

  if (!DRY_RUN) {
    for (const u of toDelete) {
      await db.collection('users').doc(u.id).delete();
      log('success', `Deleted user: ${u.id}`);
    }
  }

  return toDelete.map(u => u.id);
}

async function cleanupPets(deletedUserIds) {
  log('info', '--- CLEANUP PETS ---');
  const petsSnap = await db.collection('pets').get();
  const toDelete = [];

  petsSnap.forEach(doc => {
    const data = doc.data();
    if (deletedUserIds.includes(data.ownerId)) {
      toDelete.push(doc.id);
    }
  });

  log('warning', `Found ${toDelete.length} pets to delete`);

  if (!DRY_RUN) {
    for (const id of toDelete) {
      await db.collection('pets').doc(id).delete();
      log('success', `Deleted pet: ${id}`);
    }
  }
}

async function cleanupPosts(deletedUserIds) {
  log('info', '--- CLEANUP POSTS ---');
  const postsSnap = await db.collection('posts').get();
  const toDelete = [];

  postsSnap.forEach(doc => {
    const data = doc.data();
    if (deletedUserIds.includes(data.authorId)) {
      toDelete.push(doc.id);
    }
  });

  log('warning', `Found ${toDelete.length} posts to delete`);

  if (!DRY_RUN) {
    for (const id of toDelete) {
      await db.collection('posts').doc(id).delete();
      log('success', `Deleted post: ${id}`);
    }
  }
}

async function cleanupComments(deletedUserIds) {
  log('info', '--- CLEANUP COMMENTS ---');
  const commentsSnap = await db.collection('comments').get();
  const toDelete = [];

  commentsSnap.forEach(doc => {
    const data = doc.data();
    if (deletedUserIds.includes(data.authorId)) {
      toDelete.push(doc.id);
    }
  });

  log('warning', `Found ${toDelete.length} comments to delete`);

  if (!DRY_RUN) {
    for (const id of toDelete) {
      await db.collection('comments').doc(id).delete();
      log('success', `Deleted comment: ${id}`);
    }
  }
}

async function cleanupLikes(deletedUserIds) {
  log('info', '--- CLEANUP LIKES ---');
  const likesSnap = await db.collection('likes').get();
  const toDelete = [];

  likesSnap.forEach(doc => {
    const data = doc.data();
    if (deletedUserIds.includes(data.userId)) {
      toDelete.push(doc.id);
    }
  });

  log('warning', `Found ${toDelete.length} likes to delete`);

  if (!DRY_RUN) {
    for (const id of toDelete) {
      await db.collection('likes').doc(id).delete();
      log('success', `Deleted like: ${id}`);
    }
  }
}

async function cleanupConversations(deletedUserIds) {
  log('info', '--- CLEANUP CONVERSATIONS ---');
  const convsSnap = await db.collection('conversations').get();
  const toDelete = [];

  convsSnap.forEach(doc => {
    const data = doc.data();
    const participants = data.participants || [];
    if (participants.some(p => deletedUserIds.includes(p))) {
      toDelete.push(doc.id);
    }
  });

  log('warning', `Found ${toDelete.length} conversations to delete`);

  if (!DRY_RUN) {
    for (const id of toDelete) {
      await db.collection('conversations').doc(id).delete();
      log('success', `Deleted conversation: ${id}`);
    }
  }
}

async function cleanupMessages(deletedUserIds) {
  log('info', '--- CLEANUP MESSAGES ---');
  const messagesSnap = await db.collection('messages').get();
  const toDelete = [];

  messagesSnap.forEach(doc => {
    const data = doc.data();
    if (deletedUserIds.includes(data.senderId)) {
      toDelete.push(doc.id);
    }
  });

  log('warning', `Found ${toDelete.length} messages to delete`);

  if (!DRY_RUN) {
    for (const id of toDelete) {
      await db.collection('messages').doc(id).delete();
      log('success', `Deleted message: ${id}`);
    }
  }
}

async function migrateBookings(deletedUserIds) {
  log('info', '--- MIGRATE BOOKINGS ---');
  const bookingsSnap = await db.collection('bookings').get();
  const toDelete = [];
  const toMigrate = [];

  bookingsSnap.forEach(doc => {
    const data = doc.data();
    const clientId = data.clientId || data.userId;
    const catSitterId = data.catSitterId;

    if (deletedUserIds.includes(clientId) || deletedUserIds.includes(catSitterId)) {
      toDelete.push(doc.id);
    } else if (data.clientId && !data.userId) {
      toMigrate.push({ id: doc.id, clientId, data });
    } else if (!isValidUID(catSitterId) || !isValidUID(clientId)) {
      toDelete.push(doc.id);
    }
  });

  log('warning', `Found ${toDelete.length} bookings to delete`);
  log('info', `Found ${toMigrate.length} bookings to migrate (clientId→userId)`);

  if (!DRY_RUN) {
    for (const id of toDelete) {
      await db.collection('bookings').doc(id).delete();
      log('success', `Deleted booking: ${id}`);
    }

    for (const b of toMigrate) {
      await db.collection('bookings').doc(b.id).update({
        userId: b.clientId,
        clientId: admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      log('success', `Migrated booking ${b.id}: clientId→userId`);
    }
  }
}

async function cleanupPetSitterProfiles(deletedUserIds) {
  log('info', '--- CLEANUP PET SITTER PROFILES ---');
  const profilesSnap = await db.collection('petSitterProfiles').get();
  const toDelete = [];

  profilesSnap.forEach(doc => {
    const data = doc.data();
    if (deletedUserIds.includes(data.userId) || !isValidUID(doc.id)) {
      toDelete.push(doc.id);
    }
  });

  log('warning', `Found ${toDelete.length} pet sitter profiles to delete`);

  if (!DRY_RUN) {
    for (const id of toDelete) {
      await db.collection('petSitterProfiles').doc(id).delete();
      log('success', `Deleted pet sitter profile: ${id}`);
    }
  }
}

async function run() {
  log('info', `🚀 Starting cleanup script (DRY_RUN: ${DRY_RUN})`);

  const deletedUserIds = await cleanupUsers();
  await cleanupPets(deletedUserIds);
  await cleanupPosts(deletedUserIds);
  await cleanupComments(deletedUserIds);
  await cleanupLikes(deletedUserIds);
  await cleanupConversations(deletedUserIds);
  await cleanupMessages(deletedUserIds);
  await migrateBookings(deletedUserIds);
  await cleanupPetSitterProfiles(deletedUserIds);

  log('success', '🎉 Cleanup complete!');
  if (DRY_RUN) {
    log('warning', 'DRY RUN - no changes were made. Run without --dry-run to apply.');
  }
}

run().then(() => process.exit(0)).catch(err => {
  log('error', err.message);
  console.error(err);
  process.exit(1);
});
