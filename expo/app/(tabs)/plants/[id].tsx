import React, { useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Droplets, Info, Calendar, Leaf, Trash2, ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { usePlants } from '@/providers/PlantProvider';
import { useSettings } from '@/providers/SettingsProvider';
import StreakBadge from '@/components/StreakBadge';
import HealthDots from '@/components/HealthDots';
import GlassCard from '@/components/GlassCard';
import WaterModal from '@/components/WaterModal';
import ShareModal from '@/components/ShareModal';
import { Plant } from '@/types/plant';
import { useState } from 'react';
import { Alert } from 'react-native';

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useSettings();
  const { plants, waterPlant, addCommunityPost, removePlant } = usePlants();
  const plant = plants.find((p) => p.id === id);

  const [waterModalVisible, setWaterModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [lastWatered, setLastWatered] = useState<{ name: string; streak: number } | null>(null);

  const waterAnim = useRef(new Animated.Value(1)).current;

  const handleWater = useCallback(() => {
    if (!plant) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(waterAnim, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.spring(waterAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
    setWaterModalVisible(true);
  }, [plant, waterAnim]);

  const handleWaterConfirm = useCallback(async (health: number, note: string) => {
    if (!plant) return;
    try {
      const result = await waterPlant({ plantId: plant.id, health, note: note || undefined });
      setLastWatered({ name: result.plant.name, streak: result.plant.streak });
      setTimeout(() => {
        setWaterModalVisible(false);
        setTimeout(() => setShareModalVisible(true), 300);
      }, 400);
    } catch (e) {
      console.log('Error watering plant:', e);
      setWaterModalVisible(false);
    }
  }, [plant, waterPlant]);

  const handleShare = useCallback(async (text: string) => {
    if (lastWatered) {
      await addCommunityPost(text, lastWatered.name, lastWatered.streak);
    }
    setShareModalVisible(false);
    setLastWatered(null);
  }, [lastWatered, addCommunityPost]);

  const handleRemove = useCallback(() => {
    if (!plant) return;
    Alert.alert(
      'Remove Plant',
      `Are you sure you want to remove ${plant.name} from your collection?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removePlant(plant.id);
              router.back();
            } catch (e) {
              console.log('Error removing plant:', e);
            }
          },
        },
      ]
    );
  }, [plant, removePlant, router]);

  if (!plant) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Plant Not Found' }} />
        <View style={styles.emptyState}>
          <Leaf size={48} color={colors.textTertiary} strokeWidth={1.5} />
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>Plant not found</Text>
        </View>
      </View>
    );
  }

  const daysAgo = Math.floor(
    (Date.now() - new Date(plant.lastWatered).getTime()) / (1000 * 60 * 60 * 24)
  );
  const lastWateredText = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo} days ago`;

  const daysSinceAdded = Math.floor(
    (Date.now() - new Date(plant.addedDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 6,
            backgroundColor: colors.background,
            borderBottomColor: colors.divider,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.backButton}
          activeOpacity={0.6}
        >
          <ChevronLeft size={26} color={colors.primary} strokeWidth={2} />
          <Text style={[styles.backText, { color: colors.primary }]} numberOfLines={1}>My Plants</Text>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{plant.name}</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/plants/info', params: { id: plant.id } } as never)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.iconButton}
            activeOpacity={0.6}
          >
            <Info size={22} color={colors.waterBlue} strokeWidth={1.8} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleRemove}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.iconButton}
            activeOpacity={0.6}
          >
            <Trash2 size={20} color={colors.error} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroContainer}>
          <Image source={{ uri: plant.image }} style={styles.heroImage} contentFit="cover" />
          <View style={styles.heroOverlay}>
            <StreakBadge streak={plant.streak} size="large" />
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={[styles.plantName, { color: colors.text }]}>{plant.name}</Text>
          <Text style={[styles.plantSpecies, { color: colors.textSecondary }]}>{plant.species}</Text>

          <View style={styles.statsRow}>
            <GlassCard style={styles.statCard}>
              <View style={styles.statInner}>
                <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Health</Text>
                <HealthDots health={plant.health} size={12} />
              </View>
            </GlassCard>

            <GlassCard style={styles.statCard}>
              <View style={styles.statInner}>
                <Droplets size={14} color={colors.waterBlue} strokeWidth={1.8} />
                <Text style={[styles.statValue, { color: colors.text }]}>{lastWateredText}</Text>
              </View>
            </GlassCard>

            <GlassCard style={styles.statCard}>
              <View style={styles.statInner}>
                <Calendar size={14} color={colors.primary} strokeWidth={1.8} />
                <Text style={[styles.statValue, { color: colors.text }]}>{daysSinceAdded}d owned</Text>
              </View>
            </GlassCard>
          </View>

          {plant.notes.length > 0 && (
            <GlassCard style={styles.notesCard}>
              <View style={styles.notesInner}>
                <Text style={[styles.notesTitle, { color: colors.text }]}>Recent Notes</Text>
                {plant.notes.map((note, i) => (
                  <View key={i} style={styles.noteRow}>
                    <View style={[styles.noteDot, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.noteText, { color: colors.textSecondary }]}>{note}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>
          )}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.elevatedBackground, borderTopColor: colors.divider }]}>
        <Animated.View style={{ transform: [{ scale: waterAnim }], flex: 1 }}>
          <TouchableOpacity style={[styles.waterButton, { backgroundColor: colors.waterBlue }]} onPress={handleWater} activeOpacity={0.8}>
            <Droplets size={20} color="#fff" strokeWidth={2} />
            <Text style={styles.waterButtonText}>Water {plant.name}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <WaterModal
        visible={waterModalVisible}
        plant={plant}
        onClose={() => setWaterModalVisible(false)}
        onConfirm={handleWaterConfirm}
      />

      <ShareModal
        visible={shareModalVisible}
        plantName={lastWatered?.name ?? ''}
        streak={lastWatered?.streak ?? 0}
        onClose={() => { setShareModalVisible(false); setLastWatered(null); }}
        onShare={handleShare}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 100,
  },
  heroContainer: {
    position: 'relative' as const,
    height: 280,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute' as const,
    bottom: 16,
    right: 16,
  },
  infoSection: {
    padding: 20,
  },
  plantName: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  plantSpecies: {
    fontSize: 15,
    marginTop: 4,
    fontStyle: 'italic' as const,
  },
  statsRow: {
    flexDirection: 'row' as const,
    gap: 10,
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
  },
  statInner: {
    padding: 12,
    alignItems: 'center' as const,
    gap: 6,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '500' as const,
    textAlign: 'center' as const,
  },
  notesCard: {
    marginTop: 20,
    borderRadius: 16,
  },
  notesInner: {
    padding: 16,
  },
  notesTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 12,
  },
  noteRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
    gap: 10,
  },
  noteDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  noteText: {
    fontSize: 14,
    flex: 1,
  },
  bottomBar: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  waterButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  waterButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600' as const,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingBottom: 10,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    width: 110,
  },
  backText: {
    fontSize: 17,
    fontWeight: '400' as const,
    marginLeft: -2,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center' as const,
    fontSize: 17,
    fontWeight: '600' as const,
  },
  headerActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'flex-end' as const,
    width: 110,
    gap: 14,
  },
  iconButton: {
    padding: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
  },
});
