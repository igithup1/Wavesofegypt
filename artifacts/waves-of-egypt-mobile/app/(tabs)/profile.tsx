/**
 * Profile tab — shows current user info when logged in,
 * or a login / register form when logged out.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/contexts/AuthContext';
import { useLogin, useRegister } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetWishlistQueryKey } from '@workspace/api-client-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

// ---------------------------------------------------------------------------
// Logged-in view
// ---------------------------------------------------------------------------

function ProfileLoggedIn() {
  const colors = useColors();
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      // Invalidate wishlist so it refetches after logout.
      queryClient.removeQueries({ queryKey: getGetWishlistQueryKey() });
    } finally {
      setSigningOut(false);
    }
  };

  const initials = user
    ? (user.name ?? user.email)
        .split(' ')
        .slice(0, 2)
        .map((w: string) => w[0]?.toUpperCase() ?? '')
        .join('')
    : '?';

  const roleLabel =
    user?.role === 'admin'
      ? 'Administrator'
      : user?.role === 'vendor'
        ? 'Tour Vendor'
        : 'Traveler';

  return (
    <View style={styles.loggedInContainer}>
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      <Text style={[styles.userName, { color: colors.foreground }]}>
        {user?.name ?? 'Traveler'}
      </Text>
      <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>
        {user?.email}
      </Text>

      {/* Role badge */}
      <View style={[styles.roleBadge, { backgroundColor: colors.muted }]}>
        <Ionicons name="shield-checkmark-outline" size={13} color={colors.secondary} />
        <Text style={[styles.roleBadgeText, { color: colors.mutedForeground }]}>
          {roleLabel}
        </Text>
      </View>

      {/* Info cards */}
      <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <InfoRow icon="mail" label="Email" value={user?.email ?? '—'} colors={colors} />
      </View>

      {/* Sign-out button */}
      <Pressable
        onPress={handleSignOut}
        disabled={signingOut}
        style={({ pressed }) => [
          styles.signOutButton,
          { borderColor: colors.destructive, opacity: pressed || signingOut ? 0.7 : 1 },
        ]}
      >
        {signingOut ? (
          <ActivityIndicator size="small" color={colors.destructive} />
        ) : (
          <>
            <Feather name="log-out" size={16} color={colors.destructive} />
            <Text style={[styles.signOutText, { color: colors.destructive }]}>Sign Out</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  colors,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIconWrap, { backgroundColor: colors.muted }]}>
        <Feather name={icon} size={15} color={colors.secondary} />
      </View>
      <View style={styles.infoRowText}>
        <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Auth form (login + register)
// ---------------------------------------------------------------------------

type AuthMode = 'login' | 'register';

function AuthForm() {
  const colors = useColors();
  const { signIn } = useAuth();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { mutate: doLogin, isPending: loginPending } = useLogin();
  const { mutate: doRegister, isPending: registerPending } = useRegister();

  const isPending = loginPending || registerPending;

  const handleSubmit = () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedName = name.trim();

    if (!trimmedEmail || !trimmedPassword) {
      showAlert('Missing fields', 'Please enter your email and password.');
      return;
    }
    if (mode === 'register' && !trimmedName) {
      showAlert('Missing name', 'Please enter your name to create an account.');
      return;
    }

    if (mode === 'login') {
      doLogin(
        { data: { email: trimmedEmail, password: trimmedPassword } },
        {
          onSuccess: async (res) => {
            await signIn(res.token, res.user);
            // Refresh wishlist now that we're authenticated.
            queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() });
          },
          onError: (err) => {
            const msg = (err as { message?: string })?.message ?? 'Login failed. Please check your credentials.';
            showAlert('Login failed', msg);
          },
        },
      );
    } else {
      doRegister(
        { data: { email: trimmedEmail, password: trimmedPassword, name: trimmedName } },
        {
          onSuccess: async (res) => {
            await signIn(res.token, res.user);
            queryClient.invalidateQueries({ queryKey: getGetWishlistQueryKey() });
          },
          onError: (err) => {
            const msg = (err as { message?: string })?.message ?? 'Registration failed. Please try again.';
            showAlert('Registration failed', msg);
          },
        },
      );
    }
  };

  return (
    <View style={styles.formContainer}>
      {/* Icon */}
      <View style={[styles.formIcon, { backgroundColor: colors.primary }]}>
        <Feather name="user" size={32} color="#FFFFFF" />
      </View>

      <Text style={[styles.formTitle, { color: colors.foreground }]}>
        {mode === 'login' ? 'Welcome back' : 'Create account'}
      </Text>
      <Text style={[styles.formSubtitle, { color: colors.mutedForeground }]}>
        {mode === 'login'
          ? 'Sign in to see your bookings and saved tours'
          : 'Join WavesOfEgypt to save tours and manage bookings'}
      </Text>

      {/* Name field (register only) */}
      {mode === 'register' && (
        <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Feather name="user" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Full name"
            placeholderTextColor={colors.mutedForeground}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoComplete="name"
            returnKeyType="next"
          />
        </View>
      )}

      {/* Email */}
      <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Feather name="mail" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: colors.foreground }]}
          placeholder="Email address"
          placeholderTextColor={colors.mutedForeground}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          returnKeyType="next"
        />
      </View>

      {/* Password */}
      <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Feather name="lock" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: colors.foreground }]}
          placeholder="Password"
          placeholderTextColor={colors.mutedForeground}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />
        <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
          <Feather
            name={showPassword ? 'eye-off' : 'eye'}
            size={16}
            color={colors.mutedForeground}
          />
        </Pressable>
      </View>

      {/* Submit button */}
      <Pressable
        onPress={handleSubmit}
        disabled={isPending}
        style={({ pressed }) => [
          styles.submitButton,
          { backgroundColor: colors.primary, opacity: pressed || isPending ? 0.8 : 1 },
        ]}
      >
        {isPending ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </Text>
        )}
      </Pressable>

      {/* Toggle mode */}
      <Pressable
        onPress={() => {
          setMode((m) => (m === 'login' ? 'register' : 'login'));
          setPassword('');
        }}
        style={styles.toggleButton}
      >
        <Text style={[styles.toggleText, { color: colors.mutedForeground }]}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <Text style={[styles.toggleLink, { color: colors.secondary }]}>
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </Text>
        </Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, isLoading } = useAuth();

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
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
        <Text style={styles.headerTitle}>Profile</Text>
        {user && (
          <Text style={styles.headerSubtitle}>
            {user.name ?? user.email}
          </Text>
        )}
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: bottomPadding },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {user ? <ProfileLoggedIn /> : <AuthForm />}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },

  // ---- Logged-in ----
  loggedInContainer: {
    alignItems: 'center',
    gap: 12,
    paddingTop: 16,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  userEmail: {
    fontSize: 14,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoCard: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  infoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoRowText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '700',
  },

  // ---- Auth form ----
  formContainer: {
    alignItems: 'center',
    gap: 14,
    paddingTop: 12,
  },
  formIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'PlayfairDisplay_800ExtraBold',
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 280,
    marginBottom: 4,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  inputIcon: {
    // Fixed width so text aligns across inputs.
    width: 18,
    textAlign: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  submitButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  toggleButton: {
    paddingVertical: 4,
  },
  toggleText: {
    fontSize: 14,
    textAlign: 'center',
  },
  toggleLink: {
    fontWeight: '700',
  },
});
