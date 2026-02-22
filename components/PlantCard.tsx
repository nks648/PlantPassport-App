import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Droplets } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { Plant } from '@/types/plant';
import GlassCard from './GlassCard';
import StreakBadge from './StreakBadge';
import HealthDots from './HealthDots';

interface PlantCardProps {
  plant: Plant;
  onWater: (plant: Plant) => void;
}

export default React.memo(function PlantCard({ plant, onWater }: PlantCardProps) {
  const router = useRouter();
  const pressAnim = useRef(new Animated.Value(1)).current;
  const waterAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(pressAnim, { toValue: 0.97, useNativeDriver: true }).start();
  }, [pressAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(pressAnim, { toValue: 1, friction: 3, useNativeDriver: true }).start();
  }, [pressAnim]);

  const handleCardPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/plants/${plant.id}` as never);
  }, [plant.id, router]);

  const handleWater = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(waterAnim, { toValue: 0.85, duration: 100, useNativeDriver: true }),
      Animated.spring(waterAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();
    onWater(plant);
  }, [plant, onWater, waterAnim]);

  const daysAgo = Math.floor(
    (Date.now() - new Date(plant.lastWatered).getTime()) / (1000 * 60 * 60 * 24)
  );
  const lastWateredText = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`;

  return (
    <Animated.View style={{ transform: [{ scale: pressAnim }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handleCardPress}
      >
        <GlassCard style={styles.card}>
          <Image source={{ uri: plant.image }} style={styles.image} contentFit="cover" />
          <View style={styles.content}>
            <View style={styles.topRow}>
              <View style={styles.nameSection}>
                <Text style={styles.name} numberOfLines={1}>{plant.name}</Text>
                <Text style={styles.species} numberOfLines={1}>{plant.species}</Text>
              </View>
              <StreakBadge streak={plant.streak} size="small" />
            </View>
            <View style={styles.middleRow}>
              <HealthDots health={plant.health} />
              <Text style={styles.wateredText}>{lastWateredText}</Text>
            </View>
            <Animated.View style={{ transform: [{ scale: waterAnim }] }}>
              <TouchableOpacity
                style={styles.waterButton}
                onPress={handleWater}
                activeOpacity={0.8}
              >
                <Droplets size={15} color={Colors.textLight} strokeWidth={2} />
                <Text style={styles.waterButtonText}>Water</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  image: {
    width: 100,
    height: 140,
  },
  content: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nameSection: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  species: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wateredText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  waterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.accent,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  waterButtonText: {
    color: Colors.textLight,
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
