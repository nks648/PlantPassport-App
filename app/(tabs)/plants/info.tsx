import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Animated } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Droplets, Sun, Thermometer, Wrench, Sparkles, BookOpen, Leaf, CloudRain } from 'lucide-react-native';
import { generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import Colors from '@/constants/colors';
import { usePlants } from '@/providers/PlantProvider';
import { PlantNeeds } from '@/types/plant';
import GlassCard from '@/components/GlassCard';

const plantInfoSchema = z.object({
  careInstructions: z.array(z.string()).describe('Exactly 5 concise care instruction bullet points for this plant'),
  about: z.string().describe('A 2-3 sentence description about this plant species, its origin, and characteristics'),
  feedbackSummary: z.string().describe('A single sentence summarizing the user feedback/notes about their plant'),
});

type PlantInfo = z.infer<typeof plantInfoSchema>;

const WATER_LABELS = ['', 'Very Low', 'Low', 'Moderate', 'High', 'Very High'];
const LIGHT_LABELS = ['', 'Low Light', 'Partial Shade', 'Indirect', 'Bright', 'Full Sun'];
const HUMIDITY_LABELS = ['', 'Very Dry', 'Low', 'Average', 'Humid', 'Tropical'];
const EASE_LABELS = ['', 'Expert', 'Advanced', 'Intermediate', 'Easy', 'Beginner'];

function NeedBar({ level, color }: { level: number; color: string }) {
  return (
    <View style={styles.barTrack}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          style={[
            styles.barSegment,
            {
              backgroundColor: i <= level ? color : 'rgba(0,0,0,0.05)',
              opacity: i <= level ? 0.85 + i * 0.03 : 1,
            },
          ]}
        />
      ))}
    </View>
  );
}

function NeedsSection({ needs }: { needs: PlantNeeds }) {
  return (
    <GlassCard style={styles.sectionCard}>
      <View style={styles.sectionInner}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIconWrap}>
            <Leaf size={16} color={Colors.primary} strokeWidth={1.8} />
          </View>
          <Text style={styles.sectionTitle}>Plant Needs</Text>
        </View>

        <View style={styles.needRow}>
          <View style={[styles.iconWrap, { backgroundColor: 'rgba(0, 122, 255, 0.06)' }]}>
            <Droplets size={15} color={Colors.waterBlue} strokeWidth={1.8} />
          </View>
          <View style={styles.needContent}>
            <View style={styles.needHeader}>
              <Text style={styles.needLabel}>Water</Text>
              <Text style={styles.needValue}>{WATER_LABELS[needs.water]}</Text>
            </View>
            <NeedBar level={needs.water} color={Colors.waterBlue} />
          </View>
        </View>

        <View style={styles.needRow}>
          <View style={[styles.iconWrap, { backgroundColor: 'rgba(255, 159, 10, 0.06)' }]}>
            <Sun size={15} color={Colors.accent} strokeWidth={1.8} />
          </View>
          <View style={styles.needContent}>
            <View style={styles.needHeader}>
              <Text style={styles.needLabel}>Light</Text>
              <Text style={styles.needValue}>{LIGHT_LABELS[needs.light]}</Text>
            </View>
            <NeedBar level={needs.light} color={Colors.accent} />
          </View>
        </View>

        <View style={styles.needRow}>
          <View style={[styles.iconWrap, { backgroundColor: 'rgba(48, 176, 199, 0.06)' }]}>
            <CloudRain size={15} color={Colors.humidityTeal} strokeWidth={1.8} />
          </View>
          <View style={styles.needContent}>
            <View style={styles.needHeader}>
              <Text style={styles.needLabel}>Humidity</Text>
              <Text style={styles.needValue}>{HUMIDITY_LABELS[needs.humidity]}</Text>
            </View>
            <NeedBar level={needs.humidity} color={Colors.humidityTeal} />
          </View>
        </View>

        <View style={styles.needRow}>
          <View style={[styles.iconWrap, { backgroundColor: 'rgba(255, 59, 48, 0.06)' }]}>
            <Thermometer size={15} color="#FF6961" strokeWidth={1.8} />
          </View>
          <View style={styles.needContent}>
            <View style={styles.needHeader}>
              <Text style={styles.needLabel}>Temperature</Text>
              <Text style={styles.needValue}>{needs.idealTempMin}°–{needs.idealTempMax}°F</Text>
            </View>
            <View style={styles.tempBar}>
              <View style={styles.tempTrack}>
                <View
                  style={[
                    styles.tempRange,
                    {
                      left: `${((needs.idealTempMin - 40) / 80) * 100}%` as string,
                      right: `${100 - ((needs.idealTempMax - 40) / 80) * 100}%` as string,
                    },
                  ]}
                />
              </View>
              <View style={styles.tempLabels}>
                <Text style={styles.tempLabel}>40°</Text>
                <Text style={styles.tempLabel}>120°</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.needRow, styles.lastRow]}>
          <View style={[styles.iconWrap, { backgroundColor: 'rgba(45, 157, 78, 0.06)' }]}>
            <Wrench size={15} color={Colors.primary} strokeWidth={1.8} />
          </View>
          <View style={styles.needContent}>
            <View style={styles.needHeader}>
              <Text style={styles.needLabel}>Ease of Care</Text>
              <Text style={styles.needValue}>{EASE_LABELS[needs.easeOfCare]}</Text>
            </View>
            <NeedBar level={needs.easeOfCare} color={Colors.primary} />
          </View>
        </View>
      </View>
    </GlassCard>
  );
}

function CareSection({ instructions, isLoading }: { instructions: string[]; isLoading: boolean }) {
  return (
    <GlassCard style={styles.sectionCard}>
      <View style={styles.sectionInner}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconWrap, { backgroundColor: 'rgba(0, 122, 255, 0.06)' }]}>
            <Sparkles size={16} color={Colors.waterBlue} strokeWidth={1.8} />
          </View>
          <Text style={styles.sectionTitle}>Care Instructions</Text>
          {isLoading && <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 8 }} />}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Generating care tips...</Text>
          </View>
        ) : (
          instructions.map((instruction, i) => (
            <View key={i} style={[styles.bulletRow, i === instructions.length - 1 && styles.lastBullet]}>
              <View style={[styles.bulletDot, { backgroundColor: getBulletColor(i) }]} />
              <Text style={styles.bulletText}>{instruction}</Text>
            </View>
          ))
        )}
      </View>
    </GlassCard>
  );
}

function AboutSection({ about, feedbackSummary, isLoading }: { about: string; feedbackSummary: string; isLoading: boolean }) {
  return (
    <GlassCard style={styles.sectionCard}>
      <View style={styles.sectionInner}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIconWrap, { backgroundColor: 'rgba(255, 159, 10, 0.06)' }]}>
            <BookOpen size={16} color={Colors.accent} strokeWidth={1.8} />
          </View>
          <Text style={styles.sectionTitle}>About</Text>
          {isLoading && <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 8 }} />}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Learning about this plant...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.aboutText}>{about}</Text>
            {feedbackSummary ? (
              <View style={styles.feedbackContainer}>
                <View style={styles.feedbackBar} />
                <View style={styles.feedbackContent}>
                  <Text style={styles.feedbackLabel}>Your Observations</Text>
                  <Text style={styles.feedbackText}>{feedbackSummary}</Text>
                </View>
              </View>
            ) : null}
          </>
        )}
      </View>
    </GlassCard>
  );
}

function getBulletColor(index: number): string {
  const colors = [Colors.waterBlue, Colors.success, Colors.accent, '#FF6961', Colors.primary];
  return colors[index % colors.length];
}

export default function PlantInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { plants, waterLogs } = usePlants();
  const plant = plants.find((p) => p.id === id);

  const [plantInfo, setPlantInfo] = useState<PlantInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!plant) return;

    const recentLogs = waterLogs
      .filter((l) => l.plantId === plant.id)
      .slice(0, 5);
    const logNotes = recentLogs
      .filter((l) => l.note)
      .map((l) => l.note)
      .join('; ');

    const userFeedback = [
      ...plant.notes,
      logNotes,
    ].filter(Boolean).join('. ');

    const fetchPlantInfo = async () => {
      try {
        console.log('Fetching plant info for:', plant.name, plant.species);
        const result = await generateObject({
          messages: [
            {
              role: 'user',
              content: `You are a plant care expert. For the plant "${plant.name}" (species: ${plant.species}), provide:

1. Exactly 5 concise care instruction bullet points (each under 15 words)
2. A 2-3 sentence description about this plant species
3. A single sentence summarizing the following user observations about their plant: "${userFeedback || 'No notes yet'}"

Current plant status: Health ${plant.health}/5, Streak ${plant.streak} days, Water needs ${plant.needs.water}/5, Light needs ${plant.needs.light}/5, Humidity needs ${plant.needs.humidity}/5.`,
            },
          ],
          schema: plantInfoSchema,
        });
        console.log('Plant info received:', result);
        setPlantInfo(result);
        setError(null);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      } catch (e) {
        console.log('Error fetching plant info:', e);
        setError('Could not load plant details. Please try again.');
        setPlantInfo({
          careInstructions: [
            'Water when top inch of soil feels dry',
            'Provide bright, indirect sunlight for best growth',
            'Maintain humidity above 50% if possible',
            'Fertilize monthly during growing season',
            'Wipe leaves regularly to remove dust',
          ],
          about: `${plant.name} (${plant.species}) is a popular houseplant known for its beautiful foliage. It thrives in indoor conditions and is a wonderful addition to any plant collection.`,
          feedbackSummary: userFeedback || 'No user observations recorded yet.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlantInfo();
  }, [plant?.id]);

  if (!plant) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Plant Info' }} />
        <View style={styles.emptyState}>
          <Leaf size={48} color={Colors.textTertiary} strokeWidth={1.5} />
          <Text style={styles.emptyText}>Plant not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: `${plant.name} Info`,
          headerTitleStyle: { fontWeight: '600' as const, fontSize: 17, letterSpacing: -0.2 },
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBanner}>
          <View style={styles.headerIcon}>
            <Text style={styles.headerEmoji}>🌱</Text>
          </View>
          <Text style={styles.headerName}>{plant.name}</Text>
          <Text style={styles.headerSpecies}>{plant.species}</Text>
        </View>

        <NeedsSection needs={plant.needs} />
        <CareSection instructions={plantInfo?.careInstructions ?? []} isLoading={isLoading} />
        <AboutSection
          about={plantInfo?.about ?? ''}
          feedbackSummary={plantInfo?.feedbackSummary ?? ''}
          isLoading={isLoading}
        />

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerBanner: {
    alignItems: 'center' as const,
    marginBottom: 24,
    paddingTop: 4,
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(45, 157, 78, 0.06)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 12,
  },
  headerEmoji: {
    fontSize: 28,
  },
  headerName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  headerSpecies: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic' as const,
    marginTop: 2,
  },
  sectionCard: {
    marginBottom: 16,
    borderRadius: 16,
  },
  sectionInner: {
    padding: 18,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(45, 157, 78, 0.06)',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  needRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
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
    color: Colors.text,
  },
  needValue: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
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
    backgroundColor: 'rgba(0,0,0,0.05)',
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
    color: Colors.textTertiary,
  },
  bulletRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 12,
    gap: 12,
  },
  lastBullet: {
    marginBottom: 0,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  bulletText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  aboutText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  feedbackContainer: {
    flexDirection: 'row' as const,
    backgroundColor: 'rgba(45, 157, 78, 0.04)',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  feedbackBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  feedbackContent: {
    flex: 1,
  },
  feedbackLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.primary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    fontStyle: 'italic' as const,
  },
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center' as const,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  errorBanner: {
    backgroundColor: 'rgba(255, 59, 48, 0.06)',
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    textAlign: 'center' as const,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textTertiary,
  },
});
