import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import type { Tour } from '@workspace/api-client-react';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface TourCardProps {
  tour: Tour;
  horizontal?: boolean;
}

function openWhatsApp(tourTitle: string, whatsapp?: string | null) {
  const number = whatsapp ?? '201001234567';
  const msg = encodeURIComponent(
    `Hello, I'd like to book: ${tourTitle}. Please send available dates and pricing.`
  );
  // Use Linking in a safe way — just return the URL for the parent to handle
  return `https://wa.me/${number}?text=${msg}`;
}

export function TourCard({ tour, horizontal = false }: TourCardProps) {
  const colors = useColors();
  const discount = tour.discountPrice
    ? Math.round((1 - tour.discountPrice / tour.price) * 100)
    : 0;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/tour/${tour.id}`);
  };

  const cardWidth = horizontal ? SCREEN_WIDTH * 0.72 : undefined;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
          width: cardWidth,
          opacity: pressed ? 0.95 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      {/* Cover image */}
      <View style={[styles.imageWrapper, { borderRadius: colors.radius }]}>
        <Image
          source={{ uri: tour.coverImage }}
          style={styles.image}
          contentFit="cover"
          transition={300}
        />
        {/* Badges */}
        <View style={styles.badgeRow}>
          {tour.isFeatured && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.badgeText, { color: colors.primaryForeground }]}>
                Featured
              </Text>
            </View>
          )}
          {discount > 0 && (
            <View style={[styles.badge, { backgroundColor: '#EF4444' }]}>
              <Text style={[styles.badgeText, { color: '#FFFFFF' }]}>
                -{discount}%
              </Text>
            </View>
          )}
        </View>
        {/* Duration pill */}
        <View style={[styles.durationPill, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
          <Feather name="clock" size={11} color="#FFFFFF" />
          <Text style={styles.durationText}>{tour.durationHours}h</Text>
        </View>
      </View>

      {/* Body */}
      <View style={styles.body}>
        {tour.categoryName ? (
          <Text style={[styles.category, { color: colors.secondary }]} numberOfLines={1}>
            {tour.categoryName}
          </Text>
        ) : null}
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
          {tour.title}
        </Text>

        {/* Rating */}
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={13} color={colors.accent} />
          <Text style={[styles.rating, { color: colors.foreground }]}>
            {tour.rating.toFixed(1)}
          </Text>
          <Text style={[styles.reviewCount, { color: colors.mutedForeground }]}>
            ({tour.reviewCount})
          </Text>
          {tour.hasHotelPickup && (
            <>
              <View style={[styles.dot, { backgroundColor: colors.border }]} />
              <Ionicons name="car-outline" size={13} color={colors.secondary} />
              <Text style={[styles.pickup, { color: colors.secondary }]}>Hotel pickup</Text>
            </>
          )}
        </View>

        {/* Price row */}
        <View style={styles.priceRow}>
          <View>
            <Text style={[styles.fromLabel, { color: colors.mutedForeground }]}>From</Text>
            <View style={styles.priceInner}>
              {tour.discountPrice ? (
                <>
                  <Text style={[styles.originalPrice, { color: colors.mutedForeground }]}>
                    ${tour.price}
                  </Text>
                  <Text style={[styles.price, { color: colors.foreground }]}>
                    ${tour.discountPrice}
                  </Text>
                </>
              ) : (
                <Text style={[styles.price, { color: colors.foreground }]}>
                  ${tour.price}
                </Text>
              )}
              <Text style={[styles.perPerson, { color: colors.mutedForeground }]}>/pp</Text>
            </View>
          </View>
          {/* WhatsApp quick book */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              const url = openWhatsApp(tour.title);
              // Use expo-linking — polyfilled on web
              import('expo-linking').then(({ openURL }) => openURL(url));
            }}
            style={({ pressed }) => [
              styles.waButton,
              {
                backgroundColor: pressed ? '#1DA851' : '#25D366',
                borderRadius: colors.radius - 4,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageWrapper: {
    height: 180,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgeRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  durationPill: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  body: {
    padding: 12,
  },
  category: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  rating: {
    fontSize: 13,
    fontWeight: '600',
  },
  reviewCount: {
    fontSize: 12,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    marginHorizontal: 2,
  },
  pickup: {
    fontSize: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  fromLabel: {
    fontSize: 11,
    marginBottom: 1,
  },
  priceInner: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  originalPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
  },
  perPerson: {
    fontSize: 11,
  },
  waButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
