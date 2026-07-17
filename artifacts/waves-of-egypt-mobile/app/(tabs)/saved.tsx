import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Platform,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useWishlist } from '@/contexts/WishlistContext';
import { TourCard } from '@/components/TourCard';
import type { Tour } from '@workspace/api-client-react';

export default function SavedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { savedTours, isLoading } = useWishlist();

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  // Bottom padding for the floating tab bar.
  const bottomPadding = insets.bottom + 60;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: topPadding + 12, backgroundColor: colors.primary },
        ]}
      >
        <Text style={styles.headerTitle}>Saved Tours</Text>
        {savedTours.length > 0 && (
          <Text style={[styles.headerSubtitle]}>
            {savedTours.length} {savedTours.length === 1 ? 'tour' : 'tours'} saved
          </Text>
        )}
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <Ionicons name="heart" size={48} color={colors.border} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Loading…
          </Text>
        </View>
      ) : savedTours.length === 0 ? (
        <View style={styles.centered}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="heart-outline" size={40} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No saved tours yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Tap the heart icon on any tour to save it here for later.
          </Text>
          <Pressable
            onPress={() => router.push('/explore')}
            style={({ pressed }) => [
              styles.exploreButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={[styles.exploreButtonText, { color: colors.primaryForeground }]}>
              Browse Tours
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={savedTours}
          keyExtractor={(item: Tour) => String(item.id)}
          renderItem={({ item }: { item: Tour }) => <TourCard tour={item} />}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: bottomPadding },
          ]}
          showsVerticalScrollIndicator={false}
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
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'PlayfairDisplay_800ExtraBold',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
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
    gap: 14,
    padding: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 260,
  },
  exploreButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  exploreButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
