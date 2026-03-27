import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Droplets, Heart, Leaf, Flame, Award, TrendingUp } from 'lucide-react-native';
import { useSettings } from '@/providers/SettingsProvider';
import { ActivityItem } from '@/types/plant';

interface ActivityTimelineItemProps {
  item: ActivityItem;
  isLast?: boolean;
}

export default function ActivityTimelineItem({ item, isLast = false }: ActivityTimelineItemProps) {
  const { colors } = useSettings();

  const ICON_MAP = {
    water: { icon: Droplets, color: colors.accent },
    health_check: { icon: Heart, color: colors.error },
    new_plant: { icon: Leaf, color: colors.primary },
    remove_plant: { icon: Leaf, color: colors.error },
    streak_milestone: { icon: Flame, color: colors.streak },
    badge_earned: { icon: Award, color: colors.gold },
    level_up: { icon: TrendingUp, color: colors.xpPurple },
  };

  const config = ICON_MAP[item.type] ?? ICON_MAP.water;
  const IconComponent = config.icon;

  return (
    <View style={styles.row}>
      <View style={styles.iconColumn}>
        <View style={[styles.iconCircle, { backgroundColor: config.color + '14' }]}>
          <IconComponent size={14} color={config.color} strokeWidth={1.8} />
        </View>
        {!isLast && <View style={[styles.line, { backgroundColor: colors.divider }]} />}
      </View>
      <View style={styles.content}>
        <Text style={[styles.description, { color: colors.text }]}>{item.description}</Text>
        <Text style={[styles.date, { color: colors.textSecondary }]}>{item.date}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    minHeight: 52,
  },
  iconColumn: {
    alignItems: 'center',
    width: 36,
    marginRight: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    flex: 1,
    width: 1,
    marginVertical: 4,
  },
  content: {
    flex: 1,
    paddingBottom: 16,
  },
  description: {
    fontSize: 14,
    fontWeight: '400' as const,
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
  },
});
