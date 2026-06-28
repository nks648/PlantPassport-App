import React, { useCallback, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Plus, ArrowLeft, Leaf, RefreshCw, Check, Info } from 'lucide-react-native';
import { usePlants } from '@/providers/PlantProvider';
import { useSettings } from '@/providers/SettingsProvider';
import { Plant, PlantNeeds } from '@/types/plant';
import PlantNeedsCard from '@/components/PlantNeedsCard';
import { generateCareGuide } from '@/lib/plantAI';

const DEFAULT_NEEDS: PlantNeeds = {
  water: 3,
  light: 3,
  humidity: 3,
  idealTempMin: 60,
  idealTempMax: 80,
  easeOfCare: 3,
};

interface PossibleMatch {
  commonName: string;
  scientificName: string;
  confidence: number;
}

function ConfidenceMeter({ confidence }: { confidence: number }) {
  const { colors } = useSettings();
  const fillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: confidence / 100,
      duration: 800,
      delay: 300,
      useNativeDriver: false,
    }).start();
  }, [confidence, fillAnim]);

  const getColor = () => {
    if (confidence >= 70) return colors.primary;
    if (confidence >= 40) return colors.warning;
    return colors.error;
  };

  const getLabel = () => {
    if (confidence >= 80) return 'High confidence';
    if (confidence >= 50) return 'Moderate confidence';
    return 'Low confidence';
  };

  const color = getColor();

  return (
    <View style={styles.confidenceContainer}>
      <View style={styles.confidenceHeader}>
        <View style={styles.confidenceLeft}>
          <Check size={14} color={color} strokeWidth={2.5} />
          <Text style={[styles.confidenceLabel, { color }]}>{getLabel()}</Text>
        </View>
        <Text style={[styles.confidencePercent, { color }]}>{confidence}%</Text>
      </View>
      <View style={[styles.confidenceTrack, { backgroundColor: colors.inputBackground }]}>
        <Animated.View
          style={[
            styles.confidenceFill,
            {
              backgroundColor: color,
              width: fillAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
}

function MatchItem({ match, index }: { match: PossibleMatch; index: number }) {
  const { colors } = useSettings();
  const conf = Math.round(match.confidence * 100);
  return (
    <View style={[styles.matchItem, { backgroundColor: colors.background }]}>
      <View style={[styles.matchRank, { backgroundColor: colors.primaryMuted }]}>
        <Text style={[styles.matchRankText, { color: colors.primary }]}>{index + 1}</Text>
      </View>
      <View style={styles.matchInfo}>
        <Text style={[styles.matchName, { color: colors.text }]}>{match.commonName}</Text>
        <Text style={[styles.matchSpecies, { color: colors.textSecondary }]}>{match.scientificName}</Text>
      </View>
      <Text style={[styles.matchConfidence, { color: colors.textSecondary }]}>{conf}%</Text>
    </View>
  );
}

export default function ScanResultScreen() {
  const router = useRouter();
  const { colors } = useSettings();
  const params = useLocalSearchParams<{
    name: string;
    species: string;
    confidence: string;
    notes: string;
    possibleMatches: string;
    needs: string;
    wateringFrequencyDays: string;
    imageUri: string;
  }>();
  const { addPlant, plants } = usePlants();
  const [isAdding, setIsAdding] = useState<boolean>(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const confidence = parseInt(params.confidence || '0', 10);
  const notes = params.notes || '';

  let needs: PlantNeeds = DEFAULT_NEEDS;
  try {
    if (params.needs) needs = { ...DEFAULT_NEEDS, ...JSON.parse(params.needs) };
  } catch {
    console.log('[ScanResult] Failed to parse needs');
  }
  const wateringFrequencyDays = parseInt(params.wateringFrequencyDays || '3', 10) || 3;

  let possibleMatches: PossibleMatch[] = [];
  try {
    possibleMatches = JSON.parse(params.possibleMatches || '[]');
  } catch {
    console.log('[ScanResult] Failed to parse possibleMatches');
  }

  const displayImage = params.imageUri || 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600&h=600&fit=crop';

  const handleAddPlant = useCallback(async () => {
    if (isAdding) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const alreadyExists = plants.some(
        (p) => p.name.toLowerCase() === (params.name || '').toLowerCase()
      );
      if (alreadyExists) {
        Alert.alert('Already Added', `${params.name} is already in your garden!`);
        return;
      }

      setIsAdding(true);

      const name = params.name || 'Unknown Plant';
      const species = params.species || 'Unknown Species';

      // Generate the species-specific care guide ONCE, at add time, then persist it.
      let careGuide: { careInstructions: string[]; about: string } | undefined;
      try {
        const guide = await generateCareGuide(name, species, notes);
        if (guide.careInstructions.length >= 3 || guide.about) {
          careGuide = { careInstructions: guide.careInstructions, about: guide.about };
        }
      } catch (e) {
        console.log('[ScanResult] Care guide generation failed, will generate later:', e);
      }

      const newPlant: Plant = {
        id: `plant_${Date.now()}`,
        name,
        species,
        image: displayImage,
        health: 4,
        streak: 0,
        lastWatered: new Date().toISOString().split('T')[0],
        addedDate: new Date().toISOString().split('T')[0],
        notes: notes ? [notes] : [],
        needs,
        wateringFrequencyDays,
        careGuide,
      };

      await addPlant(newPlant);
      Alert.alert(
        'Plant Added!',
        `${name} has been added to your garden.`,
        [{ text: 'View My Plants', onPress: () => router.replace('/(tabs)/plants' as never) }]
      );
    } catch (e) {
      console.log('[ScanResult] Error adding plant:', e);
      Alert.alert('Error', 'Failed to add plant. Please try again.');
    } finally {
      setIsAdding(false);
    }
  }, [isAdding, params, plants, addPlant, router, displayImage, notes, needs, wateringFrequencyDays]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleScanAgain = useCallback(() => {
    router.replace('/scan' as never);
  }, [router]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: displayImage }} style={styles.heroImage} contentFit="cover" />
            <View style={styles.imageOverlay} />
            <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
              <ArrowLeft size={20} color="#fff" strokeWidth={2} />
            </TouchableOpacity>
            <View style={styles.imageLabel}>
              <View style={[styles.identifiedBadge, { backgroundColor: colors.primary }]}>
                <Leaf size={14} color="#fff" strokeWidth={2} />
                <Text style={styles.identifiedText}>Identified</Text>
              </View>
            </View>
          </View>

          <Animated.View style={[styles.contentCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }], backgroundColor: colors.cardSolid }]}>
            <Text style={[styles.plantName, { color: colors.text }]}>{params.name || 'Unknown Plant'}</Text>
            <Text style={[styles.plantSpecies, { color: colors.textSecondary }]}>{params.species || 'Unknown Species'}</Text>

            <View style={[styles.divider, { backgroundColor: colors.divider }]} />

            <ConfidenceMeter confidence={confidence} />

            {notes ? (
              <>
                <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                <View style={styles.notesSection}>
                  <View style={styles.notesTitleRow}>
                    <Info size={16} color={colors.accent} strokeWidth={2} />
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>NOTES</Text>
                  </View>
                  <Text style={[styles.notesText, { color: colors.text }]}>{notes}</Text>
                </View>
              </>
            ) : null}

            {possibleMatches.length > 0 ? (
              <>
                <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>POSSIBLE MATCHES</Text>
                <View style={styles.matchesList}>
                  {possibleMatches.map((match, index) => (
                    <MatchItem key={`${match.scientificName}-${index}`} match={match} index={index} />
                  ))}
                </View>
              </>
            ) : null}
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <View style={styles.careCardWrap}>
              <PlantNeedsCard needs={needs} wateringFrequencyDays={wateringFrequencyDays} />
            </View>
          </Animated.View>

          <View style={styles.scanAgainContainer}>
            <TouchableOpacity style={[styles.scanAgainButton, { backgroundColor: colors.cardSolid, borderColor: colors.divider }]} onPress={handleScanAgain} activeOpacity={0.8}>
              <RefreshCw size={18} color={colors.primary} strokeWidth={2} />
              <Text style={[styles.scanAgainText, { color: colors.primary }]}>Scan Again</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomPad} />
        </ScrollView>
      </SafeAreaView>

      <SafeAreaView edges={['bottom']} style={[styles.bottomBar, { backgroundColor: colors.elevatedBackground, borderTopColor: colors.divider }]}>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }, isAdding && styles.addButtonDisabled]} onPress={handleAddPlant} activeOpacity={0.85} disabled={isAdding}>
          {isAdding ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.addButtonText}>Building care guide…</Text>
            </>
          ) : (
            <>
              <Plus size={20} color="#fff" strokeWidth={2.5} />
              <Text style={styles.addButtonText}>Add to My Plants</Text>
            </>
          )}
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  imageContainer: { position: 'relative', height: 300 },
  heroImage: { width: '100%', height: '100%' },
  imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, backgroundColor: 'transparent' },
  backBtn: { position: 'absolute', top: 12, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  imageLabel: { position: 'absolute', bottom: 16, left: 16 },
  identifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  identifiedText: { color: '#fff', fontSize: 13, fontWeight: '600' as const },
  contentCard: { marginHorizontal: 16, marginTop: -32, borderRadius: 20, padding: 24, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16 }, android: { elevation: 6 }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16 } }) },
  plantName: { fontSize: 26, fontWeight: '700' as const, marginBottom: 2, letterSpacing: -0.5 },
  plantSpecies: { fontSize: 15, fontStyle: 'italic' as const, marginBottom: 4 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 20 },
  confidenceContainer: { gap: 10 },
  confidenceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  confidenceLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  confidenceLabel: { fontSize: 14, fontWeight: '600' as const },
  confidencePercent: { fontSize: 22, fontWeight: '700' as const },
  confidenceTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  confidenceFill: { height: '100%', borderRadius: 4 },
  notesSection: { gap: 8 },
  notesTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 1 },
  notesText: { fontSize: 15, lineHeight: 22 },
  matchesList: { marginTop: 12, gap: 10 },
  matchItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 12, gap: 12 },
  matchRank: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  matchRankText: { fontSize: 13, fontWeight: '700' as const },
  matchInfo: { flex: 1 },
  matchName: { fontSize: 14, fontWeight: '600' as const },
  matchSpecies: { fontSize: 12, fontStyle: 'italic' as const },
  matchConfidence: { fontSize: 14, fontWeight: '600' as const },
  careCardWrap: { paddingHorizontal: 16, marginTop: 16 },
  scanAgainContainer: { paddingHorizontal: 16, marginTop: 16 },
  scanAgainButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  scanAgainText: { fontSize: 16, fontWeight: '500' as const },
  bottomPad: { height: 100 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 20, paddingTop: 12 },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14, ...Platform.select({ ios: { shadowColor: '#30D158', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8 }, android: { elevation: 4 }, default: { shadowColor: '#30D158', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8 } }) },
  addButtonDisabled: { opacity: 0.7 },
  addButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' as const },
});
