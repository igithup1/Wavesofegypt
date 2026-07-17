import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useListTours, useListCategories } from '@workspace/api-client-react';
import { TourCard } from '@/components/TourCard';
import { useColors } from '@/hooks/useColors';

const SORT_OPTIONS = [
  { label: 'Popular', value: 'best_seller' },
  { label: 'Price ↑', value: 'price_asc' },
  { label: 'Price ↓', value: 'price_desc' },
  { label: 'Rating', value: 'rating' },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]['value'];

export default function ExploreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('best_seller');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();

  // Debounce search
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = useCallback((text: string) => {
    setSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(text), 400);
  }, []);

  const { data: tourData, isLoading, isRefetching, refetch } = useListTours({
    search: debouncedSearch || undefined,
    sortBy,
    categoryId: selectedCategory,
    limit: 40,
  });

  const { data: categories } = useListCategories();

  const tours = tourData?.tours ?? [];
  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header + Search */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPadding + 12,
            backgroundColor: colors.primary,
          },
        ]}
      >
        <Text style={styles.headerTitle}>Explore Tours</Text>
        {/* Search Input */}
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search tours..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={handleSearch}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {search.length > 0 && Platform.OS !== 'ios' && (
            <Pressable onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        {/* Category chips */}
        {categories && categories.length > 0 && (
          <FlatList
            data={[{ id: undefined, name: 'All', slug: 'all', icon: '🌊', tourCount: 0 }, ...categories]}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => String(item.id ?? 'all')}
            contentContainerStyle={styles.categoryList}
            renderItem={({ item }) => {
              const isSelected = item.id === selectedCategory || (item.id === undefined && selectedCategory === undefined);
              return (
                <Pressable
                  onPress={() => setSelectedCategory(item.id as number | undefined)}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: isSelected ? colors.accent : 'rgba(255,255,255,0.15)',
                      borderColor: isSelected ? colors.accent : 'rgba(255,255,255,0.3)',
                    },
                  ]}
                >
                  <Text style={[styles.categoryChipText, { color: isSelected ? colors.accentForeground : '#FFFFFF' }]}>
                    {item.name}
                  </Text>
                </Pressable>
              );
            }}
          />
        )}

        {/* Sort chips */}
        <FlatList
          data={SORT_OPTIONS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.value}
          contentContainerStyle={styles.sortList}
          renderItem={({ item }) => {
            const isSelected = sortBy === item.value;
            return (
              <Pressable
                onPress={() => setSortBy(item.value)}
                style={[
                  styles.sortChip,
                  {
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : 'transparent',
                    borderColor: 'rgba(255,255,255,0.3)',
                  },
                ]}
              >
                <Text style={[styles.sortChipText, { color: isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.7)' }]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Tour List */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : tours.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="search-outline" size={48} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No tours found</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Try a different search term or category
          </Text>
        </View>
      ) : (
        <FlatList
          data={tours}
          keyExtractor={(t) => String(t.id)}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 84 : 90) },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={tours.length > 0}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <TourCard tour={item} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'PlayfairDisplay_700Bold',
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    padding: 0,
  },
  categoryList: {
    gap: 8,
    paddingBottom: 10,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sortList: {
    gap: 8,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  sortChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  list: {
    padding: 16,
    gap: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
