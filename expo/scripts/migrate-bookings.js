/**
 * Migration Script: Fix bookings clientId/catSitterId
 * 
 * This script repairs bookings that have invalid clientId/catSitterId values
 * (business keys like "paris-1" instead of Firebase UIDs).
 * 
 * It stores the original business keys in *Key fields for reference.
 * 
 * Usage:
 *   node scripts/migrate-bookings.js --dry-run   # Preview changes
 *   node scripts/migrate-bookings.js --apply     # Apply changes
 * 
 * Requirements:
 *   - Firebase Admin SDK credentials (GOOGLE_APPLICATION_CREDENTIALS env var)
 *   - Node.js 18+
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();
const BATCH_SIZE = 500;

// Check if a string looks like a business key (e.g., "paris-1")
function isBusinessKey(id) {
  if (!id || typeof id !== 'string') return false;
  return /^[a-z]+-\d+$/i.test(id.trim());
}

// Check if a string looks like a valid Firebase UID
function isValidFirebaseUid(id) {
  if (!id || typeof id !== 'string') return false;
  const trimmed = id.trim();
  if (trimmed.length < 20 || trimmed.length > 128) return false;
  if (isBusinessKey(trimmed)) return false;
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return false;
  return true;
}

async function migrateBookings(dryRun = true) {
  console.log(`\n🚀 Starting bookings migration (${dryRun ? 'DRY RUN' : 'APPLY MODE'})\n`);
  
  const stats = {
    total: 0,
    updated: 0,
    skipped: 0,
    unmapped: 0,
    errors: 0,
  };

  // Cache users for lookup (to resolve business keys to UIDs if possible)
  const usersCache = new Map();
  
  // Load all users
  console.log('📥 Loading users...');
  const usersSnap = await db.collection('users').get();
  usersSnap.docs.forEach(doc => {
    const data = doc.data();
    usersCache.set(doc.id, {
      id: doc.id,
      isCatSitter: data.isCatSitter || false,
    });
  });
  console.log(`✅ Loaded ${usersCache.size} users\n`);

  // Cache petSitterProfiles for business key mapping
  const petSittersCache = new Map();
  console.log('📥 Loading pet sitter profiles...');
  const petSittersSnap = await db.collection('petSitterProfiles').get();
  petSittersSnap.docs.forEach(doc => {
    const data = doc.data();
    petSittersCache.set(doc.id, {
      id: doc.id,
      userId: data.userId || doc.id,
    });
  });
  console.log(`✅ Loaded ${petSittersCache.size} pet sitter profiles\n`);

  // Process bookings in batches
  let lastDoc = null;
  let batch = db.batch();
  let batchCount = 0;

  while (true) {
    let query = db.collection('bookings').orderBy('__name__').limit(BATCH_SIZE);
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const bookingsSnap = await query.get();
    if (bookingsSnap.empty) break;

    for (const doc of bookingsSnap.docs) {
      stats.total++;
      const data = doc.data();
      const { clientId, catSitterId, userId, ownerId, sitterId } = data;

      // Determine actual client UID (prefer userId > clientId > ownerId)
      const actualClientId = userId || clientId || ownerId;
      const actualCatSitterId = catSitterId || sitterId;

      const clientIsBusinessKey = isBusinessKey(actualClientId);
      const sitterIsBusinessKey = isBusinessKey(actualCatSitterId);

      if (!clientIsBusinessKey && !sitterIsBusinessKey) {
        // Both are valid UIDs, skip
        stats.skipped++;
        continue;
      }

      let newClientId = actualClientId;
      let newCatSitterId = actualCatSitterId;
      let clientKey = null;
      let catSitterKey = null;

      // Try to resolve client business key
      if (clientIsBusinessKey) {
        clientKey = actualClientId;
        // Can't easily resolve client business keys - mark for manual review
        console.log(`⚠️ Booking ${doc.id}: clientId "${actualClientId}" is a business key - cannot auto-resolve`);
        stats.unmapped++;
        continue;
      }

      // Try to resolve cat sitter business key
      if (sitterIsBusinessKey) {
        catSitterKey = actualCatSitterId;
        // Check if we have a pet sitter profile with this ID
        const sitterProfile = petSittersCache.get(actualCatSitterId);
        if (sitterProfile && isValidFirebaseUid(sitterProfile.userId)) {
          newCatSitterId = sitterProfile.userId;
        } else {
          // Try to find any user that is a cat sitter (fallback)
          console.log(`⚠️ Booking ${doc.id}: catSitterId "${actualCatSitterId}" is a business key - no mapping found`);
          stats.unmapped++;
          continue;
        }
      }

      console.log(`📝 Booking ${doc.id}:`);
      if (clientIsBusinessKey) {
        console.log(`   clientId: ${actualClientId} → ${newClientId} (stored as clientKey)`);
      }
      if (sitterIsBusinessKey) {
        console.log(`   catSitterId: ${actualCatSitterId} → ${newCatSitterId} (stored as catSitterKey)`);
      }

      if (!dryRun) {
        const updateData = {
          _migrated: true,
          _migratedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        if (clientIsBusinessKey) {
          updateData.clientId = newClientId;
          updateData.userId = newClientId;
          updateData.ownerId = newClientId;
          updateData.clientKey = clientKey;
          updateData._originalClientId = actualClientId;
        }

        if (sitterIsBusinessKey) {
          updateData.catSitterId = newCatSitterId;
          updateData.sitterId = newCatSitterId;
          updateData.sitterUserId = newCatSitterId;
          updateData.catSitterKey = catSitterKey;
          updateData._originalCatSitterId = actualCatSitterId;
        }

        batch.update(doc.ref, updateData);
        batchCount++;

        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          batch = db.batch();
          batchCount = 0;
          console.log(`💾 Committed batch of ${BATCH_SIZE} updates`);
        }
      }

      stats.updated++;
    }

    lastDoc = bookingsSnap.docs[bookingsSnap.docs.length - 1];
  }

  // Commit remaining batch
  if (!dryRun && batchCount > 0) {
    await batch.commit();
    console.log(`💾 Committed final batch of ${batchCount} updates`);
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   Total bookings: ${stats.total}`);
  console.log(`   Updated: ${stats.updated}`);
  console.log(`   Skipped (already valid): ${stats.skipped}`);
  console.log(`   Unmapped (needs manual fix): ${stats.unmapped}`);
  console.log(`   Errors: ${stats.errors}`);
  console.log(`\n${dryRun ? '🔍 DRY RUN COMPLETE - No changes made' : '✅ MIGRATION COMPLETE'}\n`);

  return stats;
}

// Main
const args = process.argv.slice(2);
const dryRun = !args.includes('--apply');

if (args.includes('--help')) {
  console.log(`
Usage: node scripts/migrate-bookings.js [options]

Options:
  --dry-run    Preview changes without applying (default)
  --apply      Apply changes to Firestore
  --help       Show this help message
`);
  process.exit(0);
}

migrateBookings(dryRun)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });
