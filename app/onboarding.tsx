import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  Dimensions, 
  TouchableOpacity,
  Animated,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '@/constants/colors';

import { useI18n } from '@/hooks/i18n-store';
import { 
  ChevronLeft, 
  ChevronRight,
  Heart,
  MapPin,
  MessageCircle
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  titleKey: string;
  descriptionKey: string;
  gradientColors: readonly [string, string, string];
}

const slides: OnboardingSlide[] = [
  {
    id: 'welcome',
    icon: Heart,
    titleKey: 'onboarding.welcome.title',
    descriptionKey: 'onboarding.welcome.description',
    gradientColors: ['#E8B4D4', '#C8A2C8', '#A8B4D8'] as const,
  },
  {
    id: 'connect',
    icon: MapPin,
    titleKey: 'onboarding.connect.title',
    descriptionKey: 'onboarding.connect.description',
    gradientColors: ['#B8C8E8', '#C8B4D8', '#D8B4C8'] as const,
  },
  {
    id: 'chat',
    icon: MessageCircle,
    titleKey: 'onboarding.chat.title',
    descriptionKey: 'onboarding.chat.description',
    gradientColors: ['#A8D8E8', '#B8C8D8', '#C8B8D8'] as const,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const heartbeatAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const chatPulseAnim = useRef(new Animated.Value(1)).current;
  const gradientAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const heartbeatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(heartbeatAnim, {
          toValue: 1.15,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(heartbeatAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(heartbeatAnim, {
          toValue: 1.15,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(heartbeatAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );

    const bounceAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -12,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    const chatPulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(chatPulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(chatPulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    const gradientAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(gradientAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: false,
        }),
        Animated.timing(gradientAnim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: false,
        }),
      ])
    );

    heartbeatAnimation.start();
    bounceAnimation.start();
    chatPulseAnimation.start();
    gradientAnimation.start();

    return () => {
      heartbeatAnimation.stop();
      bounceAnimation.stop();
      chatPulseAnimation.stop();
      gradientAnimation.stop();
    };
  }, [heartbeatAnim, bounceAnim, chatPulseAnim, gradientAnim]);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        const next = currentSlide + 1;
        setCurrentSlide(next);
        scrollViewRef.current?.scrollTo({ x: next * width, animated: true });
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        const prev = currentSlide - 1;
        setCurrentSlide(prev);
        scrollViewRef.current?.scrollTo({ x: prev * width, animated: true });
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const handleComplete = () => {
    router.replace('/auth/signup');
  };

  const renderSlide = (slide: OnboardingSlide, index: number) => {
    const IconComponent = slide.icon;
    
    let iconTransform: Array<{ scale?: Animated.Value; translateY?: Animated.Value }> = [];
    if (index === 0) {
      iconTransform = [{ scale: heartbeatAnim }];
    } else if (index === 1) {
      iconTransform = [{ translateY: bounceAnim }];
    } else if (index === 2) {
      iconTransform = [{ scale: chatPulseAnim }];
    }

    return (
      <View key={slide.id} style={styles.slide}>
        <LinearGradient
          colors={slide.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[styles.slideContent, { opacity: fadeAnim }]}>
          <Animated.View 
            style={[
              styles.iconContainer,
              {
                transform: iconTransform,
              },
            ]}
          >
            <IconComponent size={80} color={COLORS.white} />
          </Animated.View>
          
          <Text style={styles.title}>
            {t(slide.titleKey)}
          </Text>
          
          <Text style={styles.description}>
            {t(slide.descriptionKey)}
          </Text>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentSlide(idx);
        }}
        style={styles.scrollView}
      >
        {slides.map((slide, index) => renderSlide(slide, index))}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          style={[styles.navButton, currentSlide === 0 && styles.navButtonDisabled]}
          onPress={handlePrevious}
          disabled={currentSlide === 0}
        >
          <ChevronLeft size={24} color={currentSlide === 0 ? COLORS.mediumGray : COLORS.white} />
        </TouchableOpacity>

        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentSlide && styles.paginationDotActive
              ]}
            />
          ))}
        </View>

        {currentSlide < slides.length - 1 ? (
          <TouchableOpacity
            style={styles.navButton}
            onPress={handleNext}
          >
            <ChevronRight size={24} color={COLORS.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            accessibilityRole="button"
            testID="cta-start"
            style={[styles.ctaButton]}
            onPress={handleComplete}
          >
            <Text style={styles.ctaText}>Commencer</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    overflow: 'hidden',
  },
  slideContent: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconContainer: {
    marginBottom: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 60,
    padding: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },

  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
    marginBottom: 32,
  },
  languageContainer: {
    width: '100%',
    gap: 16,
  },
  languageButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageButtonActive: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.white,
  },
  languageText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.white,
  },
  languageTextActive: {
    color: COLORS.primary,
  },
  gdprContainer: {
    width: '100%',
    gap: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.white,
  },
  checkmark: {
    color: COLORS.success,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  checkboxText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.white,
    lineHeight: 22,
  },
  linkButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  linkText: {
    fontSize: 14,
    color: COLORS.white,
    textDecorationLine: 'underline',
  },

  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingTop: 20,
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
  },
  ctaText: {
    color: COLORS.primary,
    fontWeight: '700' as const,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  pagination: {
    flexDirection: 'row',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  paginationDotActive: {
    backgroundColor: COLORS.white,
    width: 24,
  },
});