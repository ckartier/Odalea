import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  Pressable,
  Alert,
  Dimensions,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import { useI18n } from '@/hooks/i18n-store';
import { useChallenges } from '@/hooks/challenges-store';
import { useTheme } from '@/hooks/theme-store';
import { useAuth } from '@/hooks/auth-store';
import { 
  Trophy, 
  Calendar, 
  Users, 
  Award,
  Camera,
  CheckCircle,
  Clock,
  Star,
} from 'lucide-react-native';
import Button from '@/components/Button';

const { width } = Dimensions.get('window');

export default function ChallengeDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const router = useRouter();
  const { challenges, joinChallenge, getUserActiveChallenges, isJoining } = useChallenges();
  const { getThemedColor } = useTheme();
  const { user } = useAuth();

  const [showJoinModal, setShowJoinModal] = useState(false);

  const challenge = challenges.find(c => c.id === id);
  const userActiveChallenges = getUserActiveChallenges(user?.id || '');
  const isUserParticipating = userActiveChallenges.some(uc => uc.challengeId === id);

  if (!challenge) {
    return (
      <View style={styles.container}>
        <Text>Challenge non trouvé</Text>
      </View>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return COLORS.success;
      case 'medium':
        return COLORS.warning;
      case 'hard':
        return COLORS.error;
      default:
        return COLORS.darkGray;
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'Facile';
      case 'medium':
        return 'Moyen';
      case 'hard':
        return 'Difficile';
      default:
        return difficulty;
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'daily':
        return 'Quotidien';
      case 'weekly':
        return 'Hebdomadaire';
      case 'monthly':
        return 'Mensuel';
      case 'special':
        return 'Spécial';
      default:
        return category;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleJoinChallenge = async () => {
    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté pour participer à un challenge.');
      return;
    }

    if (challenge.isPremium && !user.isPremium) {
      Alert.alert(
        'Challenge Premium',
        'Ce challenge est réservé aux membres Premium. Souhaitez-vous passer à Premium ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Passer à Premium', onPress: () => router.push('/premium') },
        ]
      );
      return;
    }

    try {
      await joinChallenge(challenge.id, user.id);
      Alert.alert(
        'Challenge rejoint !',
        'Vous participez maintenant à ce challenge. Bonne chance !',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de rejoindre le challenge. Veuillez réessayer.');
    }
  };

  const isActive = new Date() >= new Date(challenge.startDate) && new Date() <= new Date(challenge.endDate);

  return (
    <View style={[styles.container, { backgroundColor: getThemedColor('background') }]}>
      <Stack.Screen 
        options={{ 
          title: challenge.title.fr,
          headerStyle: { backgroundColor: getThemedColor('background') },
          headerTintColor: COLORS.white,
        }} 
      />
      <StatusBar style="light" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.headerContainer}>
          <View style={[styles.iconContainer, { backgroundColor: challenge.color }]}>
            <Text style={styles.iconText}>{challenge.icon}</Text>
          </View>
          
          <View style={styles.headerInfo}>
            <Text style={styles.challengeTitle}>{challenge.title.fr}</Text>
            
            <View style={styles.metaInfo}>
              <View style={[styles.categoryBadge, { backgroundColor: getDifficultyColor(challenge.difficulty) }]}>
                <Text style={styles.categoryText}>{getDifficultyText(challenge.difficulty)}</Text>
              </View>
              
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>{getCategoryText(challenge.category)}</Text>
              </View>
              
              {challenge.isPremium && (
                <View style={styles.premiumBadge}>
                  <Star size={12} color={COLORS.white} />
                  <Text style={styles.premiumText}>Premium</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Challenge Info */}
        <View style={styles.infoSection}>
          <Text style={styles.description}>{challenge.description.fr}</Text>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Users size={20} color={COLORS.primary} />
              <Text style={styles.statLabel}>Participants</Text>
              <Text style={styles.statValue}>{challenge.participants}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Trophy size={20} color={COLORS.primary} />
              <Text style={styles.statLabel}>Complétions</Text>
              <Text style={styles.statValue}>{challenge.completions}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Award size={20} color={COLORS.primary} />
              <Text style={styles.statLabel}>Points</Text>
              <Text style={styles.statValue}>{challenge.points}</Text>
            </View>
          </View>

          {/* Timeline */}
          <View style={styles.timelineSection}>
            <Text style={styles.sectionTitle}>Calendrier</Text>
            
            <View style={styles.timelineItem}>
              <Calendar size={16} color={COLORS.success} />
              <Text style={styles.timelineText}>
                Début : {formatDate(challenge.startDate)}
              </Text>
            </View>
            
            <View style={styles.timelineItem}>
              <Clock size={16} color={COLORS.error} />
              <Text style={styles.timelineText}>
                Fin : {formatDate(challenge.endDate)}
              </Text>
            </View>
          </View>

          {/* Requirements */}
          <View style={styles.requirementsSection}>
            <Text style={styles.sectionTitle}>Objectifs</Text>
            
            {challenge.requirements.map((requirement, index) => (
              <View key={index} style={styles.requirementItem}>
                <View style={styles.requirementIcon}>
                  <CheckCircle size={16} color={COLORS.primary} />
                </View>
                <View style={styles.requirementContent}>
                  <Text style={styles.requirementText}>
                    {requirement.description.fr}
                  </Text>
                  <Text style={styles.requirementTarget}>
                    Objectif : {requirement.target}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Badge Reward */}
          {challenge.badge && (
            <View style={styles.rewardSection}>
              <Text style={styles.sectionTitle}>Récompense</Text>
              <View style={styles.rewardItem}>
                <Award size={24} color={COLORS.accent} />
                <Text style={styles.rewardText}>Badge : {challenge.badge}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.actionContainer}>
        {isUserParticipating ? (
          <Button
            title="Déjà inscrit"
            variant="outline"
            disabled
            style={styles.actionButton}
            icon={<CheckCircle size={20} color={COLORS.success} />}
          />
        ) : isActive ? (
          <Button
            title="Participer au Challenge"
            onPress={handleJoinChallenge}
            variant="primary"
            loading={isJoining}
            style={styles.actionButton}
            icon={<Trophy size={20} color={COLORS.white} />}
          />
        ) : (
          <Button
            title="Challenge Terminé"
            variant="outline"
            disabled
            style={styles.actionButton}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 32,
  },
  headerInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 8,
  },
  metaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  typeBadge: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  premiumBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  premiumText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
  infoSection: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    marginTop: -24,
    flex: 1,
  },
  description: {
    fontSize: 16,
    color: COLORS.black,
    lineHeight: 24,
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.lightGray,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
  },
  timelineSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  timelineText: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  requirementsSection: {
    marginBottom: 24,
  },
  requirementItem: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  requirementIcon: {
    marginTop: 2,
  },
  requirementContent: {
    flex: 1,
  },
  requirementText: {
    fontSize: 14,
    color: COLORS.black,
    marginBottom: 4,
  },
  requirementTarget: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  rewardSection: {
    marginBottom: 24,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  rewardText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.accent,
  },
  actionContainer: {
    padding: 20,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.mediumGray,
  },
  actionButton: {
    width: '100%',
  },
});