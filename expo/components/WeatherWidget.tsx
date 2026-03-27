import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Platform, Animated } from 'react-native';
import { CloudSun, Thermometer, Droplets, Wind, AlertTriangle } from 'lucide-react-native';
import { useSettings } from '@/providers/SettingsProvider';
import GlassCard from '@/components/GlassCard';

interface WeatherData {
  tempC: number;
  humidity: number;
  description: string;
  city: string;
  windSpeedKmh: number;
  forecast: { day: string; highC: number; lowC: number; condition: string }[];
}

interface CareHint {
  message: string;
  type: 'warning' | 'info' | 'tip';
}

function cToF(c: number): number {
  return Math.round(c * 9 / 5 + 32);
}

function generateCareHints(weather: WeatherData): CareHint[] {
  const hints: CareHint[] = [];
  const avgHighC = weather.forecast.reduce((s, f) => s + f.highC, 0) / Math.max(weather.forecast.length, 1);

  if (avgHighC > 30) {
    hints.push({ message: 'Hot days ahead — water your plants more frequently and move sensitive ones away from direct sun.', type: 'warning' });
  } else if (avgHighC > 24) {
    hints.push({ message: 'Warm week coming up. Check soil moisture daily and mist humidity-loving plants.', type: 'tip' });
  }

  if (weather.humidity < 30) {
    hints.push({ message: 'Low humidity detected. Consider grouping plants together or using a pebble tray.', type: 'info' });
  } else if (weather.humidity > 70) {
    hints.push({ message: 'High humidity — reduce watering for succulents and watch for fungal issues.', type: 'info' });
  }

  if (weather.tempC < 10) {
    hints.push({ message: 'Cold snap! Move tropical plants away from windows and reduce watering.', type: 'warning' });
  }

  if (weather.windSpeedKmh > 24) {
    hints.push({ message: 'Windy conditions. Secure outdoor plants and check for drying soil.', type: 'tip' });
  }

  if (hints.length === 0) {
    hints.push({ message: 'Perfect plant weather! Keep up your regular watering schedule.', type: 'tip' });
  }

  return hints;
}

function getFallbackWeather(): WeatherData {
  return {
    tempC: 22,
    humidity: 55,
    description: 'Partly Cloudy',
    city: 'Your Area',
    windSpeedKmh: 13,
    forecast: [
      { day: 'Mon', highC: 26, lowC: 17, condition: 'sunny' },
      { day: 'Tue', highC: 28, lowC: 18, condition: 'partly_cloudy' },
      { day: 'Wed', highC: 29, lowC: 20, condition: 'sunny' },
      { day: 'Thu', highC: 27, lowC: 18, condition: 'cloudy' },
      { day: 'Fri', highC: 24, lowC: 16, condition: 'rain' },
    ],
  };
}

function getConditionEmoji(condition: string): string {
  switch (condition) {
    case 'sunny': return '☀️';
    case 'partly_cloudy': return '⛅';
    case 'cloudy': return '☁️';
    case 'rain': return '🌧️';
    case 'storm': return '⛈️';
    default: return '🌤️';
  }
}

export default function WeatherWidget() {
  const { colors, useCelsius } = useSettings();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    try {
      if (Platform.OS === 'web') {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              await fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
            },
            () => {
              console.log('Geolocation denied, using fallback weather');
              setWeather(getFallbackWeather());
              setLoading(false);
            },
            { timeout: 5000 }
          );
        } else {
          setWeather(getFallbackWeather());
          setLoading(false);
        }
      } else {
        const Location = await import('expo-location').catch(() => null);
        if (Location) {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
            await fetchWeatherByCoords(loc.coords.latitude, loc.coords.longitude);
          } else {
            console.log('Location permission denied, using fallback');
            setWeather(getFallbackWeather());
            setLoading(false);
          }
        } else {
          setWeather(getFallbackWeather());
          setLoading(false);
        }
      }
    } catch (e) {
      console.log('Weather fetch error:', e);
      setWeather(getFallbackWeather());
      setLoading(false);
    }
  };

  const fetchWeatherByCoords = async (lat: number, lon: number) => {
    try {
      let cityName = 'Your Area';
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`);
        const geoData = await geoRes.json();
        cityName = geoData.address?.city || geoData.address?.town || geoData.address?.village || 'Your Area';
      } catch {
        console.log('Reverse geocoding failed');
      }

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto&forecast_days=5`
      );
      const data = await response.json();

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const forecast = (data.daily?.time || []).map((date: string, i: number) => {
        const d = new Date(date + 'T00:00:00');
        const code = data.daily?.weather_code?.[i] ?? 0;
        let condition = 'sunny';
        if (code >= 61) condition = 'rain';
        else if (code >= 45) condition = 'cloudy';
        else if (code >= 2) condition = 'partly_cloudy';
        return {
          day: dayNames[d.getDay()],
          highC: Math.round(data.daily?.temperature_2m_max?.[i] ?? 25),
          lowC: Math.round(data.daily?.temperature_2m_min?.[i] ?? 15),
          condition,
        };
      });

      const weatherCode = data.current?.weather_code ?? 0;
      let desc = 'Clear';
      if (weatherCode >= 61) desc = 'Rainy';
      else if (weatherCode >= 45) desc = 'Cloudy';
      else if (weatherCode >= 2) desc = 'Partly Cloudy';

      setWeather({
        tempC: Math.round(data.current?.temperature_2m ?? 22),
        humidity: Math.round(data.current?.relative_humidity_2m ?? 55),
        description: desc,
        city: cityName,
        windSpeedKmh: Math.round(data.current?.wind_speed_10m ?? 8),
        forecast,
      });
    } catch (e) {
      console.log('API weather error:', e);
      setWeather(getFallbackWeather());
    } finally {
      setLoading(false);
    }
  };

  const displayTemp = (c: number) => useCelsius ? c : cToF(c);
  const tempUnit = useCelsius ? '°C' : '°F';
  const windDisplay = useCelsius
    ? `${weather?.windSpeedKmh ?? 0} km/h`
    : `${Math.round((weather?.windSpeedKmh ?? 0) * 0.621)} mph`;

  if (loading) {
    const opacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
    return (
      <GlassCard style={styles.container}>
        <Animated.View style={[styles.loadingBar, { opacity, backgroundColor: colors.backgroundWarm }]} />
        <Animated.View style={[styles.loadingBar, { opacity, width: '60%', backgroundColor: colors.backgroundWarm }]} />
      </GlassCard>
    );
  }

  if (!weather) return null;

  const hints = generateCareHints(weather);

  return (
    <View>
      <GlassCard style={styles.container}>
        <View style={styles.topRow}>
          <View style={styles.tempSection}>
            <Text style={[styles.temp, { color: colors.text }]}>{displayTemp(weather.tempC)}{tempUnit}</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{weather.description}</Text>
            <Text style={[styles.city, { color: colors.textTertiary }]}>{weather.city}</Text>
          </View>
          <View style={styles.detailsColumn}>
            <View style={styles.detailRow}>
              <Droplets size={13} color={colors.accent} strokeWidth={1.6} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>{weather.humidity}%</Text>
            </View>
            <View style={styles.detailRow}>
              <Wind size={13} color={colors.textSecondary} strokeWidth={1.6} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>{windDisplay}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.forecastRow, { borderTopColor: colors.divider }]}>
          {weather.forecast.map((f, i) => (
            <View key={i} style={styles.forecastDay}>
              <Text style={[styles.forecastDayText, { color: colors.textSecondary }]}>{f.day}</Text>
              <Text style={styles.forecastEmoji}>{getConditionEmoji(f.condition)}</Text>
              <Text style={[styles.forecastHigh, { color: colors.text }]}>{displayTemp(f.highC)}°</Text>
              <Text style={[styles.forecastLow, { color: colors.textTertiary }]}>{displayTemp(f.lowC)}°</Text>
            </View>
          ))}
        </View>
      </GlassCard>

      {hints.map((hint, i) => (
        <GlassCard key={i} style={styles.hintCard}>
          <View style={styles.hintRow}>
            <View style={[
              styles.hintIconBg,
              hint.type === 'warning' && { backgroundColor: 'rgba(255, 149, 0, 0.1)' },
              hint.type === 'info' && { backgroundColor: 'rgba(0, 122, 255, 0.08)' },
              hint.type === 'tip' && { backgroundColor: 'rgba(48, 209, 88, 0.1)' },
            ]}>
              {hint.type === 'warning' ? (
                <AlertTriangle size={14} color={colors.warning} strokeWidth={1.8} />
              ) : hint.type === 'info' ? (
                <CloudSun size={14} color={colors.accent} strokeWidth={1.8} />
              ) : (
                <Thermometer size={14} color={colors.primary} strokeWidth={1.8} />
              )}
            </View>
            <Text style={[styles.hintText, { color: colors.text }]}>{hint.message}</Text>
          </View>
        </GlassCard>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 10,
  },
  loadingBar: {
    height: 14,
    borderRadius: 7,
    marginBottom: 10,
    width: '80%',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tempSection: {},
  temp: {
    fontSize: 36,
    fontWeight: '700' as const,
    letterSpacing: -1,
  },
  description: {
    fontSize: 14,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  city: {
    fontSize: 12,
    marginTop: 2,
  },
  detailsColumn: {
    alignItems: 'flex-end',
    gap: 6,
    marginTop: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailText: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  forecastRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
  },
  forecastDay: {
    alignItems: 'center',
    flex: 1,
  },
  forecastDayText: {
    fontSize: 11,
    fontWeight: '500' as const,
    marginBottom: 4,
  },
  forecastEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  forecastHigh: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  forecastLow: {
    fontSize: 11,
  },
  hintCard: {
    padding: 14,
    marginBottom: 10,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  hintIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 19,
  },
});
