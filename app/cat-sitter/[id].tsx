import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS, DIMENSIONS } from '@/constants/colors';
import { useI18n } from '@/hooks/i18n-store';
import { useAuth } from '@/hooks/auth-store';
import {
  Heart,
  Star,
  MapPin,
  Clock,
  Euro,
  Calendar,
  Shield,
  Award,
  MessageCircle,
  Phone,
  Mail,
  CheckCircle,
  Users,
  Camera,
  Globe,
  ArrowLeft,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface CatSitter {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  location: string;
  distance: number;
  isAvailable: boolean;
  isVerified: boolean;
  isPremium: boolean;
  services: string[];
  responseTime: string;
  totalBookings: number;
  description: string;
  petTypes: string[];
  languages: string[];
  experience: string;
  insurance: boolean;
  emergencyContact: boolean;
  photos: string[];
  reviews: Array<{
    id: string;
    userName: string;
    userAvatar: string;
    rating: number;
    comment: string;
    date: string;
    petName: string;
  }>;
  availability: {
    [key: string]: { start: string; end: string; available: boolean };
  };
}

const mockCatSitter: CatSitter = {
  id: '1',
  name: 'Marie Dubois',
  avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?q=80&w=400',
  rating: 4.9,
  reviewCount: 127,
  hourlyRate: 15,
  location: 'Montmartre, Paris',
  distance: 0.8,
  isAvailable: true,
  isVerified: true,
  isPremium: true,
  services: ['Pet Sitting', 'Dog Walking', 'Overnight Care', 'Pet Grooming', 'Pet Training'],
  responseTime: '< 1 hour',
  totalBookings: 234,
  description: 'Passionate about animals with 5 years of experience. I love taking care of cats and dogs of all sizes. I provide personalized care and lots of love to each pet. Available for short-term and long-term care.',
  petTypes: ['Cats', 'Dogs', 'Small Animals', 'Birds'],
  languages: ['French', 'English', 'Spanish'],
  experience: '5+ years',
  insurance: true,
  emergencyContact: true,
  photos: [
    'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=400',
    'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=400',
    'https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=400',
    'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?q=80&w=400',
  ],
  reviews: [
    {
      id: '1',
      userName: 'Sophie Martin',
      userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100',
      rating: 5,
      comment: 'Marie took excellent care of my cat Luna. She sent regular updates and photos. Highly recommended!',
      date: '2024-01-15',
      petName: 'Luna',
    },
    {
      id: '2',
      userName: 'Pierre Durand',
      userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100',
      rating: 5,
      comment: 'Very professional and caring. My dog Max was happy and well-cared for.',
      date: '2024-01-10',
      petName: 'Max',
    },
    {
      id: '3',
      userName: 'Claire Rousseau',
      userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100',
      rating: 4,
      comment: 'Great communication and reliable service. Will book again!',
      date: '2024-01-05',
      petName: 'Milo',
    },
  ],
  availability: {
    monday: { start: '08:00', end: '18:00', available: true },
    tuesday: { start: '08:00', end: '18:00', available: true },
    wednesday: { start: '08:00', end: '18:00', available: true },
    thursday: { start: '08:00', end: '18:00', available: true },
    friday: { start: '08:00', end: '18:00', available: true },
    saturday: { start: '09:00', end: '17:00', available: true },
    sunday: { start: '10:00', end: '16:00', available: false },
  },
};

export default function CatSitterProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { t } = useI18n();
  const { user } = useAuth();
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // In a real app, fetch sitter data based on ID
  const sitter = mockCatSitter;

  const handleBookSitter = () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to book a sitter.');
      return;
    }
    router.push(`/booking/${sitter.id}`);
  };

  const handleMessageSitter = () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to message a sitter.');
      return;
    }
    router.push(`/messages/new?userId=${sitter.id}`);
  };

  const handleCallSitter = () => {
    Alert.alert('Call Sitter', 'This would open the phone app to call the sitter.');
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={16}
          color={i <= rating ? COLORS.accent : COLORS.mediumGray}
          fill={i <= rating ? COLORS.accent : 'transparent'}
        />
      );
    }
    return stars;
  };

  const renderAvailabilityDay = (day: string, schedule: { start: string; end: string; available: boolean }) => (
    <View key={day} style={styles.availabilityDay}>
      <Text style={styles.dayName}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
      {schedule.available ? (
        <Text style={styles.availableTime}>{schedule.start} - {schedule.end}</Text>
      ) : (
        <Text style={styles.unavailableText}>Unavailable</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: sitter.name,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color={COLORS.black} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: DIMENSIONS.COMPONENT_SIZES.HEADER_HEIGHT + DIMENSIONS.SPACING.md }
        ]} 
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, SHADOWS.medium]}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: sitter.avatar }} style={styles.avatar} />
            {sitter.isPremium && (
              <View style={styles.premiumBadge}>
                <Heart size={16} color={COLORS.premium} />
              </View>
            )}
          </View>

          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.sitterName}>{sitter.name}</Text>
              {sitter.isVerified && (
                <Shield size={20} color={COLORS.success} />
              )}
            </View>

            <View style={styles.ratingRow}>
              <View style={styles.starsContainer}>
                {renderStars(Math.floor(sitter.rating))}
              </View>
              <Text style={styles.rating}>{sitter.rating}</Text>
              <Text style={styles.reviewCount}>({sitter.reviewCount} reviews)</Text>
            </View>

            <View style={styles.locationRow}>
              <MapPin size={16} color={COLORS.darkGray} />
              <Text style={styles.location}>{sitter.location}</Text>
              <Text style={styles.distance}>• {sitter.distance}km away</Text>
            </View>

            <View style={styles.priceRow}>
              <Euro size={18} color={COLORS.catSitter} />
              <Text style={styles.price}>{sitter.hourlyRate}€/hour</Text>
            </View>
          </View>

          <View style={[styles.availabilityBadge, sitter.isAvailable ? styles.available : styles.busy]}>
            <Text style={[styles.availabilityText, sitter.isAvailable ? styles.availableText : styles.busyText]}>
              {sitter.isAvailable ? 'Available' : 'Busy'}
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={[styles.statsContainer, SHADOWS.small]}>
          <View style={styles.stat}>
            <Clock size={20} color={COLORS.primary} />
            <Text style={styles.statLabel}>Response</Text>
            <Text style={styles.statValue}>{sitter.responseTime}</Text>
          </View>
          <View style={styles.stat}>
            <Award size={20} color={COLORS.primary} />
            <Text style={styles.statLabel}>Bookings</Text>
            <Text style={styles.statValue}>{sitter.totalBookings}</Text>
          </View>
          <View style={styles.stat}>
            <Users size={20} color={COLORS.primary} />
            <Text style={styles.statLabel}>Experience</Text>
            <Text style={styles.statValue}>{sitter.experience}</Text>
          </View>
        </View>

        {/* Description */}
        <View style={[styles.section, SHADOWS.small]}>
          <Text style={styles.sectionTitle}>About Me</Text>
          <Text style={styles.description}>{sitter.description}</Text>
        </View>

        {/* Services */}
        <View style={[styles.section, SHADOWS.small]}>
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.servicesContainer}>
            {sitter.services.map((service, index) => (
              <View key={index} style={styles.serviceTag}>
                <CheckCircle size={14} color={COLORS.success} />
                <Text style={styles.serviceText}>{service}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pet Types & Languages */}
        <View style={[styles.section, SHADOWS.small]}>
          <Text style={styles.sectionTitle}>Pet Types & Languages</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pet Types:</Text>
            <Text style={styles.infoValue}>{sitter.petTypes.join(', ')}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Globe size={16} color={COLORS.darkGray} />
            <Text style={styles.infoValue}>{sitter.languages.join(', ')}</Text>
          </View>
        </View>

        {/* Photos */}
        <View style={[styles.section, SHADOWS.small]}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosContainer}>
            {sitter.photos.map((photo, index) => (
              <TouchableOpacity
                key={index}
                style={styles.photoContainer}
                onPress={() => setSelectedPhotoIndex(index)}
              >
                <Image source={{ uri: photo }} style={styles.photo} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Availability */}
        <View style={[styles.section, SHADOWS.small]}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <View style={styles.availabilityContainer}>
            {Object.entries(sitter.availability).map(([day, schedule]) =>
              renderAvailabilityDay(day, schedule)
            )}
          </View>
        </View>

        {/* Reviews */}
        <View style={[styles.section, SHADOWS.small]}>
          <Text style={styles.sectionTitle}>Reviews ({sitter.reviewCount})</Text>
          {sitter.reviews.map((review) => (
            <View key={review.id} style={styles.reviewContainer}>
              <View style={styles.reviewHeader}>
                <Image source={{ uri: review.userAvatar }} style={styles.reviewAvatar} />
                <View style={styles.reviewInfo}>
                  <Text style={styles.reviewerName}>{review.userName}</Text>
                  <View style={styles.reviewRating}>
                    {renderStars(review.rating)}
                    <Text style={styles.reviewDate}>{review.date}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
              <Text style={styles.reviewPetName}>Pet: {review.petName}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.actionContainer, SHADOWS.large]}>
        <TouchableOpacity
          style={[styles.actionButton, styles.callButton]}
          onPress={handleCallSitter}
        >
          <Phone size={20} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.messageButton]}
          onPress={handleMessageSitter}
        >
          <MessageCircle size={20} color={COLORS.primary} />
          <Text style={styles.messageButtonText}>Message</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.bookButton, !sitter.isAvailable && styles.disabledButton]}
          onPress={handleBookSitter}
          disabled={!sitter.isAvailable}
        >
          <Calendar size={20} color={COLORS.white} />
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.screenBackground,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: COLORS.white,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  premiumBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sitterName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.black,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  reviewCount: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  distance: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: COLORS.catSitter,
  },
  availabilityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  available: {
    backgroundColor: COLORS.available,
  },
  busy: {
    backgroundColor: COLORS.busy,
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  availableText: {
    color: COLORS.white,
  },
  busyText: {
    color: COLORS.white,
  },
  statsContainer: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
  },
  stat: {
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.black,
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
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.darkGray,
  },
  servicesContainer: {
    gap: 12,
  },
  serviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serviceText: {
    fontSize: 16,
    color: COLORS.black,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.darkGray,
    flex: 1,
  },
  photosContainer: {
    marginTop: 8,
  },
  photoContainer: {
    marginRight: 12,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  availabilityContainer: {
    gap: 8,
  },
  availabilityDay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: COLORS.black,
    textTransform: 'capitalize',
  },
  availableTime: {
    fontSize: 14,
    color: COLORS.success,
  },
  unavailableText: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  reviewContainer: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  reviewInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 4,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewDate: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  reviewPetName: {
    fontSize: 12,
    color: COLORS.primary,
    fontStyle: 'italic',
  },
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  callButton: {
    width: 50,
    backgroundColor: COLORS.success,
  },
  messageButton: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  messageButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.primary,
  },
  bookButton: {
    flex: 1,
    backgroundColor: COLORS.catSitter,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.white,
  },
  disabledButton: {
    backgroundColor: COLORS.mediumGray,
    opacity: 0.6,
  },
});