import createContextHook from '@nkzw/create-context-hook';
import { useQuery } from '@tanstack/react-query';
import databaseService from '@/services/database';
import { Badge, Challenge } from '@/types';
import { useAuth } from './user-store';

export const [BadgesContext, useBadges] = createContextHook(() => {
  const { user } = useAuth();
  
  // Load badges
  const badgesQuery = useQuery({
    queryKey: ['badges', user?.id],
    queryFn: async () => {
      const all = await databaseService.badge.getAllBadges();
      return all;
    },
    enabled: !!user,
  });
  
  // Load challenges
  const challengesQuery = useQuery({
    queryKey: ['challenges', user?.id],
    queryFn: async () => {
      const list = await databaseService.challenge.getActiveChallenges();
      return list;
    },
    enabled: !!user,
  });
  
  // Get unlocked badges
  const getUnlockedBadges = (): Badge[] => {
    return badgesQuery.data?.filter(badge => badge.unlocked) || [];
  };
  
  // Get locked badges
  const getLockedBadges = (): Badge[] => {
    return badgesQuery.data?.filter(badge => !badge.unlocked) || [];
  };
  
  // Get active challenges
  const getActiveChallenges = (): Challenge[] => {
    return challengesQuery.data?.filter(challenge => !challenge.completed) || [];
  };
  
  // Get completed challenges
  const getCompletedChallenges = (): Challenge[] => {
    return challengesQuery.data?.filter(challenge => challenge.completed) || [];
  };
  
  // Get all badges
  const getAllBadges = (): Badge[] => {
    return badgesQuery.data || [];
  };
  
  // Get badges by category
  const getBadgesByCategory = (category: string): Badge[] => {
    return badgesQuery.data?.filter(badge => badge.category === category) || [];
  };
  
  // Get user progress for badges
  const getUserProgress = (): Record<string, { current: number; target: number }> => {
    // Mock progress data - in a real app this would come from the API
    const progress: Record<string, { current: number; target: number }> = {};
    
    badgesQuery.data?.forEach(badge => {
      if (!badge.unlocked) {
        progress[badge.id] = {
          current: Math.floor(Math.random() * badge.requirement),
          target: badge.requirement
        };
      }
    });
    
    return progress;
  };
  
  return {
    badges: badgesQuery.data || [],
    challenges: challengesQuery.data || [],
    getAllBadges,
    getUnlockedBadges,
    getLockedBadges,
    getBadgesByCategory,
    getUserProgress,
    getActiveChallenges,
    getCompletedChallenges,
    isLoading: badgesQuery.isLoading || challengesQuery.isLoading,
  };
});