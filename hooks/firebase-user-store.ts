import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth';
import { auth } from '@/services/firebase';
import { databaseService } from '@/services/database';
import { User, Pet } from '@/types';

interface AuthState {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  initializing: boolean;
}

let setImpersonateRef: ((id: string | null) => void) | null = null;

// DEV ONLY: Impersonation functions for testing
export function impersonateUser(userId: string) {
  if (!__DEV__) {
    console.warn('impersonateUser is only available in development mode');
    return;
  }
  setImpersonateRef?.(userId);
}

export function stopImpersonation() {
  if (!__DEV__) {
    console.warn('stopImpersonation is only available in development mode');
    return;
  }
  setImpersonateRef?.(null);
}

export const [FirebaseUserContext, useFirebaseUser] = createContextHook(() => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    firebaseUser: null,
    loading: false,
    initializing: true,
  });
  const [impersonatedId, setImpersonatedId] = useState<string | null>(null);

  setImpersonateRef = setImpersonatedId;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔥 Auth state changed:', firebaseUser?.uid);
      if (impersonatedId) {
        return;
      }
      if (firebaseUser) {
        try {
          const userData = await databaseService.user.getUser(firebaseUser.uid);
          if (userData) {
            setAuthState({
              user: userData,
              firebaseUser,
              loading: false,
              initializing: false,
            });
          } else {
            const newUser: User = {
              id: firebaseUser.uid,
              firstName: firebaseUser.displayName?.split(' ')[0] || '',
              lastName: firebaseUser.displayName?.split(' ')[1] || '',
              name: firebaseUser.displayName || '',
              pseudo: firebaseUser.displayName?.replace(/\s+/g, '') || '',
              email: firebaseUser.email || '',
              phoneNumber: firebaseUser.phoneNumber || '',
              countryCode: 'FR',
              address: '',
              zipCode: '',
              city: '',
              isCatSitter: false,
              isPremium: false,
              createdAt: Date.now(),
              pets: [],
              photo: firebaseUser.photoURL || undefined,
              isProfessional: false,
              isActive: true,
              profileComplete: false,
            };
            await databaseService.user.saveUser(newUser);
            setAuthState({
              user: newUser,
              firebaseUser,
              loading: false,
              initializing: false,
            });
          }
        } catch (error) {
          console.error('❌ Error loading user data:', error);
          setAuthState({
            user: null,
            firebaseUser,
            loading: false,
            initializing: false,
          });
        }
      } else {
        setAuthState({
          user: null,
          firebaseUser: null,
          loading: false,
          initializing: false,
        });
      }
    });

    return unsubscribe;
  }, [impersonatedId]);

  useEffect(() => {
    const load = async () => {
      try {
        if (impersonatedId) {
          const u = await databaseService.user.getUser(impersonatedId);
          if (u) {
            setAuthState((prev) => ({ ...prev, user: u }));
          }
        } else {
          const uid = auth.currentUser?.uid;
          if (uid) {
            const u = await databaseService.user.getUser(uid);
            setAuthState((prev) => ({ ...prev, user: u }));
          } else {
            setAuthState((prev) => ({ ...prev, user: null }));
          }
        }
      } catch (e) {
        console.log('Impersonation load error', e);
      }
    };
    load();
  }, [impersonatedId]);

  const signIn = async (email: string, password: string) => {
    setAuthState((prev) => ({ ...prev, loading: true }));

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ User signed in successfully');

      return { success: true, user: userCredential.user } as const;
    } catch (error: any) {
      console.error('❌ Sign in error:', error);

      const code: string = error?.code ?? '';
      let errorMessage = 'An error occurred during sign in';
      if (code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later';
      } else if (code === 'auth/invalid-credential' || code === 'auth/invalid-login-credentials') {
        errorMessage = 'Invalid credentials. Please check your email and password';
      } else if (code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Check your connection and try again';
      }

      return { success: false, error: errorMessage } as const;
    } finally {
      setAuthState((prev) => ({ ...prev, loading: false }));
    }
  };

  const signUp = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    countryCode?: string;
    address?: string;
    zipCode?: string;
    city?: string;
    isCatSitter?: boolean;
    isProfessional?: boolean;
    professionalData?: any;
  }) => {
    setAuthState((prev) => ({ ...prev, loading: true }));

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password,
      );

      await updateProfile(userCredential.user, {
        displayName: `${userData.firstName} ${userData.lastName}`,
      });

      await sendEmailVerification(userCredential.user);

      const newUser: User = {
        id: userCredential.user.uid,
        firstName: userData.firstName,
        lastName: userData.lastName,
        name: `${userData.firstName} ${userData.lastName}`,
        pseudo: `${userData.firstName}${userData.lastName}`.replace(/\s+/g, ''),
        email: userData.email,
        phoneNumber: userData.phoneNumber || '',
        countryCode: userData.countryCode || 'FR',
        address: userData.address || '',
        zipCode: userData.zipCode || '',
        city: userData.city || '',
        isCatSitter: userData.isCatSitter || false,
        isPremium: false,
        createdAt: Date.now(),
        pets: [],
        isProfessional: userData.isProfessional || false,
        professionalData: userData.professionalData,
        isActive: true,
        profileComplete: false,
      };

      await databaseService.user.saveUser(newUser);

      if (userData.isProfessional && userData.professionalData) {
        await databaseService.professional.saveProfessional(
          userCredential.user.uid,
          userData.professionalData
        );
      }

      console.log('✅ User signed up successfully');
      return { success: true, user: userCredential.user } as const;
    } catch (error: any) {
      console.error('❌ Sign up error:', error);

      let errorMessage = 'An error occurred during sign up';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters';
      }

      return { success: false, error: errorMessage } as const;
    } finally {
      setAuthState((prev) => ({ ...prev, loading: false }));
    }
  };

  const signOut = async () => {
    setAuthState((prev) => ({ ...prev, loading: true }));

    try {
      await firebaseSignOut(auth);
      console.log('✅ User signed out successfully');
      return { success: true } as const;
    } catch (error) {
      console.error('❌ Sign out error:', error);
      return { success: false, error: 'An error occurred during sign out' } as const;
    } finally {
      setAuthState((prev) => ({ ...prev, loading: false }));
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!authState.user || !authState.firebaseUser) {
      return { success: false, error: 'No user is signed in' } as const;
    }

    setAuthState((prev) => ({ ...prev, loading: true }));

    try {
      const updatedUser = { ...authState.user, ...userData } as User;

      if (userData.firstName || userData.lastName || userData.photo) {
        const profileUpdates: { displayName?: string; photoURL?: string } = {};
        
        if (userData.firstName || userData.lastName) {
          profileUpdates.displayName = `${updatedUser.firstName} ${updatedUser.lastName}`;
        }
        
        if (userData.photo) {
          profileUpdates.photoURL = userData.photo;
        }

        await updateProfile(authState.firebaseUser, profileUpdates);
      }

      await databaseService.user.saveUser(updatedUser);

      setAuthState((prev) => ({
        ...prev,
        user: updatedUser,
        loading: false,
      }));

      console.log('✅ User updated successfully');
      return { success: true } as const;
    } catch (error) {
      console.error('❌ Update user error:', error);
      setAuthState((prev) => ({ ...prev, loading: false }));
      return { success: false, error: 'An error occurred while updating user data' } as const;
    }
  };

  const updatePrivacySettings = async (settings: Partial<User['privacySettings']>) => {
    if (!authState.user) {
      return { success: false, error: 'No user is signed in' } as const;
    }

    try {
      const defaultSettings = {
        showLocation: true,
        showPhone: false,
        showEmail: false,
        allowMessages: true,
        showOnlineStatus: true,
        shareActivity: true,
        allowPhotoTagging: true,
        publicProfile: true,
        hideLocationOnMap: false,
      };
      const updatedSettings = { ...defaultSettings, ...authState.user.privacySettings, ...settings };
      return await updateUser({ privacySettings: updatedSettings });
    } catch (error) {
      console.error('❌ Update privacy settings error:', error);
      return { success: false, error: 'An error occurred while updating privacy settings' } as const;
    }
  };

  const updateNotificationSettings = async (settings: Partial<User['notificationSettings']>) => {
    if (!authState.user) {
      return { success: false, error: 'No user is signed in' } as const;
    }

    try {
      const defaultSettings = {
        pushNotifications: true,
        emailNotifications: false,
        smsNotifications: false,
        reminders: true,
        socialActivity: true,
        emergencyAlerts: true,
        messageNotifications: true,
        challengeUpdates: true,
        shopOffers: false,
        lostFoundAlerts: true,
      };
      const updatedSettings = { ...defaultSettings, ...authState.user.notificationSettings, ...settings };
      return await updateUser({ notificationSettings: updatedSettings });
    } catch (error) {
      console.error('❌ Update notification settings error:', error);
      return { success: false, error: 'An error occurred while updating notification settings' } as const;
    }
  };

  const updateLanguage = async (language: 'en' | 'fr' | 'es' | 'de' | 'it') => {
    if (!authState.user) {
      return { success: false, error: 'No user is signed in' } as const;
    }

    try {
      return await updateUser({ language });
    } catch (error) {
      console.error('❌ Update language error:', error);
      return { success: false, error: 'An error occurred while updating language' } as const;
    }
  };

  const updateTheme = async (theme: 'light' | 'dark' | 'system') => {
    if (!authState.user) {
      return { success: false, error: 'No user is signed in' } as const;
    }

    try {
      return await updateUser({ theme });
    } catch (error) {
      console.error('❌ Update theme error:', error);
      return { success: false, error: 'An error occurred while updating theme' } as const;
    }
  };

  const addPet = async (petData: Omit<Pet, 'id' | 'ownerId'>) => {
    if (!authState.user) {
      return { success: false, error: 'No user is signed in' } as const;
    }

    setAuthState((prev) => ({ ...prev, loading: true }));

    try {
      const newPet: Pet = {
        ...petData,
        id: `pet-${Date.now()}`,
        ownerId: authState.user.id,
      } as Pet;

      await databaseService.pet.savePet(newPet);

      const updatedUser = { ...authState.user, pets: [...authState.user.pets, newPet] } as User;
      await databaseService.user.saveUser(updatedUser);

      setAuthState((prev) => ({
        ...prev,
        user: updatedUser,
        loading: false,
      }));

      console.log('✅ Pet added successfully');
      return { success: true, pet: newPet } as const;
    } catch (error) {
      console.error('❌ Add pet error:', error);
      setAuthState((prev) => ({ ...prev, loading: false }));
      return { success: false, error: 'An error occurred while adding the pet' } as const;
    }
  };

  const updatePet = async (petId: string, petData: Partial<Pet>) => {
    if (!authState.user) {
      return { success: false, error: 'No user is signed in' } as const;
    }

    setAuthState((prev) => ({ ...prev, loading: true }));

    try {
      const petIndex = authState.user.pets.findIndex((p) => p.id === petId);
      if (petIndex === -1) {
        return { success: false, error: 'Pet not found' } as const;
      }

      const updatedPet = { ...authState.user.pets[petIndex], ...petData } as Pet;
      await databaseService.pet.savePet(updatedPet);

      const updatedPets = [...authState.user.pets];
      updatedPets[petIndex] = updatedPet;

      const updatedUser = { ...authState.user, pets: updatedPets } as User;
      await databaseService.user.saveUser(updatedUser);

      setAuthState((prev) => ({
        ...prev,
        user: updatedUser,
        loading: false,
      }));

      console.log('✅ Pet updated successfully');
      return { success: true } as const;
    } catch (error) {
      console.error('❌ Update pet error:', error);
      setAuthState((prev) => ({ ...prev, loading: false }));
      return { success: false, error: 'An error occurred while updating the pet' } as const;
    }
  };

  return {
    user: authState.user,
    firebaseUser: authState.firebaseUser,
    loading: authState.loading,
    initializing: authState.initializing,
    isAuthenticated: !!authState.user,
    signIn,
    signUp,
    signOut,
    updateUser,
    addPet,
    updatePet,
    updatePrivacySettings,
    updateNotificationSettings,
    updateLanguage,
    updateTheme,
  };
});
