import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import { useI18n } from '@/hooks/i18n-store';
import { useBadges } from '@/hooks/badges-store';
import BadgeComponent from '@/components/Badge';
import { Badge as BadgeType } from '@/types';
import {
  Trophy,
  Star,
  Award,
  Target,
  ArrowLeft,
  Lock,
  CheckCircle,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

type BadgeCategory = 'all' | 'social' | 'health' | 'activity' | 'achievement' | 'special';

export default function BadgesScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const badgesStore = useBadges();
  
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory>('all');
  const [showOnlyUnlocked, setShowOnlyUnlocked] = useState(false);

  const allBadges = badgesStore.badges;
  const unlockedBadges = badgesStore.getUnlockedBadges();
  const lockedBadges = badgesStore.getLockedBadges();
  const userProgress = badgesStore.getUserProgress();

  const getFilteredBadges = () => {
    let badges = selectedCategory === 'all' ? allBadges : badgesStore.getBadgesByCategory(selectedCategory);
    
    if (showOnlyUnlocked) {
      badges = badges.filter((badge) => badge.unlocked);
    }
    
    return badges;
  };

  const filteredBadges = getFilteredBadges();

  const categories = [
    { id: 'all' as BadgeCategory, name: t('common.view_all'), icon: Trophy },
    { id: 'social' as BadgeCategory, name: t('badges.categories.social'), icon: Star },
    { id: 'health' as BadgeCategory, name: t('badges.categories.health'), icon: Award },
    { id: 'activity' as BadgeCategory, name: t('badges.categories.activity'), icon: Target },
    { id: 'achievement' as BadgeCategory, name: t('badges.categories.achievement'), icon: Trophy },
    { id: 'special' as BadgeCategory, name: t('badges.categories.special'), icon: Star },
  ];

  const renderCategory = (category: typeof categories[0]) => {
    const Icon = category.icon;
    const isSelected = selectedCategory === category.id;
    
    return (
      <TouchableOpacity
        key={category.id}
        style={[styles.categoryButton, isSelected && styles.selectedCategory]}
        onPress={() => setSelectedCategory(category.id)}
      >
        <Icon 
          size={20} 
          color={isSelected ? COLORS.white : COLORS.darkGray} 
        />
        <Text style={[
          styles.categoryText, 
          isSelected && styles.selectedCategoryText
        ]}>
          {category.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderBadge = ({ item, index }: { item: BadgeType; index: number }) => (
    <View style={styles.badgeContainer}>
      <BadgeComponent 
        badge={item} 
        style={styles.badge}
        showProgress={!item.unlocked}
      />
    </View>
  );

  const renderStats = () => (
    <View style={[styles.statsContainer, SHADOWS.medium]}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{unlockedBadges.length}</Text>
        <Text style={styles.statLabel}>{t('badges.earned_badges')}</Text>
      </View>
      
      <View style={styles.statDivider} />
      
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{lockedBadges.length}</Text>
        <Text style={styles.statLabel}>{t('badges.available_badges')}</Text>
      </View>
      
      <View style={styles.statDivider} />
      
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>
          {Math.round((unlockedBadges.length / allBadges.length) * 100)}%
        </Text>
        <Text style={styles.statLabel}>{t('common.done')}</Text>
      </View>
    </View>
  );

  const renderProgressSection = () => {
    const inProgressBadges = lockedBadges.filter(badge => 
      userProgress[badge.id] && userProgress[badge.id].current > 0
    );

    if (inProgressBadges.length === 0) return null;

    return (
      <View style={[styles.section, SHADOWS.small]}>
        <Text style={styles.sectionTitle}>{t('badges.badge_progress')}</Text>
        <FlatList
          data={inProgressBadges}
          renderItem={renderBadge}
          keyExtractor={(item) => item.id}
          numColumns={2}
          scrollEnabled={false}
          columnWrapperStyle={styles.badgeRow}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: t('badges.badges'),
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color={COLORS.black} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, SHADOWS.medium]}>
          <Trophy size={40} color={COLORS.accent} />
          <Text style={styles.headerTitle}>{t('profile.achievements')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('badges.badge_progress')}
          </Text>
        </View>

        {/* Stats */}
        {renderStats()}

        {/* Progress Section */}
        {renderProgressSection()}

        {/* Categories */}
        <View style={[styles.section, SHADOWS.small]}>
          <Text style={styles.sectionTitle}>{t('shop.categories')}</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map(renderCategory)}
          </ScrollView>
        </View>

        {/* Filter Toggle */}
        <View style={[styles.section, SHADOWS.small]}>
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>{t('badges.earned_badges')}</Text>
            <TouchableOpacity
              style={[styles.toggle, showOnlyUnlocked && styles.toggleActive]}
              onPress={() => setShowOnlyUnlocked(!showOnlyUnlocked)}
            >
              {showOnlyUnlocked && (
                <CheckCircle size={16} color={COLORS.white} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Badges Grid */}
        <View style={[styles.section, SHADOWS.small]}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'all' ? t('badges.badges') : `${categories.find(c => c.id === selectedCategory)?.name} ${t('badges.badges')}`}
            {showOnlyUnlocked && ` (${t('badges.earned_badges')})`}
          </Text>
          
          {filteredBadges.length > 0 ? (
            <FlatList
              data={filteredBadges}
              renderItem={renderBadge}
              keyExtractor={(item) => item.id}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={styles.badgeRow}
            />
          ) : (
            <View style={styles.emptyState}>
              <Lock size={48} color={COLORS.mediumGray} />
              <Text style={styles.emptyTitle}>{t('errors.not_found')}</Text>
              <Text style={styles.emptySubtitle}>
                {showOnlyUnlocked 
                  ? t('badges.badge_progress')
                  : t('badges.available_badges')
                }
              </Text>
            </View>
          )}
        </View>

        {/* Tips */}
        <View style={[styles.section, SHADOWS.small]}>
          <Text style={styles.sectionTitle}>{t('badges.badges')}</Text>
          
          <View style={styles.tipItem}>
            <Star size={20} color={COLORS.accent} />
            <Text style={styles.tipText}>
              {t('onboarding.connect.description')}
            </Text>
          </View>
          
          <View style={styles.tipItem}>
            <Award size={20} color={COLORS.success} />
            <Text style={styles.tipText}>
              {t('health.health_record')}
            </Text>
          </View>
          
          <View style={styles.tipItem}>
            <Target size={20} color={COLORS.primary} />
            <Text style={styles.tipText}>
              {t('challenges.participate')}
            </Text>
          </View>
          
          <View style={styles.tipItem}>
            <Trophy size={20} color={COLORS.premium} />
            <Text style={styles.tipText}>
              {t('profile.achievements')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.screenBackground,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: COLORS.white,
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginTop: 12,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 22,
  },
  statsContainer: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.mediumGray,
  },
  section: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 16,
  },
  categoriesContainer: {
    paddingRight: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    marginRight: 12,
    gap: 8,
  },
  selectedCategory: {
    backgroundColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: COLORS.darkGray,
  },
  selectedCategoryText: {
    color: COLORS.white,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterLabel: {
    fontSize: 16,
    color: COLORS.black,
  },
  toggle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.mediumGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  badgeRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  badgeContainer: {
    width: (width - 80) / 2, // Account for margins and padding
  },
  badge: {
    marginBottom: 0,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 20,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
  },
});