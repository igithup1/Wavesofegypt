import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  Platform,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useGetBestSellerTours, useGetFeaturedTours, useListCategories } from '@workspace/api-client-react';
import { TourCard } from '@/components/TourCard';
import { useColors } from '@/hooks/useColors';
import type { Tour } from '@workspace/api-client-react';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.72;

function SkeletonCard({ horizontal }: { horizontal?: boolean }) {
  const colors = useColors();
  const w = horizontal ? CARD_WIDTH : '100%';
  return (
    <View
      style={[
        styles.skeletonCard,
        {
          width: w as any,
          backgroundColor: colors.muted,
          borderRadius: colors.radius,
        },
      ]}
    />
  );
}

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
        {title}
      </Text>
      {onSeeAll && (
        <Pressable onPress={onSeeAll}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 84 + 34 : insets.bottom + 90;

  const { data: bestSellers, isLoading: bsLoading, refetch: refetchBs, isRefetching: isRefetchingBs } =
    useGetBestSellerTours();

  const { data: featured, isLoading: featLoading, refetch: refetchFeat, isRefetching: isRefetchingFeat } =
    useGetFeaturedTours();

  const { data: categories } = useListCategories();

  const isRefreshing = isRefetchingBs || isRefetchingFeat;

  const handleRefresh = useCallback(() => {
    refetchBs();
    refetchFeat();
  }, [refetchBs, refetchFeat]);

  const goToExplore = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/explore');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Hero Section */}
      <View style={styles.hero}>
        <LinearGradient
          colors={['#0B3C6A', '#00B3D6', '#0B3C6A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroGradient, { paddingTop: topPad + 16 }]}
        >
          {/* Logo / Brand */}
          <View style={styles.logoRow}>
            <Ionicons name="water" size={28} color="#F4A362" />
            <Text style={styles.logoText}>Waves of Egypt</Text>
          </View>

          <Text style={styles.heroTitle}>Discover Egypt's{'\n'}Hidden Wonders</Text>
          <Text style={styles.heroSub}>
            Snorkeling, diving, desert safaris & more — all from Hurghada
          </Text>

          {/* Search bar */}
          <Pressable
            onPress={goToExplore}
            style={[styles.searchBar, { backgroundColor: colors.card, borderRadius: colors.radius }]}
          >
            <Ionicons name="search" size={18} color={colors.mutedForeground} />
            <Text style={[styles.searchPlaceholder, { color: colors.mutedForeground }]}>
              Search tours & experiences...
            </Text>
            <View style={[styles.searchGo, { backgroundColor: colors.accent }]}>
              <Ionicons name="arrow-forward" size={16} color={colors.accentForeground} />
            </View>
          </Pressable>

          {/* Quick stat pills */}
          <View style={styles.statPills}>
            {[
              { icon: 'star' as const, label: '4.9 avg rating' },
              { icon: 'people' as const, label: '5,000+ travelers' },
              { icon: 'shield-checkmark' as const, label: 'Free cancellation' },
            ].map(({ icon, label }) => (
              <View key={label} style={styles.statPill}>
                <Ionicons name={icon} size={13} color="#F4A362" />
                <Text style={styles.statPillText}>{label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>
      </View>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="Browse by Category" onSeeAll={goToExplore} />
          <FlatList
            data={categories.slice(0, 8)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(c) => String(c.id)}
            contentContainerStyle={styles.categoryList}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/(tabs)/explore');
                }}
                style={({ pressed }) => [
                  styles.categoryCard,
                  {
                    backgroundColor: pressed ? colors.muted : colors.card,
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <View style={[styles.categoryIcon, { backgroundColor: `${colors.primary}15` }]}>
                  <Text style={styles.categoryIconText}>{item.icon}</Text>
                </View>
                <Text style={[styles.categoryName, { color: colors.foreground }]} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={[styles.categoryCount, { color: colors.mutedForeground }]}>
                  {item.tourCount} tours
                </Text>
              </Pressable>
            )}
          />
        </View>
      )}

      {/* Best Sellers */}
      <View style={styles.section}>
        <SectionHeader title="Best Sellers" onSeeAll={goToExplore} />
        {bsLoading ? (
          <FlatList
            data={[1, 2, 3]}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(i) => String(i)}
            contentContainerStyle={styles.horizontalList}
            renderItem={() => <SkeletonCard horizontal />}
          />
        ) : (
          <FlatList
            data={bestSellers ?? []}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(t: Tour) => String(t.id)}
            contentContainerStyle={styles.horizontalList}
            scrollEnabled={(bestSellers?.length ?? 0) > 0}
            renderItem={({ item }: { item: Tour }) => (
              <View style={{ width: CARD_WIDTH }}>
                <TourCard tour={item} horizontal />
              </View>
            )}
          />
        )}
      </View>

      {/* Featured Tours */}
      <View style={styles.section}>
        <SectionHeader title="Featured Experiences" onSeeAll={goToExplore} />
        {featLoading ? (
          <View style={styles.verticalList}>
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </View>
        ) : (featured ?? []).length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="compass-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No featured tours right now
            </Text>
          </View>
        ) : (
          <View style={styles.verticalList}>
            {(featured ?? []).slice(0, 6).map((tour: Tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </View>
        )}
      </View>

      {/* WhatsApp CTA banner */}
      <View style={[styles.waBanner, { marginHorizontal: 16, borderRadius: colors.radius }]}>
        <LinearGradient
          colors={['#128C7E', '#25D366']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.waBannerGradient, { borderRadius: colors.radius }]}
        >
          <View>
            <Text style={styles.waBannerTitle}>Need a custom tour?</Text>
            <Text style={styles.waBannerSub}>Chat with us on WhatsApp</Text>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              const msg = encodeURIComponent('Hello! I need help planning a custom tour in Egypt.');
              import('expo-linking').then(({ openURL }) =>
                openURL(`https://wa.me/201001234567?text=${msg}`)
              );
            }}
            style={({ pressed }) => [
              styles.waBannerBtn,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
          </Pressable>
        </LinearGradient>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hero: {},
  heroGradient: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'PlayfairDisplay_700Bold',
    letterSpacing: 0.3,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    fontFamily: 'PlayfairDisplay_800ExtraBold',
    lineHeight: 42,
    marginBottom: 10,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    fontFamily: 'Inter_400Regular',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  searchGo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statPills: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  section: {
    marginTop: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  categoryCard: {
    width: 90,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    gap: 6,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconText: {
    fontSize: 22,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
  },
  categoryCount: {
    fontSize: 10,
    textAlign: 'center',
  },
  horizontalList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  verticalList: {
    paddingHorizontal: 16,
    gap: 16,
  },
  skeletonCard: {
    height: 280,
    marginBottom: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
  waBanner: {
    marginTop: 28,
    marginBottom: 8,
    overflow: 'hidden',
  },
  waBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  waBannerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  waBannerSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  waBannerBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
