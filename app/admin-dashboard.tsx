import React, { useCallback, useMemo, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View, TextInput, Modal } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, deleteDoc, doc, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { COLORS, DIMENSIONS } from '@/constants/colors';
import { ArrowLeft, ExternalLink, Trash2, Pencil, Search as SearchIcon, Filter as FilterIcon, LogOut, LogIn } from 'lucide-react-native';

interface ItemRow {
  id: string;
  [key: string]: unknown;
}

const KNOWN: Record<string, { label: string; primaryField?: string; openPath?: (id: string) => string } > = {
  users: { label: 'Utilisateurs', primaryField: 'name', openPath: (id: string) => `/profile/${id}` },
  pets: { label: 'Animaux', primaryField: 'name', openPath: (id: string) => `/pet/${id}` },
  bookings: { label: 'Réservations', primaryField: 'status' },
  conversations: { label: 'Conversations', primaryField: 'title', openPath: (id: string) => `/messages/${id}` },
  messages: { label: 'Messages', primaryField: 'content' },
  challenges: { label: 'Challenges', primaryField: 'title' },
  petSitterProfiles: { label: 'Cat-sitters', primaryField: 'displayName' },
  orders: { label: 'Commandes', primaryField: 'status' },
  posts: { label: 'Posts', primaryField: 'title' },
};

export default function AdminDashboard() {
  const { collection: colParam } = useLocalSearchParams<{ collection?: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [busyId, setBusyId] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [filterField, setFilterField] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [editVisible, setEditVisible] = useState<boolean>(false);
  const [editValue, setEditValue] = useState<string>('');
  const [editItemState, setEditItemState] = useState<ItemRow | null>(null);

  const colKey = typeof colParam === 'string' ? colParam : '';
  const meta = KNOWN[colKey] ?? { label: colKey || 'Dashboard', primaryField: undefined };

  const listQuery = useQuery({
    queryKey: ['admin-dashboard', colKey],
    enabled: !!db && !!colKey,
    queryFn: async () => {
      console.log('[AdminDashboard] load', colKey);
      const base = collection(db, colKey);
      let q = query(base, limit(50));
      try {
        q = query(base, orderBy('createdAt', 'desc'), limit(50));
      } catch {}
      const snap = await getDocs(q);
      const rows: ItemRow[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return rows;
    }
  });

  const handleOpen = useCallback((id: string) => {
    const path = (KNOWN[colKey]?.openPath)?.(id);
    if (path) router.push(path as any);
  }, [router, colKey]);

  const handleDelete = useCallback(async (id: string) => {
    if (!db) return;
    try {
      setBusyId(id);
      await deleteDoc(doc(db, colKey, id));
      await qc.invalidateQueries({ queryKey: ['admin-dashboard', colKey] });
    } catch (e) {
      console.log('Delete error', e);
      if (Platform.OS === 'web') alert('Suppression impossible. Voir console.'); else Alert.alert('Erreur', 'Suppression impossible.');
    } finally {
      setBusyId('');
    }
  }, [colKey, qc]);

  const handleImpersonate = useCallback(async (userId: string) => {
    try {
      const mod = await import('@/hooks/auth-store');
      (mod as any)?.impersonateUser?.(userId);
      router.replace('/(tabs)/home');
    } catch (e) {
      console.log('Impersonate error', e);
      if (Platform.OS === 'web') alert('Impersonation impossible'); else Alert.alert('Erreur', 'Impersonation impossible');
    }
  }, [router]);

  const filteredData = useMemo(() => {
    const rows = (listQuery.data ?? []) as ItemRow[];
    const s = search.trim().toLowerCase();
    const fField = filterField.trim();
    const fVal = filterValue.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch = !s || Object.values(row).some(v => String(v ?? '').toLowerCase().includes(s));
      const matchesFilter = !fField || !fVal || String((row as any)[fField] ?? '').toLowerCase().includes(fVal);
      return matchesSearch && matchesFilter;
    });
  }, [listQuery.data, search, filterField, filterValue]);

  const handleEdit = useCallback(async (item: ItemRow) => {
    try {
      const primary = KNOWN[colKey]?.primaryField;
      if (!primary) return;
      setEditItemState(item);
      setEditValue(String(item[primary] ?? ''));
      setEditVisible(true);
    } catch (e) {
      console.log('Edit prep error', e);
    }
  }, [colKey]);

  const renderItem = useCallback(({ item }: { item: ItemRow }) => {
    const title: string = String((meta.primaryField ? item[meta.primaryField] : item.id) ?? item.id);
    const subtitleParts: string[] = [];
    if (item['city']) subtitleParts.push(String(item['city']));
    if (item['email']) subtitleParts.push(String(item['email']));
    if (item['status']) subtitleParts.push(String(item['status']));
    const subtitle = subtitleParts.join(' • ');
    return (
      <View style={styles.row} testID={`row-${item.id}`}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {!!KNOWN[colKey]?.openPath && (
          <TouchableOpacity style={styles.iconBtn} onPress={() => handleOpen(item.id)} testID={`open-${item.id}`}>
            <ExternalLink size={16} color={COLORS.primary} />
          </TouchableOpacity>
        )}
        {!!KNOWN[colKey]?.primaryField && (
          <TouchableOpacity style={[styles.iconBtn, { marginLeft: 8 }]} onPress={() => handleEdit(item)} testID={`edit-${item.id}`}>
            <Pencil size={16} color={COLORS.primary} />
          </TouchableOpacity>
        )}
        {colKey === 'users' && (
          <TouchableOpacity style={[styles.iconBtn, { marginLeft: 8 }]} onPress={() => handleImpersonate(item.id)} testID={`impersonate-${item.id}`}>
            <LogIn size={16} color={COLORS.primary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.iconBtn, { marginLeft: 8 }]} onPress={() => handleDelete(item.id)} disabled={busyId===item.id} testID={`delete-${item.id}`}>
          {busyId===item.id ? <ActivityIndicator /> : <Trash2 size={16} color={COLORS.error} />}
        </TouchableOpacity>
      </View>
    );
  }, [handleOpen, handleDelete, handleEdit, handleImpersonate, busyId, meta, colKey]);

  return (
    <View style={styles.container} testID="admin-dashboard-screen">
      <Stack.Screen options={{
        title: meta.label,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: 12 }}>
            <ArrowLeft size={18} color={COLORS.black} />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity
            onPress={async () => {
              try {
                const mod = await import('@/hooks/auth-store');
                const hook: any = mod;
                const { signOut } = hook.useAuth();
                const res = await signOut();
                if (res?.success) {
                  try { (await import('@/hooks/auth-store') as any)?.stopImpersonation?.(); } catch {}
                  router.replace('/splash');
                }
              } catch (e) {
                console.log('Logout error', e);
              }
            }}
            style={{ paddingHorizontal: 12 }}
            testID="btn-logout"
          >
            <LogOut size={18} color={COLORS.error} />
          </TouchableOpacity>
        )
      }} />
      {!colKey ? (
        <View style={styles.center}> 
          <Text style={styles.empty}>Aucune collection fournie</Text>
        </View>
      ) : listQuery.isLoading ? (
        <View style={styles.center}><ActivityIndicator /></View>
      ) : listQuery.error ? (
        <View style={styles.center}><Text style={styles.error}>Erreur de chargement</Text></View>
      ) : (
        <>
          <View style={styles.filterBar} testID="filter-bar">
            <View style={styles.filterRow}>
              <View style={[styles.searchBox]}>
                <SearchIcon size={16} color={COLORS.darkGray} />
                <TextInput
                  placeholder="Rechercher..."
                  value={search}
                  onChangeText={setSearch}
                  style={{ flex: 1, marginLeft: 8, paddingVertical: Platform.OS === 'web' ? 6 : 4 }}
                  autoCapitalize="none"
                  testID="search-input"
                />
              </View>
            </View>
            <View style={[styles.filterRow, { marginTop: 8 }]}>
              <View style={styles.filterPill}>
                <FilterIcon size={14} color={COLORS.primary} />
                <Text style={styles.filterLabel}>Champ</Text>
              </View>
              <View style={[styles.searchBox, { flex: 0.5, marginLeft: 8 }]}>
                <TextInput
                  placeholder="ex: city"
                  value={filterField}
                  onChangeText={setFilterField}
                  style={{ flex: 1, marginLeft: 8, paddingVertical: Platform.OS === 'web' ? 6 : 4 }}
                  autoCapitalize="none"
                  testID="filter-field-input"
                />
              </View>
              <View style={[styles.searchBox, { flex: 0.5, marginLeft: 8 }]}>
                <TextInput
                  placeholder="valeur"
                  value={filterValue}
                  onChangeText={setFilterValue}
                  style={{ flex: 1, marginLeft: 8, paddingVertical: Platform.OS === 'web' ? 6 : 4 }}
                  autoCapitalize="none"
                  testID="filter-value-input"
                />
              </View>
              <TouchableOpacity onPress={() => { setSearch(''); setFilterField(''); setFilterValue(''); }} style={[styles.iconBtn, { marginLeft: 8 }]} testID="btn-clear-filters">
                <Text>Réinitialiser</Text>
              </TouchableOpacity>
            </View>
          </View>
          <FlatList
            data={filteredData}
            keyExtractor={(it) => it.id}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            contentContainerStyle={{ padding: DIMENSIONS.SPACING.lg }}
            ListEmptyComponent={<Text style={styles.empty}>Aucun élément</Text>}
          />

          <Modal visible={editVisible} transparent animationType="slide">
            <View style={styles.modalBackdrop}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Modifier</Text>
                <View style={[styles.searchBox, { marginTop: 12 }]}> 
                  <TextInput
                    placeholder="Nouvelle valeur"
                    value={editValue}
                    onChangeText={setEditValue}
                    style={{ flex: 1, marginLeft: 8, paddingVertical: Platform.OS === 'web' ? 6 : 4 }}
                    autoCapitalize="none"
                    testID="edit-input"
                  />
                </View>
                <View style={{ flexDirection: 'row', marginTop: 16, justifyContent: 'flex-end' }}>
                  <TouchableOpacity onPress={() => { setEditVisible(false); setEditItemState(null); }} style={[styles.iconBtn]} testID="edit-cancel">
                    <Text>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        if (!db || !editItemState) return;
                        const primary = KNOWN[colKey]?.primaryField;
                        if (!primary) return;
                        await import('firebase/firestore').then(async ({ doc, updateDoc }) => {
                          await updateDoc(doc(db, colKey, editItemState.id), { [primary]: editValue });
                        });
                        setEditVisible(false);
                        setEditItemState(null);
                        await qc.invalidateQueries({ queryKey: ['admin-dashboard', colKey] });
                      } catch (e) {
                        console.log('Edit save error', e);
                        if (Platform.OS === 'web') alert('Edition impossible'); else Alert.alert('Erreur', 'Edition impossible');
                      }
                    }}
                    style={[styles.iconBtn, { marginLeft: 8, backgroundColor: 'rgba(125,212,238,0.25)' }]}
                    testID="edit-save"
                  >
                    <Text style={{ color: COLORS.primary, fontWeight: '600' as const }}>Enregistrer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.screenBackground,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    color: COLORS.error,
  },
  filterBar: {
    paddingHorizontal: DIMENSIONS.SPACING.lg,
    paddingTop: DIMENSIONS.SPACING.md,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)'
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(125,212,238,0.12)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterLabel: {
    marginLeft: 6,
    color: COLORS.primary,
    fontSize: DIMENSIONS.FONT_SIZES.xs,
    fontWeight: '600' as const,
  },
  sep: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(125,212,238,0.12)'
  },
  title: {
    fontWeight: '700' as const,
    color: COLORS.black,
  },
  subtitle: {
    marginTop: 4,
    color: COLORS.darkGray,
    fontSize: DIMENSIONS.FONT_SIZES.xs,
  },
  empty: {
    color: COLORS.darkGray,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontWeight: '700' as const,
    color: COLORS.black,
    fontSize: DIMENSIONS.FONT_SIZES.md,
  }
});
