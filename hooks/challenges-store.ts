import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import databaseService from '@/services/database';
import { useAuth } from '@/hooks/user-store';

export interface Challenge {
  id: string;
  title: {
    fr: string;
    en: string;
  };
  description: {
    fr: string;
    en: string;
  };
  category: 'daily' | 'weekly' | 'monthly' | 'special';
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  badge?: string;
  requirements: {
    type: 'photo' | 'checkin' | 'activity' | 'social' | 'learning';
    target: number;
    description: {
      fr: string;
      en: string;
    };
  }[];
  isPremium: boolean;
  startDate: string;
  endDate: string;
  participants: number;
  completions: number;
  icon: string;
  color: string;
  duration: number; // in days
}

export interface UserChallenge {
  id: string;
  challengeId: string;
  userId: string;
  status: 'active' | 'completed' | 'failed' | 'expired' | 'pending_validation';
  progress: {
    [requirementIndex: number]: {
      current: number;
      target: number;
      completed: boolean;
      evidence?: {
        type: 'photo' | 'text' | 'location';
        data: string;
        timestamp: string;
      }[];
    };
  };
  startedAt: string;
  completedAt?: string;
  pointsEarned: number;
  badgeEarned?: string;
  proofSubmitted?: {
    type: 'photo' | 'video' | 'text';
    data: string;
    timestamp: string;
  };
  validationStatus?: 'pending' | 'approved' | 'rejected';
  votes?: ChallengeVote[];
}

export interface ChallengeVote {
  id: string;
  participationId: string;
  voterId: string;
  vote: 'yes' | 'no';
  timestamp: string;
}

export interface ChallengeParticipation {
  id: string;
  challengeId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  proof: {
    type: 'photo' | 'video' | 'text';
    data: string;
    timestamp: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  votes: ChallengeVote[];
  yesVotes: number;
  noVotes: number;
  totalVotes: number;
  badgeEarned?: string;
  submittedAt: string;
  validatedAt?: string;
}

export interface ChallengeLeaderboard {
  userId: string;
  userName: string;
  userPhoto?: string;
  totalPoints: number;
  completedChallenges: number;
  badges: string[];
  rank: number;
}

export interface CommunityFeedItem {
  id: string;
  type: 'challenge_completed' | 'badge_earned' | 'challenge_participation';
  userId: string;
  userName: string;
  userPhoto?: string;
  challengeId: string;
  challengeTitle: string;
  challengeIcon: string;
  proof?: {
    type: 'photo' | 'video' | 'text';
    data: string;
  };
  badgeEarned?: string;
  timestamp: string;
  likes: number;
  comments: CommunityComment[];
  isLiked: boolean;
  votes?: {
    yes: number;
    no: number;
    userVote?: 'yes' | 'no';
  };
}

export interface CommunityComment {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  content: string;
  timestamp: string;
  isPremium: boolean;
}

export const [ChallengesContext, useChallenges] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<Challenge['category'] | 'all'>('all');

  // Query for available challenges (Firestore)
  const challengesQuery = useQuery({
    queryKey: ['challenges', activeCategory],
    queryFn: async () => {
      const list = await databaseService.challenge.getActiveChallenges();
      let items = (list as unknown as Challenge[]);
      
      if (!items || items.length === 0) {
        console.log('No challenges found in Firestore, using defaults');
        items = getDefaultChallenges();
      }
      
      return activeCategory === 'all' ? items : items.filter(c => c.category === activeCategory);
    },
  });

  // Query for user's challenges
  const userChallengesQuery = useQuery({
    queryKey: ['userChallenges', user?.id],
    queryFn: async () => {
      if (!user?.id) return [] as UserChallenge[];
      const list = await databaseService.challenge.getUserChallenges(user.id);
      return list as unknown as UserChallenge[];
    },
    enabled: !!user?.id,
  });

  // Query for challenge participations
  const participationsQuery = useQuery({
    queryKey: ['challengeParticipations'],
    queryFn: async () => {
      const list = await databaseService.challenge.getParticipations();
      return list as unknown as ChallengeParticipation[];
    },
  });

  // Query for community feed
  const communityFeedQuery = useQuery({
    queryKey: ['communityFeed'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem('communityFeed');
      const feed: CommunityFeedItem[] = stored ? JSON.parse(stored) : getDefaultCommunityFeed();
      return feed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
  });

  // Query for leaderboard
  const leaderboardQuery = useQuery({
    queryKey: ['challengeLeaderboard'],
    queryFn: async () => {
      const agg = await databaseService.challenge.getLeaderboard();
      const rows: ChallengeLeaderboard[] = (agg as any[]).map((row, idx) => ({
        userId: row.userId,
        userName: row.userId,
        userPhoto: undefined,
        totalPoints: row.totalPoints,
        completedChallenges: 0,
        badges: [],
        rank: idx + 1,
      }));
      return rows;
    },
  });

  // Mutation to join a challenge
  const joinChallengeMutation = useMutation({
    mutationFn: async ({ challengeId, userId }: { challengeId: string; userId: string }) => {
      await databaseService.challenge.joinChallenge({ challengeId, userId });
      return { challengeId, userId } as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userChallenges'] });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['challengeLeaderboard'] });
    },
  });

  // Mutation to submit proof for challenge
  const submitProofMutation = useMutation({
    mutationFn: async ({ 
      userChallengeId, 
      proof 
    }: { 
      userChallengeId: string; 
      proof: { type: 'photo' | 'video' | 'text'; data: string; };
    }) => {
      const uc = userChallengesQuery.data?.find(ucItem => ucItem.id === userChallengeId);
      if (!uc) throw new Error('User challenge not found');
      await databaseService.challenge.submitProof({
        userChallengeId,
        challengeId: uc.challengeId,
        userId: uc.userId,
        userName: undefined,
        userPhoto: undefined,
        proof,
      });
      return uc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userChallenges'] });
      queryClient.invalidateQueries({ queryKey: ['challengeParticipations'] });
      queryClient.invalidateQueries({ queryKey: ['challengeLeaderboard'] });
    },
  });

  // Mutation to vote on challenge participation
  const voteMutation = useMutation({
    mutationFn: async ({ 
      participationId, 
      voterId, 
      vote 
    }: { 
      participationId: string; 
      voterId: string; 
      vote: 'yes' | 'no';
    }) => {
      await databaseService.challenge.voteOnParticipation({ participationId, voterId, vote });
      return { participationId } as any;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challengeParticipations'] });
      queryClient.invalidateQueries({ queryKey: ['userChallenges'] });
      queryClient.invalidateQueries({ queryKey: ['communityFeed'] });
      queryClient.invalidateQueries({ queryKey: ['challengeLeaderboard'] });
    },
  });

  // Mutation to update challenge progress
  const updateProgressMutation = useMutation({
    mutationFn: async ({
      userChallengeId,
      requirementIndex,
      evidence,
      increment = 1,
    }: {
      userChallengeId: string;
      requirementIndex: number;
      evidence?: { type: 'photo' | 'text' | 'location'; data: string; timestamp: string; };
      increment?: number;
    }) => {
      const stored = await AsyncStorage.getItem('userChallenges');
      const userChallenges: UserChallenge[] = stored ? JSON.parse(stored) : [];
      
      const challengeIndex = userChallenges.findIndex(uc => uc.id === userChallengeId);
      if (challengeIndex === -1) throw new Error('User challenge not found');
      
      const userChallenge = userChallenges[challengeIndex];
      const progress = userChallenge.progress[requirementIndex];
      
      if (!progress) throw new Error('Requirement not found');
      
      // Update progress
      progress.current = Math.min(progress.current + increment, progress.target);
      progress.completed = progress.current >= progress.target;
      
      if (evidence) {
        if (!progress.evidence) {
          progress.evidence = [];
        }
        progress.evidence.push(evidence);
      }
      
      // Check if all requirements are completed
      const allCompleted = Object.values(userChallenge.progress).every(p => p.completed);
      
      if (allCompleted && userChallenge.status === 'active') {
        userChallenge.status = 'completed';
        userChallenge.completedAt = new Date().toISOString();
        
        // Award points and badge
        const challenge = challengesQuery.data?.find(c => c.id === userChallenge.challengeId);
        if (challenge) {
          userChallenge.pointsEarned = challenge.points;
          if (challenge.badge) {
            userChallenge.badgeEarned = challenge.badge;
          }
        }
      }
      
      userChallenges[challengeIndex] = userChallenge;
      await AsyncStorage.setItem('userChallenges', JSON.stringify(userChallenges));
      
      return userChallenge;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userChallenges'] });
      queryClient.invalidateQueries({ queryKey: ['challengeLeaderboard'] });
    },
  });

  // Helper functions
  const joinChallenge = (challengeId: string, userId: string) => {
    return joinChallengeMutation.mutateAsync({ challengeId, userId });
  };

  const submitProof = (userChallengeId: string, proof: { type: 'photo' | 'video' | 'text'; data: string; }) => {
    return submitProofMutation.mutateAsync({ userChallengeId, proof });
  };

  const voteOnParticipation = (participationId: string, voterId: string, vote: 'yes' | 'no') => {
    return voteMutation.mutateAsync({ participationId, voterId, vote });
  };

  const updateProgress = (
    userChallengeId: string,
    requirementIndex: number,
    evidence?: { type: 'photo' | 'text' | 'location'; data: string; timestamp: string; },
    increment: number = 1
  ) => {
    return updateProgressMutation.mutateAsync({
      userChallengeId,
      requirementIndex,
      evidence,
      increment,
    });
  };

  const getUserActiveChallenges = (userId: string) => {
    return userChallengesQuery.data?.filter(uc => uc.userId === userId && uc.status === 'active') || [];
  };

  const getUserCompletedChallenges = (userId: string) => {
    return userChallengesQuery.data?.filter(uc => uc.userId === userId && uc.status === 'completed') || [];
  };

  const getUserPendingChallenges = (userId: string) => {
    return userChallengesQuery.data?.filter(uc => uc.userId === userId && uc.status === 'pending_validation') || [];
  };

  const getUserTotalPoints = (userId: string) => {
    const completedChallenges = getUserCompletedChallenges(userId);
    return completedChallenges.reduce((total, uc) => total + uc.pointsEarned, 0);
  };

  const getUserBadges = (userId: string) => {
    const completedChallenges = getUserCompletedChallenges(userId);
    return completedChallenges
      .filter(uc => uc.badgeEarned)
      .map(uc => uc.badgeEarned!)
      .filter((badge, index, array) => array.indexOf(badge) === index);
  };

  const getDaysLeft = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getHoursLeft = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    return Math.max(0, diffHours);
  };

  const hasUserJoinedChallenge = (challengeId: string, userId: string) => {
    return userChallengesQuery.data?.some(uc => uc.challengeId === challengeId && uc.userId === userId) || false;
  };

  const hasUserVoted = (participationId: string, userId: string) => {
    const participation = participationsQuery.data?.find(p => p.id === participationId);
    return participation?.votes.some(v => v.voterId === userId) || false;
  };

  const getUserVote = (participationId: string, userId: string) => {
    const participation = participationsQuery.data?.find(p => p.id === participationId);
    return participation?.votes.find(v => v.voterId === userId)?.vote;
  };

  return {
    // Data
    challenges: challengesQuery.data || [],
    userChallenges: userChallengesQuery.data || [],
    participations: participationsQuery.data || [],
    communityFeed: communityFeedQuery.data || [],
    leaderboard: leaderboardQuery.data || [],
    activeCategory,
    
    // Loading states
    isLoadingChallenges: challengesQuery.isLoading,
    isLoadingUserChallenges: userChallengesQuery.isLoading,
    isLoadingParticipations: participationsQuery.isLoading,
    isLoadingCommunityFeed: communityFeedQuery.isLoading,
    isLoadingLeaderboard: leaderboardQuery.isLoading,
    
    // Actions
    joinChallenge,
    submitProof,
    voteOnParticipation,
    updateProgress,
    setActiveCategory,
    getUserActiveChallenges,
    getUserCompletedChallenges,
    getUserPendingChallenges,
    getUserTotalPoints,
    getUserBadges,
    getDaysLeft,
    getHoursLeft,
    hasUserJoinedChallenge,
    hasUserVoted,
    getUserVote,
    
    // Mutations
    isJoining: joinChallengeMutation.isPending,
    isSubmittingProof: submitProofMutation.isPending,
    isVoting: voteMutation.isPending,
    isUpdatingProgress: updateProgressMutation.isPending,
  };
});

// Default challenges data
function getDefaultChallenges(): Challenge[] {
  return [
    {
      id: '1',
      title: {
        fr: 'Photo Rigolote',
        en: 'Funny Photo',
      },
      description: {
        fr: 'Partagez une photo amusante de votre animal dans une situation comique',
        en: 'Share a funny photo of your pet in a comical situation',
      },
      category: 'weekly',
      difficulty: 'easy',
      points: 100,
      badge: 'comedian',
      requirements: [
        {
          type: 'photo',
          target: 1,
          description: {
            fr: 'Prenez une photo rigolote de votre animal',
            en: 'Take a funny photo of your pet',
          },
        },
      ],
      isPremium: false,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      participants: 1250,
      completions: 890,
      icon: '😂',
      color: '#FFD93D',
      duration: 7,
    },
    {
      id: '2',
      title: {
        fr: 'Marche de 10km',
        en: '10km Walk',
      },
      description: {
        fr: 'Parcourez 10 kilomètres avec votre chien en une semaine',
        en: 'Walk 10 kilometers with your dog in one week',
      },
      category: 'weekly',
      difficulty: 'medium',
      points: 200,
      badge: 'walker',
      requirements: [
        {
          type: 'activity',
          target: 10,
          description: {
            fr: 'Marchez 10km au total avec votre chien',
            en: 'Walk 10km total with your dog',
          },
        },
      ],
      isPremium: false,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      participants: 680,
      completions: 420,
      icon: '🚶‍♂️',
      color: '#4ECDC4',
      duration: 7,
    },
    {
      id: '3',
      title: {
        fr: 'Apprendre la Patte',
        en: 'Paw Shake',
      },
      description: {
        fr: 'Apprenez à votre animal à donner la patte sur commande',
        en: 'Teach your pet to shake paws on command',
      },
      category: 'monthly',
      difficulty: 'medium',
      points: 250,
      badge: 'trainer',
      requirements: [
        {
          type: 'photo',
          target: 1,
          description: {
            fr: 'Filmez votre animal donnant la patte',
            en: 'Film your pet shaking paws',
          },
        },
      ],
      isPremium: false,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      participants: 450,
      completions: 280,
      icon: '🐾',
      color: '#F0A5C9',
      duration: 30,
    },
    {
      id: '4',
      title: {
        fr: 'Selfie Unique',
        en: 'Unique Selfie',
      },
      description: {
        fr: 'Prenez un selfie avec votre chat dans un lieu unique ou insolite',
        en: 'Take a selfie with your cat in a unique or unusual place',
      },
      category: 'weekly',
      difficulty: 'easy',
      points: 150,
      badge: 'explorer',
      requirements: [
        {
          type: 'photo',
          target: 1,
          description: {
            fr: 'Selfie avec votre chat dans un lieu unique',
            en: 'Selfie with your cat in a unique place',
          },
        },
      ],
      isPremium: false,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      participants: 320,
      completions: 180,
      icon: '🤳',
      color: '#A8E6CF',
      duration: 7,
    },
    {
      id: '5',
      title: {
        fr: 'Câlin Multi-Animaux',
        en: 'Multi-Pet Hug',
      },
      description: {
        fr: 'Organisez un câlin avec plusieurs animaux en même temps',
        en: 'Organize a hug with multiple pets at the same time',
      },
      category: 'special',
      difficulty: 'hard',
      points: 400,
      badge: 'pet_whisperer',
      requirements: [
        {
          type: 'photo',
          target: 1,
          description: {
            fr: 'Photo de vous avec plusieurs animaux',
            en: 'Photo of you with multiple pets',
          },
        },
      ],
      isPremium: true,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      participants: 120,
      completions: 45,
      icon: '🤗',
      color: '#FFB6C1',
      duration: 14,
    },
    {
      id: '6',
      title: {
        fr: 'Tour Impressionnant',
        en: 'Impressive Trick',
      },
      description: {
        fr: 'Filmez votre animal réalisant un tour impressionnant',
        en: 'Film your pet performing an impressive trick',
      },
      category: 'monthly',
      difficulty: 'hard',
      points: 350,
      badge: 'showmaster',
      requirements: [
        {
          type: 'photo',
          target: 1,
          description: {
            fr: 'Vidéo de votre animal faisant un tour',
            en: 'Video of your pet doing a trick',
          },
        },
      ],
      isPremium: false,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      participants: 280,
      completions: 95,
      icon: '🎪',
      color: '#DDA0DD',
      duration: 30,
    },
    {
      id: '7',
      title: {
        fr: 'Photo en Costume',
        en: 'Costume Photo',
      },
      description: {
        fr: 'Déguisez votre animal et prenez une photo adorable',
        en: 'Dress up your pet and take an adorable photo',
      },
      category: 'special',
      difficulty: 'easy',
      points: 180,
      badge: 'fashionista',
      requirements: [
        {
          type: 'photo',
          target: 1,
          description: {
            fr: 'Photo de votre animal déguisé',
            en: 'Photo of your pet in costume',
          },
        },
      ],
      isPremium: false,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      participants: 890,
      completions: 650,
      icon: '🎭',
      color: '#FFA07A',
      duration: 10,
    },
    {
      id: '8',
      title: {
        fr: 'Promenade Nature',
        en: 'Nature Walk',
      },
      description: {
        fr: 'Explorez un parc ou un sentier naturel avec votre animal',
        en: 'Explore a park or nature trail with your pet',
      },
      category: 'weekly',
      difficulty: 'easy',
      points: 120,
      badge: 'nature_lover',
      requirements: [
        {
          type: 'photo',
          target: 1,
          description: {
            fr: 'Photo dans un environnement naturel',
            en: 'Photo in a natural environment',
          },
        },
      ],
      isPremium: false,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      participants: 560,
      completions: 420,
      icon: '🌲',
      color: '#90EE90',
      duration: 7,
    },
    {
      id: '9',
      title: {
        fr: 'Session Dressage',
        en: 'Training Session',
      },
      description: {
        fr: 'Organisez une session de dressage avec votre animal',
        en: 'Organize a training session with your pet',
      },
      category: 'monthly',
      difficulty: 'medium',
      points: 300,
      badge: 'trainer_pro',
      requirements: [
        {
          type: 'photo',
          target: 1,
          description: {
            fr: 'Vidéo de votre session de dressage',
            en: 'Video of your training session',
          },
        },
      ],
      isPremium: true,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      participants: 200,
      completions: 85,
      icon: '🎯',
      color: '#87CEEB',
      duration: 30,
    },
    {
      id: '10',
      title: {
        fr: 'Moment Toilettage',
        en: 'Grooming Time',
      },
      description: {
        fr: 'Partagez un moment de toilettage relaxant avec votre animal',
        en: 'Share a relaxing grooming moment with your pet',
      },
      category: 'weekly',
      difficulty: 'easy',
      points: 100,
      badge: 'groomer',
      requirements: [
        {
          type: 'photo',
          target: 1,
          description: {
            fr: 'Photo pendant le toilettage',
            en: 'Photo during grooming',
          },
        },
      ],
      isPremium: false,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      participants: 340,
      completions: 250,
      icon: '✂️',
      color: '#F0E68C',
      duration: 7,
    },
  ];
}

function getDefaultLeaderboard(): ChallengeLeaderboard[] {
  return [
    {
      userId: '1',
      userName: 'Sarah Johnson',
      userPhoto: 'https://images.unsplash.com/photo-1494790108755-2616b9e0e4b0?w=100&h=100&fit=crop&crop=face',
      totalPoints: 2450,
      completedChallenges: 12,
      badges: ['comedian', 'walker', 'trainer', 'explorer'],
      rank: 1,
    },
    {
      userId: '2',
      userName: 'Mike Chen',
      userPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      totalPoints: 2180,
      completedChallenges: 9,
      badges: ['walker', 'nature_lover', 'groomer'],
      rank: 2,
    },
    {
      userId: '3',
      userName: 'Emma Wilson',
      userPhoto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
      totalPoints: 1950,
      completedChallenges: 8,
      badges: ['comedian', 'explorer', 'fashionista'],
      rank: 3,
    },
  ];
}

function getDefaultCommunityFeed(): CommunityFeedItem[] {
  return [
    {
      id: '1',
      type: 'challenge_completed',
      userId: '1',
      userName: 'Sarah Johnson',
      userPhoto: 'https://images.unsplash.com/photo-1494790108755-2616b9e0e4b0?w=100&h=100&fit=crop&crop=face',
      challengeId: '1',
      challengeTitle: 'Photo Rigolote',
      challengeIcon: '😂',
      proof: {
        type: 'photo',
        data: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=300&fit=crop',
      },
      badgeEarned: 'comedian',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      likes: 24,
      comments: [],
      isLiked: false,
      votes: {
        yes: 5,
        no: 1,
      },
    },
    {
      id: '2',
      type: 'badge_earned',
      userId: '2',
      userName: 'Mike Chen',
      userPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      challengeId: '2',
      challengeTitle: 'Marche de 10km',
      challengeIcon: '🚶‍♂️',
      badgeEarned: 'walker',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      likes: 18,
      comments: [],
      isLiked: false,
    },
  ];
}