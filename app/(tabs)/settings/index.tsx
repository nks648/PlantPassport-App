import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  Thermometer,
  Sun,
  Moon,
  Smartphone,
  Check,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSettings, TemperatureUnit, AppLanguage, ThemeMode } from '@/providers/SettingsProvider';
import GlassCard from '@/components/GlassCard';

interface OptionItem<T> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export default function SettingsScreen() {
  const { settings, updateSettings, t, colors } = useSettings();

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
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
  },
});
