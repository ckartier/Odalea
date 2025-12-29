import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  increment,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  Report, 
  ReportReason, 
  ReportTargetType,
  ModerationAction,
  ModerationActionType,
  UserFlags
} from '@/types';

const COLLECTIONS = {
  REPORTS: 'reports',
  MODERATION_ACTIONS: 'moderationActions',
  USER_FLAGS: 'userFlags',
  POSTS: 'posts',
  COMMENTS: 'comments',
  USERS: 'users',
  NOTIFICATIONS: 'notifications'
} as const;

export class ModerationService {
  static async createReport(
    reporterId: string,
    reporterName: string,
    targetType: ReportTargetType,
    targetId: string,
    reason: ReportReason,
    details?: string
  ): Promise<string> {
    try {
      console.log('🚨 Creating report:', { reporterId, targetType, targetId, reason });
      
      const existingReportQuery = query(
        collection(db, COLLECTIONS.REPORTS),
        where('reporterId', '==', reporterId),
        where('targetType', '==', targetType),
        where('targetId', '==', targetId),
        where('status', '!=', 'dismissed')
      );
      
      const existingReports = await getDocs(existingReportQuery);
      if (!existingReports.empty) {
        console.log('⚠️ Report already exists');
        return existingReports.docs[0].id;
      }
      
      const report: Omit<Report, 'id'> = {
        reporterId,
        reporterName,
        targetType,
        targetId,
        reason,
        details,
        status: 'pending',
        createdAt: new Date()
      };
      
      const reportRef = await addDoc(collection(db, COLLECTIONS.REPORTS), {
        ...report,
        createdAt: serverTimestamp()
      });
      
      console.log('✅ Report created:', reportRef.id);
      
      await this.checkAutoModeration(targetType, targetId, reporterId);
      
      return reportRef.id;
    } catch (error) {
      console.error('❌ Error creating report:', error);
      throw error;
    }
  }

  static async checkAutoModeration(
    targetType: ReportTargetType,
    targetId: string,
    reporterId: string
  ): Promise<void> {
    try {
      const reportsQuery = query(
        collection(db, COLLECTIONS.REPORTS),
        where('targetType', '==', targetType),
        where('targetId', '==', targetId),
        where('status', '==', 'pending')
      );
      
      const reports = await getDocs(reportsQuery);
      const reportCount = reports.size;
      
      console.log(`📊 Target ${targetType}:${targetId} has ${reportCount} pending reports`);
      
      if (reportCount >= 3) {
        console.log('🚫 Auto-hiding content due to multiple reports');
        await this.hideContent(targetType, targetId, 'system', 'Auto-hidden: Multiple reports', true);
      }
      
      const seriousReasons: ReportReason[] = ['child_safety', 'violence', 'self_harm'];
      const hasSeriousReport = reports.docs.some(doc => 
        seriousReasons.includes(doc.data().reason as ReportReason)
      );
      
      if (hasSeriousReport) {
        console.log('🚨 Serious content detected, hiding immediately');
        await this.hideContent(targetType, targetId, 'system', 'Auto-hidden: Serious violation', true);
      }
    } catch (error) {
      console.error('❌ Error in auto-moderation check:', error);
    }
  }

  static async hideContent(
    targetType: ReportTargetType,
    targetId: string,
    actorId: string,
    reason: string,
    automated: boolean = false
  ): Promise<void> {
    try {
      console.log('🙈 Hiding content:', { targetType, targetId, reason });
      
      if (targetType === 'post') {
        const postRef = doc(db, COLLECTIONS.POSTS, targetId);
        await updateDoc(postRef, {
          visibility: 'hidden',
          moderatedAt: serverTimestamp(),
          moderatedBy: actorId
        });
      }
      
      await this.logModerationAction(actorId, 'hide', targetType, targetId, reason, automated);
      
      const targetDoc = await getDoc(doc(db, 
        targetType === 'post' ? COLLECTIONS.POSTS : COLLECTIONS.COMMENTS, 
        targetId
      ));
      
      if (targetDoc.exists()) {
        const authorId = targetDoc.data().authorId;
        if (authorId) {
          await this.addStrike(authorId, reason);
        }
      }
      
      console.log('✅ Content hidden successfully');
    } catch (error) {
      console.error('❌ Error hiding content:', error);
      throw error;
    }
  }

  static async approveContent(
    targetType: ReportTargetType,
    targetId: string,
    actorId: string
  ): Promise<void> {
    try {
      console.log('✅ Approving content:', { targetType, targetId });
      
      if (targetType === 'post') {
        const postRef = doc(db, COLLECTIONS.POSTS, targetId);
        await updateDoc(postRef, {
          visibility: 'public',
          moderatedAt: serverTimestamp(),
          moderatedBy: actorId
        });
      }
      
      await this.logModerationAction(actorId, 'approve', targetType, targetId, 'Content approved');
      
      const reportsQuery = query(
        collection(db, COLLECTIONS.REPORTS),
        where('targetType', '==', targetType),
        where('targetId', '==', targetId),
        where('status', '==', 'pending')
      );
      
      const reports = await getDocs(reportsQuery);
      const batch = reports.docs.map(reportDoc => 
        updateDoc(doc(db, COLLECTIONS.REPORTS, reportDoc.id), {
          status: 'dismissed',
          reviewedAt: serverTimestamp(),
          reviewedBy: actorId
        })
      );
      
      await Promise.all(batch);
      
      console.log('✅ Content approved successfully');
    } catch (error) {
      console.error('❌ Error approving content:', error);
      throw error;
    }
  }

  static async deleteContent(
    targetType: ReportTargetType,
    targetId: string,
    actorId: string,
    reason: string
  ): Promise<void> {
    try {
      console.log('🗑️ Deleting content:', { targetType, targetId, reason });
      
      await this.logModerationAction(actorId, 'delete', targetType, targetId, reason);
      
      const targetDoc = await getDoc(doc(db, 
        targetType === 'post' ? COLLECTIONS.POSTS : COLLECTIONS.COMMENTS, 
        targetId
      ));
      
      if (targetDoc.exists()) {
        const authorId = targetDoc.data().authorId;
        if (authorId) {
          await this.addStrike(authorId, reason);
        }
      }
      
      console.log('✅ Content deletion logged');
    } catch (error) {
      console.error('❌ Error deleting content:', error);
      throw error;
    }
  }

  static async banUser(
    userId: string,
    actorId: string,
    reason: string,
    durationDays?: number
  ): Promise<void> {
    try {
      console.log('🚫 Banning user:', { userId, reason, durationDays });
      
      const bannedUntil = durationDays 
        ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
        : undefined;
      
      const userFlagsRef = doc(db, COLLECTIONS.USER_FLAGS, userId);
      const userFlagsSnap = await getDoc(userFlagsRef);
      
      if (userFlagsSnap.exists()) {
        await updateDoc(userFlagsRef, {
          isBanned: true,
          bannedUntil: bannedUntil ? Timestamp.fromDate(bannedUntil) : null,
          bannedReason: reason,
          updatedAt: serverTimestamp()
        });
      } else {
        await setDoc(userFlagsRef, {
          userId,
          strikes: 0,
          isBanned: true,
          bannedUntil: bannedUntil ? Timestamp.fromDate(bannedUntil) : null,
          bannedReason: reason,
          lastActions: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      await this.logModerationAction(actorId, 'ban', 'user', userId, reason);
      
      await this.createNotification(userId, 'moderation', 'Compte suspendu', reason);
      
      console.log('✅ User banned successfully');
    } catch (error) {
      console.error('❌ Error banning user:', error);
      throw error;
    }
  }

  static async unbanUser(userId: string, actorId: string): Promise<void> {
    try {
      console.log('✅ Unbanning user:', userId);
      
      const userFlagsRef = doc(db, COLLECTIONS.USER_FLAGS, userId);
      await updateDoc(userFlagsRef, {
        isBanned: false,
        bannedUntil: null,
        bannedReason: null,
        updatedAt: serverTimestamp()
      });
      
      await this.logModerationAction(actorId, 'unban', 'user', userId, 'User unbanned');
      
      await this.createNotification(userId, 'moderation', 'Compte rétabli', 'Votre compte a été rétabli.');
      
      console.log('✅ User unbanned successfully');
    } catch (error) {
      console.error('❌ Error unbanning user:', error);
      throw error;
    }
  }

  static async addStrike(userId: string, reason: string): Promise<void> {
    try {
      console.log('⚠️ Adding strike to user:', userId);
      
      const userFlagsRef = doc(db, COLLECTIONS.USER_FLAGS, userId);
      const userFlagsSnap = await getDoc(userFlagsRef);
      
      if (userFlagsSnap.exists()) {
        const currentStrikes = userFlagsSnap.data().strikes || 0;
        const newStrikes = currentStrikes + 1;
        
        await updateDoc(userFlagsRef, {
          strikes: increment(1),
          updatedAt: serverTimestamp()
        });
        
        if (newStrikes >= 3) {
          console.log('🚫 User reached 3 strikes, auto-banning');
          await this.banUser(userId, 'system', 'Auto-ban: 3 strikes', 7);
        }
      } else {
        await setDoc(userFlagsRef, {
          userId,
          strikes: 1,
          isBanned: false,
          lastActions: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      console.log('✅ Strike added successfully');
    } catch (error) {
      console.error('❌ Error adding strike:', error);
      throw error;
    }
  }

  static async isUserBanned(userId: string): Promise<boolean> {
    try {
      const userFlagsRef = doc(db, COLLECTIONS.USER_FLAGS, userId);
      const userFlagsSnap = await getDoc(userFlagsRef);
      
      if (!userFlagsSnap.exists()) {
        return false;
      }
      
      const data = userFlagsSnap.data();
      
      if (!data.isBanned) {
        return false;
      }
      
      if (data.bannedUntil) {
        const bannedUntil = data.bannedUntil.toDate();
        if (bannedUntil < new Date()) {
          await this.unbanUser(userId, 'system');
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error checking if user is banned:', error);
      return false;
    }
  }

  static async getUserFlags(userId: string): Promise<UserFlags | null> {
    try {
      const userFlagsRef = doc(db, COLLECTIONS.USER_FLAGS, userId);
      const userFlagsSnap = await getDoc(userFlagsRef);
      
      if (!userFlagsSnap.exists()) {
        return null;
      }
      
      const data = userFlagsSnap.data();
      return {
        userId,
        strikes: data.strikes || 0,
        isBanned: data.isBanned || false,
        bannedUntil: data.bannedUntil?.toDate(),
        bannedReason: data.bannedReason,
        lastActions: data.lastActions || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
    } catch (error) {
      console.error('❌ Error getting user flags:', error);
      return null;
    }
  }

  static async logModerationAction(
    actorId: string,
    action: ModerationActionType,
    targetType: ReportTargetType,
    targetId: string,
    reason: string,
    automated: boolean = false
  ): Promise<void> {
    try {
      const moderationAction: Omit<ModerationAction, 'id'> = {
        actorId,
        action,
        targetType,
        targetId,
        reason,
        automated,
        createdAt: new Date()
      };
      
      await addDoc(collection(db, COLLECTIONS.MODERATION_ACTIONS), {
        ...moderationAction,
        createdAt: serverTimestamp()
      });
      
      console.log('📝 Moderation action logged:', action);
    } catch (error) {
      console.error('❌ Error logging moderation action:', error);
    }
  }

  static async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string
  ): Promise<void> {
    try {
      await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
        userId,
        type,
        title,
        message,
        read: false,
        createdAt: serverTimestamp()
      });
      
      console.log('🔔 Notification created for user:', userId);
    } catch (error) {
      console.error('❌ Error creating notification:', error);
    }
  }

  static async getPendingReports(limitCount: number = 50): Promise<Report[]> {
    try {
      const reportsQuery = query(
        collection(db, COLLECTIONS.REPORTS),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const reportsSnap = await getDocs(reportsQuery);
      return reportsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        reviewedAt: doc.data().reviewedAt?.toDate()
      })) as Report[];
    } catch (error) {
      console.error('❌ Error getting pending reports:', error);
      return [];
    }
  }

  static async getModerationActions(
    targetType?: ReportTargetType,
    targetId?: string,
    limitCount: number = 50
  ): Promise<ModerationAction[]> {
    try {
      let q = query(
        collection(db, COLLECTIONS.MODERATION_ACTIONS),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      if (targetType && targetId) {
        q = query(
          collection(db, COLLECTIONS.MODERATION_ACTIONS),
          where('targetType', '==', targetType),
          where('targetId', '==', targetId),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      }
      
      const actionsSnap = await getDocs(q);
      return actionsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as ModerationAction[];
    } catch (error) {
      console.error('❌ Error getting moderation actions:', error);
      return [];
    }
  }

  static async checkRateLimit(userId: string, action: 'post' | 'report', limitPerHour: number = 10): Promise<boolean> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const collectionName = action === 'post' ? COLLECTIONS.POSTS : COLLECTIONS.REPORTS;
      const fieldName = action === 'post' ? 'authorId' : 'reporterId';
      
      const actionsQuery = query(
        collection(db, collectionName),
        where(fieldName, '==', userId),
        where('createdAt', '>', Timestamp.fromDate(oneHourAgo))
      );
      
      const actionsSnap = await getDocs(actionsQuery);
      const count = actionsSnap.size;
      
      console.log(`🔍 Rate limit check for ${action}: ${count}/${limitPerHour}`);
      
      return count < limitPerHour;
    } catch (error) {
      console.error('❌ Error checking rate limit:', error);
      return true;
    }
  }
}

export default ModerationService;
