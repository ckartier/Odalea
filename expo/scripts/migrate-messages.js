/**
 * Migration Script: Fix messages senderId/receiverId
 * 
 * This script repairs messages that have invalid senderId/receiverId values
 * (business keys like "paris-1" instead of Firebase UIDs).
 * 
 * It uses the conversation.participants array to determine the correct UIDs.
 * 
 * Usage:
 *   node scripts/migrate-messages.js --dry-run   # Preview changes
 *   node scripts/migrate-messages.js --apply     # Apply changes
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

async function migrateMessages(dryRun = true) {
  console.log(`\n🚀 Starting messages migration (${dryRun ? 'DRY RUN' : 'APPLY MODE'})\n`);
  
  const stats = {
    total: 0,
    updated: 0,
    skipped: 0,
    unmapped: 0,
    errors: 0,
  };

  // Cache conversations for participant lookup
  const conversationsCache = new Map();
  
  // Load all conversations
  console.log('📥 Loading conversations...');
  const conversationsSnap = await db.collection('conversations').get();
  conversationsSnap.docs.forEach(doc => {
    const data = doc.data();
    conversationsCache.set(doc.id, {
      id: doc.id,
      participants: data.participants || [],
    });
  });
  console.log(`✅ Loaded ${conversationsCache.size} conversations\n`);

  // Process messages in batches
  let lastDoc = null;
  let batch = db.batch();
  let batchCount = 0;

  while (true) {
    let query = db.collection('messages').orderBy('__name__').limit(BATCH_SIZE);
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const messagesSnap = await query.get();
    if (messagesSnap.empty) break;

    for (const doc of messagesSnap.docs) {
      stats.total++;
      const data = doc.data();
      const { senderId, receiverId, conversationId } = data;

      // Check if senderId or receiverId are business keys
      const senderIsBusinessKey = isBusinessKey(senderId);
      const receiverIsBusinessKey = isBusinessKey(receiverId);

      if (!senderIsBusinessKey && !receiverIsBusinessKey) {
        // Both are valid UIDs, skip
        stats.skipped++;
        continue;
      }

      // Get conversation participants
      const conversation = conversationsCache.get(conversationId);
      if (!conversation || !conversation.participants || conversation.participants.length < 2) {
        console.log(`⚠️ Message ${doc.id}: Cannot map - no valid conversation found`);
        stats.unmapped++;
        continue;
      }

      const participants = conversation.participants.filter(p => isValidFirebaseUid(p));
      if (participants.length < 2) {
        console.log(`⚠️ Message ${doc.id}: Cannot map - conversation participants are not valid UIDs`);
        stats.unmapped++;
        continue;
      }

      // Determine correct senderId/receiverId from participants
      let newSenderId = senderId;
      let newReceiverId = receiverId;

      if (senderIsBusinessKey) {
        // Try to find a matching participant
        // Since we can't know which one was the sender, we'll use the first participant
        // that isn't the receiver (if receiver is valid)
        if (isValidFirebaseUid(receiverId)) {
          newSenderId = participants.find(p => p !== receiverId) || participants[0];
        } else {
          newSenderId = participants[0];
        }
      }

      if (receiverIsBusinessKey) {
        // Use the participant that isn't the sender
        if (isValidFirebaseUid(newSenderId)) {
          newReceiverId = participants.find(p => p !== newSenderId) || participants[1];
        } else {
          newReceiverId = participants[1];
        }
      }

      console.log(`📝 Message ${doc.id}:`);
      console.log(`   senderId: ${senderId} → ${newSenderId}`);
      console.log(`   receiverId: ${receiverId} → ${newReceiverId}`);

      if (!dryRun) {
        batch.update(doc.ref, {
          senderId: newSenderId,
          receiverId: newReceiverId,
          _migrated: true,
          _migratedAt: admin.firestore.FieldValue.serverTimestamp(),
          _originalSenderId: senderId,
          _originalReceiverId: receiverId,
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

    lastDoc = messagesSnap.docs[messagesSnap.docs.length - 1];
  }

  // Commit remaining batch
  if (!dryRun && batchCount > 0) {
    await batch.commit();
    console.log(`💾 Committed final batch of ${batchCount} updates`);
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   Total messages: ${stats.total}`);
  console.log(`   Updated: ${stats.updated}`);
  console.log(`   Skipped (already valid): ${stats.skipped}`);
  console.log(`   Unmapped (no conversation): ${stats.unmapped}`);
  console.log(`   Errors: ${stats.errors}`);
  console.log(`\n${dryRun ? '🔍 DRY RUN COMPLETE - No changes made' : '✅ MIGRATION COMPLETE'}\n`);

  return stats;
}

// Main
const args = process.argv.slice(2);
const dryRun = !args.includes('--apply');

if (args.includes('--help')) {
  console.log(`
Usage: node scripts/migrate-messages.js [options]

Options:
  --dry-run    Preview changes without applying (default)
  --apply      Apply changes to Firestore
  --help       Show this help message
`);
  process.exit(0);
}

migrateMessages(dryRun)
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });
