import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Animated,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import {
  Edit3,
  Check,
  X,
  Leaf,
  Droplets,
  TrendingUp,
  Zap,
  Award,
  MapPin,
  Thermometer,
  CloudSun,
  AlertTriangle,
  Wind,
  Camera,
} from 'lucide-react-native';
import { usePlants } from '@/providers/PlantProvider';
import { useSettings } from '@/providers/SettingsProvider';
import { getRankForXP } from '@/types/plant';
import GlassCard from '@/components/GlassCard';
import HealthDots from '@/components/HealthDots';

interface LocationWeather {
  city: string;
  tempC: number;
  humidity: number;
  description: string;
  windSpeedKmh: number;
}

interface LocationCareAdvice {
  title: string;
  message: string;
  type: 'warning' | 'info' | 'tip';
}

function fToC(f: number): number {
  return Math.round((f - 32) * 5 / 9);
}

function cToF(c: number): number {
  return Math.round(c * 9 / 5 + 32);
}

function generateLocationCare(weather: LocationWeather, useCelsius: boolean, plants: { name: string; needs: { water: number; light: number; humidity: number; idealTempMin: number; idealTempMax: number } }[]): LocationCareAdvice[] {
  const advice: LocationCareAdvice[] = [];
  const unit = useCelsius ? '°C' : '°F';
  const currentTemp = useCelsius ? weather.tempC : cToF(weather.tempC);

  plants.forEach((plant) => {
    const idealMin = useCelsius ? fToC(plant.needs.idealTempMin) : plant.needs.idealTempMin;
    const idealMax = useCelsius ? fToC(plant.needs.idealTempMax) : plant.needs.idealTempMax;

    if (currentTemp > idealMax) {
      advice.push({
        title: plant.name,
        message: `Current ${currentTemp}${unit} exceeds ideal range (${idealMin}–${idealMax}${unit}). Move to a cooler spot and increase watering.`,
        type: 'warning',
      });
    } else if (currentTemp < idealMin) {
      advice.push({
        title: plant.name,
        message: `Current ${currentTemp}${unit} is below ideal (${idealMin}–${idealMax}${unit}). Keep away from cold drafts and reduce watering.`,
        type: 'warning',
      });
    }

    if (weather.humidity < 30 && plant.needs.humidity >= 4) {
      advice.push({
        title: plant.name,
        message: `Humidity is only ${weather.humidity}%. This plant loves moisture — mist regularly or use a humidifier.`,
        type: 'info',
      });
    }
  });

  if (advice.length === 0) {
    const locationLabel = weather.city !== 'Unknown' ? weather.city : 'your area';
    advice.push({
      title: 'All Clear',
      message: `Conditions in ${locationLabel} look great for your plants right now. Keep up the routine!`,
      type: 'tip',
    });
  }

  return advice.slice(0, 4);
}

export default function ProfileScreen() {
  const { plants, userProfile, averageHealth, averageStreak, totalStreak, updateProfile } = usePlants();
  const { colors, useCelsius } = useSettings();
  const rankInfo = getRankForXP(userProfile.xp);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(userProfile.name);
  const [locationWeather, setLocationWeather] = useState<LocationWeather | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  useEffect(() => {
    fetchLocation();
  }, []);

  const fetchLocation = async () => {
    try {
      if (Platform.OS === 'web') {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              await fetchWeatherForLocation(pos.coords.latitude, pos.coords.longitude);
            },
            () => {
              setLocationWeather({ city: 'Unknown', tempC: 22, humidity: 55, description: 'Partly Cloudy', windSpeedKmh: 13 });
              setLocationLoading(false);
            },
            { timeout: 5000 }
          );
        } else {
          setLocationWeather({ city: 'Unknown', tempC: 22, humidity: 55, description: 'Partly Cloudy', windSpeedKmh: 13 });
          setLocationLoading(false);
        }
      } else {
        const Location = await import('expo-location').catch(() => null);
        if (Location) {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
            await fetchWeatherForLocation(loc.coords.latitude, loc.coords.longitude);
          } else {
            setLocationWeather({ city: 'Unknown', tempC: 22, humidity: 55, description: 'Partly Cloudy', windSpeedKmh: 13 });
            setLocationLoading(false);
          }
        } else {
          setLocationWeather({ city: 'Unknown', tempC: 22, humidity: 55, description: 'Partly Cloudy', windSpeedKmh: 13 });
          setLocationLoading(false);
        }
      }
    } catch {
      setLocationWeather({ city: 'Unknown', tempC: 22, humidity: 55, description: 'Partly Cloudy', windSpeedKmh: 13 });
      setLocationLoading(false);
    }
  };

  const fetchWeatherForLocation = async (lat: number, lon: number) => {
    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`);
      const geoData = await geoRes.json();
      const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || 'Your Area';

      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto`
      );
      const weatherData = await weatherRes.json();

      const weatherCode = weatherData.current?.weather_code ?? 0;
      let desc = 'Clear';
      if (weatherCode >= 61) desc = 'Rainy';
      else if (weatherCode >= 45) desc = 'Cloudy';
      else if (weatherCode >= 2) desc = 'Partly Cloudy';

      setLocationWeather({
        city,
        tempC: Math.round(weatherData.current?.temperature_2m ?? 22),
        humidity: Math.round(weatherData.current?.relative_humidity_2m ?? 55),
        description: desc,
        windSpeedKmh: Math.round(weatherData.current?.wind_speed_10m ?? 8),
      });
    } catch (e) {
      console.log('Location weather error:', e);
      setLocationWeather({ city: 'Unknown', tempC: 22, humidity: 55, description: 'Partly Cloudy', windSpeedKmh: 13 });
    } finally {
      setLocationLoading(false);
    }
  };

  const displayTemp = (c: number) => useCelsius ? c : cToF(c);
  const tempUnit = useCelsius ? '°C' : '°F';
  const windDisplay = useCelsius
    ? `${locationWeather?.windSpeedKmh ?? 0} km/h`
    : `${Math.round((locationWeather?.windSpeedKmh ?? 0) * 0.621)} mph`;

  const handleSaveName = useCallback(async () => {
    const trimmed = editName.trim();
    if (trimmed.length === 0) {
      Alert.alert('Invalid Name', 'Please enter a valid name.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateProfile({ name: trimmed });
    setIsEditing(false);
  }, [editName, updateProfile]);

  const handleCancelEdit = useCallback(() => {
    setEditName(userProfile.name);
    setIsEditing(false);
  }, [userProfile.name]);

  const handleStartEdit = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditName(userProfile.name);
    setIsEditing(true);
  }, [userProfile.name]);

  const handlePickAvatar = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to change your profile picture.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        console.log('New avatar selected:', result.assets[0].uri);
        await updateProfile({ avatar: result.assets[0].uri });
      }
    } catch (e) {
      console.log('Image picker error:', e);
      Alert.alert('Error', 'Could not pick image. Please try again.');
    }
  }, [updateProfile]);

  const xpProgress = rankInfo.xpToNext
    ? Math.min((userProfile.xp - (getRankForXP(userProfile.xp - 1).xpToNext != null ? 0 : 0)) / ((rankInfo.xpToNext ?? 0) + userProfile.xp), 1)
    : 1;

  const healthOverview = useMemo(() => {
    return plants.map(p => ({
      id: p.id,
      name: p.name,
      health: p.health,
      streak: p.streak,
      image: p.image,
      trend: p.health >= 4 ? 'up' as const : p.health >= 3 ? 'stable' as const : 'down' as const,
    }));
  }, [plants]);

  const locationCare = useMemo(() => {
    if (!locationWeather) return [];
    return generateLocationCare(locationWeather, useCelsius, plants);
  }, [locationWeather, useCelsius, plants]);

  return (
    <Animated.View style={[styles.wrapper, { opacity: fadeAnim, backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <GlassCard style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.8} style={styles.avatarContainer}>
              <Image source={{ uri: userProfile.avatar }} style={styles.avatar} />
              <View style={[styles.avatarBadge, { backgroundColor: colors.primary, borderColor: colors.cardSolid }]}>
                <Camera size={12} color="#fff" strokeWidth={2} />
              </View>
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              {isEditing ? (
                <View style={styles.editRow}>
                  <TextInput
                    style={[styles.nameInput, { color: colors.text, borderBottomColor: colors.primary }]}
                    value={editName}
                    onChangeText={setEditName}
                    autoFocus
                    maxLength={30}
                    returnKeyType="done"
                    onSubmitEditing={handleSaveName}
                    testID="name-input"
                  />
                  <TouchableOpacity onPress={handleSaveName} style={[styles.editBtn, { backgroundColor: colors.inputBackground }]} testID="save-name-btn">
                    <Check size={18} color={colors.primary} strokeWidth={2} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleCancelEdit} style={[styles.editBtn, { backgroundColor: colors.inputBackground }]} testID="cancel-name-btn">
                    <X size={18} color={colors.error} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.nameRow}>
                  <Text style={[styles.profileName, { color: colors.text }]}>{userProfile.name}</Text>
                  <TouchableOpacity onPress={handleStartEdit} style={[styles.editIconBtn, { backgroundColor: colors.inputBackground }]} testID="edit-name-btn">
                    <Edit3 size={14} color={colors.textSecondary} strokeWidth={1.8} />
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.rankRow}>
                <Text style={styles.rankEmoji}>{rankInfo.emoji}</Text>
                <Text style={[styles.rankText, { color: colors.textSecondary }]}>{rankInfo.rank}</Text>
              </View>
            </View>
          </View>

          {rankInfo.xpToNext != null && (
            <View style={styles.xpSection}>
              <View style={[styles.xpBarTrack, { backgroundColor: colors.inputBackground }]}>
                <View style={[styles.xpBarFill, { width: `${Math.min(xpProgress * 100, 100)}%`, backgroundColor: colors.accent }]} />
              </View>
              <View style={styles.xpLabelRow}>
                <View style={styles.xpBadge}>
                  <Zap size={10} color={colors.accent} />
                  <Text style={[styles.xpBadgeText, { color: colors.accent }]}>{userProfile.xp} XP</Text>
                </View>
                <Text style={[styles.xpToNext, { color: colors.textSecondary }]}>{rankInfo.xpToNext} to {rankInfo.nextRank}</Text>
              </View>
            </View>
          )}
        </GlassCard>

        <View style={styles.statsGrid}>
          <GlassCard style={styles.miniStat}>
            <Leaf size={18} color={colors.primary} strokeWidth={1.6} />
            <Text style={[styles.miniStatValue, { color: colors.text }]}>{plants.length}</Text>
            <Text style={[styles.miniStatLabel, { color: colors.textSecondary }]}>Plants</Text>
          </GlassCard>
          <GlassCard style={styles.miniStat}>
            <Droplets size={18} color={colors.accent} strokeWidth={1.6} />
            <Text style={[styles.miniStatValue, { color: colors.text }]}>{userProfile.totalWaterings}</Text>
            <Text style={[styles.miniStatLabel, { color: colors.textSecondary }]}>Waterings</Text>
          </GlassCard>
          <GlassCard style={styles.miniStat}>
            <TrendingUp size={18} color={colors.streak} strokeWidth={1.6} />
            <Text style={[styles.miniStatValue, { color: colors.text }]}>{averageStreak}</Text>
            <Text style={[styles.miniStatLabel, { color: colors.textSecondary }]}>Avg Streak</Text>
          </GlassCard>
          <GlassCard style={styles.miniStat}>
            <Award size={18} color={colors.xpPurple} strokeWidth={1.6} />
            <Text style={[styles.miniStatValue, { color: colors.text }]}>{averageHealth.toFixed(1)}</Text>
            <Text style={[styles.miniStatLabel, { color: colors.textSecondary }]}>Avg Health</Text>
          </GlassCard>
        </View>

        {locationWeather && !locationLoading && (
          <>
            <View style={styles.sectionHeader}>
              <MapPin size={16} color={colors.accent} strokeWidth={1.8} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Plant care for {locationWeather.city !== 'Unknown' ? locationWeather.city : 'your location'}</Text>
            </View>

            <GlassCard style={styles.locationCard}>
              <View style={styles.locationRow}>
                <View style={styles.locationDetail}>
                  <Thermometer size={14} color={colors.text} strokeWidth={1.6} />
                  <Text style={[styles.locationValue, { color: colors.text }]}>{displayTemp(locationWeather.tempC)}{tempUnit}</Text>
                </View>
                <View style={styles.locationDetail}>
                  <Droplets size={14} color={colors.accent} strokeWidth={1.6} />
                  <Text style={[styles.locationValue, { color: colors.text }]}>{locationWeather.humidity}%</Text>
                </View>
                <View style={styles.locationDetail}>
                  <Wind size={14} color={colors.textSecondary} strokeWidth={1.6} />
                  <Text style={[styles.locationValue, { color: colors.text }]}>{windDisplay}</Text>
                </View>
                <View style={styles.locationDetail}>
                  <CloudSun size={14} color={colors.warning} strokeWidth={1.6} />
                  <Text style={[styles.locationValue, { color: colors.text }]}>{locationWeather.description}</Text>
                </View>
              </View>
            </GlassCard>

            {locationCare.map((item, i) => (
              <GlassCard key={i} style={styles.careAdviceCard}>
                <View style={styles.careAdviceRow}>
                  <View style={[
                    styles.careAdviceIcon,
                    item.type === 'warning' && { backgroundColor: 'rgba(255, 149, 0, 0.1)' },
                    item.type === 'info' && { backgroundColor: 'rgba(0, 122, 255, 0.08)' },
                    item.type === 'tip' && { backgroundColor: 'rgba(48, 209, 88, 0.1)' },
                  ]}>
                    {item.type === 'warning' ? (
                      <AlertTriangle size={14} color={colors.warning} strokeWidth={1.8} />
                    ) : item.type === 'info' ? (
                      <Droplets size={14} color={colors.accent} strokeWidth={1.8} />
                    ) : (
                      <Leaf size={14} color={colors.primary} strokeWidth={1.8} />
                    )}
                  </View>
                  <View style={styles.careAdviceContent}>
                    <Text style={[styles.careAdviceTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[styles.careAdviceMessage, { color: colors.textSecondary }]}>{item.message}</Text>
                  </View>
                </View>
              </GlassCard>
            ))}
          </>
        )}

        <View style={styles.sectionHeader}>
          <Leaf size={16} color={colors.primary} strokeWidth={1.8} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Plant Health Overview</Text>
        </View>

        {healthOverview.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No plants yet. Add some to see their health!</Text>
          </GlassCard>
        ) : (
          <GlassCard style={styles.healthCard}>
            {healthOverview.map((p, i) => (
              <View
                key={p.id}
                style={[styles.healthRow, i < healthOverview.length - 1 && [styles.healthRowBorder, { borderBottomColor: colors.divider }]]}
              >
                <Image source={{ uri: p.image }} style={styles.healthPlantImage} />
                <View style={styles.healthInfo}>
                  <Text style={[styles.healthName, { color: colors.text }]} numberOfLines={1}>{p.name}</Text>
                  <View style={styles.healthMeta}>
                    <Text style={[styles.streakMini, { color: colors.streak }]}>🔥 {p.streak}d</Text>
                  </View>
                </View>
                <HealthDots health={p.health} />
                <View style={[
                  styles.trendBadge,
                  p.trend === 'up' && { backgroundColor: 'rgba(52, 199, 89, 0.1)' },
                  p.trend === 'down' && { backgroundColor: 'rgba(255, 59, 48, 0.1)' },
                  p.trend === 'stable' && { backgroundColor: colors.inputBackground },
                ]}>
                  <TrendingUp
                    size={11}
                    color={p.trend === 'up' ? colors.success : p.trend === 'down' ? colors.error : colors.textSecondary}
                    style={p.trend === 'down' ? { transform: [{ rotate: '180deg' }] } : undefined}
                    strokeWidth={1.8}
                  />
                </View>
              </View>
            ))}
          </GlassCard>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  profileCard: {
    padding: 20,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    position: 'relative' as const,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: 'rgba(48, 209, 88, 0.2)',
  },
  avatarBadge: {
    position: 'absolute' as const,
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 2,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
  },
  editIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nameInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600' as const,
    borderBottomWidth: 2,
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  rankEmoji: {
    fontSize: 16,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  xpSection: {
    marginTop: 16,
  },
  xpBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: 6,
    borderRadius: 3,
  },
  xpLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  xpBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  xpToNext: {
    fontSize: 11,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  miniStat: {
    flex: 1,
    minWidth: '45%' as unknown as number,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  miniStatValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
  },
  miniStatLabel: {
    fontSize: 11,
    fontWeight: '400' as const,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
  },
  locationCard: {
    padding: 14,
    marginBottom: 10,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  locationDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  locationValue: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  careAdviceCard: {
    padding: 14,
    marginBottom: 8,
  },
  careAdviceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  careAdviceIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  careAdviceContent: {
    flex: 1,
  },
  careAdviceTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  careAdviceMessage: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  healthCard: {
    padding: 6,
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  healthRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  healthPlantImage: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  healthInfo: {
    flex: 1,
  },
  healthName: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  healthMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  streakMini: {
    fontSize: 11,
  },
  trendBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
