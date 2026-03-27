import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSettings } from '@/providers/SettingsProvider';
import { WATERING_CHART_DATA } from '@/mocks/plants';
import GlassCard from './GlassCard';

export default function WateringChart() {
  const { colors } = useSettings();
  const data = WATERING_CHART_DATA;
  const totalDays = data.length;
  const wateredDays = data.filter(d => d === 1).length;
  const percentage = Math.round((wateredDays / totalDays) * 100);

  return (
    <GlassCard style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>30-Day Consistency</Text>
        <View style={[styles.percentBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.percentText}>{percentage}%</Text>
        </View>
      </View>
      <View style={styles.chart}>
        {data.map((val, i) => (
          <View key={i} style={styles.barWrapper}>
            <View
              style={[
                styles.bar,
                {
                  height: val === 1 ? 28 : 6,
                  backgroundColor: val === 1 ? colors.primary : colors.inputBackground,
                  borderRadius: 3,
                },
              ]}
            />
          </View>
        ))}
      </View>
      <View style={styles.labels}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>30 days ago</Text>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Today</Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  percentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  percentText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 32,
  },
  barWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '80%',
    minWidth: 4,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  label: {
    fontSize: 11,
  },
});
