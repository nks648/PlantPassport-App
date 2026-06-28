import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Droplets, Sun, Thermometer, Sprout, CloudRain, Leaf } from 'lucide-react-native';
import { useSettings } from '@/providers/SettingsProvider';
import { PlantNeeds } from '@/types/plant';
import { formatTempRange } from '@/utils/temperature';

interface PlantNeedsCardProps {
  needs: PlantNeeds;
  wateringFrequencyDays?: number;
}

const WATER_LABELS = ['', 'Very Low', 'Low', 'Moderate', 'High', 'Very High'];
const LIGHT_LABELS = ['', 'Low Light', 'Partial Shade', 'Indirect', 'Bright', 'Full Sun'];
const HUMIDITY_LABELS = ['', 'Very Dry', 'Low', 'Average', 'Humid', 'Tropical'];
const EASE_LABELS = ['', 'Expert', 'Advanced', 'Intermediate', 'Easy', 'Beginner'];

/** Convert days between waterings into a tag-style frequency readout, e.g. "1×/wk". */
function wateringFrequencyLabel(days: number): string {
  if (days <= 1) return 'Daily';
  if (days < 7) return `Every ${days}d`;
  if (days === 7) return '1×/wk';
  const weeks = Math.round(days / 7);
  return weeks <= 1 ? '1×/wk' : `1×/${weeks}wk`;
}

interface TileProps {
  icon: React.ReactNode;
  accent: string;
  label: string;
  value: string;
  level?: number;
  bgInner: string;
  tileBorder: string;
  textColor: string;
  mutedColor: string;
  dotInactive: string;
}

function CareTile({ icon, accent, label, value, level, bgInner, tileBorder, textColor, mutedColor, dotInactive }: TileProps) {
  return (
    <View style={[styles.tile, { backgroundColor: bgInner, borderColor: tileBorder }]}>
      <View style={[styles.iconChip, { backgroundColor: `${accent}1F`, borderColor: `${accent}40` }]}>
        {icon}
      </View>
      <Text style={[styles.tileValue, { color: textColor }]}>{value}</Text>
      <Text style={[styles.tileLabel, { color: mutedColor }]}>{label}</Text>
      {level !== undefined ? (
        <View style={styles.dotsRow}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i <= level ? accent : dotInactive },
              ]}
            />
          ))}
        </View>
      ) : (
        <View style={styles.dotsSpacer} />
      )}
    </View>
  );
}

export default React.memo(function PlantNeedsCard({ needs, wateringFrequencyDays }: PlantNeedsCardProps) {
  const { useCelsius, isDark } = useSettings();
  const tempDisplay = formatTempRange(needs.idealTempMin, needs.idealTempMax, useCelsius);
  const waterValue = wateringFrequencyDays ? wateringFrequencyLabel(wateringFrequencyDays) : WATER_LABELS[needs.water];

  // Theme-aware colours — dark by default (the premium "plant tag" look),
  // light variant when the app is in light mode.
  const theme = isDark
    ? {
        bg: '#171511',
        bgInner: 'rgba(255, 255, 255, 0.045)',
        border: 'rgba(201, 168, 106, 0.18)',
        tileBorder: 'rgba(255, 255, 255, 0.06)',
        gold: '#C9A86A',
        textColor: '#F3EEE2',
        muted: 'rgba(243, 238, 226, 0.5)',
        dotInactive: 'rgba(243, 238, 226, 0.14)',
        divider: 'rgba(243, 238, 226, 0.1)',
        water: '#5AC8FA',
        sun: '#FFCD57',
        humidity: '#64D2FF',
        temp: '#FF8A7A',
        ease: '#5FD08A',
      }
    : {
        bg: '#FFFFFF',
        bgInner: 'rgba(0, 0, 0, 0.025)',
        border: 'rgba(0, 0, 0, 0.08)',
        tileBorder: 'rgba(0, 0, 0, 0.05)',
        gold: '#8B6914',
        textColor: '#1C1C1E',
        muted: 'rgba(60, 60, 67, 0.5)',
        dotInactive: 'rgba(60, 60, 67, 0.12)',
        divider: 'rgba(60, 60, 67, 0.08)',
        water: '#007AFF',
        sun: '#FF9500',
        humidity: '#30B0C7',
        temp: '#FF3B30',
        ease: '#2D9D4E',
      };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, borderColor: theme.border }]}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Leaf size={14} color={theme.gold} strokeWidth={2} />
          <Text style={[styles.brand, { color: theme.gold }]}>CARE GUIDE</Text>
        </View>
        <View style={[styles.passportBadge, { borderColor: theme.border }]}>
          <Text style={[styles.passportText, { color: theme.muted }]}>Plant Passport</Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.divider }]} />

      <View style={styles.grid}>
        <CareTile
          icon={<Droplets size={18} color={theme.water} strokeWidth={1.9} />}
          accent={theme.water}
          label="Water"
          value={waterValue}
          level={needs.water}
          bgInner={theme.bgInner}
          tileBorder={theme.tileBorder}
          textColor={theme.textColor}
          mutedColor={theme.muted}
          dotInactive={theme.dotInactive}
        />
        <CareTile
          icon={<Sun size={18} color={theme.sun} strokeWidth={1.9} />}
          accent={theme.sun}
          label="Light"
          value={LIGHT_LABELS[needs.light]}
          level={needs.light}
          bgInner={theme.bgInner}
          tileBorder={theme.tileBorder}
          textColor={theme.textColor}
          mutedColor={theme.muted}
          dotInactive={theme.dotInactive}
        />
        <CareTile
          icon={<Thermometer size={18} color={theme.temp} strokeWidth={1.9} />}
          accent={theme.temp}
          label="Temperature"
          value={tempDisplay}
          bgInner={theme.bgInner}
          tileBorder={theme.tileBorder}
          textColor={theme.textColor}
          mutedColor={theme.muted}
          dotInactive={theme.dotInactive}
        />
        <CareTile
          icon={<CloudRain size={18} color={theme.humidity} strokeWidth={1.9} />}
          accent={theme.humidity}
          label="Humidity"
          value={HUMIDITY_LABELS[needs.humidity]}
          level={needs.humidity}
          bgInner={theme.bgInner}
          tileBorder={theme.tileBorder}
          textColor={theme.textColor}
          mutedColor={theme.muted}
          dotInactive={theme.dotInactive}
        />
        <CareTile
          icon={<Sprout size={18} color={theme.ease} strokeWidth={1.9} />}
          accent={theme.ease}
          label="Ease of Care"
          value={EASE_LABELS[needs.easeOfCare]}
          level={needs.easeOfCare}
          bgInner={theme.bgInner}
          tileBorder={theme.tileBorder}
          textColor={theme.textColor}
          mutedColor={theme.muted}
          dotInactive={theme.dotInactive}
        />
      </View>
    </View>
  );
});

const TILE_GAP = 10;

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 16,
    marginTop: -4,
    marginBottom: 14,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 5,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  brandRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 7,
  },
  brand: {
    fontSize: 12.5,
    fontWeight: '700' as const,
    letterSpacing: 2,
  },
  passportBadge: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  passportText: {
    fontSize: 9.5,
    fontWeight: '600' as const,
    letterSpacing: 0.4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 14,
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: TILE_GAP,
  },
  tile: {
    width: `${(100 - 0) / 3}%` as `${number}%`,
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 96,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 13,
    paddingHorizontal: 12,
  },
  iconChip: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 9,
  },
  tileValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
    marginTop: 1,
  },
  dotsRow: {
    flexDirection: 'row' as const,
    gap: 3,
    marginTop: 9,
  },
  dotsSpacer: {
    height: 4,
    marginTop: 9,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
