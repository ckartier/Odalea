import React, { useCallback, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { COLORS } from '@/constants/colors';

interface SeedResultItem {
  id: string;
  status: 'success' | 'error';
  message: string;
}

const CAT_PHOTOS = [
  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1573865526739-10c1d3a1f0cc?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1529778873920-4da4926a72c2?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1533738699159-45b9e825188f?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400&h=400&fit=crop',
];

export default function FirebaseCompleteUsersScreen() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [results, setResults] = useState<SeedResultItem[]>([]);

  const completeUsers = useCallback(async () => {
    if (!db) return;
    setIsProcessing(true);
    setResults([]);
    
    try {
      const usersCol = collection(db, 'users');
      const snapshot = await getDocs(usersCol);
      
      let count = 0;
      for (const userDoc of snapshot.docs) {
        try {
          const userData = userDoc.data();
          const updates: any = {};
          
          if (!userData.photo && !userData.animalPhoto) {
            const randomPhoto = CAT_PHOTOS[Math.floor(Math.random() * CAT_PHOTOS.length)];
            updates.photo = randomPhoto;
            updates.animalPhoto = randomPhoto;
          }
          
          if (!userData.animalName && userData.pseudo) {
            const catNames = ['Minou', 'Felix', 'Luna', 'Simba', 'Nala', 'Tigrou', 'Garfield', 'Whiskers'];
            updates.animalName = catNames[Math.floor(Math.random() * catNames.length)];
          }
          
          if (!userData.animalType) {
            updates.animalType = 'chat';
          }
          
          if (!userData.animalGender) {
            updates.animalGender = Math.random() > 0.5 ? 'male' : 'female';
          }
          
          if (Object.keys(updates).length > 0) {
            await updateDoc(doc(db, 'users', userDoc.id), updates);
            count++;
            setResults(prev => [
              ...prev,
              { id: userDoc.id, status: 'success', message: `Utilisateur ${userData.pseudo || userDoc.id} complété` },
            ]);
          }
        } catch (e) {
          setResults(prev => [
            ...prev,
            { id: userDoc.id, status: 'error', message: (e as Error)?.message ?? 'Erreur inconnue' },
          ]);
        }
      }
      
      setResults(prev => [
        ...prev,
        { id: 'summary', status: 'success', message: `${count} utilisateurs complétés sur ${snapshot.docs.length}` },
      ]);
    } catch (e) {
      setResults(prev => [
        ...prev,
        { id: 'error', status: 'error', message: (e as Error)?.message ?? 'Erreur inconnue' },
      ]);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Compléter Utilisateurs' }} />
      <Text style={styles.title}>Compléter les fiches utilisateurs</Text>
      <Text style={styles.subtitle}>Ajoute des photos et informations manquantes aux utilisateurs</Text>

      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.primaryBtn, isProcessing && styles.disabledBtn]}
          disabled={isProcessing}
          onPress={completeUsers}
        >
          {isProcessing ? (
            <>
              <ActivityIndicator color={COLORS.white} />
              <Text style={styles.primaryBtnText}> Traitement en cours...</Text>
            </>
          ) : (
            <Text style={styles.primaryBtnText}>Compléter les utilisateurs</Text>
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
