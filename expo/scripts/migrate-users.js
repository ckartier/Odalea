/*
Small Node script to migrate sensitive fields from `users` to `users_private` and set a default profileVisibility.

Usage:
  DRY RUN (default):
    node scripts/migrate-users.js
  APPLY CHANGES:
    node scripts/migrate-users.js --apply

Optional flags:
  --defaultVisibility=public   // public | friends | private (default: public)
  --project=your-project-id    // override detected project

Authentication:
  Set GOOGLE_APPLICATION_CREDENTIALS to your Firebase service account JSON path, or run
  this where gcloud application-default login is configured.
*/

/* eslint-disable no-console */
const admin = require('firebase-admin');

function getFlag(name, fallback) {
  const flag = process.argv.find((arg) => arg.startsWith(`--${name}`));
  if (!flag) return fallback;
  const [_, value] = flag.split('=');
  return value ?? true;
}

const APPLY = process.argv.includes('--apply');
const DEFAULT_VISIBILITY = (getFlag('defaultVisibility', 'public') || 'public').toString();
const PROJECT_ID = getFlag('project', process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT);

function initAdmin() {
  if (admin.apps.length) return;
  admin.initializeApp({
    projectId: PROJECT_ID,
    credential: admin.credential.applicationDefault(),
  });
}

/**
 * Fields considered sensitive that should be moved from users -> users_private
 */
const SENSITIVE_FIELDS = [
  'email',
  'phone',
  'address',
  'birthdate',
  'blockedUsers',
  'notificationSettings',
  'paymentCustomerId',
];

async function run() {
  console.log('▶️  Users migration starting...');
  console.log('    apply:', APPLY);
  console.log('    defaultVisibility:', DEFAULT_VISIBILITY);
  if (PROJECT_ID) console.log('    project:', PROJECT_ID);

  initAdmin();
  const db = admin.firestore();

  const usersSnap = await db.collection('users').get();
  console.log(`ℹ️  Found ${usersSnap.size} user documents`);

  let examined = 0;
  let toWrite = 0;
  let batchesCommitted = 0;
  let batch = db.batch();
  const commitBatch = async () => {
    if (!APPLY) return; // dry-run
    await batch.commit();
    batchesCommitted += 1;
    batch = db.batch();
  };

  // Aggregated dry‑run report
  const report = {
    usersTotal: usersSnap.size,
    usersNeedingVisibility: 0,
    usersWithSensitive: 0,
    fieldsOccurrences: Object.fromEntries(SENSITIVE_FIELDS.map((k) => [k, 0])),
    examples: [],
  };

  for (const doc of usersSnap.docs) {
    examined += 1;
    const userId = doc.id;
    const data = doc.data() || {};

    const sensitive = {};
    let hasSensitive = false;

    for (const key of SENSITIVE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        sensitive[key] = data[key];
        hasSensitive = true;
        report.fieldsOccurrences[key] += 1;
      }
    }

    const updates = {};
    const deletes = {};

    // Move sensitive fields
    if (hasSensitive) {
      report.usersWithSensitive += 1;
      const privateRef = db.collection('users_private').doc(userId);
      if (APPLY) batch.set(privateRef, { ...sensitive, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
      toWrite += 1;

      for (const key of Object.keys(sensitive)) {
        deletes[key] = admin.firestore.FieldValue.delete();
      }
    }

    // Ensure profileVisibility default if missing
    const needsVisibility = !('profileVisibility' in data) || data.profileVisibility == null || data.profileVisibility === '';
    if (needsVisibility) {
      report.usersNeedingVisibility += 1;
      updates['profileVisibility'] = DEFAULT_VISIBILITY;
    }

    // Always bump updatedAt if we modify
    if (Object.keys(deletes).length > 0 || Object.keys(updates).length > 0) {
      updates['updatedAt'] = admin.firestore.FieldValue.serverTimestamp();
    }

    if (Object.keys(deletes).length > 0 || Object.keys(updates).length > 0) {
      const userRef = db.collection('users').doc(userId);
      if (APPLY) batch.set(userRef, { ...deletes, ...updates }, { merge: true });
      toWrite += 1;

      if (report.examples.length < 10) {
        report.examples.push({
          userId,
          move: Object.keys(sensitive),
          set: needsVisibility ? { profileVisibility: DEFAULT_VISIBILITY } : {},
          update: Object.keys(updates),
          delete: Object.keys(deletes),
        });
      }
    }

    if (toWrite >= 400) { // keep margin below 500 writes/commit
      console.log(`⏩ committing batch after ${examined} processed...`);
      await commitBatch();
      toWrite = 0;
    }
  }

  if (toWrite > 0) {
    console.log('⏩ committing final batch...');
    await commitBatch();
  }

  // Print dry‑run summary
  console.log('—— Dry‑run summary ——');
  console.log(JSON.stringify({
    apply: APPLY,
    defaultVisibility: DEFAULT_VISIBILITY,
    usersTotal: report.usersTotal,
    usersWithSensitive: report.usersWithSensitive,
    usersNeedingVisibility: report.usersNeedingVisibility,
    fieldsOccurrences: report.fieldsOccurrences,
    examples: report.examples,
  }, null, 2));

  console.log('✅ Migration finished');
  console.log('   documents scanned:', examined);
  console.log('   batches committed:', APPLY ? batchesCommitted : 0, APPLY ? '' : '(dry-run)');
}

run().catch((err) => {
  console.error('❌ Migration failed:', err?.message || err);
  process.exitCode = 1;
});
