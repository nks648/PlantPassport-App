import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSettings } from '@/providers/SettingsProvider';

interface StreakBadgeProps {
  streak: number;
  size?: 'small' | 'medium' | 'large';
}

export default function StreakBadge({ streak, size = 'medium' }: StreakBadgeProps) {
  const { colors } = useSettings();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (streak >= 7) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [streak]);

  const fontSize = size === 'small' ? 11 : size === 'large' ? 18 : 13;
  const iconSize = size === 'small' ? 12 : size === 'large' ? 22 : 16;
  const paddingH = size === 'small' ? 6 : size === 'large' ? 14 : 10;
  const paddingV = size === 'small' ? 2 : size === 'large' ? 6 : 4;

  return (
    <Animated.View
      style={[
        styles.badge,
        {
          paddingHorizontal: paddingH,
          paddingVertical: paddingV,
          transform: [{ scale: pulseAnim }],
          backgroundColor: colors.streakGlow,
        },
        streak >= 30 && { backgroundColor: 'rgba(255, 214, 10, 0.15)', borderWidth: 1, borderColor: 'rgba(255, 214, 10, 0.3)' },
        streak >= 7 && streak < 30 && { backgroundColor: 'rgba(255, 149, 0, 0.15)' },
      ]}
    >
      <Text style={{ fontSize: iconSize }}>🔥</Text>
      <Text style={[styles.text, { fontSize, color: colors.text }]}>{streak}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 20,
  },
  text: {
    fontWeight: '600' as const,
  },
});
