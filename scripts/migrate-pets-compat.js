/**
 * Migration Script: Add pets compatibility fields
 * 
 * This script adds missing species/photoURL fields to pets documents
 * for backwards compatibility with code expecting these field names.
 * 
 * - species = type (alias)
 * - photoURL = mainPhoto (alias)
 * 
 * Usage:
 *   node scripts/migrate-pets-compat.js --dry-run   # Preview changes
 *   node scripts/migrate-pets-compat.js --apply     # Apply changes
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

async function migratePetsCompat(dryRun = true) {
  console.log(`\n🚀 Starting pets compatibility migration (${dryRun ? 'DRY RUN' : 'APPLY MODE'})\n`);
  
  const stats = {
    total: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  // Process pets in batches
  let lastDoc = null;
  let batch = db.batch();
  let batchCount = 0;

  while (true) {
    let query = db.collection('pets').orderBy('__name__').limit(BATCH_SIZE);
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const petsSnap = await query.get();
    if (petsSnap.empty) break;

    for (const doc of petsSnap.docs) {
      stats.total++;
      const data = doc.data();
      
      const hasType = data.type !== undefined;
      const hasSpecies = data.species !== undefined;
      const hasMainPhoto = data.mainPhoto !== undefined;
      const hasPhotoURL = data.photoURL !== undefined;

      // Check if we need to add compatibility fields
      const needsSpecies = hasType && !hasSpecies;
      const needsPhotoURL = hasMainPhoto && !hasPhotoURL;
      const needsType = !hasType && hasSpecies;
      const needsMainPhoto = !hasMainPhoto && hasPhotoURL;

      if (!needsSpecies && !needsPhotoURL && !needsType && !needsMainPhoto) {
        stats.skipped++;
        continue;
      }

      const updateData = {};
      
      if (needsSpecies) {
        updateData.species = data.type;
        console.log(`📝 Pet ${doc.id}: Adding species = "${data.type}"`);
      }
      
      if (needsPhotoURL) {
        updateData.photoURL = data.mainPhoto;
        console.log(`📝 Pet ${doc.id}: Adding photoURL = "${data.mainPhoto?.substring(0, 50)}..."`);
      }
      
      if (needsType) {
        updateData.type = data.species;
        console.log(`📝 Pet ${doc.id}: Adding type = "${data.species}"`);
      }
      
      if (needsMainPhoto) {
        updateData.mainPhoto = data.photoURL;
        console.log(`📝 Pet ${doc.id}: Adding mainPhoto = "${data.photoURL?.substring(0, 50)}..."`);
      }

      if (!dryRun) {
        batch.update(doc.ref, {
          ...updateData,
          _compatMigrated: true,
          _compatMigratedAt: admin.firestore.FieldValue.serverTimestamp(),
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

    lastDoc = petsSnap.docs[petsSnap.docs.length - 1];
  }

  // Commit remaining batch
  if (!dryRun && batchCount > 0) {
    await batch.commit();
    console.log(`💾 Committed final batch of ${batchCount} updates`);
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   Total pets: ${stats.total}`);
  console.log(`   Updated: ${stats.updated}`);
  console.log(`   Skipped (already complete): ${stats.skipped}`);
  console.log(`   Errors: ${stats.errors}`);
  console.log(`\n${dryRun ? '🔍 DRY RUN COMPLETE - No changes made' : '✅ MIGRATION COMPLETE'}\n`);

  return stats;
}

// Main
const args = process.argv.slice(2);
const dryRun = !args.includes('--apply');

if (args.includes('--help')) {
  console.log(`
Usage: node scripts/migrate-pets-compat.js [options]

Options:
  --dry-run    Preview changes without applying (default)
  --apply      Apply changes to Firestore
  --help       Show this help message
`);
  process.exit(0);
}

migratePetsCompat(dryRun)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });
