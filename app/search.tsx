import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SHADOWS } from '@/constants/colors';
import { useI18n } from '@/hooks/i18n-store';
import { mockUsers } from '@/mocks/users';
import { Pet, User } from '@/types';
import {
  Search,
  ArrowLeft,
  MapPin,
  Heart,
  Star,
  Filter,
  X,
} from 'lucide-react-native';

type SearchResult = {
  type: 'pet' | 'user';
  data: Pet | User;
  owner?: User;
};

export default function SearchScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pets' | 'users' | 'sitters'>('all');

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      performSearch(searchQuery);
    } else {
      setResults([]);
    }
  }, [searchQuery, selectedFilter]);

  const performSearch = (query: string) => {
    setIsLoading(true);
    
    // Simulate search delay
    setTimeout(() => {
      const searchResults: SearchResult[] = [];
      const lowerQuery = query.toLowerCase();

      // Search through users
      mockUsers.forEach(user => {
        const matchesUser = 
          user.firstName.toLowerCase().includes(lowerQuery) ||
          user.lastName.toLowerCase().includes(lowerQuery) ||
          user.city.toLowerCase().includes(lowerQuery) ||
          user.zipCode.includes(query);

        if (matchesUser && (selectedFilter === 'all' || selectedFilter === 'users' || (selectedFilter === 'sitters' && user.isCatSitter))) {
          searchResults.push({
            type: 'user',
            data: user,
          });
        }

        // Search through pets
        user.pets.forEach(pet => {
          const matchesPet = 
            pet.name.toLowerCase().includes(lowerQuery) ||
            pet.breed.toLowerCase().includes(lowerQuery) ||
            pet.type.toLowerCase().includes(lowerQuery);

          if (matchesPet && (selectedFilter === 'all' || selectedFilter === 'pets')) {
            searchResults.push({
              type: 'pet',
              data: pet,
              owner: user,
            });
          }
        });
      });

      setResults(searchResults);
      setIsLoading(false);
    }, 300);
  };

  const handleResultPress = (result: SearchResult) => {
    if (result.type === 'pet') {
      router.push(`/pet/${result.data.id}`);
    } else {
      router.push(`/profile/${result.data.id}`);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setResults([]);
  };

  const renderPetResult = (pet: Pet, owner: User) => (
    <TouchableOpacity
      style={[styles.resultItem, SHADOWS.small]}
      onPress={() => handleResultPress({ type: 'pet', data: pet, owner })}
    >
      <View style={[
        styles.petIndicator,
        { backgroundColor: pet.gender === 'male' ? COLORS.male : COLORS.female }
      ]} />
      
      <View style={styles.resultContent}>
        <Text style={styles.resultTitle}>{pet.name}</Text>
        <Text style={styles.resultSubtitle}>{pet.breed} • {pet.type}</Text>
        <View style={styles.ownerInfo}>
          <Text style={styles.ownerText}>Owner: {owner.firstName} {owner.lastName}</Text>
          <View style={styles.locationInfo}>
            <MapPin size={12} color={COLORS.darkGray} />
            <Text style={styles.locationText}>{owner.city}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.resultType}>
        <Heart size={16} color={COLORS.primary} />
      </View>
    </TouchableOpacity>
  );

  const renderUserResult = (user: User) => (
    <TouchableOpacity
      style={[styles.resultItem, SHADOWS.small]}
      onPress={() => handleResultPress({ type: 'user', data: user })}
    >
      <View style={[styles.userAvatar, { backgroundColor: COLORS.primary }]}>
        <Text style={styles.avatarText}>
          {user.firstName[0]}{user.lastName[0]}
        </Text>
      </View>
      
      <View style={styles.resultContent}>
        <View style={styles.userNameRow}>
          <Text style={styles.resultTitle}>{user.firstName} {user.lastName}</Text>
          {user.isPremium && <Star size={16} color={COLORS.premium} />}
          {user.isCatSitter && <Text style={styles.sitterBadge}>Cat Sitter</Text>}
        </View>
        <View style={styles.locationInfo}>
          <MapPin size={12} color={COLORS.darkGray} />
          <Text style={styles.locationText}>{user.city}, {user.zipCode}</Text>
        </View>
        <Text style={styles.petCount}>{user.pets.length} pet{user.pets.length !== 1 ? 's' : ''}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderResult = ({ item }: { item: SearchResult }) => {
    if (item.type === 'pet') {
      return renderPetResult(item.data as Pet, item.owner!);
    } else {
      return renderUserResult(item.data as User);
    }
  };

  const renderEmptyState = () => {
    if (searchQuery.trim().length === 0) {
      return (
        <View style={styles.emptyState}>
          <Search size={48} color={COLORS.mediumGray} />
          <Text style={styles.emptyTitle}>Search Odalea</Text>
          <Text style={styles.emptySubtitle}>
            Find pets, owners, and cat sitters in your area
          </Text>
        </View>
      );
    }

    if (results.length === 0 && !isLoading) {
      return (
        <View style={styles.emptyState}>
          <Search size={48} color={COLORS.mediumGray} />
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptySubtitle}>
            Try adjusting your search terms or filters
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Search',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color={COLORS.black} />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Search Bar */}
      <View style={[styles.searchContainer, SHADOWS.small]}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={COLORS.darkGray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search pets, owners, or locations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.darkGray}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <X size={20} color={COLORS.darkGray} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'all' && styles.activeFilter]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[styles.filterText, selectedFilter === 'all' && styles.activeFilterText]}>
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'pets' && styles.activeFilter]}
            onPress={() => setSelectedFilter('pets')}
          >
            <Text style={[styles.filterText, selectedFilter === 'pets' && styles.activeFilterText]}>
              Pets
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'users' && styles.activeFilter]}
            onPress={() => setSelectedFilter('users')}
          >
            <Text style={[styles.filterText, selectedFilter === 'users' && styles.activeFilterText]}>
              Users
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'sitters' && styles.activeFilter]}
            onPress={() => setSelectedFilter('sitters')}
          >
            <Text style={[styles.filterText, selectedFilter === 'sitters' && styles.activeFilterText]}>
              Cat Sitters
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Results */}
      <FlatList
        data={results}
        renderItem={renderResult}
        keyExtractor={(item, index) => `${item.type}-${item.data.id}-${index}`}
        contentContainerStyle={styles.resultsContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.screenBackground,
  },
  searchContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  filterButton: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activeFilter: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: COLORS.darkGray,
  },
  activeFilterText: {
    color: COLORS.white,
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  resultItem: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  petIndicator: {
    width: 8,
    height: 50,
    borderRadius: 4,
    marginRight: 12,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.white,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 4,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sitterBadge: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: COLORS.catSitter,
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  ownerInfo: {
    gap: 4,
  },
  ownerText: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  petCount: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 2,
  },
  resultType: {
    marginLeft: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
});