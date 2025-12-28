import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { userService, petSitterService } from '@/services/database';
import { COLORS, DIMENSIONS } from '@/constants/colors';
import AppBackground from '@/components/AppBackground';
import GlassCard from '@/components/GlassCard';
import { CheckCircle, AlertCircle } from 'lucide-react-native';

const DEV_EMAIL = 'amandine@gmail.com';
const DEV_PASSWORD = process.env.EXPO_PUBLIC_DEV_PASSWORD || 'password123';

export default function DevSeedCatSitterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<{ type: 'success' | 'error' | 'info'; message: string }[]>([]);

  const addLog = (type: 'success' | 'error' | 'info', message: string) => {
    console.log(`[${type.toUpperCase()}] ${message}`);
    setLogs((prev) => [...prev, { type, message }]);
  };

  const runSeed = async () => {
    setLoading(true);
    setLogs([]);

    try {
      addLog('info', `Connexion avec ${DEV_EMAIL}...`);

      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, DEV_EMAIL, DEV_PASSWORD);
        addLog('success', `✅ Connecté en tant que ${userCredential.user.email}`);
      } catch (authError: any) {
        addLog('error', `❌ Échec de connexion: ${authError.message}`);
        addLog('info', 'Assurez-vous que le compte existe ou créez-le manuellement.');
        setLoading(false);
        return;
      }

      const uid = userCredential.user.uid;
      addLog('info', `UID Firebase: ${uid}`);

      addLog('info', 'Vérification profil utilisateur...');
      let userProfile = await userService.getUser(uid);

      if (!userProfile) {
        addLog('info', 'Création du profil utilisateur...');
        const newUser: Partial<any> = {
          id: uid,
          email: DEV_EMAIL,
          firstName: 'Amandine',
          lastName: 'Test',
          name: 'Amandine Test',
          pseudo: 'amandine',
          countryCode: '+33',
          phoneNumber: '612345678',
          address: 'Paris',
          zipCode: '75001',
          city: 'Paris',
          location: {
            latitude: 48.8566,
            longitude: 2.3522,
          },
          isCatSitter: true,
          isPremium: false,
          pets: [],
          isActive: true,
          profileComplete: true,
          createdAt: Date.now(),
        };

        await userService.saveUser(newUser as any);
        addLog('success', '✅ Profil utilisateur créé');
        userProfile = newUser as any;
      } else {
        addLog('success', '✅ Profil utilisateur existant trouvé');

        if (!userProfile.isCatSitter) {
          addLog('info', 'Mise à jour: isCatSitter = true');
          await userService.saveUser({ ...userProfile, isCatSitter: true });
        }
      }

      addLog('info', 'Vérification profil Cat Sitter...');
      let sitterProfile = await petSitterService.getProfile(uid);

      const defaultServices = [
        {
          id: `svc-${Date.now()}-1`,
          name: 'Visite (30 min)',
          description: 'Passage à domicile, eau/nourriture, litière, nouvelles.',
          price: 12,
          duration: 30,
          icon: 'visit',
          isActive: true,
        },
        {
          id: `svc-${Date.now()}-2`,
          name: 'Garde (1 h)',
          description: 'Présence + soins de base + jeux.',
          price: 20,
          duration: 60,
          icon: 'home',
          isActive: true,
        },
        {
          id: `svc-${Date.now()}-3`,
          name: 'Promenade (30 min)',
          description: 'Sortie + dépense + retour au calme.',
          price: 12,
          duration: 30,
          icon: 'walk',
          isActive: true,
        },
      ];

      if (!sitterProfile) {
        addLog('info', 'Création du profil Cat Sitter...');
        const newSitterProfile = {
          id: uid,
          userId: uid,
          isActive: true,
          hourlyRate: 20,
          description: 'Cat sitter expérimentée, passionnée par les chats. Disponible pour visites, gardes et promenades.',
          services: ['Pet Sitting', 'Visite', 'Garde'],
          customServices: defaultServices,
          availability: {
            monday: { start: '08:00', end: '18:00', available: true },
            tuesday: { start: '08:00', end: '18:00', available: true },
            wednesday: { start: '08:00', end: '18:00', available: true },
            thursday: { start: '08:00', end: '18:00', available: true },
            friday: { start: '08:00', end: '18:00', available: true },
            saturday: { start: '09:00', end: '17:00', available: true },
            sunday: { start: '10:00', end: '16:00', available: false },
          },
          photos: [],
          experience: '5 ans',
          petTypes: ['Cats', 'Dogs'],
          languages: ['French', 'English'],
          insurance: false,
          emergencyContact: true,
          emergencyContactName: 'Marie Dupont',
          emergencyContactPhone: '+33698765432',
          responseTime: '< 2 hours',
          totalBookings: 0,
          rating: 5.0,
          reviewCount: 0,
          radiusKm: 10,
          verification: { status: 'unverified' },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        await petSitterService.saveProfile(uid, newSitterProfile);
        addLog('success', '✅ Profil Cat Sitter créé avec 3 prestations par défaut');
      } else {
        addLog('success', '✅ Profil Cat Sitter existant trouvé');

        const hasWalk = sitterProfile.customServices?.some((s: any) =>
          s.name.toLowerCase().includes('promenade')
        );

        if (!hasWalk) {
          addLog('info', 'Ajout de "Promenade (30 min)"...');
          const updated = {
            ...sitterProfile,
            customServices: [
              ...(sitterProfile.customServices || []),
              {
                id: `svc-${Date.now()}`,
                name: 'Promenade (30 min)',
                description: 'Sortie + dépense + retour au calme.',
                price: Math.max(5, Math.round((sitterProfile.hourlyRate * 0.5) * 100) / 100),
                duration: 30,
                icon: 'walk',
                isActive: true,
              },
            ],
            updatedAt: Date.now(),
          };
          await petSitterService.saveProfile(uid, updated);
          addLog('success', '✅ "Promenade (30 min)" ajoutée');
        } else {
          addLog('success', '✅ "Promenade (30 min)" déjà présente');
        }
      }

      addLog('success', '🎉 Seed terminé avec succès!');
      addLog('info', `Vous pouvez maintenant utiliser ${DEV_EMAIL} pour tester le dashboard Cat Sitter.`);

      Alert.alert(
        'Seed terminé',
        'Les données ont été créées avec succès. Vous pouvez maintenant naviguer vers le dashboard Cat Sitter.',
        [
          { text: 'OK', onPress: () => router.back() },
          { text: 'Dashboard', onPress: () => router.push('/(pro)/cat-sitter-dashboard' as any) },
        ]
      );
    } catch (error: any) {
      console.error('❌ Erreur seed:', error);
      addLog('error', `❌ Erreur: ${error.message}`);
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppBackground>
      <Stack.Screen
        options={{
          title: 'Dev Seed Cat Sitter',
          headerShown: true,
        }}
      />

      <ScrollView contentContainerStyle={styles.container}>
        <GlassCard tint="neutral" style={styles.card}>
          <Text style={styles.title}>Seed Cat Sitter Data</Text>
          <Text style={styles.subtitle}>
            Script de développement pour initialiser les données du compte amandine@gmail.com
          </Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{DEV_EMAIL}</Text>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={runSeed}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>Lancer le Seed</Text>
            )}
          </TouchableOpacity>
        </GlassCard>

        {logs.length > 0 && (
          <GlassCard tint="neutral" style={styles.logsCard}>
            <Text style={styles.logsTitle}>Logs</Text>
            {logs.map((log, index) => (
              <View key={index} style={styles.logItem}>
                {log.type === 'success' && <CheckCircle size={16} color={COLORS.success} />}
                {log.type === 'error' && <AlertCircle size={16} color={COLORS.error} />}
                {log.type === 'info' && <AlertCircle size={16} color={COLORS.darkGray} />}
                <Text
                  style={[
                    styles.logText,
                    log.type === 'success' && { color: COLORS.success },
                    log.type === 'error' && { color: COLORS.error },
                  ]}
                >
                  {log.message}
                </Text>
              </View>
            ))}
          </GlassCard>
        )}
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: DIMENSIONS.SPACING.md,
  },
  card: {
    padding: DIMENSIONS.SPACING.lg,
    marginBottom: DIMENSIONS.SPACING.md,
  },
  title: {
    fontSize: DIMENSIONS.FONT_SIZES.xxl,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginBottom: DIMENSIONS.SPACING.xs,
  },
  subtitle: {
    fontSize: DIMENSIONS.FONT_SIZES.sm,
    color: COLORS.darkGray,
    marginBottom: DIMENSIONS.SPACING.lg,
  },
  infoBox: {
    backgroundColor: `${COLORS.male}15`,
    padding: DIMENSIONS.SPACING.md,
    borderRadius: 12,
    marginBottom: DIMENSIONS.SPACING.lg,
  },
  infoLabel: {
    fontSize: DIMENSIONS.FONT_SIZES.sm,
    fontWeight: '600' as const,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: DIMENSIONS.FONT_SIZES.md,
    fontWeight: '700' as const,
    color: COLORS.black,
  },
  button: {
    backgroundColor: COLORS.black,
    paddingVertical: DIMENSIONS.SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: DIMENSIONS.FONT_SIZES.md,
    fontWeight: '700' as const,
  },
  logsCard: {
    padding: DIMENSIONS.SPACING.md,
  },
  logsTitle: {
    fontSize: DIMENSIONS.FONT_SIZES.lg,
    fontWeight: '700' as const,
    color: COLORS.black,
    marginBottom: DIMENSIONS.SPACING.sm,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  logText: {
    flex: 1,
    fontSize: DIMENSIONS.FONT_SIZES.sm,
    color: COLORS.black,
  },
});
