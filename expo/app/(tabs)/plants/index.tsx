import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronDown, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Plant } from '@/types/plant';
import { usePlants } from '@/providers/PlantProvider';
import { useSettings } from '@/providers/SettingsProvider';
import PlantCard from '@/components/PlantCard';
import PlantNeedsCard from '@/components/PlantNeedsCard';
import WaterModal from '@/components/WaterModal';
import ShareModal from '@/components/ShareModal';

export default function PlantsScreen() {
  const router = useRouter();
  const { colors } = useSettings();
  const { plants, waterPlant, addCommunityPost, checkOverwatering } = usePlants();
  const [waterModalPlant, setWaterModalPlant] = useState<Plant | null>(null);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [lastWateredPlant, setLastWateredPlant] = useState<{ name: string; streak: number } | null>(null);
  const [showOverwaterWarning, setShowOverwaterWarning] = useState(false);
  const [pendingWaterPlant, setPendingWaterPlant] = useState<Plant | null>(null);

  const handleWater = useCallback((plant: Plant) => {
    const isOverwatering = checkOverwatering(plant);
    if (isOverwatering) {
      setPendingWaterPlant(plant);
      setShowOverwaterWarning(true);
      return;
    }
    setWaterModalPlant(plant);
  }, [checkOverwatering]);

  const handleOverwaterConfirm = useCallback(() => {
    setShowOverwaterWarning(false);
    if (pendingWaterPlant) {
      setWaterModalPlant(pendingWaterPlant);
      setPendingWaterPlant(null);
    }
  }, [pendingWaterPlant]);

  const handleOverwaterCancel = useCallback(() => {
    setShowOverwaterWarning(false);
    setPendingWaterPlant(null);
  }, []);

  const handleWaterConfirm = useCallback(async (health: number, note: string) => {
    if (!waterModalPlant) return;
    try {
      const result = await waterPlant({ plantId: waterModalPlant.id, health, note: note || undefined });
      setLastWateredPlant({ name: result.plant.name, streak: result.plant.streak });
      setTimeout(() => {
        setWaterModalPlant(null);
        setTimeout(() => {
          setShareModalVisible(true);
        }, 300);
      }, 400);
    } catch (e) {
      console.log('Error watering plant:', e);
      setWaterModalPlant(null);
    }
  }, [waterModalPlant, waterPlant]);

  const handleShare = useCallback(async (text: string) => {
    if (lastWateredPlant) {
      await addCommunityPost(text, lastWateredPlant.name, lastWateredPlant.streak);
    }
    setShareModalVisible(false);
    setLastWateredPlant(null);
  }, [lastWateredPlant, addCommunityPost]);

  const handleShareClose = useCallback(() => {
    setShareModalVisible(false);
    setLastWateredPlant(null);
  }, []);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const fabScale = useRef(new Animated.Value(1)).current;
  const handleFabPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(fabScale, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.spring(fabScale, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
    router.push('/scan' as never);
  }, [router, fabScale]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.count, { color: colors.textSecondary }]}>{plants.length} plant{plants.length !== 1 ? 's' : ''} in your garden</Text>
        {plants.map((plant) => (
          <View key={plant.id}>
            <PlantCard plant={plant} onWater={handleWater} />
            {plant.needs && (
              <TouchableOpacity
                style={styles.needsToggle}
                onPress={() => toggleExpand(plant.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.needsToggleText, { color: colors.primary }]}>
                  {expandedId === plant.id ? 'Hide Care Guide' : 'View Care Guide'}
                </Text>
                <View style={[
                  styles.chevronWrap,
                  expandedId === plant.id && styles.chevronFlipped,
                ]}>
                  <ChevronDown size={14} color={colors.primary} />
                </View>
              </TouchableOpacity>
            )}
            {expandedId === plant.id && plant.needs && (
              <PlantNeedsCard needs={plant.needs} wateringFrequencyDays={plant.wateringFrequencyDays} />
            )}
          </View>
        ))}
        <View style={{ height: 80 }} />
      </ScrollView>

      <Animated.View style={[styles.fabContainer, { transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={handleFabPress} activeOpacity={0.85}>
          <Plus size={24} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>
      </Animated.View>

      {showOverwaterWarning && (
        <OverwaterWarning
          plantName={pendingWaterPlant?.name ?? ''}
          onConfirm={handleOverwaterConfirm}
          onCancel={handleOverwaterCancel}
        />
      )}

      <WaterModal
        visible={!!waterModalPlant}
        plant={waterModalPlant}
        onClose={() => setWaterModalPlant(null)}
        onConfirm={handleWaterConfirm}
      />

      <ShareModal
        visible={shareModalVisible}
        plantName={lastWateredPlant?.name ?? ''}
        streak={lastWateredPlant?.streak ?? 0}
        onClose={handleShareClose}
        onShare={handleShare}
      />
    </View>
  );
}

function OverwaterWarning({
  plantName,
  onConfirm,
  onCancel,
}: {
  plantName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { colors } = useSettings();
  return (
    <View style={owStyles.overlay}>
      <View style={[owStyles.card, { backgroundColor: colors.cardSolid }]}>
        <Text style={owStyles.emoji}>⚠️</Text>
        <Text style={[owStyles.title, { color: colors.text }]}>Are you sure?</Text>
        <Text style={[owStyles.message, { color: colors.textSecondary }]}>
          {plantName} was watered less than 24 hours ago. Overwatering can harm your plant.
        </Text>
        <View style={owStyles.actions}>
          <TouchableOpacity style={[owStyles.cancelBtn, { backgroundColor: colors.background }]} onPress={onCancel} activeOpacity={0.8}>
            <Text style={[owStyles.cancelText, { color: colors.textSecondary }]}>Not Now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[owStyles.confirmBtn, { backgroundColor: colors.warning }]} onPress={onConfirm} activeOpacity={0.8}>
            <Text style={owStyles.confirmText}>Water Anyway</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const owStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    zIndex: 100,
  },
  card: {
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  count: {
    fontSize: 13,
    marginBottom: 16,
  },
  needsToggle: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: -6,
    marginBottom: 6,
    paddingVertical: 6,
    gap: 4,
  },
  needsToggleText: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  chevronWrap: {
    transform: [{ rotate: '0deg' }],
  },
  chevronFlipped: {
    transform: [{ rotate: '180deg' }],
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
