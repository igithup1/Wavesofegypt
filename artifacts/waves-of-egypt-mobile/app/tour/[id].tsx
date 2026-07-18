import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  FlatList,
  ActivityIndicator,
  Platform,
  Share,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useGetTour } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { WEB_APP_URL } from '@/constants/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function StarRating({ rating }: { rating: number }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={rating >= star ? 'star' : rating >= star - 0.5 ? 'star-half' : 'star-outline'}
          size={14}
          color={colors.accent}
        />
      ))}
    </View>
  );
}

export default function TourDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'highlights' | 'included'>('overview');

  const tourId = Number(id);
  const { data: tour, isLoading, isError, refetch } = useGetTour(tourId);

  const handleWhatsApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const number = tour?.whatsappNumber ?? '201001234567';
    const msg = encodeURIComponent(
      `Hello! I'd like to book: ${tour?.title}. Please share available dates and pricing.`
    );
    const url = `https://wa.me/${number}?text=${msg}`;
    import('expo-linking').then(({ openURL }) => openURL(url));
  };

  const handleShare = async () => {
    if (!tour) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = `${WEB_APP_URL}/tours/${tourId}`;
    try {
      await Share.share({
        title: tour.title,
        message: Platform.OS === 'ios' ? tour.title : `${tour.title}\n${url}`,
        url,
      });
    } catch {
      // user cancelled or share unavailable — silent
    }
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !tour) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.mutedForeground} />
        <Text style={[styles.errorTitle, { color: colors.foreground }]}>Tour not found</Text>
        <Pressable
          onPress={() => refetch()}
          style={[styles.retryBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const allImages = [tour.coverImage, ...(tour.images ?? [])].filter(Boolean);
  const discount = tour.discountPrice
    ? Math.round((1 - tour.discountPrice / tour.price) * 100)
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Floating Back Button */}
      <Pressable
        onPress={() => router.back()}
        style={[
          styles.backBtn,
          { top: topPad + 8, backgroundColor: 'rgba(0,0,0,0.5)' },
        ]}
      >
        <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
      </Pressable>

      {/* Floating Share Button */}
      {tour && (
        <Pressable
          onPress={handleShare}
          style={({ pressed }) => [
            styles.shareBtn,
            {
              top: topPad + 8,
              backgroundColor: 'rgba(0,0,0,0.5)',
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Ionicons name="share-outline" size={22} color="#FFFFFF" />
        </Pressable>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === 'web' ? 100 : 110) }}
      >
        {/* Hero Gallery */}
        <View style={styles.heroContainer}>
          <FlatList
            data={allImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => String(i)}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setActiveImage(index);
            }}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item }}
                style={{ width: SCREEN_WIDTH, height: 300 }}
                contentFit="cover"
                transition={200}
              />
            )}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.5)']}
            style={styles.heroGradient}
          />
          {/* Pagination dots */}
          {allImages.length > 1 && (
            <View style={styles.dotsRow}>
              {allImages.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    { backgroundColor: i === activeImage ? '#FFFFFF' : 'rgba(255,255,255,0.5)' },
                    i === activeImage ? styles.dotActive : null,
                  ]}
                />
              ))}
            </View>
          )}
          {/* Category badge */}
          {tour.categoryName && (
            <View style={[styles.categoryBadge, { backgroundColor: colors.secondary }]}>
              <Text style={styles.categoryBadgeText}>{tour.categoryName}</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Title & rating */}
          <View style={styles.titleSection}>
            {discount > 0 && (
              <View style={[styles.discountBadge, { backgroundColor: '#EF4444' }]}>
                <Text style={styles.discountText}>-{discount}% OFF</Text>
              </View>
            )}
            <Text style={[styles.title, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
              {tour.title}
            </Text>
            <View style={styles.ratingRow}>
              <StarRating rating={tour.rating} />
              <Text style={[styles.ratingNum, { color: colors.foreground }]}>
                {tour.rating.toFixed(1)}
              </Text>
              <Text style={[styles.reviewCount, { color: colors.mutedForeground }]}>
                ({tour.reviewCount} reviews)
              </Text>
            </View>
          </View>

          {/* Stats chips */}
          <View style={styles.statsRow}>
            <StatChip icon="time-outline" label={`${tour.durationHours}h`} colors={colors} />
            {tour.maxParticipants && (
              <StatChip icon="people-outline" label={`Max ${tour.maxParticipants}`} colors={colors} />
            )}
            {tour.difficulty && (
              <StatChip icon="trending-up-outline" label={tour.difficulty} colors={colors} />
            )}
            {tour.hasHotelPickup && (
              <StatChip icon="car-outline" label="Hotel Pickup" colors={colors} />
            )}
            {tour.freeCancellation && (
              <StatChip icon="shield-checkmark-outline" label="Free Cancel" colors={colors} />
            )}
            {tour.instantConfirmation && (
              <StatChip icon="flash-outline" label="Instant Confirm" colors={colors} />
            )}
          </View>

          {/* Tab switcher */}
          <View style={[styles.tabBar, { borderColor: colors.border }]}>
            {(['overview', 'highlights', 'included'] as const).map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tab,
                  activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: activeTab === tab ? colors.primary : colors.mutedForeground,
                      fontWeight: activeTab === tab ? '700' : '500',
                    },
                  ]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Tab content */}
          {activeTab === 'overview' && (
            <View style={styles.tabContent}>
              {tour.description ? (
                <Text style={[styles.description, { color: colors.foreground }]}>
                  {tour.description}
                </Text>
              ) : null}
              {(tour as any).meetingPoint ? (
                <View style={[styles.infoBox, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
                  <Ionicons name="location-outline" size={18} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Meeting Point</Text>
                    <Text style={[styles.infoValue, { color: colors.foreground }]}>
                      {(tour as any).meetingPoint}
                    </Text>
                  </View>
                </View>
              ) : null}
              {(tour as any).languages?.length > 0 ? (
                <View style={[styles.infoBox, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
                  <Ionicons name="language-outline" size={18} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Languages</Text>
                    <Text style={[styles.infoValue, { color: colors.foreground }]}>
                      {(tour as any).languages.join(', ')}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          )}

          {activeTab === 'highlights' && (
            <View style={styles.tabContent}>
              {tour.highlights && tour.highlights.length > 0 ? (
                tour.highlights.map((h, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <View style={[styles.bullet, { backgroundColor: colors.accent }]} />
                    <Text style={[styles.bulletText, { color: colors.foreground }]}>{h}</Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.description, { color: colors.mutedForeground }]}>
                  No highlights listed.
                </Text>
              )}
            </View>
          )}

          {activeTab === 'included' && (
            <View style={styles.tabContent}>
              {tour.included && tour.included.length > 0 && (
                <>
                  <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Included</Text>
                  {tour.included.map((item, i) => (
                    <View key={i} style={styles.checkRow}>
                      <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
                      <Text style={[styles.checkText, { color: colors.foreground }]}>{item}</Text>
                    </View>
                  ))}
                </>
              )}
              {tour.excluded && tour.excluded.length > 0 && (
                <>
                  <Text style={[styles.sectionLabel, { color: colors.foreground, marginTop: 16 }]}>
                    Not Included
                  </Text>
                  {tour.excluded.map((item, i) => (
                    <View key={i} style={styles.checkRow}>
                      <Ionicons name="close-circle" size={18} color="#EF4444" />
                      <Text style={[styles.checkText, { color: colors.foreground }]}>{item}</Text>
                    </View>
                  ))}
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View
        style={[
          styles.cta,
          {
            paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 8,
            backgroundColor: colors.card,
            borderTopColor: colors.border,
          },
        ]}
      >
        <View style={styles.ctaPrice}>
          <Text style={[styles.ctaFrom, { color: colors.mutedForeground }]}>From</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
            {tour.discountPrice ? (
              <>
                <Text style={[styles.ctaOriginal, { color: colors.mutedForeground }]}>
                  ${tour.price}
                </Text>
                <Text style={[styles.ctaPriceNum, { color: colors.foreground }]}>
                  ${tour.discountPrice}
                </Text>
              </>
            ) : (
              <Text style={[styles.ctaPriceNum, { color: colors.foreground }]}>
                ${tour.price}
              </Text>
            )}
            <Text style={[styles.ctaFrom, { color: colors.mutedForeground }]}>/pp</Text>
          </View>
        </View>
        <View style={styles.ctaBtns}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push(`/tour/book/${tourId}` as any);
            }}
            style={({ pressed }) => [
              styles.bookBtn,
              {
                backgroundColor: colors.primary,
                borderRadius: colors.radius,
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
                flex: 1,
              },
            ]}
          >
            <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
            <Text style={styles.bookBtnText}>Book Now</Text>
          </Pressable>
          <Pressable
            onPress={handleWhatsApp}
            style={({ pressed }) => [
              styles.whatsappBtn,
              {
                backgroundColor: pressed ? '#1DA851' : '#25D366',
                borderRadius: colors.radius,
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function StatChip({
  icon,
  label,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.statChip, { backgroundColor: colors.muted, borderRadius: 20 }]}>
      <Ionicons name={icon} size={14} color={colors.primary} />
      <Text style={[styles.statLabel, { color: colors.foreground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    zIndex: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtn: {
    position: 'absolute',
    right: 16,
    zIndex: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContainer: {
    height: 300,
    position: 'relative',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 16,
  },
  categoryBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    padding: 20,
  },
  titleSection: {
    marginBottom: 16,
    gap: 8,
  },
  discountBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 34,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingNum: {
    fontSize: 14,
    fontWeight: '700',
  },
  reviewCount: {
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
  },
  tabContent: {
    gap: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    fontFamily: 'Inter_400Regular',
  },
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },
  cta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    gap: 16,
  },
  ctaPrice: {
    flex: 1,
  },
  ctaFrom: {
    fontSize: 11,
  },
  ctaOriginal: {
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  ctaPriceNum: {
    fontSize: 22,
    fontWeight: '800',
  },
  ctaBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  whatsappBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    paddingVertical: 14,
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
});
