import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from './firebase';

const COLLECTIONS = {
  PROFESSIONAL_VERIFICATIONS: 'professionalVerifications',
  PROFESSIONALS: 'professionals',
  USERS: 'users',
} as const;

export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'expired';
export type VerificationType = 'siret' | 'insurance' | 'diploma' | 'identity';

export interface VerificationDocument {
  type: VerificationType;
  fileUrl: string;
  fileName: string;
  uploadedAt: Date;
}

export interface ProfessionalVerification {
  id: string;
  userId: string;
  status: VerificationStatus;
  documents: VerificationDocument[];
  siretNumber?: string;
  companyName?: string;
  activityType?: string;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
  expiresAt?: Date;
}

class ProfessionalVerificationService {
  async submitVerification(params: {
    siretNumber?: string;
    companyName: string;
    activityType: string;
    documents: { type: VerificationType; uri: string; fileName: string }[];
  }): Promise<string> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      console.log('📋 Submitting professional verification for user:', userId);

      const existingQuery = query(
        collection(db, COLLECTIONS.PROFESSIONAL_VERIFICATIONS),
        where('userId', '==', userId),
        where('status', '==', 'pending')
      );
      const existing = await getDocs(existingQuery);
      if (!existing.empty) {
        console.log('⚠️ User already has a pending verification');
        throw new Error('Une demande de vérification est déjà en cours');
      }

      const uploadedDocs: VerificationDocument[] = [];
      for (const doc of params.documents) {
        const fileUrl = await this.uploadDocument(userId, doc.type, doc.uri, doc.fileName);
        uploadedDocs.push({
          type: doc.type,
          fileUrl,
          fileName: doc.fileName,
          uploadedAt: new Date(),
        });
      }

      const verificationRef = await addDoc(collection(db, COLLECTIONS.PROFESSIONAL_VERIFICATIONS), {
        userId,
        status: 'pending',
        documents: uploadedDocs,
        siretNumber: params.siretNumber || null,
        companyName: params.companyName,
        activityType: params.activityType,
        submittedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });

      console.log('✅ Verification submitted successfully:', verificationRef.id);
      return verificationRef.id;
    } catch (error) {
      console.error('❌ Error submitting verification:', error);
      throw error;
    }
  }

  private async uploadDocument(
    userId: string,
    type: VerificationType,
    uri: string,
    fileName: string
  ): Promise<string> {
    try {
      console.log('📤 Uploading document:', type, fileName);
      
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const timestamp = Date.now();
      const path = `verifications/${userId}/${type}_${timestamp}_${fileName}`;
      const storageRef = ref(storage, path);
      
      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);
      
      console.log('✅ Document uploaded successfully');
      return downloadUrl;
    } catch (error) {
      console.error('❌ Error uploading document:', error);
      throw error;
    }
  }

  async getVerificationStatus(userId?: string): Promise<ProfessionalVerification | null> {
    try {
      const uid = userId || auth.currentUser?.uid;
      if (!uid) return null;

      const q = query(
        collection(db, COLLECTIONS.PROFESSIONAL_VERIFICATIONS),
        where('userId', '==', uid)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      const latestDoc = snapshot.docs.sort((a, b) => {
        const aTime = a.data().submittedAt?.toMillis?.() || 0;
        const bTime = b.data().submittedAt?.toMillis?.() || 0;
        return bTime - aTime;
      })[0];

      const data = latestDoc.data();
      return {
        id: latestDoc.id,
        userId: data.userId,
        status: data.status,
        documents: data.documents || [],
        siretNumber: data.siretNumber,
        companyName: data.companyName,
        activityType: data.activityType,
        submittedAt: data.submittedAt?.toDate?.() || new Date(),
        reviewedAt: data.reviewedAt?.toDate?.(),
        reviewedBy: data.reviewedBy,
        rejectionReason: data.rejectionReason,
        expiresAt: data.expiresAt?.toDate?.(),
      };
    } catch (error) {
      console.error('❌ Error getting verification status:', error);
      return null;
    }
  }

  async isVerified(userId?: string): Promise<boolean> {
    try {
      const verification = await this.getVerificationStatus(userId);
      if (!verification) return false;
      
      if (verification.status !== 'approved') return false;
      
      if (verification.expiresAt && verification.expiresAt < new Date()) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error checking verification status:', error);
      return false;
    }
  }

  async getPendingVerifications(): Promise<ProfessionalVerification[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.PROFESSIONAL_VERIFICATIONS),
        where('status', '==', 'pending')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          status: data.status,
          documents: data.documents || [],
          siretNumber: data.siretNumber,
          companyName: data.companyName,
          activityType: data.activityType,
          submittedAt: data.submittedAt?.toDate?.() || new Date(),
          reviewedAt: data.reviewedAt?.toDate?.(),
          reviewedBy: data.reviewedBy,
          rejectionReason: data.rejectionReason,
        };
      });
    } catch (error) {
      console.error('❌ Error getting pending verifications:', error);
      return [];
    }
  }

  async approveVerification(verificationId: string, reviewerId: string): Promise<void> {
    try {
      console.log('✅ Approving verification:', verificationId);
      
      const verificationRef = doc(db, COLLECTIONS.PROFESSIONAL_VERIFICATIONS, verificationId);
      const verificationSnap = await getDoc(verificationRef);
      
      if (!verificationSnap.exists()) {
        throw new Error('Verification not found');
      }
      
      const data = verificationSnap.data();
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      
      await updateDoc(verificationRef, {
        status: 'approved',
        reviewedAt: serverTimestamp(),
        reviewedBy: reviewerId,
        expiresAt,
      });

      const professionalRef = doc(db, COLLECTIONS.PROFESSIONALS, data.userId);
      await updateDoc(professionalRef, {
        isVerified: true,
        verifiedAt: serverTimestamp(),
        verificationId,
      }).catch(() => {
        console.log('⚠️ Professional doc not found, user may need to complete registration');
      });

      const userRef = doc(db, COLLECTIONS.USERS, data.userId);
      await updateDoc(userRef, {
        isProfessional: true,
        isVerifiedProfessional: true,
      }).catch(() => {
        console.log('⚠️ Could not update user doc');
      });

      console.log('✅ Verification approved successfully');
    } catch (error) {
      console.error('❌ Error approving verification:', error);
      throw error;
    }
  }

  async rejectVerification(
    verificationId: string,
    reviewerId: string,
    reason: string
  ): Promise<void> {
    try {
      console.log('❌ Rejecting verification:', verificationId);
      
      const verificationRef = doc(db, COLLECTIONS.PROFESSIONAL_VERIFICATIONS, verificationId);
      
      await updateDoc(verificationRef, {
        status: 'rejected',
        reviewedAt: serverTimestamp(),
        reviewedBy: reviewerId,
        rejectionReason: reason,
      });

      console.log('✅ Verification rejected successfully');
    } catch (error) {
      console.error('❌ Error rejecting verification:', error);
      throw error;
    }
  }

  async validateSiret(siret: string): Promise<{ valid: boolean; companyName?: string; error?: string }> {
    try {
      const cleanSiret = siret.replace(/\s/g, '');
      
      if (cleanSiret.length !== 14) {
        return { valid: false, error: 'Le SIRET doit contenir 14 chiffres' };
      }
      
      if (!/^\d+$/.test(cleanSiret)) {
        return { valid: false, error: 'Le SIRET ne doit contenir que des chiffres' };
      }

      let sum = 0;
      for (let i = 0; i < 14; i++) {
        let digit = parseInt(cleanSiret[i], 10);
        if (i % 2 === 0) {
          digit *= 2;
          if (digit > 9) digit -= 9;
        }
        sum += digit;
      }
      
      if (sum % 10 !== 0) {
        return { valid: false, error: 'Numéro SIRET invalide (checksum)' };
      }

      return { valid: true, companyName: undefined };
    } catch (error) {
      console.error('❌ Error validating SIRET:', error);
      return { valid: false, error: 'Erreur lors de la validation' };
    }
  }
}

export const professionalVerificationService = new ProfessionalVerificationService();
export default professionalVerificationService;
