import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Pet } from '@/types';
import { Alert } from 'react-native';

// Combined store for user-related data (Auth and Pets)
export const [UserContext, useUser] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  // Load user from storage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to load user from storage', error);
      } finally {
        setLoading(false);
        setInitializing(false);
      }
    };

    loadUser();
  }, []);

  // Save user to storage when it changes
  useEffect(() => {
    const saveUser = async () => {
      try {
        if (user) {
          await AsyncStorage.setItem('user', JSON.stringify(user));
        } else {
          await AsyncStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Failed to save user to storage', error);
      }
    };

    if (!initializing) {
      saveUser();
    }
  }, [user, initializing]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: false, error: 'Email/password auth is handled by Firebase. Please use Firebase auth.' };
    } catch (error) {
      return { success: false, error: 'An error occurred during sign in' };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (userData: Partial<User>) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const pseudoVal = (userData.pseudo || `${userData.firstName || ''}${userData.lastName || ''}`.replace(/\s+/g, '')).trim();
      const emailVal = (userData.email || '').trim();
      const newUser: User = {
        id: `user-${Date.now()}`,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
        pseudo: pseudoVal,
        pseudoLower: pseudoVal.toLowerCase(),
        email: emailVal,
        emailLower: emailVal.toLowerCase(),
        phoneNumber: userData.phoneNumber || '',
        countryCode: userData.countryCode || 'FR',
        address: userData.address || '',
        zipCode: userData.zipCode || '',
        city: userData.city || '',
        isCatSitter: userData.isCatSitter || false,
        referralCode: userData.referralCode,
        isPremium: false,
        createdAt: Date.now(),
        pets: [],
        animalType: userData.animalType,
        animalName: userData.animalName,
        isProfessional: userData.isProfessional || false,
        professionalData: userData.professionalData,
        photo: userData.photo,
        isActive: true,
        profileComplete: true,
      };
      setUser(newUser);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'An error occurred during sign up' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setUser(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'An error occurred during sign out' };
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user) return { success: false, error: 'No user is signed in' };
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'An error occurred while updating user data' };
    } finally {
      setLoading(false);
    }
  };

  const addPet = async (petData: Omit<Pet, 'id' | 'ownerId'>) => {
    if (!user) return { success: false, error: 'No user is signed in' };
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newPet: Pet = {
        ...petData,
        id: `pet-${Date.now()}`,
        ownerId: user.id,
      };
      const updatedUser: User = {
        ...user,
        pets: [...user.pets, newPet],
      };
      setUser(updatedUser);
      return { success: true, pet: newPet };
    } catch (error) {
      return { success: false, error: 'An error occurred while adding a pet' };
    } finally {
      setLoading(false);
    }
  };

  const updatePet = async (petId: string, petData: Partial<Pet>) => {
    if (!user) return { success: false, error: 'No user is signed in' };
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const petIndex = user.pets.findIndex(p => p.id === petId);
      if (petIndex === -1) {
        return { success: false, error: 'Pet not found' };
      }
      const updatedPets = [...user.pets];
      updatedPets[petIndex] = { ...updatedPets[petIndex], ...petData };
      const updatedUser = {
        ...user,
        pets: updatedPets,
      };
      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'An error occurred while updating the pet' };
    } finally {
      setLoading(false);
    }
  };

  const socialSignIn = async (provider: 'google' | 'apple') => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      Alert.alert(
        'Info',
        `${provider.charAt(0).toUpperCase() + provider.slice(1)} sign-in is handled by Firebase in this app.`,
        [{ text: 'OK' }]
      );
      return { success: false, error: 'Use Firebase auth flows' };
    } catch (error) {
      return { success: false, error: `An error occurred during ${provider} sign in` };
    } finally {
      setLoading(false);
    }
  };

  const verifySMS = async (code: string) => {
    if (code === '123456') {
      return { success: true };
    } else {
      return { success: false, error: 'Invalid verification code' };
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateUser,
    addPet,
    updatePet,
    socialSignIn,
    verifySMS,
  };
});

// Export useAuth as an alias for backward compatibility
export const useAuth = useUser;