import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Droplets, Sun, Thermometer, Wrench, CloudRain } from 'lucide-react-native';
import { useSettings } from '@/providers/SettingsProvider';
import { PlantNeeds } from '@/types/plant';
import { formatTempRange, getTempBarValues } from '@/utils/temperature';

interface PlantNeedsCardProps {
  needs: PlantNeeds;
}

const WATER_LABELS = ['', 'Very Low', 'Low', 'Moderate', 'High', 'Very High'];
const LIGHT_LABELS = ['', 'Low Light', 'Partial Shade', 'Indirect', 'Bright', 'Full Sun'];
const HUMIDITY_LABELS = ['', 'Very Dry', 'Low', 'Average', 'Humid', 'Tropical'];
const EASE_LABELS = ['', 'Expert', 'Advanced', 'Intermediate', 'Easy', 'Beginner'];

function NeedBar({ level, color, inactiveColor }: { level: number; color: string; inactiveColor: string }) {
  return (
    <View style={styles.barTrack}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          style={[
            styles.barSegment,
            {
              backgroundColor: i <= level ? color : inactiveColor,
              opacity: i <= level ? 0.85 + (i * 0.03) : 1,
            },
          ]}
        />
      ))}
    </View>
  );
}

export default React.memo(function PlantNeedsCard({ needs }: PlantNeedsCardProps) {
  const { colors, useCelsius } = useSettings();
  const tempDisplay = formatTempRange(needs.idealTempMin, needs.idealTempMax, useCelsius);
  const tempBar = getTempBarValues(needs.idealTempMin, needs.idealTempMax, useCelsius);
  const scaleRange = tempBar.scaleMax - tempBar.scaleMin;

  return (
    <View style={[styles.container, { backgroundColor: colors.cardSolid }]}>
      <Text style={[styles.title, { color: colors.textTertiary }]}>Care Guide</Text>

      <View style={[styles.needRow, { borderBottomColor: colors.divider }]}>
        <View style={[styles.iconWrap, { backgroundColor: 'rgba(0, 122, 255, 0.08)' }]}>
          <Droplets size={15} color={colors.waterBlue} strokeWidth={1.8} />
        </View>
        <View style={styles.needContent}>
          <View style={styles.needHeader}>
            <Text style={[styles.needLabel, { color: colors.text }]}>Water</Text>
            <Text style={[styles.needValue, { color: colors.textSecondary }]}>{WATER_LABELS[needs.water]}</Text>
          </View>
          <NeedBar level={needs.water} color={colors.waterBlue} inactiveColor={colors.inputBackground} />
        </View>
      </View>

      <View style={[styles.needRow, { borderBottomColor: colors.divider }]}>
        <View style={[styles.iconWrap, { backgroundColor: 'rgba(255, 149, 0, 0.08)' }]}>
          <Sun size={15} color={colors.accent} strokeWidth={1.8} />
        </View>
        <View style={styles.needContent}>
          <View style={styles.needHeader}>
            <Text style={[styles.needLabel, { color: colors.text }]}>Light</Text>
            <Text style={[styles.needValue, { color: colors.textSecondary }]}>{LIGHT_LABELS[needs.light]}</Text>
          </View>
          <NeedBar level={needs.light} color={colors.accent} inactiveColor={colors.inputBackground} />
        </View>
      </View>

      <View style={[styles.needRow, { borderBottomColor: colors.divider }]}>
        <View style={[styles.iconWrap, { backgroundColor: 'rgba(48, 176, 199, 0.08)' }]}>
          <CloudRain size={15} color={colors.humidityTeal} strokeWidth={1.8} />
        </View>
        <View style={styles.needContent}>
          <View style={styles.needHeader}>
            <Text style={[styles.needLabel, { color: colors.text }]}>Humidity</Text>
            <Text style={[styles.needValue, { color: colors.textSecondary }]}>{HUMIDITY_LABELS[needs.humidity]}</Text>
          </View>
          <NeedBar level={needs.humidity} color={colors.humidityTeal} inactiveColor={colors.inputBackground} />
        </View>
      </View>

      <View style={[styles.needRow, { borderBottomColor: colors.divider }]}>
        <View style={[styles.iconWrap, { backgroundColor: 'rgba(255, 59, 48, 0.08)' }]}>
          <Thermometer size={15} color="#FF6961" strokeWidth={1.8} />
        </View>
        <View style={styles.needContent}>
          <View style={styles.needHeader}>
            <Text style={[styles.needLabel, { color: colors.text }]}>Temperature</Text>
            <Text style={[styles.needValue, { color: colors.textSecondary }]}>{tempDisplay}</Text>
          </View>
          <View style={styles.tempBar}>
            <View style={[styles.tempTrack, { backgroundColor: colors.inputBackground }]}>
              <View
                style={[
                  styles.tempRange,
                  {
                    left: `${((tempBar.min - tempBar.scaleMin) / scaleRange) * 100}%` as string,
                    right: `${100 - ((tempBar.max - tempBar.scaleMin) / scaleRange) * 100}%` as string,
                  },
                ]}
              />
            </View>
            <View style={styles.tempLabels}>
              <Text style={[styles.tempLabel, { color: colors.textTertiary }]}>{tempBar.scaleMin}{tempBar.unit}</Text>
              <Text style={[styles.tempLabel, { color: colors.textTertiary }]}>{tempBar.scaleMax}{tempBar.unit}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.needRow, styles.lastRow]}>
        <View style={[styles.iconWrap, { backgroundColor: 'rgba(48, 209, 88, 0.08)' }]}>
          <Wrench size={15} color={colors.primary} strokeWidth={1.8} />
        </View>
        <View style={styles.needContent}>
          <View style={styles.needHeader}>
            <Text style={[styles.needLabel, { color: colors.text }]}>Ease of Care</Text>
            <Text style={[styles.needValue, { color: colors.textSecondary }]}>{EASE_LABELS[needs.easeOfCare]}</Text>
          </View>
          <NeedBar level={needs.easeOfCare} color={colors.primary} inactiveColor={colors.inputBackground} />
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginTop: -4,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  needRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lastRow: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 10,
    marginTop: 1,
  },
  needContent: {
    flex: 1,
  },
  needHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 6,
  },
  needLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  needValue: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  barTrack: {
    flexDirection: 'row' as const,
    gap: 4,
    height: 6,
  },
  barSegment: {
    flex: 1,
    borderRadius: 3,
    height: 6,
  },
  tempBar: {
    gap: 3,
  },
  tempTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden' as const,
  },
  tempRange: {
    position: 'absolute' as const,
    top: 0,
    bottom: 0,
    backgroundColor: '#FF6961',
    borderRadius: 3,
    opacity: 0.75,
  },
  tempLabels: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  tempLabel: {
    fontSize: 9,
  },
});
