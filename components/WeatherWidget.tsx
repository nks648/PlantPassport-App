import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Platform, Animated } from 'react-native';
import { CloudSun, Thermometer, Droplets, Wind, AlertTriangle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import GlassCard from '@/components/GlassCard';

interface WeatherData {
  temp: number;
  humidity: number;
  description: string;
  city: string;
  windSpeed: number;
  forecast: { day: string; high: number; low: number; condition: string }[];
}

interface CareHint {
  message: string;
  type: 'warning' | 'info' | 'tip';
}

function generateCareHints(weather: WeatherData): CareHint[] {
  const hints: CareHint[] = [];
  const avgHighNext = weather.forecast.reduce((s, f) => s + f.high, 0) / Math.max(weather.forecast.length, 1);

  if (avgHighNext > 85) {
    hints.push({ message: 'Hot days ahead — water your plants more frequently and move sensitive ones away from direct sun.', type: 'warning' });
  } else if (avgHighNext > 75) {
    hints.push({ message: 'Warm week coming up. Check soil moisture daily and mist humidity-loving plants.', type: 'tip' });
  }

  if (weather.humidity < 30) {
    hints.push({ message: 'Low humidity detected. Consider grouping plants together or using a pebble tray.', type: 'info' });
  } else if (weather.humidity > 70) {
    hints.push({ message: 'High humidity — reduce watering for succulents and watch for fungal issues.', type: 'info' });
  }

  if (weather.temp < 50) {
    hints.push({ message: 'Cold snap! Move tropical plants away from windows and reduce watering.', type: 'warning' });
  }

  if (weather.windSpeed > 15) {
    hints.push({ message: 'Windy conditions. Secure outdoor plants and check for drying soil.', type: 'tip' });
  }

  if (hints.length === 0) {
    hints.push({ message: 'Perfect plant weather! Keep up your regular watering schedule.', type: 'tip' });
  }

  return hints;
}

function getFallbackWeather(): WeatherData {
  return {
    temp: 72,
    humidity: 55,
    description: 'Partly Cloudy',
    city: 'Your Area',
    windSpeed: 8,
    forecast: [
      { day: 'Mon', high: 78, low: 62, condition: 'sunny' },
      { day: 'Tue', high: 82, low: 65, condition: 'partly_cloudy' },
      { day: 'Wed', high: 85, low: 68, condition: 'sunny' },
      { day: 'Thu', high: 80, low: 64, condition: 'cloudy' },
      { day: 'Fri', high: 76, low: 60, condition: 'rain' },
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
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=5`
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
          high: Math.round(data.daily?.temperature_2m_max?.[i] ?? 72),
          low: Math.round(data.daily?.temperature_2m_min?.[i] ?? 58),
          condition,
        };
      });

      const weatherCode = data.current?.weather_code ?? 0;
      let desc = 'Clear';
      if (weatherCode >= 61) desc = 'Rainy';
      else if (weatherCode >= 45) desc = 'Cloudy';
      else if (weatherCode >= 2) desc = 'Partly Cloudy';

      let cityName = 'Your Area';
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`);
        const geoData = await geoRes.json();
        cityName = geoData.address?.city || geoData.address?.town || geoData.address?.village || 'Your Area';
      } catch {
        console.log('Reverse geocoding failed');
      }

      setWeather({
        temp: Math.round(data.current?.temperature_2m ?? 72),
        humidity: Math.round(data.current?.relative_humidity_2m ?? 55),
        description: desc,
        city: cityName,
        windSpeed: Math.round(data.current?.wind_speed_10m ?? 8),
        forecast,
      });
    } catch (e) {
      console.log('API weather error:', e);
      setWeather(getFallbackWeather());
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    const opacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
    return (
      <GlassCard style={styles.container}>
        <Animated.View style={[styles.loadingBar, { opacity }]} />
        <Animated.View style={[styles.loadingBar, { opacity, width: '60%' }]} />
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
            <Text style={styles.temp}>{weather.temp}°F</Text>
            <Text style={styles.description}>{weather.description}</Text>
            <Text style={styles.city}>{weather.city}</Text>
          </View>
          <View style={styles.detailsColumn}>
            <View style={styles.detailRow}>
              <Droplets size={13} color={Colors.accent} strokeWidth={1.6} />
              <Text style={styles.detailText}>{weather.humidity}%</Text>
            </View>
            <View style={styles.detailRow}>
              <Wind size={13} color={Colors.textSecondary} strokeWidth={1.6} />
              <Text style={styles.detailText}>{weather.windSpeed} mph</Text>
            </View>
          </View>
        </View>

        <View style={styles.forecastRow}>
          {weather.forecast.map((f, i) => (
            <View key={i} style={styles.forecastDay}>
              <Text style={styles.forecastDayText}>{f.day}</Text>
              <Text style={styles.forecastEmoji}>{getConditionEmoji(f.condition)}</Text>
              <Text style={styles.forecastHigh}>{f.high}°</Text>
              <Text style={styles.forecastLow}>{f.low}°</Text>
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
                <AlertTriangle size={14} color={Colors.warning} strokeWidth={1.8} />
              ) : hint.type === 'info' ? (
                <CloudSun size={14} color={Colors.accent} strokeWidth={1.8} />
              ) : (
                <Thermometer size={14} color={Colors.primary} strokeWidth={1.8} />
              )}
            </View>
            <Text style={styles.hintText}>{hint.message}</Text>
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
    backgroundColor: Colors.backgroundWarm,
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
    color: Colors.text,
    letterSpacing: -1,
  },
  description: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  city: {
    fontSize: 12,
    color: Colors.textTertiary,
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
    color: Colors.textSecondary,
  },
  forecastRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.divider,
    paddingTop: 12,
  },
  forecastDay: {
    alignItems: 'center',
    flex: 1,
  },
  forecastDayText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  forecastEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  forecastHigh: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  forecastLow: {
    fontSize: 11,
    color: Colors.textTertiary,
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
    color: Colors.text,
    lineHeight: 19,
  },
});
