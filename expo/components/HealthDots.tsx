import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useSettings } from '@/providers/SettingsProvider';

interface HealthDotsProps {
  health: number;
  interactive?: boolean;
  onSelect?: (value: number) => void;
  size?: number;
}

export default function HealthDots({ health, interactive = false, onSelect, size = 10 }: HealthDotsProps) {
  const { colors } = useSettings();
  const dots = [1, 2, 3, 4, 5];

  const getColor = (index: number, filled: boolean) => {
    if (!filled) return colors.inputBackground;
    if (index <= 2) return colors.error;
    if (index <= 3) return colors.warning;
    return colors.success;
  };

  return (
    <View style={styles.container}>
      {dots.map((dot) => {
        const filled = dot <= health;
        const color = getColor(dot, filled);

        if (interactive) {
          return (
            <TouchableOpacity
              key={dot}
              onPress={() => onSelect?.(dot)}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <View
                style={[
                  styles.dot,
                  {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: color,
                  },
                ]}
              />
            </TouchableOpacity>
          );
        }

        return (
          <View
            key={dot}
            style={[
              styles.dot,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: color,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {},
});
