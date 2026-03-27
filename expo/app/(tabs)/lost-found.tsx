import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import { useI18n } from '@/hooks/i18n-store';
import { useLostFound } from '@/hooks/lost-found-store';
import { useTheme } from '@/hooks/theme-store';
import { Plus, MapPin, Clock, Heart, AlertTriangle } from 'lucide-react-native';
import Button from '@/components/Button';

export default function LostFoundScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { lostPets, isLoading } = useLostFound();
  const { getThemedColor } = useTheme();

  const handleReportLost = () => {
    router.push('/lost-found/report');
  };

  const handlePetPress = (petId: string) => {
    router.push(`/lost-found/${petId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lost':
        return COLORS.lost;
      case 'found':
        return COLORS.found;
      case 'reunited':
        return COLORS.success;
      default:
        return COLORS.darkGray;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'lost':
        return 'Perdu';
      case 'found':
        return 'Trouvé';
      case 'reunited':
        return 'Retrouvé';
      default:
        return status;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Il y a moins d\'1h';
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: getThemedColor('background') }]}>
      <Stack.Screen 
        options={{ 
          title: t('lost_found.lost_found'),
          headerStyle: { backgroundColor: getThemedColor('background') },
          headerTintColor: COLORS.white,
        }} 
      />
      <StatusBar style="light" />

      {/* Header with Report Button */}
      <View style={styles.header}>
        <Pressable 
          style={[styles.reportButton, { backgroundColor: COLORS.emergency }]} 
          onPress={handleReportLost}
        >
          <Plus size={20} color={COLORS.white} />
          <Text style={styles.reportButtonText}>Signaler un animal perdu</Text>
        </Pressable>
      </View>



      {/* Pet List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {lostPets.length === 0 ? (
          <View style={styles.emptyState}>
            <AlertTriangle size={64} color={COLORS.darkGray} />
            <Text style={styles.emptyTitle}>Aucun signalement trouvé</Text>
            <Text style={styles.emptyDescription}>
              Aucun animal signalé dans votre région pour le moment.
            </Text>
            <Button
              title="Signaler un animal perdu"
              onPress={handleReportLost}
              variant="primary"
              style={styles.emptyButton}
            />
          </View>
        ) : (
          <View style={styles.petList}>
            {lostPets.map((pet) => (
              <Pressable
                key={pet.id}
                style={styles.petCard}
                onPress={() => handlePetPress(pet.id)}
              >
                <View style={styles.petImageContainer}>
                  <Image
                    source={{ uri: pet.photos[0] || 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=400' }}
                    style={styles.petImage}
                  />
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(pet.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(pet.status)}</Text>
                  </View>
                  {pet.reward && (
                    <View style={styles.rewardBadge}>
                      <Heart size={12} color={COLORS.white} />
                      <Text style={styles.rewardText}>{pet.reward}€</Text>
                    </View>
                  )}
                </View>

                <View style={styles.petInfo}>
                  <Text style={styles.petName}>{pet.petName}</Text>
                  <Text style={styles.petSpecies}>{pet.species} • {pet.breed}</Text>
                  
                  <View style={styles.locationRow}>
                    <MapPin size={14} color={COLORS.darkGray} />
                    <Text style={styles.locationText}>{pet.lastSeenLocation.address}</Text>
                  </View>
                  
                  <View style={styles.timeRow}>
                    <Clock size={14} color={COLORS.darkGray} />
                    <Text style={styles.timeText}>{formatTimeAgo(pet.createdAt)}</Text>
                  </View>

                  <Text style={styles.description} numberOfLines={2}>
                    {pet.description}
                  </Text>

                  {pet.responses.length > 0 && (
                    <Text style={styles.responsesCount}>
                      {pet.responses.length} réponse{pet.responses.length > 1 ? 's' : ''}
                    </Text>
                  )}
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 8,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  reportButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },

  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyButton: {
    minWidth: 200,
  },
  petList: {
    padding: 16,
    gap: 16,
  },
  petCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  petImageContainer: {
    position: 'relative',
    height: 200,
  },
  petImage: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  rewardBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.emergency,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  petInfo: {
    padding: 16,
  },
  petName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 4,
  },
  petSpecies: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.darkGray,
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  timeText: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  description: {
    fontSize: 14,
    color: COLORS.black,
    lineHeight: 20,
    marginBottom: 8,
  },
  responsesCount: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
});