import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Trophy, Flame, Leaf } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSettings } from '@/providers/SettingsProvider';
import { MOCK_LEADERBOARD } from '@/mocks/plants';
import GlassCard from '@/components/GlassCard';

type TimeFilter = 'all-time' | 'weekly';

export default function LeaderboardScreen() {
  const { colors } = useSettings();
  const [filter, setFilter] = useState<TimeFilter>('all-time');

  const handleFilterChange = useCallback((f: TimeFilter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilter(f);
  }, []);

  const sorted = [...MOCK_LEADERBOARD].sort((a, b) => {
    const aVal = filter === 'weekly' ? (a.weeklyStreak ?? 0) : a.streak;
    const bVal = filter === 'weekly' ? (b.weeklyStreak ?? 0) : b.streak;
    return bVal - aVal;
  }).map((e, i) => ({ ...e, rank: i + 1 }));

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);
  const currentUser = sorted.find(e => e.isCurrentUser);

  const medalColors = [colors.gold, colors.silver, colors.bronze];

  const getStreakValue = (entry: typeof sorted[0]) =>
    filter === 'weekly' ? (entry.weeklyStreak ?? 0) : entry.streak;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.filterRow, { backgroundColor: colors.inputBackground }]}>
          <TouchableOpacity
            style={[styles.filterBtn, filter === 'all-time' && [styles.filterBtnActive, { backgroundColor: colors.cardSolid }]]}
            onPress={() => handleFilterChange('all-time')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterText, { color: colors.textSecondary }, filter === 'all-time' && { color: colors.text, fontWeight: '600' as const }]}>All Time</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterBtn, filter === 'weekly' && [styles.filterBtnActive, { backgroundColor: colors.cardSolid }]]}
            onPress={() => handleFilterChange('weekly')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterText, { color: colors.textSecondary }, filter === 'weekly' && { color: colors.text, fontWeight: '600' as const }]}>This Week</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {filter === 'all-time' ? 'Most consistent plant parents' : 'Top performers this week'}
        </Text>

        <View style={styles.podium}>
          {[1, 0, 2].map((idx) => {
            const entry = top3[idx];
            if (!entry) return null;
            const isFirst = idx === 0;
            return (
              <View key={entry.id} style={[styles.podiumItem, isFirst && styles.podiumFirst]}>
                <View style={[styles.medalCircle, { borderColor: medalColors[idx] }]}>
                  <Image source={{ uri: entry.avatar }} style={[styles.podiumAvatar, { backgroundColor: colors.divider }]} />
                  <View style={[styles.rankBadge, { backgroundColor: medalColors[idx] }]}>
                    <Text style={styles.rankBadgeText}>{entry.rank}</Text>
                  </View>
                </View>
                <Text style={[styles.podiumName, { color: colors.text }]} numberOfLines={1}>{entry.userName}</Text>
                <View style={styles.podiumStreakRow}>
                  <Flame size={12} color={colors.streak} strokeWidth={1.8} />
                  <Text style={[styles.podiumStreak, { color: colors.text }]}>{getStreakValue(entry)}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {rest.map((entry) => (
          <GlassCard
            key={entry.id}
            style={[styles.listItem, entry.isCurrentUser && { backgroundColor: 'rgba(48, 209, 88, 0.04)', borderColor: 'rgba(48, 209, 88, 0.15)', borderWidth: 1 }]}
          >
            <Text style={[styles.rank, { color: colors.textSecondary }, entry.isCurrentUser && { color: colors.primary }]}>
              {entry.rank}
            </Text>
            <Image source={{ uri: entry.avatar }} style={[styles.listAvatar, { backgroundColor: colors.divider }]} />
            <View style={styles.listInfo}>
              <Text style={[styles.listName, { color: colors.text }, entry.isCurrentUser && { color: colors.primary, fontWeight: '600' as const }]}>
                {entry.userName}
                {entry.isCurrentUser ? ' (You)' : ''}
              </Text>
              <View style={styles.listMeta}>
                <Leaf size={11} color={colors.textSecondary} strokeWidth={1.8} />
                <Text style={[styles.listMetaText, { color: colors.textSecondary }]}>{entry.totalPlants} plants</Text>
              </View>
            </View>
            <View style={[styles.listStreak, { backgroundColor: colors.streakGlow }]}>
              <Flame size={14} color={colors.streak} strokeWidth={1.8} />
              <Text style={[styles.listStreakText, { color: colors.text }]}>{getStreakValue(entry)}</Text>
            </View>
          </GlassCard>
        ))}

        {currentUser && currentUser.rank > 3 && (
          <View style={styles.pinnedSection}>
            <View style={styles.pinnedDivider}>
              <View style={[styles.pinnedLine, { backgroundColor: colors.divider }]} />
              <Text style={[styles.pinnedLabel, { color: colors.textSecondary }]}>Your Rank</Text>
              <View style={[styles.pinnedLine, { backgroundColor: colors.divider }]} />
            </View>
            <GlassCard style={[styles.listItem, { backgroundColor: 'rgba(48, 209, 88, 0.04)', borderColor: 'rgba(48, 209, 88, 0.15)', borderWidth: 1 }]}>
              <Text style={[styles.rank, { color: colors.primary }]}>{currentUser.rank}</Text>
              <Image source={{ uri: currentUser.avatar }} style={[styles.listAvatar, { backgroundColor: colors.divider }]} />
              <View style={styles.listInfo}>
                <Text style={[styles.listName, { color: colors.primary, fontWeight: '600' as const }]}>
                  {currentUser.userName} (You)
                </Text>
                <View style={styles.listMeta}>
                  <Leaf size={11} color={colors.textSecondary} strokeWidth={1.8} />
                  <Text style={[styles.listMetaText, { color: colors.textSecondary }]}>{currentUser.totalPlants} plants</Text>
                </View>
              </View>
              <View style={[styles.listStreak, { backgroundColor: colors.streakGlow }]}>
                <Flame size={14} color={colors.streak} strokeWidth={1.8} />
                <Text style={[styles.listStreakText, { color: colors.text }]}>{getStreakValue(currentUser)}</Text>
              </View>
            </GlassCard>
          </View>
        )}
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
    paddingBottom: 32,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 16,
    borderRadius: 10,
    padding: 2,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 28,
    paddingHorizontal: 10,
  },
  podiumItem: {
    alignItems: 'center',
    flex: 1,
  },
  podiumFirst: {
    marginBottom: 16,
  },
  medalCircle: {
    borderWidth: 3,
    borderRadius: 40,
    padding: 3,
    position: 'relative',
  },
  podiumAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  rankBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    color: '#1C1C1E',
    fontSize: 11,
    fontWeight: '700' as const,
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '500' as const,
    marginTop: 8,
    textAlign: 'center',
  },
  podiumStreakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  podiumStreak: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 8,
  },
  rank: {
    width: 28,
    fontSize: 15,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  listAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 8,
  },
  listInfo: {
    flex: 1,
    marginLeft: 12,
  },
  listName: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  listMetaText: {
    fontSize: 12,
  },
  listStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  listStreakText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  pinnedSection: {
    marginTop: 8,
  },
  pinnedDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  pinnedLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  pinnedLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
});
