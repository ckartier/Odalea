import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { useAuth } from './user-store';
import { safeJsonParse } from '@/lib/safe-json';

export interface PremiumFeatures {
  unlimitedMessages: boolean;
  multipleAnimals: boolean;
  incognitoMode: boolean;
  advancedFilters: boolean;
  noAds: boolean;
  vipBadge: boolean;
  unlimitedGallery: boolean;
  prioritySupport: boolean;
  vetAssistantUnlimited: boolean;
  vetAssistantHistory: boolean;
  vetAssistantPriority: boolean;
  vetAssistantReminders: boolean;
}

export interface AdConfig {
  showBannerAds: boolean;
  showInterstitialAds: boolean;
  bannerAdUnitId: string;
  interstitialAdUnitId: string;
  adFrequency: number; // Show interstitial every X actions
}

export const [PremiumContext, usePremium] = createContextHook(() => {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [premiumFeatures, setPremiumFeatures] = useState<PremiumFeatures>({
    unlimitedMessages: false,
    multipleAnimals: false,
    incognitoMode: false,
    advancedFilters: false,
    noAds: false,
    vipBadge: false,
    unlimitedGallery: false,
    prioritySupport: false,
    vetAssistantUnlimited: false,
    vetAssistantHistory: false,
    vetAssistantPriority: false,
    vetAssistantReminders: false,
  });
  
  const [adConfig, setAdConfig] = useState<AdConfig>({
    showBannerAds: true,
    showInterstitialAds: true,
    bannerAdUnitId: Platform.select({
      ios: 'ca-app-pub-3940256099942544/2934735716', // Test ad unit
      android: 'ca-app-pub-3940256099942544/6300978111', // Test ad unit
      default: '',
    }),
    interstitialAdUnitId: Platform.select({
      ios: 'ca-app-pub-3940256099942544/4411468910', // Test ad unit
      android: 'ca-app-pub-3940256099942544/1033173712', // Test ad unit
      default: '',
    }),
    adFrequency: 3, // Show interstitial every 3 actions
  });

  const [actionCount, setActionCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [animalCount, setAnimalCount] = useState(0);
  const [vetAssistantDailyCount, setVetAssistantDailyCount] = useState(0);
  const [vetAssistantLastResetDate, setVetAssistantLastResetDate] = useState<string>('');

  // Update premium status based on user
  useEffect(() => {
    if (user) {
      const userIsPremium = user.isPremium || false;
      setIsPremium(userIsPremium);
      
      if (userIsPremium) {
        setPremiumFeatures({
          unlimitedMessages: true,
          multipleAnimals: true,
          incognitoMode: true,
          advancedFilters: true,
          noAds: true,
          vipBadge: true,
          unlimitedGallery: true,
          prioritySupport: true,
          vetAssistantUnlimited: true,
          vetAssistantHistory: true,
          vetAssistantPriority: true,
          vetAssistantReminders: true,
        });
        
        setAdConfig(prev => ({
          ...prev,
          showBannerAds: false,
          showInterstitialAds: false,
        }));
      } else {
        setPremiumFeatures({
          unlimitedMessages: false,
          multipleAnimals: false,
          incognitoMode: false,
          advancedFilters: false,
          noAds: false,
          vipBadge: false,
          unlimitedGallery: false,
          prioritySupport: false,
          vetAssistantUnlimited: false,
          vetAssistantHistory: false,
          vetAssistantPriority: false,
          vetAssistantReminders: false,
        });
        
        setAdConfig(prev => ({
          ...prev,
          showBannerAds: true,
          showInterstitialAds: true,
        }));
      }
    }
  }, [user]);

  // Load usage counts from storage
  useEffect(() => {
    const loadUsageCounts = async () => {
      try {
        const counts = await AsyncStorage.getItem('usage_counts');
        const parsed = safeJsonParse(counts, { 
          messageCount: 0, 
          animalCount: 0, 
          actionCount: 0,
          vetAssistantDailyCount: 0,
          vetAssistantLastResetDate: '',
        });
        setMessageCount(parsed.messageCount || 0);
        setAnimalCount(parsed.animalCount || 0);
        setActionCount(parsed.actionCount || 0);
        
        const today = new Date().toDateString();
        if (parsed.vetAssistantLastResetDate !== today) {
          setVetAssistantDailyCount(0);
          setVetAssistantLastResetDate(today);
        } else {
          setVetAssistantDailyCount(parsed.vetAssistantDailyCount || 0);
          setVetAssistantLastResetDate(parsed.vetAssistantLastResetDate || today);
        }
      } catch (error) {
        console.error('Error loading usage counts:', error);
      }
    };

    loadUsageCounts();
  }, []);

  // Save usage counts to storage
  const saveUsageCounts = async () => {
    try {
      await AsyncStorage.setItem('usage_counts', JSON.stringify({
        messageCount,
        animalCount,
        actionCount,
        vetAssistantDailyCount,
        vetAssistantLastResetDate,
      }));
    } catch (error) {
      console.error('Error saving usage counts:', error);
    }
  };

  useEffect(() => {
    saveUsageCounts();
  }, [messageCount, animalCount, actionCount, vetAssistantDailyCount, vetAssistantLastResetDate]);

  const checkMessageLimit = (): boolean => {
    if (isPremium) return true;
    
    const monthlyLimit = 3;
    if (messageCount >= monthlyLimit) {
      showPremiumPrompt('messages');
      return false;
    }
    return true;
  };

  const checkAnimalLimit = (): boolean => {
    if (isPremium) return true;
    
    const animalLimit = 1;
    if (animalCount >= animalLimit) {
      showPremiumPrompt('animals');
      return false;
    }
    return true;
  };

  const checkGalleryLimit = (currentPhotos: number): boolean => {
    if (isPremium) return true;
    
    const galleryLimit = 3;
    if (currentPhotos >= galleryLimit) {
      showPremiumPrompt('gallery');
      return false;
    }
    return true;
  };

  const incrementMessageCount = () => {
    if (!isPremium) {
      setMessageCount(prev => prev + 1);
    }
  };

  const incrementAnimalCount = () => {
    if (!isPremium) {
      setAnimalCount(prev => prev + 1);
    }
  };

  const incrementActionCount = () => {
    setActionCount(prev => prev + 1);
  };

  const shouldShowInterstitialAd = (): boolean => {
    if (isPremium || !adConfig.showInterstitialAds) return false;
    return actionCount > 0 && actionCount % adConfig.adFrequency === 0;
  };

  const showPremiumPrompt = (feature: string) => {
    const featureMessages = {
      messages: 'Vous avez atteint la limite de 3 conversations par mois. Passez à Premium pour des messages illimités !',
      animals: 'Les utilisateurs gratuits ne peuvent ajouter qu\'un seul animal. Passez à Premium pour ajouter plusieurs animaux !',
      gallery: 'Les utilisateurs gratuits sont limités à 3 photos. Passez à Premium pour une galerie illimitée !',
      filters: 'Les filtres avancés sont réservés aux membres Premium. Passez à Premium maintenant !',
      incognito: 'Le mode incognito est une fonctionnalité Premium. Passez à Premium pour naviguer en privé !',
    };

    Alert.alert(
      'Fonctionnalité Premium',
      featureMessages[feature as keyof typeof featureMessages] || 'Cette fonctionnalité nécessite un abonnement Premium.',
      [
        { text: 'Plus tard', style: 'cancel' },
        { text: 'Passer à Premium', onPress: () => navigateToPremium() },
      ]
    );
  };

  const navigateToPremium = () => {
    // This would navigate to premium subscription page
    console.log('Navigate to premium subscription');
  };

  const resetMonthlyLimits = () => {
    setMessageCount(0);
    // This would typically be called monthly via a background task
  };

  const getFeatureStatus = (feature: keyof PremiumFeatures): boolean => {
    return premiumFeatures[feature];
  };

  const getRemainingMessages = (): number => {
    if (isPremium) return -1; // Unlimited
    return Math.max(0, 3 - messageCount);
  };

  const getRemainingAnimals = (): number => {
    if (isPremium) return -1; // Unlimited
    return Math.max(0, 1 - animalCount);
  };

  const VET_ASSISTANT_DAILY_LIMIT = 5;

  const checkVetAssistantLimit = (): boolean => {
    if (isPremium) return true;
    
    const today = new Date().toDateString();
    if (vetAssistantLastResetDate !== today) {
      setVetAssistantDailyCount(0);
      setVetAssistantLastResetDate(today);
      return true;
    }
    
    if (vetAssistantDailyCount >= VET_ASSISTANT_DAILY_LIMIT) {
      return false;
    }
    return true;
  };

  const incrementVetAssistantCount = () => {
    if (!isPremium) {
      const today = new Date().toDateString();
      if (vetAssistantLastResetDate !== today) {
        setVetAssistantDailyCount(1);
        setVetAssistantLastResetDate(today);
      } else {
        setVetAssistantDailyCount(prev => prev + 1);
      }
    }
  };

  const getRemainingVetAssistantQuestions = (): number => {
    if (isPremium) return -1; // Unlimited
    const today = new Date().toDateString();
    if (vetAssistantLastResetDate !== today) {
      return VET_ASSISTANT_DAILY_LIMIT;
    }
    return Math.max(0, VET_ASSISTANT_DAILY_LIMIT - vetAssistantDailyCount);
  };

  const upgradeToPremium = async (planId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would integrate with payment processing (Stripe, Apple Pay, etc.)
      // For now, we'll simulate a successful upgrade
      const success = Math.random() > 0.1; // 90% success rate for demo
      
      if (success) {
        setIsPremium(true);
        return { success: true };
      } else {
        return { success: false, error: 'Payment processing failed. Please try again.' };
      }
    } catch {
      return { success: false, error: 'An unexpected error occurred during payment processing.' };
    }
  };

  return {
    isPremium,
    premiumFeatures,
    adConfig,
    messageCount,
    animalCount,
    actionCount,
    vetAssistantDailyCount,
    checkMessageLimit,
    checkAnimalLimit,
    checkGalleryLimit,
    checkVetAssistantLimit,
    incrementMessageCount,
    incrementAnimalCount,
    incrementActionCount,
    incrementVetAssistantCount,
    shouldShowInterstitialAd,
    showPremiumPrompt,
    navigateToPremium,
    resetMonthlyLimits,
    getFeatureStatus,
    getRemainingMessages,
    getRemainingAnimals,
    getRemainingVetAssistantQuestions,
    upgradeToPremium,
    VET_ASSISTANT_DAILY_LIMIT,
  };
});