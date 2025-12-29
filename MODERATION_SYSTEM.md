# 🛡️ Système de Modération Instagram-like - Odalea

Système complet de modération avec détection automatique, signalements, et gestion des contenus sensibles.

---

## 📋 Vue d'ensemble

### Composants du système
1. **Types TypeScript** - Modèles de données pour posts, reports, moderation actions
2. **Service de modération** - Logique métier (signalements, bans, strikes)
3. **Règles Firestore/Storage** - Sécurité et permissions
4. **UI Components** - ReportModal, ContentWarning
5. **Cloud Functions** - Modération automatique (recommandé)

### Flux de modération
```
1. User uploads content → 2. Storage upload triggers Cloud Function
3. Image moderation API check → 4. Set visibility flag
5. User report triggers auto-check → 6. Admin review if needed
```

---

## 🗂️ Data Model Firestore

### Collection: `posts`
```typescript
{
  id: string
  authorId: string              // auth.uid
  content: string
  images?: string[]
  type: 'text' | 'photo' | 'video'
  visibility: 'public' | 'pending' | 'hidden'  // Default: 'public'
  flags?: {
    nsfw?: boolean              // Contenu sensible
    violence?: boolean          // Violence/gore
    childRisk?: boolean         // Exploitation enfant
    moderationScore?: number    // Score 0-1
  }
  likesCount: number
  commentsCount: number
  savesCount?: number
  createdAt: Timestamp
  moderatedAt?: Timestamp
  moderatedBy?: string          // 'system' | admin uid
}
```

### Collection: `reports`
```typescript
{
  id: string
  reporterId: string            // auth.uid
  reporterName: string
  targetType: 'post' | 'comment' | 'user'
  targetId: string
  reason: 'spam' | 'harassment' | 'hate_speech' | 'violence' 
         | 'sexual_content' | 'self_harm' | 'child_safety' 
         | 'false_info' | 'other'
  details?: string              // Optional description
  status: 'pending' | 'reviewing' | 'actioned' | 'dismissed'
  createdAt: Timestamp
  reviewedAt?: Timestamp
  reviewedBy?: string           // Admin uid
  actionTaken?: string          // Description de l'action
}
```

### Collection: `moderationActions` (Audit log)
```typescript
{
  id: string
  actorId: string               // 'system' | admin uid
  actorName?: string
  action: 'hide' | 'delete' | 'warn' | 'ban' | 'unban' | 'approve' | 'flag'
  targetType: 'post' | 'comment' | 'user'
  targetId: string
  reason: string
  details?: string
  automated: boolean            // true if system action
  createdAt: Timestamp
}
```

### Collection: `userFlags`
```typescript
{
  userId: string                // Document ID = auth.uid
  strikes: number               // Count violations
  isBanned: boolean
  bannedUntil?: Timestamp       // Null = permanent
  bannedReason?: string
  lastActions: ModerationAction[] // Recent actions (limited to last 10)
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### Collection: `contentSettings` (User preferences)
```typescript
{
  userId: string                // Document ID = auth.uid
  hideSensitiveContent: boolean // Hide nsfw content
  blurSensitiveImages: boolean  // Blur instead of hide
  autoPlayVideos: boolean
}
```

---

## 🔐 Firestore Rules

```javascript
// Posts - visibility-based access
match /posts/{postId} {
  allow read: if isAuthenticated() && 
                 (resource.data.visibility == 'public' || 
                  resource.data.visibility == 'pending' ||
                  resource.data.authorId == request.auth.uid ||
                  isAdmin());
  
  allow create: if isAuthenticated() && 
                   request.resource.data.authorId == request.auth.uid &&
                   (!request.resource.data.keys().hasAny(['visibility']) || 
                    request.resource.data.visibility == 'public');
  
  allow update: if isAuthenticated() && 
                   resource.data.authorId == request.auth.uid &&
                   !request.resource.data.diff(resource.data).affectedKeys()
                     .hasAny(['visibility', 'flags', 'moderatedAt', 'moderatedBy']);
  
  allow delete: if isAuthenticated() && 
                   resource.data.authorId == request.auth.uid;
}

// Reports - reporter + admins can read
match /reports/{reportId} {
  allow read: if isAuthenticated() && 
                 (resource.data.reporterId == request.auth.uid || isAdmin());
  
  allow create: if isAuthenticated() && 
                   request.resource.data.reporterId == request.auth.uid &&
                   request.resource.data.status == 'pending';
  
  allow update: if isAdmin();
  allow delete: if false;
}

// Moderation Actions - admin only (audit log)
match /moderationActions/{actionId} {
  allow read: if isAdmin();
  allow create: if isAuthenticated() && 
                   (request.resource.data.actorId == request.auth.uid || 
                    request.resource.data.actorId == 'system');
  allow update, delete: if false;
}

// User Flags - user can read own, admins read all
match /userFlags/{userId} {
  allow read: if userId == request.auth.uid || isAdmin();
  allow create, update: if isAdmin();
  allow delete: if false;
}
```

---

## 📦 Firebase Storage Rules

```javascript
// Post media with moderation
match /users/{userId}/posts/{postId}/{filename} {
  allow read: if isAuthenticated();
  allow write: if isOwner(userId) && isValidMediaUpload();
  allow delete: if isOwner(userId);
}

function isValidMediaUpload() {
  return (isImage() && request.resource.size < 10 * 1024 * 1024) ||
         (isVideo() && request.resource.size < 50 * 1024 * 1024);
}
```

---

## ☁️ Cloud Functions (Recommandé)

### 1. Image Moderation on Upload

**Provider options:**
- **Google Cloud Vision API** (comprehensive, $$$)
- **AWS Rekognition** (good balance, $$)
- **Cloudflare AI** (économique, $)
- **Sightengine** (spécialisé modération, $$)

```typescript
// functions/src/moderateImage.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import vision from '@google-cloud/vision';

const visionClient = new vision.ImageAnnotatorClient();

export const moderateUploadedImage = functions.storage
  .object()
  .onFinalize(async (object) => {
    const filePath = object.name;
    
    // Only process post images
    if (!filePath?.includes('/posts/')) return;
    
    // Extract userId and postId from path
    const match = filePath.match(/users\/(.+?)\/posts\/(.+?)\//);
    if (!match) return;
    
    const [, userId, postId] = match;
    
    try {
      // Get image from Storage
      const bucket = admin.storage().bucket(object.bucket);
      const file = bucket.file(filePath);
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000 // 15 min
      });
      
      // Call Vision API
      const [result] = await visionClient.safeSearchDetection(url);
      const detections = result.safeSearchAnnotation;
      
      // Analyze results
      const flags: any = {};
      let visibility: 'public' | 'pending' | 'hidden' = 'public';
      
      // CRITICAL: child exploitation
      if (detections?.racy === 'VERY_LIKELY' || 
          detections?.adult === 'VERY_LIKELY') {
        flags.childRisk = true;
        visibility = 'hidden';
        
        // Auto-ban user for severe violation
        await admin.firestore()
          .collection('userFlags')
          .doc(userId)
          .set({
            isBanned: true,
            bannedReason: 'Auto-ban: Severe content violation',
            strikes: admin.firestore.FieldValue.increment(3),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        
        // Log action
        await logModerationAction('system', 'ban', 'user', userId, 
          'Auto-ban: Severe content violation', true);
      }
      // HIGH: violence or explicit content
      else if (detections?.violence === 'VERY_LIKELY' || 
               detections?.violence === 'LIKELY') {
        flags.violence = true;
        visibility = 'pending';
      }
      // MEDIUM: potentially sensitive
      else if (detections?.adult === 'LIKELY' || 
               detections?.racy === 'LIKELY') {
        flags.nsfw = true;
        visibility = 'pending';
      }
      
      // Update post
      await admin.firestore()
        .collection('posts')
        .doc(postId)
        .update({
          visibility,
          flags,
          moderatedAt: admin.firestore.FieldValue.serverTimestamp(),
          moderatedBy: 'system'
        });
      
      // Notify user if content hidden/pending
      if (visibility !== 'public') {
        await admin.firestore()
          .collection('notifications')
          .add({
            userId,
            type: visibility === 'hidden' ? 'content_rejected' : 'moderation',
            title: visibility === 'hidden' ? 
              'Contenu refusé' : 'Contenu en vérification',
            message: visibility === 'hidden' ?
              'Votre publication a été refusée car elle ne respecte pas nos règles.' :
              'Votre publication est en cours de vérification.',
            data: { postId, reason: Object.keys(flags)[0] },
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
      }
      
      console.log(`✅ Moderated post ${postId}: ${visibility}`, flags);
      
    } catch (error) {
      console.error('❌ Error moderating image:', error);
    }
  });

async function logModerationAction(
  actorId: string,
  action: string,
  targetType: string,
  targetId: string,
  reason: string,
  automated: boolean
) {
  await admin.firestore()
    .collection('moderationActions')
    .add({
      actorId,
      action,
      targetType,
      targetId,
      reason,
      automated,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
}
```

### 2. Auto-moderation on Reports

```typescript
// functions/src/autoModerateReports.ts
export const processReport = functions.firestore
  .document('reports/{reportId}')
  .onCreate(async (snap, context) => {
    const report = snap.data();
    const { targetType, targetId, reason } = report;
    
    // Count pending reports for this target
    const reportsSnapshot = await admin.firestore()
      .collection('reports')
      .where('targetType', '==', targetType)
      .where('targetId', '==', targetId)
      .where('status', '==', 'pending')
      .get();
    
    const reportCount = reportsSnapshot.size;
    
    // Auto-hide if 3+ reports OR serious violation
    const seriousReasons = ['child_safety', 'violence', 'self_harm'];
    
    if (reportCount >= 3 || seriousReasons.includes(reason)) {
      if (targetType === 'post') {
        await admin.firestore()
          .collection('posts')
          .doc(targetId)
          .update({
            visibility: 'hidden',
            moderatedAt: admin.firestore.FieldValue.serverTimestamp(),
            moderatedBy: 'system'
          });
        
        // Get post author
        const postDoc = await admin.firestore()
          .collection('posts')
          .doc(targetId)
          .get();
        
        const authorId = postDoc.data()?.authorId;
        
        if (authorId) {
          // Add strike
          await admin.firestore()
            .collection('userFlags')
            .doc(authorId)
            .set({
              strikes: admin.firestore.FieldValue.increment(1),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
          
          // Check if should ban (3 strikes)
          const userFlags = await admin.firestore()
            .collection('userFlags')
            .doc(authorId)
            .get();
          
          if (userFlags.data()?.strikes >= 3) {
            await admin.firestore()
              .collection('userFlags')
              .doc(authorId)
              .update({
                isBanned: true,
                bannedUntil: admin.firestore.Timestamp.fromDate(
                  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
                ),
                bannedReason: 'Auto-ban: 3 strikes'
              });
          }
        }
      }
      
      console.log(`✅ Auto-hid ${targetType} ${targetId} (${reportCount} reports)`);
    }
  });
```

### 3. Rate Limiting

```typescript
// Already implemented in ModerationService.checkRateLimit()
// Limits: 10 posts/hour, 5 reports/hour
```

---

## 🎨 UI Components

### ReportModal

```typescript
import { ReportModal } from '@/components/ReportModal';

// Usage in PostCard
<ReportModal
  visible={showReportModal}
  onClose={() => setShowReportModal(false)}
  targetType="post"
  targetId={post.id}
/>
```

### ContentWarning

```typescript
import { ContentWarning } from '@/components/ContentWarning';

// Usage for sensitive posts
<ContentWarning 
  flags={post.flags}
  mediaUri={post.images?.[0]}
  type="blur" // or 'cover'
>
  <Image source={{ uri: post.images[0] }} />
</ContentWarning>
```

---

## 📊 Feed Algorithm (Simple)

### Scoring formula
```typescript
score = 
  recencyWeight * (1 - daysSincePost / 30) +
  engagementWeight * (likes + comments * 2) / maxEngagement +
  proximityWeight * (1 - distance / maxDistance) +
  affinityWeight * (mutualFriends / totalFriends) +
  diversityWeight * (1 - authorPostsSeen / totalAuthorPosts)
```

### Implementation
```typescript
// Exclude hidden/pending/banned content
const visiblePosts = allPosts.filter(post => 
  post.visibility === 'public' &&
  !bannedUserIds.includes(post.authorId)
);

// Apply user content settings
const filteredPosts = visiblePosts.filter(post => {
  if (userSettings.hideSensitiveContent && post.flags?.nsfw) {
    return false;
  }
  return true;
});

// Score and sort
const scoredPosts = filteredPosts.map(post => ({
  ...post,
  score: calculateScore(post, user)
})).sort((a, b) => b.score - a.score);
```

---

## 🔍 Required Firestore Indexes

```json
{
  "indexes": [
    {
      "collectionGroup": "posts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "visibility", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "reports",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "targetType", "order": "ASCENDING" },
        { "fieldPath": "targetId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "reports",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## ✅ Checklist Déploiement

### Phase 1: Setup (Dev)
- [x] Types TypeScript créés
- [x] ModerationService implémenté
- [x] UI Components créés
- [x] Firestore rules mises à jour
- [x] Storage rules mises à jour

### Phase 2: Testing (Staging)
- [ ] Tester création de post avec images
- [ ] Tester signalement (1 report, 3+ reports)
- [ ] Tester ban utilisateur (manuel + auto)
- [ ] Tester rate limiting (posts + reports)
- [ ] Vérifier ContentWarning affichage
- [ ] Vérifier ReportModal workflow

### Phase 3: Cloud Functions (Prod)
- [ ] Créer projet Cloud Functions
- [ ] Activer Vision API / autre provider
- [ ] Déployer moderateUploadedImage function
- [ ] Déployer processReport function
- [ ] Tester upload → auto-modération
- [ ] Monitor logs + erreurs

### Phase 4: Admin Panel (Optional)
- [ ] Liste reports pending
- [ ] Review content (approve/hide/delete)
- [ ] User management (ban/unban/strikes)
- [ ] Moderation actions audit log
- [ ] Statistics dashboard

---

## 🚨 Important Notes

### Sécurité
- ❌ Ne JAMAIS exposer les reports publiquement
- ✅ Toujours logger les actions de modération (audit)
- ✅ Rate limit pour éviter l'abus
- ✅ Vérifier userFlags.isBanned avant CHAQUE action

### Performance
- Utiliser indexes composites
- Limiter queries avec `limit()`
- Cache les userFlags en mémoire (courte durée)
- Utiliser batch operations pour mass actions

### Legal / GDPR
- Conserver les reports 30 jours minimum (audit)
- Permettre export des données utilisateur
- Anonymiser les reports après résolution
- Documenter chaque ban avec raison

---

## 📞 Support & Resources

- **Google Cloud Vision API**: https://cloud.google.com/vision/docs/detecting-safe-search
- **AWS Rekognition**: https://docs.aws.amazon.com/rekognition/latest/dg/moderation.html
- **Sightengine**: https://sightengine.com/docs
- **Firebase Functions**: https://firebase.google.com/docs/functions

---

**Date:** 2025-12-29  
**Version:** 1.0  
**Status:** ✅ Ready for Testing
