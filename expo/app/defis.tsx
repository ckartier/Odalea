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
import { Stack, useRouter } from 'expo-router';
import { useChallenges } from '@/hooks/challenges-store';
import { useFirebaseUser } from '@/hooks/firebase-user-store';
import { Trophy, Calendar, Users, ChevronRight, Star } from 'lucide-react-native';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY, SHADOWS } from '@/theme/tokens';

type CategoryFilter = 'all' | 'daily' | 'weekly' | 'monthly' | 'special';

export default function DefisScreen() {
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
  } = useChallenges();
  
  const [refreshing, setRefreshing] = useState(false);
  const [joiningChallengeId, setJoiningChallengeId] = useState<string | null>(null);

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
      case 'weekly': return 'Hebdomadaire';
      case 'monthly': return 'Mensuel';
      case 'special': return 'Spécial';
      default: return category;
    }
  };

  if (isLoadingChallenges) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Stack.Screen options={{ title: 'Défis', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement des défis...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ title: 'Défis', headerShown: true }} />
      
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
          <Text style={styles.headerTitle}>Relève les défis !</Text>
          <Text style={styles.headerSubtitle}>
            Gagne des points et des badges en complétant les défis avec ton animal
          </Text>
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
                      <View style={styles.difficultyBadge}>
                        <Star
                          size={12}
                          color="#FFD700"
                          fill={challenge.difficulty === 'hard' ? '#FFD700' : 'none'}
                        />
                        <Text style={styles.difficultyText}>
                          {challenge.difficulty === 'easy' ? 'Facile' : challenge.difficulty === 'medium' ? 'Moyen' : 'Difficile'}
                        </Text>
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
                      <Users size={16} color={COLORS.textSecondary} />
                      <Text style={styles.statText}>{challenge.participants}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Calendar size={16} color={COLORS.textSecondary} />
                      <Text style={styles.statText}>{daysLeft}j restants</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Trophy size={16} color="#FFD700" />
                      <Text style={[styles.statText, { color: '#FFD700' }]}>{challenge.points} pts</Text>
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
                        <ActivityIndicator size="small" color={COLORS.surface} />
                      ) : (
                        <>
                          <Text style={styles.joinButtonText}>Rejoindre</Text>
                          <ChevronRight size={16} color={COLORS.surface} />
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
    gap: SPACING.md,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerTitle: {
    ...TYPOGRAPHY.title,
    fontSize: 32,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  filtersContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
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
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  filterChipTextActive: {
    color: COLORS.surface,
    fontWeight: '700' as const,
  },
  challengeCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    padding: SPACING.lg,
    ...SHADOWS.card,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeIcon: {
    fontSize: 32,
  },
  challengeHeaderText: {
    flex: 1,
  },
  challengeTitle: {
    ...TYPOGRAPHY.bodyLarge,
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  challengeMeta: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.small,
  },
  categoryText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.surface,
    fontSize: 11,
    fontWeight: '600' as const,
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.small,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  difficultyText: {
    ...TYPOGRAPHY.caption,
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '600' as const,
  },
  challengeDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    flex: 1,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.button,
    minWidth: 100,
    justifyContent: 'center',
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.surface,
    fontSize: 14,
  },
  joinedBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.button,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  joinedText: {
    ...TYPOGRAPHY.caption,
    color: '#4CAF50',
    fontWeight: '600' as const,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
