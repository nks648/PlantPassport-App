import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Droplets, TrendingUp } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { usePlants } from '@/providers/PlantProvider';
import GlassCard from '@/components/GlassCard';
import HealthDots from '@/components/HealthDots';

export default function HistoryScreen() {
  const { waterLogs, plants } = usePlants();
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);

  const handleChipPress = useCallback((plantId: string | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPlantId(prev => prev === plantId ? null : plantId);
  }, []);

  const filteredLogs = useMemo(() => {
    if (!selectedPlantId) return waterLogs;
    return waterLogs.filter(l => l.plantId === selectedPlantId);
  }, [waterLogs, selectedPlantId]);

  const healthOverTime = useMemo(() => {
    const targetPlants = selectedPlantId
      ? plants.filter(p => p.id === selectedPlantId)
      : plants;
    return targetPlants.map(p => ({
      id: p.id,
      name: p.name,
      health: p.health,
      trend: p.health >= 4 ? 'up' as const : p.health >= 3 ? 'stable' as const : 'down' as const,
    }));
  }, [plants, selectedPlantId]);

  const groupedLogs = useMemo(() => {
    return filteredLogs.reduce<Record<string, typeof filteredLogs>>((acc, log) => {
      if (!acc[log.date]) acc[log.date] = [];
      acc[log.date].push(log);
      return acc;
    }, {});
  }, [filteredLogs]);

  const sortedDates = useMemo(() =>
    Object.keys(groupedLogs).sort((a, b) => b.localeCompare(a)),
  [groupedLogs]);

  const healthChartData = useMemo(() => {
    const targetId = selectedPlantId || (plants.length > 0 ? plants[0].id : null);
    if (!targetId) return [];
    const logs = waterLogs
      .filter(l => l.plantId === targetId)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7);
    return logs;
  }, [waterLogs, selectedPlantId, plants]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipRow}
      >
        <TouchableOpacity
          style={[styles.chip, !selectedPlantId && styles.chipActive]}
          onPress={() => handleChipPress(null)}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, !selectedPlantId && styles.chipTextActive]}>All Plants</Text>
        </TouchableOpacity>
        {plants.map(p => (
          <TouchableOpacity
            key={p.id}
            style={[styles.chip, selectedPlantId === p.id && styles.chipActive]}
            onPress={() => handleChipPress(p.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, selectedPlantId === p.id && styles.chipTextActive]}>{p.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {healthChartData.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Health Over Time</Text>
          <GlassCard style={styles.chartCard}>
            <View style={styles.miniChart}>
              {healthChartData.map((log, i) => (
                <View key={log.id} style={styles.miniChartCol}>
                  <View style={styles.miniBarContainer}>
                    <View
                      style={[
                        styles.miniBar,
                        {
                          height: `${(log.health / 5) * 100}%`,
                          backgroundColor:
                            log.health >= 4 ? Colors.success :
                            log.health >= 3 ? Colors.warning : Colors.error,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.miniBarLabel}>
                    {new Date(log.date + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              ))}
            </View>
          </GlassCard>
        </>
      )}

      <Text style={styles.sectionTitle}>Plant Health Overview</Text>
      <GlassCard style={styles.healthOverview}>
        {healthOverTime.map((p, i) => (
          <View
            key={p.id}
            style={[styles.healthRow, i < healthOverTime.length - 1 && styles.healthRowBorder]}
          >
            <Text style={styles.healthName} numberOfLines={1}>{p.name}</Text>
            <HealthDots health={p.health} />
            <View style={[styles.trendBadge, p.trend === 'up' && styles.trendUp, p.trend === 'down' && styles.trendDown]}>
              <TrendingUp
                size={12}
                color={p.trend === 'up' ? Colors.success : p.trend === 'down' ? Colors.error : Colors.textSecondary}
                style={p.trend === 'down' ? { transform: [{ rotate: '180deg' }] } : undefined}
                strokeWidth={1.8}
              />
              <Text style={[
                styles.trendText,
                p.trend === 'up' && { color: Colors.success },
                p.trend === 'down' && { color: Colors.error },
              ]}>
                {p.trend === 'up' ? 'Up' : p.trend === 'down' ? 'Down' : 'Stable'}
              </Text>
            </View>
          </View>
        ))}
      </GlassCard>

      <Text style={styles.sectionTitle}>Watering Log</Text>
      {sortedDates.length === 0 && (
        <Text style={styles.emptyText}>No watering logs yet</Text>
      )}
      {sortedDates.map((date) => (
        <View key={date} style={styles.dateGroup}>
          <Text style={styles.dateHeader}>{formatDate(date)}</Text>
          {groupedLogs[date].map((log) => (
            <GlassCard key={log.id} style={styles.logCard}>
              <View style={styles.logRow}>
                <View style={styles.logIcon}>
                  <Droplets size={14} color={Colors.accent} strokeWidth={1.8} />
                </View>
                <View style={styles.logContent}>
                  <Text style={styles.logPlant}>{log.plantName}</Text>
                  {log.note ? <Text style={styles.logNote}>{log.note}</Text> : null}
                </View>
                <HealthDots health={log.health} size={7} />
              </View>
            </GlassCard>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

function formatDate(dateStr: string): string {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  chipScroll: {
    marginBottom: 20,
    marginHorizontal: -20,
  },
  chipRow: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.cardSolid,
  },
  chipActive: {
    backgroundColor: Colors.text,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
    letterSpacing: -0.4,
  },
  chartCard: {
    padding: 16,
    marginBottom: 24,
  },
  miniChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    height: 100,
  },
  miniChartCol: {
    flex: 1,
    alignItems: 'center',
  },
  miniBarContainer: {
    flex: 1,
    width: '70%',
    justifyContent: 'flex-end',
  },
  miniBar: {
    borderRadius: 4,
    minHeight: 8,
    width: '100%',
  },
  miniBarLabel: {
    fontSize: 9,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  healthOverview: {
    padding: 14,
    marginBottom: 28,
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  healthRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  healthName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(142, 142, 147, 0.1)',
  },
  trendUp: {
    backgroundColor: 'rgba(52, 199, 89, 0.08)',
  },
  trendDown: {
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
  },
  trendText: {
    fontSize: 10,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateHeader: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  logCard: {
    padding: 12,
    marginBottom: 8,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 122, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logContent: {
    flex: 1,
  },
  logPlant: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  logNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
