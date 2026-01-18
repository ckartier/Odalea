import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  Dimensions,
  ImageBackground,
  ScrollView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/theme/tokens';
import { useOnboarding } from '@/hooks/onboarding-store';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SLIDES = [
  {
    title: 'Des rencontres pour eux',
    subtitle: 'Aide ton animal à créer des liens adaptés à sa personnalité.',
    image: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/0jfm5p4d0r89ncjsaotfp',
  },
  {
    title: 'Des profils pensés avec soin',
    subtitle: 'Personnalité, affinités et intentions claires pour chaque animal.',
    image: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/3z6mfb118zpggrt08bvsq',
  },
  {
    title: 'Des rencontres à leur rythme',
    subtitle: 'Découvre, échange et organise des rencontres adaptées.',
    image: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/paty2cb5t1ei8rkwz5puv',
  },
];

const MODAL_HEIGHT = 240;

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { complete } = useOnboarding();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleNext = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
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
    if (index !== currentIndex && index >= 0 && index < SLIDES.length) {
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
        style={styles.scrollView}
      >
        {SLIDES.map((slide, index) => (
          <View key={index} style={styles.slide}>
            <ImageBackground
              source={{ uri: slide.image }}
              style={styles.backgroundImage}
              resizeMode="cover"
            >
              <View style={styles.imageOverlay} />
            </ImageBackground>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.modalContainer, { paddingBottom: insets.bottom + 14 }]}>
        <View style={styles.modalContent}>
          <Text style={styles.title} numberOfLines={2}>
            {SLIDES[currentIndex].title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {SLIDES[currentIndex].subtitle}
          </Text>
          
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
                isLastSlide ? styles.buttonPill : styles.buttonRound,
                pressed && styles.buttonPressed,
              ]}
            >
              {isLastSlide ? (
                <Text style={styles.buttonText}>Commencer</Text>
              ) : (
                <ChevronRight size={24} color={COLORS.surface} strokeWidth={2.5} />
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  backgroundImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    height: MODAL_HEIGHT,
  },
  modalContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: COLORS.textPrimary,
    marginBottom: 8,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 'auto',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  dotActive: {
    backgroundColor: '#0B2A3C',
    width: 24,
  },
  buttonRound: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0B2A3C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPill: {
    paddingHorizontal: 28,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0B2A3C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.surface,
  },
});
