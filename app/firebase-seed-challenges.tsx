import React, { useCallback, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { COLORS } from '@/constants/colors';

interface SeedResultItem {
  id: string;
  status: 'success' | 'error';
  message: string;
}

const DEFAULT_CHALLENGES = [
  {
    id: 'challenge-1',
    title: { fr: 'Photo Rigolote', en: 'Funny Photo' },
    description: { fr: 'Partagez une photo amusante de votre animal dans une situation comique', en: 'Share a funny photo of your pet in a comical situation' },
    category: 'weekly',
    difficulty: 'easy',
    points: 100,
    badge: 'comedian',
    requirements: [
      {
        type: 'photo',
        target: 1,
        description: { fr: 'Prenez une photo rigolote de votre animal', en: 'Take a funny photo of your pet' },
      },
    ],
    isPremium: false,
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    participants: 0,
    completions: 0,
    icon: '😂',
    color: '#FFD93D',
    duration: 7,
  },
  {
    id: 'challenge-2',
    title: { fr: 'Marche de 10km', en: '10km Walk' },
    description: { fr: 'Parcourez 10 kilomètres avec votre chien en une semaine', en: 'Walk 10 kilometers with your dog in one week' },
    category: 'weekly',
    difficulty: 'medium',
    points: 200,
    badge: 'walker',
    requirements: [
      {
        type: 'activity',
        target: 10,
        description: { fr: 'Marchez 10km au total avec votre chien', en: 'Walk 10km total with your dog' },
      },
    ],
    isPremium: false,
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    participants: 0,
    completions: 0,
    icon: '🚶‍♂️',
    color: '#4ECDC4',
    duration: 7,
  },
  {
    id: 'challenge-3',
    title: { fr: 'Apprendre la Patte', en: 'Paw Shake' },
    description: { fr: 'Apprenez à votre animal à donner la patte sur commande', en: 'Teach your pet to shake paws on command' },
    category: 'monthly',
    difficulty: 'medium',
    points: 250,
    badge: 'trainer',
    requirements: [
      {
        type: 'photo',
        target: 1,
        description: { fr: 'Filmez votre animal donnant la patte', en: 'Film your pet shaking paws' },
      },
    ],
    isPremium: false,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    participants: 0,
    completions: 0,
    icon: '🐾',
    color: '#F0A5C9',
    duration: 30,
  },
  {
    id: 'challenge-4',
    title: { fr: 'Selfie Unique', en: 'Unique Selfie' },
    description: { fr: 'Prenez un selfie avec votre chat dans un lieu unique ou insolite', en: 'Take a selfie with your cat in a unique or unusual place' },
    category: 'weekly',
    difficulty: 'easy',
    points: 150,
    badge: 'explorer',
    requirements: [
      {
        type: 'photo',
        target: 1,
        description: { fr: 'Selfie avec votre chat dans un lieu unique', en: 'Selfie with your cat in a unique place' },
      },
    ],
    isPremium: false,
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    participants: 0,
    completions: 0,
    icon: '🤳',
    color: '#A8E6CF',
    duration: 7,
  },
  {
    id: 'challenge-5',
    title: { fr: 'Câlin Multi-Animaux', en: 'Multi-Pet Hug' },
    description: { fr: 'Organisez un câlin avec plusieurs animaux en même temps', en: 'Organize a hug with multiple pets at the same time' },
    category: 'special',
    difficulty: 'hard',
    points: 400,
    badge: 'pet_whisperer',
    requirements: [
      {
        type: 'photo',
        target: 1,
        description: { fr: 'Photo de vous avec plusieurs animaux', en: 'Photo of you with multiple pets' },
      },
    ],
    isPremium: true,
    startDate: new Date(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    participants: 0,
    completions: 0,
    icon: '🤗',
    color: '#FFB6C1',
    duration: 14,
  },
  {
    id: 'challenge-6',
    title: { fr: 'Tour Impressionnant', en: 'Impressive Trick' },
    description: { fr: 'Filmez votre animal réalisant un tour impressionnant', en: 'Film your pet performing an impressive trick' },
    category: 'monthly',
    difficulty: 'hard',
    points: 350,
    badge: 'showmaster',
    requirements: [
      {
        type: 'photo',
        target: 1,
        description: { fr: 'Vidéo de votre animal faisant un tour', en: 'Video of your pet doing a trick' },
      },
    ],
    isPremium: false,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    participants: 0,
    completions: 0,
    icon: '🎪',
    color: '#DDA0DD',
    duration: 30,
  },
  {
    id: 'challenge-7',
    title: { fr: 'Photo en Costume', en: 'Costume Photo' },
    description: { fr: 'Déguisez votre animal et prenez une photo adorable', en: 'Dress up your pet and take an adorable photo' },
    category: 'special',
    difficulty: 'easy',
    points: 180,
    badge: 'fashionista',
    requirements: [
      {
        type: 'photo',
        target: 1,
        description: { fr: 'Photo de votre animal déguisé', en: 'Photo of your pet in costume' },
      },
    ],
    isPremium: false,
    startDate: new Date(),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    participants: 0,
    completions: 0,
    icon: '🎭',
    color: '#FFA07A',
    duration: 10,
  },
  {
    id: 'challenge-8',
    title: { fr: 'Promenade Nature', en: 'Nature Walk' },
    description: { fr: 'Explorez un parc ou un sentier naturel avec votre animal', en: 'Explore a park or nature trail with your pet' },
    category: 'weekly',
    difficulty: 'easy',
    points: 120,
    badge: 'nature_lover',
    requirements: [
      {
        type: 'photo',
        target: 1,
        description: { fr: 'Photo dans un environnement naturel', en: 'Photo in a natural environment' },
      },
    ],
    isPremium: false,
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    participants: 0,
    completions: 0,
    icon: '🌲',
    color: '#90EE90',
    duration: 7,
  },
  {
    id: 'challenge-9',
    title: { fr: 'Session Dressage', en: 'Training Session' },
    description: { fr: 'Organisez une session de dressage avec votre animal', en: 'Organize a training session with your pet' },
    category: 'monthly',
    difficulty: 'medium',
    points: 300,
    badge: 'trainer_pro',
    requirements: [
      {
        type: 'photo',
        target: 1,
        description: { fr: 'Vidéo de votre session de dressage', en: 'Video of your training session' },
      },
    ],
    isPremium: true,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    participants: 0,
    completions: 0,
    icon: '🎯',
    color: '#87CEEB',
    duration: 30,
  },
  {
    id: 'challenge-10',
    title: { fr: 'Moment Toilettage', en: 'Grooming Time' },
    description: { fr: 'Partagez un moment de toilettage relaxant avec votre animal', en: 'Share a relaxing grooming moment with your pet' },
    category: 'weekly',
    difficulty: 'easy',
    points: 100,
    badge: 'groomer',
    requirements: [
      {
        type: 'photo',
        target: 1,
        description: { fr: 'Photo pendant le toilettage', en: 'Photo during grooming' },
      },
    ],
    isPremium: false,
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    participants: 0,
    completions: 0,
    icon: '✂️',
    color: '#F0E68C',
    duration: 7,
  },
];

export default function FirebaseSeedChallengesScreen() {
  const router = useRouter();
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [results, setResults] = useState<SeedResultItem[]>([]);

  const seedChallenges = useCallback(async () => {
    if (!db) return;
    setIsSeeding(true);
    setResults([]);
    
    try {
      const col = collection(db, 'challenges');
      for (const challenge of DEFAULT_CHALLENGES) {
        try {
          await setDoc(doc(col, challenge.id), challenge, { merge: true });
          setResults(prev => [
            ...prev,
            { id: challenge.id, status: 'success', message: `Défi «${challenge.title.fr}» créé` },
          ]);
        } catch (e) {
          setResults(prev => [
            ...prev,
            { id: challenge.id, status: 'error', message: (e as Error)?.message ?? 'Erreur inconnue' },
          ]);
        }
      }
    } finally {
      setIsSeeding(false);
    }
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Seed Challenges' }} />
      <Text style={styles.title}>Créer des défis par défaut</Text>
      <Text style={styles.subtitle}>Ajoute {DEFAULT_CHALLENGES.length} défis dans Firebase</Text>

      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.primaryBtn, isSeeding && styles.disabledBtn]}
          disabled={isSeeding}
          onPress={seedChallenges}
        >
          {isSeeding ? (
            <>
              <ActivityIndicator color={COLORS.white} />
              <Text style={styles.primaryBtnText}> Création en cours...</Text>
            </>
          ) : (
            <Text style={styles.primaryBtnText}>Créer les défis</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.results}>
        <Text style={styles.sectionTitle}>Résultats ({results.length})</Text>
        {results.map((r, i) => (
          <View key={`${r.id}-${i}`} style={[styles.resultItem, r.status === 'success' ? styles.ok : styles.err]}>
            <Text style={styles.resultText}>{r.status.toUpperCase()} • {r.id}</Text>
            <Text style={styles.resultDetail}>{r.message}</Text>
          </View>
        ))}
        {!results.length && <Text style={styles.hint}>Aucun résultat pour l'instant.</Text>}
      </View>

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.back()}
      >
        <Text style={styles.backBtnText}>Retour</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: 16, gap: 12 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.black },
  subtitle: { fontSize: 14, color: COLORS.darkGray },
  section: { backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.black, marginBottom: 6 },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: { opacity: 0.5 },
  primaryBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  results: { marginTop: 16 },
  resultItem: { padding: 12, borderRadius: 8, marginBottom: 8 },
  ok: { backgroundColor: '#d4edda' },
  err: { backgroundColor: '#f8d7da' },
  resultText: { fontSize: 14, fontWeight: '600', color: COLORS.black },
  resultDetail: { fontSize: 12, color: COLORS.darkGray, marginTop: 4 },
  hint: { fontSize: 14, color: COLORS.darkGray, fontStyle: 'italic' },
  backBtn: {
    backgroundColor: COLORS.lightGray,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  backBtnText: { color: COLORS.black, fontSize: 16, fontWeight: '600' },
});
