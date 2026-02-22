import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Leaf, Flame, Plus, Droplets, ChevronRight, Zap } from 'lucide-react-native';
import { usePlants } from '@/providers/PlantProvider';
import { useSettings } from '@/providers/SettingsProvider';
import { getRankForXP } from '@/types/plant';
import GlassCard from '@/components/GlassCard';
import WateringChart from '@/components/WateringChart';
import ActivityTimelineItem from '@/components/ActivityTimelineItem';
import WeatherWidget from '@/components/WeatherWidget';

export default function HomeScreen() {
  const { colors } = useSettings();
  const {
    plants,
    activities,
    totalStreak,
    averageStreak,
    userProfile,
    plantsNeedingWater,
  } = usePlants();
  const router = useRouter();
  const rankInfo = getRankForXP(userProfile.xp);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const xpProgress = rankInfo.xpToNext
    ? (userProfile.xp - (rankInfo.xpToNext ? userProfile.xp - (rankInfo.xpToNext - userProfile.xp) : 0)) / (rankInfo.xpToNext + userProfile.xp)
    : 1;

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.greetingSection}>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>{getGreeting()},</Text>
            <Text style={[styles.userName, { color: colors.text }]}>{userProfile.name.split(' ')[0]}</Text>
            <View style={styles.rankRow}>
              <Text style={styles.rankEmoji}>{rankInfo.emoji}</Text>
              <Text style={[styles.rankText, { color: colors.textSecondary }]}>{rankInfo.rank}</Text>
              <View style={styles.xpBadge}>
                <Zap size={10} color={colors.accent} />
                <Text style={[styles.xpText, { color: colors.accent }]}>{userProfile.xp} XP</Text>
              </View>
            </View>
          </View>
          <Image source={{ uri: userProfile.avatar }} style={styles.avatar} />
        </View>

        {rankInfo.xpToNext != null && (
          <View style={styles.xpBarContainer}>
            <View style={[styles.xpBarTrack, { backgroundColor: colors.inputBackground }]}>
              <Animated.View style={[styles.xpBarFill, { width: `${Math.min(xpProgress * 100, 100)}%`, backgroundColor: colors.accent }]} />
            </View>
            <Text style={[styles.xpToNext, { color: colors.textSecondary }]}>{rankInfo.xpToNext} XP to {rankInfo.nextRank}</Text>
          </View>
        )}

        <View style={styles.statsRow}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/plants' as never);
            }}
            style={styles.statTouchable}
          >
            <GlassCard style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: colors.primaryMuted }]}>
                <Leaf size={18} color={colors.primary} strokeWidth={1.8} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{plants.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>My Plants</Text>
              <ChevronRight size={12} color={colors.textTertiary} style={styles.statChevron} />
            </GlassCard>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/profile' as never);
            }}
            style={styles.statTouchable}
          >
            <GlassCard style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: colors.streakGlow }]}>
                <Flame size={18} color={colors.streak} strokeWidth={1.8} />
              </View>
              <Text style={[styles.statValue, { color: colors.text }]}>{averageStreak}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Streak</Text>
              <ChevronRight size={12} color={colors.textTertiary} style={styles.statChevron} />
            </GlassCard>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Weather & Care</Text>
        </View>
        <WeatherWidget />

        <WateringChart />

        {plantsNeedingWater.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Needs Attention</Text>
              <View style={[styles.taskCountBadge, { backgroundColor: colors.error }]}>
                <Text style={styles.taskCountText}>{plantsNeedingWater.length}</Text>
              </View>
            </View>
            <GlassCard style={styles.tasksCard}>
              {plantsNeedingWater.map((plant, index) => {
                const daysAgo = Math.floor(
                  (Date.now() - new Date(plant.lastWatered + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <TouchableOpacity
                    key={plant.id}
                    style={[
                      styles.taskRow,
                      index < plantsNeedingWater.length - 1 && [styles.taskRowBorder, { borderBottomColor: colors.divider }],
                    ]}
                    onPress={() => router.push(`/plants/${plant.id}` as never)}
                    activeOpacity={0.7}
                  >
                    <Image source={{ uri: plant.image }} style={styles.taskPlantImage} />
                    <View style={styles.taskInfo}>
                      <Text style={[styles.taskPlantName, { color: colors.text }]}>{plant.name}</Text>
                      <Text style={[styles.taskDue, { color: colors.warning }]}>Last watered {daysAgo}d ago</Text>
                    </View>
                    <View style={styles.taskAction}>
                      <Droplets size={14} color={colors.accent} strokeWidth={1.8} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </GlassCard>
          </>
        )}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
        </View>
        <GlassCard style={styles.activityCard}>
          {activities.slice(0, 6).map((item, index) => (
            <ActivityTimelineItem
              key={item.id}
              item={item}
              isLast={index === Math.min(activities.length, 6) - 1}
            />
          ))}
        </GlassCard>

        <View style={{ height: 80 }} />
      </ScrollView>

      <ScanFab />
    </View>
  );
}

function ScanFab() {
  const { colors } = useSettings();
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
    router.push('/scan' as never);
  }, [router, scaleAnim]);

  return (
    <Animated.View style={[styles.fabContainer, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={handlePress} activeOpacity={0.85}>
        <Plus size={24} color="#fff" strokeWidth={2.5} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  greetingSection: {
    flex: 1,
  },
  greeting: {
    fontSize: 15,
    fontWeight: '400' as const,
    letterSpacing: -0.2,
  },
  userName: {
    fontSize: 30,
    fontWeight: '700' as const,
    letterSpacing: -0.6,
    marginBottom: 8,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rankEmoji: {
    fontSize: 16,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  xpText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(48, 209, 88, 0.15)',
  },
  xpBarContainer: {
    marginBottom: 20,
    marginTop: 10,
  },
  xpBarTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: 4,
    borderRadius: 2,
  },
  xpToNext: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statTouchable: {
    flex: 1,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '400' as const,
  },
  statChevron: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: -0.4,
  },
  taskCountBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  tasksCard: {
    padding: 4,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  taskRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  taskPlantImage: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  taskInfo: {
    flex: 1,
    marginLeft: 12,
  },
  taskPlantName: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  taskDue: {
    fontSize: 13,
    marginTop: 2,
  },
  taskAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityCard: {
    padding: 16,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#30D158',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});
