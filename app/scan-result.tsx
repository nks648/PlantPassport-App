import React, { useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Plus, ArrowLeft, Leaf, RefreshCw, Check, Info } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { usePlants } from '@/providers/PlantProvider';
import { Plant } from '@/types/plant';

interface PossibleMatch {
  commonName: string;
  scientificName: string;
  confidence: number;
}

function ConfidenceMeter({ confidence }: { confidence: number }) {
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
    if (confidence >= 70) return Colors.primary;
    if (confidence >= 40) return Colors.warning;
    return Colors.error;
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
      <View style={styles.confidenceTrack}>
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
  const conf = Math.round(match.confidence * 100);
  return (
    <View style={styles.matchItem}>
      <View style={styles.matchRank}>
        <Text style={styles.matchRankText}>{index + 1}</Text>
      </View>
      <View style={styles.matchInfo}>
        <Text style={styles.matchName}>{match.commonName}</Text>
        <Text style={styles.matchSpecies}>{match.scientificName}</Text>
      </View>
      <Text style={styles.matchConfidence}>{conf}%</Text>
    </View>
  );
}

export default function ScanResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    name: string;
    species: string;
    confidence: string;
    notes: string;
    possibleMatches: string;
    imageUri: string;
  }>();
  const { addPlant, plants } = usePlants();

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

  let possibleMatches: PossibleMatch[] = [];
  try {
    possibleMatches = JSON.parse(params.possibleMatches || '[]');
  } catch {
    console.log('[ScanResult] Failed to parse possibleMatches');
  }

  const displayImage = params.imageUri || 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600&h=600&fit=crop';

  const handleAddPlant = useCallback(async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const alreadyExists = plants.some(
        (p) => p.name.toLowerCase() === (params.name || '').toLowerCase()
      );
      if (alreadyExists) {
        Alert.alert('Already Added', `${params.name} is already in your garden!`);
        return;
      }

      const newPlant: Plant = {
        id: `plant_${Date.now()}`,
        name: params.name || 'Unknown Plant',
        species: params.species || 'Unknown Species',
        image: displayImage,
        health: 4,
        streak: 0,
        lastWatered: new Date().toISOString().split('T')[0],
        addedDate: new Date().toISOString().split('T')[0],
        notes: notes ? [notes] : [],
        needs: {
          water: 3,
          light: 3,
          humidity: 3,
          idealTempMin: 60,
          idealTempMax: 80,
          easeOfCare: 3,
        },
        wateringFrequencyDays: 3,
      };

      await addPlant(newPlant);
      Alert.alert(
        'Plant Added!',
        `${params.name} has been added to your garden.`,
        [{ text: 'View My Plants', onPress: () => router.replace('/(tabs)/plants' as never) }]
      );
    } catch (e) {
      console.log('[ScanResult] Error adding plant:', e);
      Alert.alert('Error', 'Failed to add plant. Please try again.');
    }
  }, [params, plants, addPlant, router, displayImage, notes]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleScanAgain = useCallback(() => {
    router.replace('/scan' as never);
  }, [router]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: displayImage }} style={styles.heroImage} contentFit="cover" />
            <View style={styles.imageOverlay} />
            <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
              <ArrowLeft size={20} color="#fff" strokeWidth={2} />
            </TouchableOpacity>
            <View style={styles.imageLabel}>
              <View style={styles.identifiedBadge}>
                <Leaf size={14} color="#fff" strokeWidth={2} />
                <Text style={styles.identifiedText}>Identified</Text>
              </View>
            </View>
          </View>

          <Animated.View style={[styles.contentCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.plantName}>{params.name || 'Unknown Plant'}</Text>
            <Text style={styles.plantSpecies}>{params.species || 'Unknown Species'}</Text>

            <View style={styles.divider} />

            <ConfidenceMeter confidence={confidence} />

            {notes ? (
              <>
                <View style={styles.divider} />
                <View style={styles.notesSection}>
                  <View style={styles.notesTitleRow}>
                    <Info size={16} color={Colors.accent} strokeWidth={2} />
                    <Text style={styles.sectionTitle}>NOTES</Text>
                  </View>
                  <Text style={styles.notesText}>{notes}</Text>
                </View>
              </>
            ) : null}

            {possibleMatches.length > 0 ? (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>POSSIBLE MATCHES</Text>
                <View style={styles.matchesList}>
                  {possibleMatches.map((match, index) => (
                    <MatchItem key={`${match.scientificName}-${index}`} match={match} index={index} />
                  ))}
                </View>
              </>
            ) : null}
          </Animated.View>

          <View style={styles.scanAgainContainer}>
            <TouchableOpacity style={styles.scanAgainButton} onPress={handleScanAgain} activeOpacity={0.8}>
              <RefreshCw size={18} color={Colors.primary} strokeWidth={2} />
              <Text style={styles.scanAgainText}>Scan Again</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomPad} />
        </ScrollView>
      </SafeAreaView>

      <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
        <TouchableOpacity style={styles.addButton} onPress={handleAddPlant} activeOpacity={0.85}>
          <Plus size={20} color="#fff" strokeWidth={2.5} />
          <Text style={styles.addButtonText}>Add to My Plants</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  imageContainer: {
    position: 'relative',
    height: 300,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'transparent',
  },
  backBtn: {
    position: 'absolute',
    top: 12,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageLabel: {
    position: 'absolute',
    bottom: 16,
    left: 16,
  },
  identifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  identifiedText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600' as const,
  },
  contentCard: {
    marginHorizontal: 16,
    marginTop: -32,
    backgroundColor: Colors.cardSolid,
    borderRadius: 20,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
    }),
  },
  plantName: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  plantSpecies: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.divider,
    marginVertical: 20,
  },
  confidenceContainer: {
    gap: 10,
  },
  confidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confidenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confidenceLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  confidencePercent: {
    fontSize: 22,
    fontWeight: '700' as const,
  },
  confidenceTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(60, 60, 67, 0.05)',
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 4,
  },
  notesSection: {
    gap: 8,
  },
  notesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  notesText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  matchesList: {
    marginTop: 12,
    gap: 10,
  },
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  matchRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchRankText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  matchInfo: {
    flex: 1,
  },
  matchName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  matchSpecies: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  matchConfidence: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  scanAgainContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  scanAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.cardSolid,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  scanAgainText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.primary,
  },
  bottomPad: {
    height: 100,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(242, 242, 247, 0.95)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.divider,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      default: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
    }),
  },
  addButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600' as const,
  },
});
