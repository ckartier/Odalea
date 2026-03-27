import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useChallenges } from '@/hooks/challenges-store';
import { useFirebaseUser } from '@/hooks/firebase-user-store';
import { Trophy, Calendar, Users, ChevronRight, Star, Flame, Target } from 'lucide-react-native';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '@/theme/tokens';

type CategoryFilter = 'all' | 'daily' | 'weekly' | 'monthly' | 'special';

export default function ChallengesTab() {
  const router = useRouter();
  const { user } = useFirebaseUser();
  const {
    challenges,
    isLoadingChallenges,
    joinChallenge,
    hasUserJoinedChallenge,
    getDaysLeft,
    activeCategory,
    setActiveCategory,
    getUserActiveChallenges,
    getUserTotalPoints,
  } = useChallenges();
  
  const [refreshing, setRefreshing] = useState(false);
  const [joiningChallengeId, setJoiningChallengeId] = useState<string | null>(null);

  const userActiveChallenges = user?.id ? getUserActiveChallenges(user.id) : [];
  const userPoints = user?.id ? getUserTotalPoints(user.id) : 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const handleJoinChallenge = useCallback(async (challengeId: string) => {
    if (!user?.id) {
      Alert.alert('Erreur', 'Vous devez être connecté pour rejoindre un défi');
      return;
    }

    try {
      setJoiningChallengeId(challengeId);
      await joinChallenge(challengeId, user.id);
      Alert.alert('Succès', 'Vous avez rejoint le défi !');
    } catch (error) {
      console.error('Error joining challenge:', error);
      Alert.alert('Erreur', 'Impossible de rejoindre le défi');
    } finally {
      setJoiningChallengeId(null);
    }
  }, [user, joinChallenge]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'daily': return '#4ECDC4';
      case 'weekly': return '#FFD93D';
      case 'monthly': return '#F0A5C9';
      case 'special': return '#FF6B9D';
      default: return COLORS.primary;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'daily': return 'Quotidien';
      case 'weekly': return 'Hebdo';
      case 'monthly': return 'Mensuel';
      case 'special': return 'Spécial';
      default: return category;
    }
  };

  if (isLoadingChallenges) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement des défis...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Défis</Text>
          <Text style={styles.headerSubtitle}>
            Gagne des points et badges avec ton animal
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 215, 0, 0.15)' }]}>
              <Trophy size={24} color="#FFD700" />
            </View>
            <Text style={styles.statValue}>{userPoints}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 107, 107, 0.15)' }]}>
              <Flame size={24} color="#FF6B6B" />
            </View>
            <Text style={styles.statValue}>{userActiveChallenges.length}</Text>
            <Text style={styles.statLabel}>En cours</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: 'rgba(78, 205, 196, 0.15)' }]}>
              <Target size={24} color="#4ECDC4" />
            </View>
            <Text style={styles.statValue}>{challenges.length}</Text>
            <Text style={styles.statLabel}>Disponibles</Text>
          </View>
        </View>

        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        >
          {(['all', 'daily', 'weekly', 'monthly', 'special'] as CategoryFilter[]).map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterChip,
                activeCategory === category && styles.filterChipActive,
              ]}
              onPress={() => setActiveCategory(category)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeCategory === category && styles.filterChipTextActive,
                ]}
              >
                {category === 'all' ? 'Tous' : getCategoryLabel(category)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Challenges List */}
        {challenges.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Trophy size={64} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>Aucun défi disponible</Text>
            <Text style={styles.emptyText}>
              Reviens plus tard pour découvrir de nouveaux défis !
            </Text>
          </View>
        ) : (
          challenges.map((challenge) => {
            const hasJoined = hasUserJoinedChallenge(challenge.id, user?.id || '');
            const daysLeft = getDaysLeft(challenge.endDate);
            const categoryColor = getCategoryColor(challenge.category);
            const isJoining = joiningChallengeId === challenge.id;

            return (
              <TouchableOpacity
                key={challenge.id}
                style={styles.challengeCard}
                onPress={() => router.push(`/challenges/${challenge.id}` as any)}
                activeOpacity={0.9}
              >
                <View style={styles.challengeHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: `${categoryColor}20` }]}>
                    <Text style={styles.challengeIcon}>{challenge.icon}</Text>
                  </View>
                  <View style={styles.challengeHeaderText}>
                    <Text style={styles.challengeTitle}>{challenge.title.fr}</Text>
                    <View style={styles.challengeMeta}>
                      <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
                        <Text style={styles.categoryText}>{getCategoryLabel(challenge.category)}</Text>
                      </View>
                      <View style={styles.pointsBadge}>
                        <Trophy size={12} color="#FFD700" />
                        <Text style={styles.pointsText}>{challenge.points} pts</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <Text style={styles.challengeDescription} numberOfLines={2}>
                  {challenge.description.fr}
                </Text>

                <View style={styles.challengeFooter}>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Users size={14} color={COLORS.textSecondary} />
                      <Text style={styles.statText}>{challenge.participants}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Calendar size={14} color={COLORS.textSecondary} />
                      <Text style={styles.statText}>{daysLeft}j</Text>
                    </View>
                  </View>

                  {hasJoined ? (
                    <View style={styles.joinedBadge}>
                      <Text style={styles.joinedText}>Rejoint ✓</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.joinButton, isJoining && styles.joinButtonDisabled]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleJoinChallenge(challenge.id);
                      }}
                      disabled={isJoining}
                      activeOpacity={0.7}
                    >
                      {isJoining ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Text style={styles.joinButtonText}>Participer</Text>
                          <ChevronRight size={16} color="#FFFFFF" />
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.m,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.l,
    paddingBottom: SPACING.m,
  },
  headerTitle: {
    ...TYPOGRAPHY.titleL,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.l,
    gap: SPACING.m,
    marginBottom: SPACING.m,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.m,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  statValue: {
    ...TYPOGRAPHY.titleM,
    color: COLORS.textPrimary,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  filtersContainer: {
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    gap: SPACING.s,
  },
  filterChip: {
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.s,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontWeight: '500' as const,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  challengeCard: {
    marginHorizontal: SPACING.l,
    marginBottom: SPACING.m,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.l,
    ...SHADOWS.card,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.m,
    gap: SPACING.m,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeIcon: {
    fontSize: 28,
  },
  challengeHeaderText: {
    flex: 1,
  },
  challengeTitle: {
    ...TYPOGRAPHY.bodySemibold,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  challengeMeta: {
    flexDirection: 'row',
    gap: SPACING.s,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    paddingHorizontal: SPACING.s,
    paddingVertical: 3,
    borderRadius: RADIUS.small,
  },
  categoryText: {
    ...TYPOGRAPHY.caption,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600' as const,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: SPACING.s,
    paddingVertical: 3,
    borderRadius: RADIUS.small,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  pointsText: {
    ...TYPOGRAPHY.caption,
    color: '#B8860B',
    fontSize: 11,
    fontWeight: '600' as const,
  },
  challengeDescription: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginBottom: SPACING.m,
    lineHeight: 20,
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.m,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderRadius: RADIUS.button,
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    ...TYPOGRAPHY.smallSemibold,
    color: '#FFFFFF',
  },
  joinedBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderRadius: RADIUS.button,
    borderWidth: 1,
    borderColor: '#34C759',
  },
  joinedText: {
    ...TYPOGRAPHY.smallSemibold,
    color: '#34C759',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING['5xl'],
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.titleM,
    color: COLORS.textPrimary,
    marginTop: SPACING.l,
    marginBottom: SPACING.s,
    textAlign: 'center' as const,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center' as const,
  },
});
