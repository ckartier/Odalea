import React, { useState, useRef } from 'react';
import { View, StyleSheet, Text, Pressable, Dimensions, Animated, Image, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { COLORS, RADIUS, SPACING, TYPOGRAPHY, ANIMATION } from '@/theme/tokens';
import { useOnboarding } from '@/hooks/onboarding-store';


const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    title: 'Des rencontres pour eux',
    subtitle: 'Aide ton animal à créer des liens adaptés à sa personnalité.',
    image: 'https://images.unsplash.com/photo-1548681528-6a5c45b66b42?w=800&q=80',
  },
  {
    title: 'Des profils pensés avec soin',
    subtitle: 'Personnalité, affinités et intentions claires pour chaque animal.',
    image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&q=80',
  },
  {
    title: 'Des rencontres à leur rythme',
    subtitle: 'Découvre, échange et organise des rencontres adaptées.',
    image: 'https://images.unsplash.com/photo-1501820488136-72669149e0d4?w=800&q=80',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { complete } = useOnboarding();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: ANIMATION.duration.slow,
      useNativeDriver: true,
    }).start();
  }, [currentIndex, fadeAnim]);

  const handleNext = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (currentIndex < SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * SCREEN_WIDTH,
        animated: true,
      });
    } else {
      complete();
      router.push('/auth/signup' as any);
    }
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
      >
        {SLIDES.map((slide, index) => (
          <View key={index} style={styles.slide}>
            <Animated.View style={[styles.imageContainer, { opacity: fadeAnim }]}>
              <Image
                source={{ uri: slide.image }}
                style={styles.image}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay} />
            </Animated.View>
            
            <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.subtitle}>{slide.subtitle}</Text>
            </Animated.View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.nextButton,
            pressed && styles.nextButtonPressed,
          ]}
        >
          {isLastSlide ? (
            <Text style={styles.nextButtonText}>Commencer</Text>
          ) : (
            <ArrowRight size={24} color={COLORS.surface} strokeWidth={2.5} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.onboardingBlue,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxl * 2,
  },
  image: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    borderRadius: RADIUS.card * 2,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  textContainer: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
    alignItems: 'center',
  },
  title: {
    ...TYPOGRAPHY.title,
    fontSize: 32,
    color: COLORS.surface,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  dotActive: {
    backgroundColor: COLORS.surface,
    width: 24,
  },
  nextButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonPressed: {
    opacity: 0.8,
  },
  nextButtonText: {
    ...TYPOGRAPHY.button,
    fontSize: 14,
    color: COLORS.surface,
  },
});
