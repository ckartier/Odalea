/**
 * Migration Script: Fix activePetId for users
 * 
 * This script sets activePetId for users who have pets but no activePetId set.
 * It sets activePetId to the first pet owned by the user.
 * 
 * Usage:
 *   node scripts/fix-active-pet-id.js --dry-run   # Preview changes
 *   node scripts/fix-active-pet-id.js --apply     # Apply changes
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

async function fixActivePetId(dryRun = true) {
  console.log(`\n🚀 Starting activePetId fix (${dryRun ? 'DRY RUN' : 'APPLY MODE'})\n`);
  
  const stats = {
    totalUsers: 0,
    updated: 0,
    skipped: 0,
    noPets: 0,
    errors: 0,
  };

  // Load all pets grouped by owner
  console.log('📥 Loading pets by owner...');
  const petsByOwner = new Map();
  const petsSnap = await db.collection('pets').orderBy('createdAt', 'desc').get();
  petsSnap.docs.forEach(doc => {
    const data = doc.data();
    const ownerId = data.ownerId;
    if (ownerId) {
      if (!petsByOwner.has(ownerId)) {
        petsByOwner.set(ownerId, []);
      }
      petsByOwner.get(ownerId).push({
        id: doc.id,
        name: data.name,
        createdAt: data.createdAt,
      });
    }
  });
  console.log(`✅ Loaded pets for ${petsByOwner.size} owners\n`);

  // Process users in batches
  let lastDoc = null;
  let batch = db.batch();
  let batchCount = 0;

  while (true) {
    let query = db.collection('users').orderBy('__name__').limit(BATCH_SIZE);
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const usersSnap = await query.get();
    if (usersSnap.empty) break;

    for (const doc of usersSnap.docs) {
      stats.totalUsers++;
      const data = doc.data();
      const userId = doc.id;

      // Check if user already has activePetId
      if (data.activePetId) {
        stats.skipped++;
        continue;
      }

      // Get user's pets
      const userPets = petsByOwner.get(userId) || [];
      if (userPets.length === 0) {
        stats.noPets++;
        continue;
      }

      // Set activePetId to first pet
      const firstPet = userPets[0];
      console.log(`📝 User ${userId}: Setting activePetId = "${firstPet.id}" (${firstPet.name})`);

      if (!dryRun) {
        batch.update(doc.ref, {
          activePetId: firstPet.id,
          _activePetIdFixed: true,
          _activePetIdFixedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
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

    lastDoc = usersSnap.docs[usersSnap.docs.length - 1];
  }

  // Commit remaining batch
  if (!dryRun && batchCount > 0) {
    await batch.commit();
    console.log(`💾 Committed final batch of ${batchCount} updates`);
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   Total users: ${stats.totalUsers}`);
  console.log(`   Updated (activePetId set): ${stats.updated}`);
  console.log(`   Skipped (already has activePetId): ${stats.skipped}`);
  console.log(`   No pets (nothing to set): ${stats.noPets}`);
  console.log(`   Errors: ${stats.errors}`);
  console.log(`\n${dryRun ? '🔍 DRY RUN COMPLETE - No changes made' : '✅ MIGRATION COMPLETE'}\n`);

  return stats;
}

// Main
const args = process.argv.slice(2);
const dryRun = !args.includes('--apply');

if (args.includes('--help')) {
  console.log(`
Usage: node scripts/fix-active-pet-id.js [options]

Options:
  --dry-run    Preview changes without applying (default)
  --apply      Apply changes to Firestore
  --help       Show this help message
`);
  process.exit(0);
}

fixActivePetId(dryRun)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });
