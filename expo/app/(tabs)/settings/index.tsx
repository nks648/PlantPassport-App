import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import {
  Thermometer,
  Sun,
  Moon,
  Smartphone,
  Check,
  LogOut,
  UserCircle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSettings, TemperatureUnit, AppLanguage, ThemeMode } from '@/providers/SettingsProvider';
import { useAuth, AuthProviderName } from '@/providers/AuthProvider';
import GlassCard from '@/components/GlassCard';

function AppleGlyph({ color }: { color: string }) {
  return <Text style={[styles.providerGlyph, { color }]}></Text>;
}

function GoogleGlyph() {
  return <Text style={[styles.providerGlyph, styles.googleGlyph]}>G</Text>;
}

interface OptionItem<T> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export default function SettingsScreen() {
  const { settings, updateSettings, t, colors } = useSettings();
  const { user, isAuthenticated, isLoading: authLoading, isSigningIn, error: authError, signIn, signOut, clearError } = useAuth();

  const handleSignIn = useCallback(async (provider: AuthProviderName) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    clearError();
    await signIn(provider);
  }, [signIn, clearError]);

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await signOut();
        },
      },
    ]);
  }, [signOut]);

  const handleTempUnit = useCallback((unit: TemperatureUnit) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateSettings({ temperatureUnit: unit });
  }, [updateSettings]);

  const handleLanguage = useCallback((lang: AppLanguage) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateSettings({ language: lang });
  }, [updateSettings]);

  const handleTheme = useCallback((mode: ThemeMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateSettings({ themeMode: mode });
  }, [updateSettings]);

  const tempOptions: OptionItem<TemperatureUnit>[] = [
    { value: 'auto', label: t('auto'), icon: <Smartphone size={18} color={colors.accent} strokeWidth={1.6} /> },
    { value: 'celsius', label: t('celsius'), icon: <Thermometer size={18} color={colors.primary} strokeWidth={1.6} /> },
    { value: 'fahrenheit', label: t('fahrenheit'), icon: <Thermometer size={18} color={colors.streak} strokeWidth={1.6} /> },
  ];

  const langOptions: OptionItem<AppLanguage>[] = [
    { value: 'en', label: t('english'), icon: <Text style={styles.flagEmoji}>🇺🇸</Text> },
    { value: 'es', label: t('spanish'), icon: <Text style={styles.flagEmoji}>🇪🇸</Text> },
    { value: 'pt', label: t('portuguese'), icon: <Text style={styles.flagEmoji}>🇧🇷</Text> },
  ];

  const themeOptions: OptionItem<ThemeMode>[] = [
    { value: 'light', label: t('light'), icon: <Sun size={18} color={colors.warning} strokeWidth={1.6} /> },
    { value: 'dark', label: t('dark'), icon: <Moon size={18} color={colors.xpPurple} strokeWidth={1.6} /> },
    { value: 'system', label: t('system'), icon: <Smartphone size={18} color={colors.accent} strokeWidth={1.6} /> },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Account</Text>
        <GlassCard style={styles.accountCard}>
          {authLoading ? (
            <View style={styles.accountLoading}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : isAuthenticated && user ? (
            <>
              <View style={styles.accountRow}>
                {user.picture ? (
                  <Image source={{ uri: user.picture }} style={styles.accountAvatar} contentFit="cover" />
                ) : (
                  <View style={[styles.accountAvatar, styles.accountAvatarFallback, { backgroundColor: colors.inputBackground }]}>
                    <UserCircle size={28} color={colors.primary} strokeWidth={1.6} />
                  </View>
                )}
                <View style={styles.accountInfo}>
                  <Text style={[styles.accountName, { color: colors.text }]} numberOfLines={1}>
                    {user.name || 'Signed in'}
                  </Text>
                  {!!user.email && (
                    <Text style={[styles.accountEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                      {user.email}
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={[styles.signOutBtn, { borderTopColor: colors.divider }]}
                onPress={handleSignOut}
                activeOpacity={0.7}
              >
                <LogOut size={18} color={colors.error} strokeWidth={1.8} />
                <Text style={[styles.signOutText, { color: colors.error }]}>Sign Out</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.signInWrap}>
              <Text style={[styles.signInTitle, { color: colors.text }]}>Sign in to sync your plants</Text>
              <Text style={[styles.signInSubtitle, { color: colors.textSecondary }]}>
                Save your collection and access it on any device.
              </Text>
              {!!authError && (
                <View style={[styles.errorBox, { backgroundColor: 'rgba(255,59,48,0.1)' }]}>
                  <Text style={[styles.errorText, { color: colors.error }]}>{authError}</Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.providerBtn, styles.googleBtn, isSigningIn && styles.providerBtnDisabled]}
                onPress={() => handleSignIn('google')}
                disabled={isSigningIn}
                activeOpacity={0.85}
              >
                <GoogleGlyph />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </TouchableOpacity>
              {Platform.OS !== 'android' && (
                <TouchableOpacity
                  style={[styles.providerBtn, styles.appleBtn, isSigningIn && styles.providerBtnDisabled]}
                  onPress={() => handleSignIn('apple')}
                  disabled={isSigningIn}
                  activeOpacity={0.85}
                >
                  <AppleGlyph color="#fff" />
                  <Text style={styles.appleBtnText}>Continue with Apple</Text>
                </TouchableOpacity>
              )}
              {isSigningIn && (
                <View style={styles.signingInRow}>
                  <ActivityIndicator size="small" color={colors.textSecondary} />
                  <Text style={[styles.signingInText, { color: colors.textSecondary }]}>Opening sign in…</Text>
                </View>
              )}
            </View>
          )}
        </GlassCard>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('temperature')}</Text>
        <GlassCard style={styles.optionGroup}>
          {tempOptions.map((opt, i) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.optionRow,
                i < tempOptions.length - 1 && [styles.optionBorder, { borderBottomColor: colors.divider }],
              ]}
              onPress={() => handleTempUnit(opt.value)}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, { backgroundColor: colors.inputBackground }]}>{opt.icon}</View>
                <Text style={[styles.optionLabel, { color: colors.text }]}>{opt.label}</Text>
              </View>
              {settings.temperatureUnit === opt.value && (
                <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                  <Check size={14} color="#fff" strokeWidth={2.5} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </GlassCard>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('language')}</Text>
        <GlassCard style={styles.optionGroup}>
          {langOptions.map((opt, i) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.optionRow,
                i < langOptions.length - 1 && [styles.optionBorder, { borderBottomColor: colors.divider }],
              ]}
              onPress={() => handleLanguage(opt.value)}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, { backgroundColor: colors.inputBackground }]}>{opt.icon}</View>
                <Text style={[styles.optionLabel, { color: colors.text }]}>{opt.label}</Text>
              </View>
              {settings.language === opt.value && (
                <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                  <Check size={14} color="#fff" strokeWidth={2.5} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </GlassCard>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('theme')}</Text>
        <GlassCard style={styles.optionGroup}>
          {themeOptions.map((opt, i) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.optionRow,
                i < themeOptions.length - 1 && [styles.optionBorder, { borderBottomColor: colors.divider }],
              ]}
              onPress={() => handleTheme(opt.value)}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, { backgroundColor: colors.inputBackground }]}>{opt.icon}</View>
                <Text style={[styles.optionLabel, { color: colors.text }]}>{opt.label}</Text>
              </View>
              {settings.themeMode === opt.value && (
                <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                  <Check size={14} color="#fff" strokeWidth={2.5} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </GlassCard>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>Plant Passport v1.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 20,
    marginLeft: 4,
  },
  optionGroup: {
    padding: 0,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  optionBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagEmoji: {
    fontSize: 20,
  },
  accountCard: {
    padding: 0,
    overflow: 'hidden',
  },
  accountLoading: {
    padding: 28,
    alignItems: 'center',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  accountAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  accountAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  },
  accountEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  signInWrap: {
    padding: 18,
  },
  signInTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  signInSubtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  errorBox: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  providerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 50,
    borderRadius: 14,
    marginBottom: 10,
  },
  providerBtnDisabled: {
    opacity: 0.6,
  },
  googleBtn: {
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.12)',
  },
  googleBtnText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1f1f1f',
  },
  appleBtn: {
    backgroundColor: '#000',
  },
  appleBtnText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  providerGlyph: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  googleGlyph: {
    color: '#4285F4',
    fontWeight: '800' as const,
  },
  signingInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  signingInText: {
    fontSize: 13,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
  },
});
