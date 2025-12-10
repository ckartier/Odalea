import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SHADOWS } from '@/constants/colors';
import { useI18n } from '@/hooks/i18n-store';
import { useAuth } from '@/hooks/user-store';
import { useChallenges } from '@/hooks/challenges-store';
import { usePremium } from '@/hooks/premium-store';
import { 
  Trophy, 
  Camera, 
  Video, 
  Activity, 
  Brain, 
  Calendar, 
  Users, 
  Award,
  Clock,
  CheckCircle,
  Upload,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Star,
  Gift,
  Plus
} from 'lucide-react-native';
import Button from '@/components/Button';

export default function ChallengesScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const {
    challenges,
    userChallenges,
    leaderboard,
    participations,
    joinChallenge,
    submitProof,
    voteOnParticipation,
    getUserActiveChallenges,
    getUserCompletedChallenges,
    getUserPendingChallenges,
    getDaysLeft,
    getHoursLeft,
    hasUserJoinedChallenge,
    hasUserVoted,
    getUserVote,
    isJoining,
    isSubmittingProof,
    isVoting,
  } = useChallenges();
  
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'challenges' | 'my_challenges' | 'leaderboard'>('challenges');
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [selectedParticipation, setSelectedParticipation] = useState<any>(null);
  const [selectedProofImage, setSelectedProofImage] = useState<string | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'photo':
        return <Camera size={20} color={COLORS.primary} />;
      case 'video':
        return <Video size={20} color={COLORS.primary} />;
      case 'activity':
        return <Activity size={20} color={COLORS.primary} />;
      case 'knowledge':
        return <Brain size={20} color={COLORS.primary} />;
      default:
        return <Trophy size={20} color={COLORS.primary} />;
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    if (!user) return;
    
    const challenge = challenges.find(c => c.id === challengeId);
    if (!challenge) return;
    
    if (challenge.isPremium && !isPremium) {
      Alert.alert(
        t('challenges.premium_only'),
        'Ce défi est réservé aux membres Premium.',
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: 'Passer à Premium', onPress: () => router.push('/premium') },
        ]
      );
      return;
    }
    
    try {
      await joinChallenge(challengeId, user.id);
      setShowJoinModal(false);
      Alert.alert(
        t('challenges.joined'),
        `Vous avez rejoint le défi "${challenge.title.fr}" !`,
        [{ text: t('common.ok') }]
      );
    } catch (error) {
      Alert.alert(t('common.error'), 'Impossible de rejoindre ce défi.');
    }
  };

  const handleSubmitProof = async (userChallengeId: string, proof: any) => {
    try {
      await submitProof(userChallengeId, proof);
      setShowProofModal(false);
      setSelectedProofImage(null);
      Alert.alert(
        t('challenges.validation_pending'),
        'Votre preuve a été soumise et est en attente de validation par la communauté.',
        [{ text: t('common.ok') }]
      );
    } catch (error) {
      Alert.alert(t('common.error'), 'Impossible de soumettre la preuve.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission requise',
            'L\'accès à la caméra est nécessaire pour prendre une photo.',
            [{ text: t('common.ok') }]
          );
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedProofImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert(t('common.error'), 'Impossible de prendre une photo.');
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'L\'accès à la galerie est nécessaire pour choisir une photo.',
          [{ text: t('common.ok') }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedProofImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('common.error'), 'Impossible de choisir une photo.');
    }
  };

  const handleSubmitSelectedProof = () => {
    if (!selectedProofImage || !selectedChallenge || !user) return;
    
    const userChallenge = userChallenges.find(
      uc => uc.challengeId === selectedChallenge.id && uc.userId === user.id
    );
    
    if (!userChallenge) return;
    
    const proof = {
      type: 'photo',
      data: selectedProofImage,
    };
    
    handleSubmitProof(userChallenge.id, proof);
  };

  const handleVote = async (participationId: string, vote: 'yes' | 'no') => {
    if (!user) return;
    
    try {
      await voteOnParticipation(participationId, user.id, vote);
      Alert.alert(
        t('common.success'),
        'Votre vote a été enregistré !',
        [{ text: t('common.ok') }]
      );
    } catch (error) {
      Alert.alert(t('common.error'), 'Impossible d\'enregistrer votre vote.');
    }
  };

  const getTimeLeft = (endDate: string) => {
    const days = getDaysLeft(endDate);
    const hours = getHoursLeft(endDate);
    
    if (days > 0) {
      return t('challenges.days_left', { count: days });
    } else if (hours > 0) {
      return t('challenges.hours_left', { count: hours });
    } else {
      return t('challenges.completed');
    }
  };

  const getChallengeStatus = (challengeId: string) => {
    if (!user) return 'not_joined';
    
    const userChallenge = userChallenges.find(
      uc => uc.challengeId === challengeId && uc.userId === user.id
    );
    
    if (!userChallenge) return 'not_joined';
    
    return userChallenge.status;
  };

  const renderChallenge = (challenge: any) => {
    const status = getChallengeStatus(challenge.id);
    const timeLeft = getTimeLeft(challenge.endDate);
    const isActive = getDaysLeft(challenge.endDate) > 0;
    
    return (
      <View key={challenge.id} style={[
        styles.challengeCard,
        challenge.isPremium && styles.premiumChallenge
      ]}>
        <View style={styles.challengeHeader}>
          <View style={[styles.challengeIconContainer, { backgroundColor: challenge.color + '20' }]}>
            <Text style={styles.challengeIcon}>{challenge.icon}</Text>
          </View>
          
          <View style={styles.challengeInfo}>
            <View style={styles.challengeTitleRow}>
              <Text style={styles.challengeTitle}>{challenge.title.fr}</Text>
              {challenge.isPremium && (
                <View style={styles.premiumBadge}>
                  <Star size={12} color={COLORS.accent} />
                  <Text style={styles.premiumText}>Premium</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.challengeDescription}>{challenge.description.fr}</Text>
            
            <View style={styles.challengeStats}>
              <View style={styles.statItem}>
                <Users size={14} color={COLORS.darkGray} />
                <Text style={styles.statText}>{challenge.participants}</Text>
              </View>
              <View style={styles.statItem}>
                <Clock size={14} color={COLORS.darkGray} />
                <Text style={styles.statText}>{timeLeft}</Text>
              </View>
              <View style={styles.statItem}>
                <Gift size={14} color={COLORS.accent} />
                <Text style={styles.pointsText}>{challenge.points} pts</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.challengeActions}>
          {status === 'not_joined' && isActive && (
            <Button
              title={t('challenges.join_challenge')}
              variant="primary"
              size="small"
              onPress={() => {
                setSelectedChallenge(challenge);
                setShowJoinModal(true);
              }}
              disabled={isJoining}
            />
          )}
          
          {status === 'active' && (
            <Button
              title={t('challenges.upload_proof')}
              variant="outline"
              size="small"
              onPress={() => {
                setSelectedChallenge(challenge);
                setShowProofModal(true);
              }}
              disabled={isSubmittingProof}
            />
          )}
          
          {status === 'pending_validation' && (
            <View style={styles.pendingContainer}>
              <Eye size={16} color={COLORS.warning} />
              <Text style={styles.pendingText}>{t('challenges.validation_pending')}</Text>
            </View>
          )}
          
          {status === 'completed' && (
            <View style={styles.completedContainer}>
              <CheckCircle size={16} color={COLORS.success} />
              <Text style={styles.completedText}>{t('challenges.completed')}</Text>
            </View>
          )}
          


        </View>
      </View>
    );
  };

  const renderLeaderboardItem = (item: any) => (
    <View key={item.userId} style={styles.leaderboardItem}>
      <View style={styles.rankContainer}>
        <Text style={styles.rankText}>{getRankIcon(item.rank)}</Text>
      </View>
      
      <Image source={{ uri: item.userPhoto }} style={styles.leaderboardAvatar} />
      
      <View style={styles.leaderboardInfo}>
        <Text style={styles.leaderboardName}>{item.userName}</Text>
        <View style={styles.leaderboardStats}>
          <Text style={styles.pointsText}>{item.totalPoints} points</Text>
          <Text style={styles.badgesText}>{item.badges.length} badges</Text>
        </View>
      </View>
    </View>
  );

  const renderMyChallenge = (userChallenge: any) => {
    const challenge = challenges.find(c => c.id === userChallenge.challengeId);
    if (!challenge) return null;
    
    return (
      <View key={userChallenge.id} style={styles.myChallengeCard}>
        <View style={styles.myChallengeHeader}>
          <Text style={styles.myChallengeIcon}>{challenge.icon}</Text>
          <View style={styles.myChallengeInfo}>
            <Text style={styles.myChallengeTitle}>{challenge.title.fr}</Text>
            <Text style={styles.myChallengeStatus}>
              {userChallenge.status === 'active' && t('challenges.in_progress')}
              {userChallenge.status === 'completed' && t('challenges.completed')}
              {userChallenge.status === 'pending_validation' && t('challenges.validation_pending')}
            </Text>
          </View>
          <View style={styles.myChallengePoints}>
            <Text style={styles.pointsEarned}>{userChallenge.pointsEarned}</Text>
            <Text style={styles.pointsLabel}>pts</Text>
          </View>
        </View>
        
        {userChallenge.status === 'active' && (
          <Button
            title={t('challenges.upload_proof')}
            variant="outline"
            size="small"
            onPress={() => {
              setSelectedChallenge(challenge);
              setShowProofModal(true);
            }}
          />
        )}
      </View>
    );
  };

  const renderParticipation = (participation: any) => {
    const challenge = challenges.find(c => c.id === participation.challengeId);
    if (!challenge) return null;
    
    const userVote = user ? getUserVote(participation.id, user.id) : undefined;
    const hasVoted = user ? hasUserVoted(participation.id, user.id) : false;
    
    return (
      <View key={participation.id} style={styles.participationCard}>
        <View style={styles.participationHeader}>
          <Image source={{ uri: participation.userPhoto }} style={styles.participationAvatar} />
          <View style={styles.participationInfo}>
            <Text style={styles.participationUser}>{participation.userName}</Text>
            <Text style={styles.participationChallenge}>{challenge.title.fr}</Text>
          </View>
          <Text style={styles.participationIcon}>{challenge.icon}</Text>
        </View>
        
        {participation.proof.type === 'photo' && (
          <Image source={{ uri: participation.proof.data }} style={styles.participationProof} />
        )}
        
        <View style={styles.participationVoting}>
          <View style={styles.votingResults}>
            <Text style={styles.votingText}>
              {t('challenges.votes_count', { count: participation.totalVotes })}
            </Text>
            <Text style={styles.votingBreakdown}>
              {participation.yesVotes} {t('challenges.vote_yes')} • {participation.noVotes} {t('challenges.vote_no')}
            </Text>
          </View>
          
          {user && !hasVoted && participation.userId !== user.id && (
            <View style={styles.votingButtons}>
              <TouchableOpacity
                style={[styles.voteButton, styles.yesButton]}
                onPress={() => handleVote(participation.id, 'yes')}
                disabled={isVoting}
              >
                <ThumbsUp size={16} color={COLORS.white} />
                <Text style={styles.voteButtonText}>{t('challenges.vote_yes')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.voteButton, styles.noButton]}
                onPress={() => handleVote(participation.id, 'no')}
                disabled={isVoting}
              >
                <ThumbsDown size={16} color={COLORS.white} />
                <Text style={styles.voteButtonText}>{t('challenges.vote_no')}</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {hasVoted && (
            <View style={styles.votedContainer}>
              <Text style={styles.votedText}>
                Vous avez voté : {userVote === 'yes' ? '👍' : '👎'}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t('navigation.challenges'),
        }}
      />

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'challenges' && styles.activeTab]}
          onPress={() => setActiveTab('challenges')}
        >
          <Trophy size={18} color={activeTab === 'challenges' ? COLORS.primary : COLORS.darkGray} />
          <Text style={[styles.tabText, activeTab === 'challenges' && styles.activeTabText]}>
            {t('challenges.community_challenges')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my_challenges' && styles.activeTab]}
          onPress={() => setActiveTab('my_challenges')}
        >
          <Users size={18} color={activeTab === 'my_challenges' ? COLORS.primary : COLORS.darkGray} />
          <Text style={[styles.tabText, activeTab === 'my_challenges' && styles.activeTabText]}>
            {t('challenges.my_challenges')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'leaderboard' && styles.activeTab]}
          onPress={() => setActiveTab('leaderboard')}
        >
          <Award size={18} color={activeTab === 'leaderboard' ? COLORS.primary : COLORS.darkGray} />
          <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.activeTabText]}>
            {t('challenges.leaderboard')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'challenges' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('challenges.active_challenges')}</Text>
              {isPremium && (
                <TouchableOpacity style={styles.addButton}>
                  <Plus size={20} color={COLORS.primary} />
                  <Text style={styles.addButtonText}>{t('challenges.propose_challenge')}</Text>
                </TouchableOpacity>
              )}
            </View>
            {challenges.filter(c => getDaysLeft(c.endDate) > 0).map(renderChallenge)}
            
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('challenges.history')}</Text>
            </View>
            {challenges.filter(c => getDaysLeft(c.endDate) === 0).map(renderChallenge)}
            
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Participations en attente de vote</Text>
            </View>
            {participations.filter(p => p.status === 'pending').map(renderParticipation)}
          </>
        )}
        
        {activeTab === 'my_challenges' && user && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('challenges.in_progress')}</Text>
            </View>
            {getUserActiveChallenges(user.id).map(renderMyChallenge)}
            
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('challenges.validation_pending')}</Text>
            </View>
            {getUserPendingChallenges(user.id).map(renderMyChallenge)}
            
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('challenges.history')}</Text>
            </View>
            {getUserCompletedChallenges(user.id).map(renderMyChallenge)}
          </>
        )}
        
        {activeTab === 'leaderboard' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('challenges.leaderboard')}</Text>
            </View>
            {leaderboard.map(renderLeaderboardItem)}
          </>
        )}
      </ScrollView>

      {/* Join Challenge Modal */}
      <Modal
        visible={showJoinModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rejoindre le défi</Text>
            {selectedChallenge && (
              <>
                <Text style={styles.modalChallenge}>{selectedChallenge.title.fr}</Text>
                <Text style={styles.modalDescription}>{selectedChallenge.description.fr}</Text>
                <Text style={styles.modalPoints}>Récompense: {selectedChallenge.points} points</Text>
                {selectedChallenge.badge && (
                  <Text style={styles.modalBadge}>Badge: {selectedChallenge.badge}</Text>
                )}
              </>
            )}
            
            <View style={styles.modalButtons}>
              <Button
                title={t('common.cancel')}
                variant="outline"
                onPress={() => setShowJoinModal(false)}
                style={styles.modalButton}
              />
              <Button
                title={t('challenges.join_challenge')}
                variant="primary"
                onPress={() => selectedChallenge && handleJoinChallenge(selectedChallenge.id)}
                disabled={isJoining}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Submit Proof Modal */}
      <Modal
        visible={showProofModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProofModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Soumettre une preuve</Text>
            {selectedChallenge && (
              <>
                <Text style={styles.modalChallenge}>{selectedChallenge.title.fr}</Text>
                <Text style={styles.modalDescription}>
                  Téléchargez une photo ou vidéo prouvant que vous avez relevé ce défi.
                </Text>
              </>
            )}
            
            {selectedProofImage ? (
              <View style={styles.selectedProofContainer}>
                <Image source={{ uri: selectedProofImage }} style={styles.selectedProofImage} />
                <TouchableOpacity
                  style={styles.changePhotoButton}
                  onPress={() => setSelectedProofImage(null)}
                >
                  <Text style={styles.changePhotoText}>Changer la photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.proofOptions}>
                <TouchableOpacity style={styles.proofOption} onPress={handleTakePhoto}>
                  <Camera size={24} color={COLORS.primary} />
                  <Text style={styles.proofOptionText}>Prendre une photo</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.proofOption} onPress={handlePickFromGallery}>
                  <Upload size={24} color={COLORS.primary} />
                  <Text style={styles.proofOptionText}>Choisir depuis la galerie</Text>
                </TouchableOpacity>
              </View>
            )}
            
            <View style={styles.modalButtons}>
              <Button
                title={t('common.cancel')}
                variant="outline"
                onPress={() => {
                  setShowProofModal(false);
                  setSelectedProofImage(null);
                }}
                style={styles.modalButton}
              />
              {selectedProofImage && (
                <Button
                  title="Télécharger une preuve"
                  variant="primary"
                  onPress={handleSubmitSelectedProof}
                  disabled={isSubmittingProof}
                  style={styles.modalButton}
                />
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.mediumGray,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.darkGray,
    marginLeft: 6,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray,
  },
  addButtonText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  challengeCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    ...SHADOWS.small,
  },
  premiumChallenge: {
    borderWidth: 1,
    borderColor: COLORS.accent + '40',
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  challengeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  challengeIcon: {
    fontSize: 24,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
    flex: 1,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  premiumText: {
    fontSize: 10,
    color: COLORS.accent,
    fontWeight: '600',
    marginLeft: 2,
  },
  challengeDescription: {
    fontSize: 13,
    color: COLORS.darkGray,
    lineHeight: 18,
    marginBottom: 8,
  },
  challengeStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    color: COLORS.darkGray,
    marginLeft: 4,
  },
  pointsText: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '600',
    marginLeft: 4,
  },
  challengeActions: {
    marginTop: 12,
  },
  pendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pendingText: {
    fontSize: 12,
    color: COLORS.warning,
    fontWeight: '600',
    marginLeft: 6,
  },
  completedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  completedText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
    marginLeft: 6,
  },
  joinedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinedText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: 6,
  },
  myChallengeCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    ...SHADOWS.small,
  },
  myChallengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  myChallengeIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  myChallengeInfo: {
    flex: 1,
  },
  myChallengeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 2,
  },
  myChallengeStatus: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  myChallengePoints: {
    alignItems: 'center',
  },
  pointsEarned: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  pointsLabel: {
    fontSize: 10,
    color: COLORS.darkGray,
  },
  participationCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    ...SHADOWS.small,
  },
  participationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  participationAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  participationInfo: {
    flex: 1,
  },
  participationUser: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },
  participationChallenge: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  participationIcon: {
    fontSize: 20,
  },
  participationProof: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  participationVoting: {
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: 12,
  },
  votingResults: {
    marginBottom: 12,
  },
  votingText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 2,
  },
  votingBreakdown: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  votingButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  voteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  yesButton: {
    backgroundColor: COLORS.success,
  },
  noButton: {
    backgroundColor: COLORS.error,
  },
  voteButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  votedContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  votedText: {
    fontSize: 12,
    color: COLORS.darkGray,
    fontStyle: 'italic',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    ...SHADOWS.small,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 18,
    fontWeight: '700',
  },
  leaderboardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  leaderboardStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgesText: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalChallenge: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalPoints: {
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalBadge: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
  },
  proofOptions: {
    marginVertical: 16,
  },
  proofOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
    marginBottom: 12,
  },
  proofOptionText: {
    fontSize: 14,
    color: COLORS.black,
    fontWeight: '500',
    marginLeft: 12,
  },
  selectedProofContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  selectedProofImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  changePhotoButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
  },
  changePhotoText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
});