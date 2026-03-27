/**
 * Script de nettoyage Firestore - Suppression des utilisateurs mock (paris-*, test-*)
 * 
 * Usage: node scripts/cleanup-mock-users.js [--dry-run]
 * 
 * IMPORTANT: Toujours faire un dry-run avant d'exécuter réellement
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Configuration Firebase Admin
const serviceAccount = require('../service-account-key.json'); // À créer depuis Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const db = admin.firestore();

const isDryRun = process.argv.includes('--dry-run');

console.log('🧹 Script de nettoyage des utilisateurs mock');
console.log(`Mode: ${isDryRun ? '🔍 DRY-RUN (simulation)' : '⚠️  EXECUTION RÉELLE'}`);
console.log('─'.repeat(60));

// Guard: détecte les IDs mock
function isMockId(id) {
  return id.includes('paris-') || 
         id.includes('test-') || 
         id.length < 20 || // Les UID Firebase font ~28 caractères
         /^[a-z]+-\d+$/.test(id); // Pattern type: "paris-1", "test-3"
}

async function confirmAction(message) {
  if (isDryRun) return true;
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(`${message} (yes/no): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

async function cleanupCollection(collectionName, idField = 'id', cascadeFields = []) {
  console.log(`\n📂 Analysing collection: ${collectionName}`);
  
  const snapshot = await db.collection(collectionName).get();
  const mockDocs = [];
  const cascadeDocs = [];
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const docId = doc.id;
    
    // Doc est mock si son ID est mock
    if (isMockId(docId)) {
      mockDocs.push({ id: docId, data });
    }
    
    // Doc référence un mock dans un champ cascade
    for (const field of cascadeFields) {
      const fieldValue = data[field];
      if (fieldValue && isMockId(String(fieldValue))) {
        cascadeDocs.push({ id: docId, field, mockRef: fieldValue });
      }
    }
  });
  
  console.log(`  ├─ Mock docs trouvés: ${mockDocs.length}`);
  console.log(`  └─ Docs référençant des mocks: ${cascadeDocs.length}`);
  
  if (mockDocs.length > 0) {
    console.log(`\n  📝 Liste des mock docs à supprimer:`);
    mockDocs.slice(0, 10).forEach(d => console.log(`     • ${d.id}`));
    if (mockDocs.length > 10) console.log(`     ... et ${mockDocs.length - 10} autres`);
  }
  
  if (cascadeDocs.length > 0) {
    console.log(`\n  🔗 Docs liés à supprimer:`);
    cascadeDocs.slice(0, 10).forEach(d => console.log(`     • ${d.id} (${d.field} -> ${d.mockRef})`));
    if (cascadeDocs.length > 10) console.log(`     ... et ${cascadeDocs.length - 10} autres`);
  }
  
  if (!isDryRun && (mockDocs.length > 0 || cascadeDocs.length > 0)) {
    const batch = db.batch();
    let count = 0;
    
    mockDocs.forEach(doc => {
      batch.delete(db.collection(collectionName).doc(doc.id));
      count++;
    });
    
    cascadeDocs.forEach(doc => {
      batch.delete(db.collection(collectionName).doc(doc.id));
      count++;
    });
    
    if (count > 0) {
      await batch.commit();
      console.log(`  ✅ ${count} documents supprimés`);
    }
  }
  
  return { mockDocs: mockDocs.length, cascadeDocs: cascadeDocs.length };
}

async function cleanupUsers() {
  console.log(`\n👥 Nettoyage collection USERS`);
  const snapshot = await db.collection('users').get();
  const mockUsers = [];
  const realUsers = [];
  
  snapshot.forEach(doc => {
    const data = doc.data();
    if (isMockId(doc.id)) {
      mockUsers.push({ id: doc.id, email: data.email, pseudo: data.pseudo });
    } else {
      realUsers.push({ id: doc.id, email: data.email });
      
      // Clean friends array
      if (data.friends && Array.isArray(data.friends)) {
        const mockFriends = data.friends.filter(isMockId);
        if (mockFriends.length > 0 && !isDryRun) {
          const cleanFriends = data.friends.filter(id => !isMockId(id));
          db.collection('users').doc(doc.id).update({ friends: cleanFriends });
          console.log(`  🧹 Cleaned ${mockFriends.length} mock friends from user ${doc.id}`);
        }
      }
    }
  });
  
  console.log(`  ├─ Utilisateurs réels: ${realUsers.length}`);
  console.log(`  └─ Utilisateurs mock: ${mockUsers.length}`);
  
  if (mockUsers.length > 0) {
    console.log(`\n  ⚠️  Utilisateurs mock à supprimer:`);
    mockUsers.forEach(u => console.log(`     • ${u.id} (${u.email || u.pseudo || 'no email'})`));
  }
  
  if (!isDryRun && mockUsers.length > 0) {
    const batch = db.batch();
    mockUsers.forEach(u => {
      batch.delete(db.collection('users').doc(u.id));
    });
    await batch.commit();
    console.log(`  ✅ ${mockUsers.length} utilisateurs mock supprimés`);
  }
  
  return mockUsers.length;
}

async function main() {
  try {
    const stats = {
      users: 0,
      pets: 0,
      posts: 0,
      comments: 0,
      likes: 0,
      conversations: 0,
      messages: 0,
      friendRequests: 0,
      bookings: 0,
      petSitterProfiles: 0,
    };
    
    // 1. Clean users first
    stats.users = await cleanupUsers();
    
    // 2. Clean related collections
    const result1 = await cleanupCollection('pets', 'id', ['ownerId']);
    stats.pets = result1.mockDocs + result1.cascadeDocs;
    
    const result2 = await cleanupCollection('posts', 'id', ['authorId', 'fromOwnerId']);
    stats.posts = result2.mockDocs + result2.cascadeDocs;
    
    const result3 = await cleanupCollection('comments', 'id', ['authorId']);
    stats.comments = result3.mockDocs + result3.cascadeDocs;
    
    const result4 = await cleanupCollection('likes', 'id', ['userId']);
    stats.likes = result4.mockDocs + result4.cascadeDocs;
    
    const result5 = await cleanupCollection('conversations', 'id', ['participants']);
    stats.conversations = result5.mockDocs + result5.cascadeDocs;
    
    const result6 = await cleanupCollection('messages', 'id', ['senderId', 'receiverId']);
    stats.messages = result6.mockDocs + result6.cascadeDocs;
    
    const result7 = await cleanupCollection('friendRequests', 'id', ['senderId', 'receiverId']);
    stats.friendRequests = result7.mockDocs + result7.cascadeDocs;
    
    const result8 = await cleanupCollection('bookings', 'id', ['userId', 'catSitterId']);
    stats.bookings = result8.mockDocs + result8.cascadeDocs;
    
    const result9 = await cleanupCollection('petSitterProfiles', 'id', ['userId']);
    stats.petSitterProfiles = result9.mockDocs + result9.cascadeDocs;
    
    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('📊 RÉSUMÉ');
    console.log('═'.repeat(60));
    console.log(`Mode: ${isDryRun ? '🔍 DRY-RUN' : '✅ EXÉCUTÉ'}`);
    console.log('');
    Object.entries(stats).forEach(([key, value]) => {
      if (value > 0) {
        console.log(`  ${key.padEnd(20)} : ${value} doc(s)`);
      }
    });
    console.log('');
    const total = Object.values(stats).reduce((a, b) => a + b, 0);
    console.log(`  TOTAL: ${total} document(s) ${isDryRun ? 'à supprimer' : 'supprimés'}`);
    console.log('═'.repeat(60));
    
    if (isDryRun) {
      console.log('\n⚠️  Ceci était une simulation. Pour exécuter réellement:');
      console.log('   node scripts/cleanup-mock-users.js\n');
    } else {
      console.log('\n✅ Nettoyage terminé avec succès!\n');
    }
    
  } catch (error) {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Confirmation avant exécution réelle
(async () => {
  if (!isDryRun) {
    console.log('\n⚠️  ATTENTION: Vous êtes sur le point de SUPPRIMER définitivement des données!');
    const confirmed = await confirmAction('\nÊtes-vous SÛR de vouloir continuer?');
    if (!confirmed) {
      console.log('\n❌ Opération annulée.');
      process.exit(0);
    }
  }
  
  await main();
})();
