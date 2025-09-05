import React, { useCallback, useMemo, useState } from 'react';
import { Stack } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { collection, deleteField, doc, getDocs, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { COLORS, DIMENSIONS } from '@/constants/colors';
import { ShieldCheck, Database } from 'lucide-react-native';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; msg?: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, msg: (error as any)?.message ?? 'Unknown error' };
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorBox} testID="migration-error">
          <Text style={styles.errorTitle}>Erreur</Text>
          <Text style={styles.errorText}>{this.state.msg}</Text>
        </View>
      );
    }
    return this.props.children as any;
  }
}

export default function FirebaseMigrateUsersScreen() {
  const [running, setRunning] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ total: number; done: number; moved: number; skipped: number; errors: number }>({ total: 0, done: 0, moved: 0, skipped: 0, errors: 0 });
  const [log, setLog] = useState<string[]>([]);

  const sensitiveKeys = useMemo(() => (
    [
      'email',
      'emailLower',
      'phoneNumber',
      'address',
      'zipCode',
      'normalizedAddress',
      'addressVerified',
      'location',
      'referralCode',
    ] as const
  ), []);

  const runMigration = useCallback(async () => {
    if (!db) return;
    setRunning(true);
    setLog([]);
    setProgress({ total: 0, done: 0, moved: 0, skipped: 0, errors: 0 });
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const total = usersSnap.size;
      setProgress(prev => ({ ...prev, total }));

      let batch = writeBatch(db);
      let batchOps = 0;
      const commitBatch = async () => {
        if (batchOps > 0) {
          await batch.commit();
          batch = writeBatch(db);
          batchOps = 0;
        }
      };

      for (const d of usersSnap.docs) {
        try {
          const u = d.data() as Record<string, any>;
          const uid = d.id;

          const privateDoc: Record<string, any> = {
            userId: uid,
            email: u?.email ?? null,
            emailLower: (u?.emailLower ?? (u?.email ? String(u.email).toLowerCase() : null)) ?? null,
            phoneNumber: u?.phoneNumber ?? null,
            address: u?.address ?? null,
            zipCode: u?.zipCode ?? null,
            city: u?.city ?? null,
            countryCode: u?.countryCode ?? null,
            location: u?.location ?? null,
            addressVerified: Boolean(u?.addressVerified ?? false),
            normalizedAddress: u?.normalizedAddress ?? null,
            referralCode: u?.referralCode ?? null,
            updatedAt: serverTimestamp(),
          };

          if (u?.professionalData) {
            const pd = u.professionalData as Record<string, any>;
            const sensitivePro: Record<string, any> = {};
            if (pd?.iban) sensitivePro.iban = pd.iban;
            if (pd?.siret) sensitivePro.siret = pd.siret;
            if (Object.keys(sensitivePro).length > 0) {
              privateDoc.professional = { ...(privateDoc.professional ?? {}), ...sensitivePro };
            }
          }

          const hasSomethingToMove = sensitiveKeys.some(k => u?.[k] != null) || privateDoc.professional != null;
          const usersPrivateRef = doc(db, 'users_private', uid);

          if (hasSomethingToMove) {
            batch.set(usersPrivateRef, privateDoc, { merge: true });
            batchOps += 1;
          }

          const publicUpdates: Record<string, any> = { profileVisibility: u?.profileVisibility ?? 'public', updatedAt: serverTimestamp() };
          for (const k of sensitiveKeys) {
            if (u?.[k] !== undefined) publicUpdates[k] = deleteField();
          }
          if (u?.professionalData?.iban !== undefined) publicUpdates['professionalData.iban'] = deleteField();
          if (u?.professionalData?.siret !== undefined) publicUpdates['professionalData.siret'] = deleteField();

          batch.update(doc(db, 'users', uid), publicUpdates);
          batchOps += 1;

          if (batchOps >= 400) {
            await commitBatch();
          }

          setProgress(prev => ({ ...prev, done: prev.done + 1, moved: prev.moved + (hasSomethingToMove ? 1 : 0), skipped: prev.skipped + (hasSomethingToMove ? 0 : 1) }));
          setLog(prev => [...prev, `User ${uid}: ${hasSomethingToMove ? 'déplacé' : 'aucune donnée sensible'} • profileVisibility=${publicUpdates.profileVisibility}`].slice(-200));
        } catch (inner) {
          setProgress(prev => ({ ...prev, done: prev.done + 1, errors: prev.errors + 1 }));
          setLog(prev => [...prev, `Erreur ${d.id}: ${(inner as any)?.message ?? 'inconnue'}`].slice(-200));
        }
      }

      await commitBatch();
      setLog(prev => [...prev, 'Migration terminée'].slice(-200));
    } catch (e) {
      setLog(prev => [...prev, `Erreur globale: ${(e as any)?.message ?? 'inconnue'}`].slice(-200));
    } finally {
      setRunning(false);
    }
  }, [db, sensitiveKeys]);

  return (
    <ErrorBoundary>
      <Stack.Screen options={{ title: 'Migration users → users_private' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} testID="firebase-migrate-users">
        <View style={styles.headerBox}>
          <View style={styles.headerIcon}><Database size={20} color={COLORS.primary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Migration de sécurité</Text>
            <Text style={styles.subtitle}>Déplacer email/téléphone/adresse vers users_private et définir profileVisibility par défaut</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <TouchableOpacity onPress={runMigration} style={styles.actionBtn} testID="btn-run-migration" disabled={running}>
            {running ? <ActivityIndicator color={COLORS.white} /> : <ShieldCheck size={18} color={COLORS.white} />}
            <Text style={styles.actionBtnText}>{running ? 'En cours…' : 'Lancer la migration'}</Text>
          </TouchableOpacity>
          <Text style={styles.statText}>Profil: profileVisibility est défini à “public” si absent.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progression</Text>
          <Text style={styles.statText} testID="stat-progress">Total: {progress.total} • Traités: {progress.done} • Déplacés: {progress.moved} • Ignorés: {progress.skipped} • Erreurs: {progress.errors}</Text>
        </View>

        {log.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Journal (dern. 200)</Text>
            <View style={styles.logBox}>
              {log.slice(-200).map((ln, i) => (
                <View key={`ln-${i}`} style={styles.logItem} testID={`log-${i}`}>
                  <Text style={styles.logText}>{ln}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: DIMENSIONS.SPACING.xl }} />
      </ScrollView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.screenBackground },
  content: { padding: DIMENSIONS.SPACING.lg },
  headerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.SPACING.lg,
    padding: DIMENSIONS.SPACING.md,
    marginBottom: DIMENSIONS.SPACING.lg,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(125,212,238,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DIMENSIONS.SPACING.md,
  },
  title: { fontSize: DIMENSIONS.FONT_SIZES.lg, fontWeight: '700' as const, color: COLORS.black },
  subtitle: { marginTop: 4, color: COLORS.darkGray, fontSize: DIMENSIONS.FONT_SIZES.xs },
  section: { backgroundColor: COLORS.white, borderRadius: DIMENSIONS.SPACING.lg, padding: DIMENSIONS.SPACING.md, marginBottom: DIMENSIONS.SPACING.lg },
  sectionTitle: { fontSize: DIMENSIONS.FONT_SIZES.md, fontWeight: '700' as const, color: COLORS.black, marginBottom: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, alignSelf: 'flex-start' },
  actionBtnText: { marginLeft: 8, color: COLORS.white, fontWeight: '700' as const, fontSize: DIMENSIONS.FONT_SIZES.xs },
  statText: { color: COLORS.darkGray, fontSize: DIMENSIONS.FONT_SIZES.xs },
  logBox: { borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', borderRadius: 12 },
  logItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  logText: { color: COLORS.darkGray, fontSize: DIMENSIONS.FONT_SIZES.xs },
  errorBox: { margin: 16, padding: 12, borderRadius: 12, backgroundColor: '#fff5f5', borderWidth: 1, borderColor: '#ffd6d6' },
  errorTitle: { fontWeight: '700' as const, color: COLORS.error, marginBottom: 6 },
  errorText: { color: COLORS.error },
});
