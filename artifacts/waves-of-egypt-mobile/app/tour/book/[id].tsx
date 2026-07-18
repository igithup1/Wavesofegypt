/**
 * BookingScreen — mobile booking flow for a single tour.
 *
 * Handles the 409 DUPLICATE_BOOKING error from the API and shows it
 * inline near the date picker so the traveler sees it in context.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  useGetTour,
  useCreateBooking,
  useListBookings,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/contexts/AuthContext';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// ---------------------------------------------------------------------------
// Mini calendar
// ---------------------------------------------------------------------------

interface CalendarProps {
  selected: string | null;
  onSelect: (dateStr: string) => void;
  disabledDates: Set<string>;
  colors: ReturnType<typeof useColors>;
}

function MiniCalendar({ selected, onSelect, disabledDates, colors }: CalendarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const days = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: Array<{ date: Date | null; str: string | null }> = [];
    for (let i = 0; i < firstDay; i++) cells.push({ date: null, str: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d);
      cells.push({ date, str: toDateStr(date) });
    }
    return cells;
  }, [viewYear, viewMonth]);

  const canGoPrev =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  return (
    <View>
      {/* Header */}
      <View style={calStyles.header}>
        <Pressable
          onPress={prevMonth}
          disabled={!canGoPrev}
          style={({ pressed }) => [calStyles.navBtn, { opacity: pressed || !canGoPrev ? 0.4 : 1 }]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[calStyles.monthLabel, { color: colors.foreground }]}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </Text>
        <Pressable
          onPress={nextMonth}
          style={({ pressed }) => [calStyles.navBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.foreground} />
        </Pressable>
      </View>

      {/* Day-of-week labels */}
      <View style={calStyles.daysRow}>
        {DAY_LABELS.map((label) => (
          <Text key={label} style={[calStyles.dayLabel, { color: colors.mutedForeground }]}>
            {label}
          </Text>
        ))}
      </View>

      {/* Date grid */}
      <View style={calStyles.grid}>
        {days.map((cell, idx) => {
          if (!cell.date || !cell.str) {
            return <View key={`empty-${idx}`} style={calStyles.cell} />;
          }
          const isPast = cell.date < today;
          const isDisabled = isPast || disabledDates.has(cell.str);
          const isSelected = cell.str === selected;
          const isToday = cell.str === toDateStr(today);

          return (
            <Pressable
              key={cell.str}
              onPress={() => {
                if (isDisabled) return;
                Haptics.selectionAsync();
                onSelect(cell.str!);
              }}
              style={({ pressed }) => [
                calStyles.cell,
                isSelected && { backgroundColor: colors.primary, borderRadius: 20 },
                !isSelected && isToday && { borderWidth: 1, borderColor: colors.primary, borderRadius: 20 },
                !isDisabled && pressed && { opacity: 0.7 },
              ]}
            >
              <Text
                style={[
                  calStyles.cellText,
                  { color: isSelected ? '#FFFFFF' : isDisabled ? colors.mutedForeground : colors.foreground },
                  isDisabled && { textDecorationLine: 'line-through' },
                  !isDisabled && !isSelected && isToday && { color: colors.primary, fontWeight: '700' },
                ]}
              >
                {cell.date.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const calStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navBtn: {
    padding: 8,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  daysRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 14,
  },
});

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function BookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const tourId = Number(id);

  const { data: tour, isLoading: tourLoading } = useGetTour(tourId);

  // Fetch existing bookings so we can mark already-booked dates
  const { data: myBookings } = useListBookings(
    { limit: 100 },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { query: { enabled: !!user } } as any,
  );

  const bookedDatesForTour = useMemo<Set<string>>(() => {
    if (!myBookings) return new Set();
    return new Set(
      myBookings
        .filter((b) => b.tourId === tourId && b.status !== 'cancelled')
        .map((b) => (typeof b.date === 'string' ? b.date : toDateStr(new Date(b.date as string)))),
    );
  }, [myBookings, tourId]);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [participants, setParticipants] = useState(1);
  const [notes, setNotes] = useState('');

  // Error states
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const createBookingMutation = useCreateBooking();

  const pricePerPerson = tour?.discountPrice || tour?.price || 0;
  const totalPrice = pricePerPerson * participants;

  const isDuplicateDate = selectedDate ? bookedDatesForTour.has(selectedDate) : false;

  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr);
    setDuplicateError(null);
    setGeneralError(null);
  };

  const formatDisplayDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const showError = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleConfirm = () => {
    if (!user) {
      showError('Login required', 'Please log in to book a tour.');
      router.push('/(tabs)/profile');
      return;
    }
    if (!selectedDate) {
      showError('Select a date', 'Please pick a date before confirming your booking.');
      return;
    }
    if (isDuplicateDate) {
      setDuplicateError('You already have a booking for this date. Please choose a different date.');
      return;
    }

    setDuplicateError(null);
    setGeneralError(null);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    createBookingMutation.mutate(
      { data: { tourId, date: selectedDate, participants, notes } },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          // Navigate back and show success
          if (Platform.OS !== 'web') {
            Alert.alert(
              '🎉 Booking confirmed!',
              `Your spot on "${tour?.title}" on ${formatDisplayDate(selectedDate)} is reserved.`,
              [{ text: 'View bookings', onPress: () => router.replace('/(tabs)/profile') }],
            );
          } else {
            router.replace('/(tabs)/profile');
          }
        },
        onError: (error) => {
          // error is an ApiError instance; cast through unknown to access its fields
          const apiError = error as unknown as {
            status: number;
            message: string;
            data: { code?: string; error?: string } | null;
          };
          const data = apiError.data;

          if (apiError.status === 409 && data?.code === 'DUPLICATE_BOOKING') {
            // Show inline near the date picker
            setDuplicateError(
              data?.error ?? 'You already have a booking for this date. Please choose a different date.',
            );
          } else if (apiError.status === 409) {
            // Capacity exceeded or other 409
            setGeneralError(data?.error ?? 'This date is fully booked. Please choose a different date.');
          } else {
            setGeneralError(apiError.message ?? 'Something went wrong. Please try again.');
          }
        },
      },
    );
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  if (tourLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!tour) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.mutedForeground} />
        <Text style={[styles.errorTitle, { color: colors.foreground }]}>Tour not found</Text>
      </View>
    );
  }

  const maxParticipants = tour.maxParticipants ?? 20;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header bar */}
      <View
        style={[
          styles.headerBar,
          {
            paddingTop: topPad + 8,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
          Book Tour
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 120,
        }}
      >
        {/* Tour summary */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.tourName, { color: colors.foreground, fontFamily: 'PlayfairDisplay_700Bold' }]}>
            {tour.title}
          </Text>
          <View style={styles.priceRow}>
            {tour.discountPrice ? (
              <>
                <Text style={[styles.originalPrice, { color: colors.mutedForeground }]}>
                  ${tour.price}
                </Text>
                <Text style={[styles.price, { color: colors.secondary }]}>
                  ${tour.discountPrice}
                </Text>
              </>
            ) : (
              <Text style={[styles.price, { color: colors.secondary }]}>${tour.price}</Text>
            )}
            <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}> / person</Text>
          </View>
        </View>

        {/* Date picker */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Select Date</Text>

          <MiniCalendar
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabledDates={bookedDatesForTour}
            colors={colors}
          />

          {/* Selected date display */}
          {selectedDate && (
            <View
              style={[
                styles.selectedDateBanner,
                {
                  backgroundColor: (duplicateError || isDuplicateDate) ? '#FEF3C7' : colors.muted,
                  borderColor: (duplicateError || isDuplicateDate) ? '#F59E0B' : 'transparent',
                },
              ]}
            >
              <Ionicons
                name={(duplicateError || isDuplicateDate) ? 'warning-outline' : 'calendar-outline'}
                size={16}
                color={(duplicateError || isDuplicateDate) ? '#92400E' : colors.primary}
              />
              <Text
                style={[
                  styles.selectedDateText,
                  { color: (duplicateError || isDuplicateDate) ? '#92400E' : colors.foreground },
                ]}
              >
                {formatDisplayDate(selectedDate)}
              </Text>
            </View>
          )}

          {/* Inline duplicate-booking error */}
          {(duplicateError || (isDuplicateDate && selectedDate)) && (
            <View style={[styles.inlineError, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
              <Ionicons name="alert-circle" size={18} color="#92400E" />
              <Text style={[styles.inlineErrorText, { color: '#92400E' }]}>
                {duplicateError ?? 'You already have a booking for this date. Please choose a different date.'}
              </Text>
            </View>
          )}

          {/* General (capacity/other) error near date section */}
          {generalError && !duplicateError && (
            <View style={[styles.inlineError, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
              <Ionicons name="alert-circle" size={18} color="#991B1B" />
              <Text style={[styles.inlineErrorText, { color: '#991B1B' }]}>{generalError}</Text>
            </View>
          )}
        </View>

        {/* Participants */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Travelers</Text>
          <View style={styles.counterRow}>
            <Pressable
              onPress={() => {
                if (participants > 1) {
                  Haptics.selectionAsync();
                  setParticipants((p) => p - 1);
                }
              }}
              style={[
                styles.counterBtn,
                { borderColor: colors.border, opacity: participants <= 1 ? 0.4 : 1 },
              ]}
            >
              <Ionicons name="remove" size={20} color={colors.foreground} />
            </Pressable>
            <View style={[styles.counterValue, { borderColor: colors.border }]}>
              <Text style={[styles.counterText, { color: colors.foreground }]}>{participants}</Text>
              <Ionicons name="people-outline" size={16} color={colors.mutedForeground} />
            </View>
            <Pressable
              onPress={() => {
                if (participants < maxParticipants) {
                  Haptics.selectionAsync();
                  setParticipants((p) => p + 1);
                }
              }}
              style={[
                styles.counterBtn,
                { borderColor: colors.border, opacity: participants >= maxParticipants ? 0.4 : 1 },
              ]}
            >
              <Ionicons name="add" size={20} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.maxHint, { color: colors.mutedForeground }]}>
              Max {maxParticipants}
            </Text>
          </View>
        </View>

        {/* Price summary */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
              ${pricePerPerson} × {participants} {participants === 1 ? 'person' : 'people'}
            </Text>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>
              ${totalPrice}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>${totalPrice}</Text>
          </View>
        </View>

        {/* Not logged in warning */}
        {!user && (
          <View style={[styles.authWarning, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Ionicons name="person-circle-outline" size={20} color={colors.mutedForeground} />
            <Text style={[styles.authWarningText, { color: colors.mutedForeground }]}>
              You need to be logged in to confirm a booking.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Sticky confirm button */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: Platform.OS === 'web' ? 24 : insets.bottom + 12,
            backgroundColor: colors.card,
            borderTopColor: colors.border,
          },
        ]}
      >
        <Pressable
          onPress={handleConfirm}
          disabled={createBookingMutation.isPending || (isDuplicateDate && !duplicateError === false)}
          style={({ pressed }) => [
            styles.confirmBtn,
            {
              backgroundColor:
                createBookingMutation.isPending
                  ? colors.mutedForeground
                  : colors.primary,
              borderRadius: colors.radius,
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}
        >
          {createBookingMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
              <Text style={styles.confirmBtnText}>Confirm Booking</Text>
            </>
          )}
        </Pressable>
      </View>
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
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  tourName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  originalPrice: {
    fontSize: 13,
    textDecorationLine: 'line-through',
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
  },
  priceLabel: {
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 14,
  },
  selectedDateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
  },
  selectedDateText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
  },
  inlineErrorText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  counterBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 10,
  },
  counterValue: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    marginHorizontal: -1,
  },
  counterText: {
    fontSize: 18,
    fontWeight: '700',
  },
  maxHint: {
    fontSize: 12,
    marginLeft: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  authWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  authWarningText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
