import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

export async function isPseudoTaken(pseudo: string): Promise<boolean> {
  try {
    const trimmed = pseudo.trim();
    if (!trimmed) return false;
    const usersRef = collection(db, 'users');
    const lower = trimmed.toLowerCase();

    // Prefer a pseudoLower field if it exists in your documents
    const qLower = query(usersRef, where('pseudoLower', '==', lower));
    const qsLower = await getDocs(qLower);
    if (!qsLower.empty) return true;

    // Fallback to exact case match on pseudo
    const qExact = query(usersRef, where('pseudo', '==', trimmed));
    const qsExact = await getDocs(qExact);
    return !qsExact.empty;
  } catch (error) {
    console.log('Error while checking pseudo availability:', error);
    return false;
  }
}

export async function isEmailTaken(email: string): Promise<boolean> {
  try {
    const value = email.trim();
    if (!value) return false;
    const usersRef = collection(db, 'users');

    const q1 = query(usersRef, where('email', '==', value.toLowerCase()));
    const qs1 = await getDocs(q1);
    if (!qs1.empty) return true;

    const q2 = query(usersRef, where('email', '==', value));
    const qs2 = await getDocs(q2);
    return !qs2.empty;
  } catch (error) {
    console.log('Error while checking email availability:', error);
    return false;
  }
}

export async function doesVeterinarianProfileExist(userId: string): Promise<boolean> {
  try {
    const trimmed = userId.trim();
    if (!trimmed) return false;

    const vetDocRef = doc(db, 'veterinarians', trimmed);
    const vetDocSnap = await getDoc(vetDocRef);
    if (vetDocSnap.exists()) {
      return true;
    }

    const vetsRef = collection(db, 'veterinarians');
    const q = query(vetsRef, where('userId', '==', trimmed));
    const qs = await getDocs(q);
    return !qs.empty;
  } catch (error) {
    console.log('Error while checking veterinarian profile existence:', error);
    return false;
  }
}
