import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Leaf, Sprout, Droplets, Users, ArrowRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signInAnonymously, isAuthenticating } = useAuth();
  const logoScale = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.sequence([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [logoScale, contentOpacity]);

  const handleGetStarted = useCallback(async () => {
    try {
      await signInAnonymously();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong';
      Alert.alert('Sign In Failed', msg);
    }
  }, [signInAnonymously]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={[styles.topSection, { paddingTop: insets.top + 60 }]}>
        <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}>
          <View style={styles.logoCircle}>
            <Leaf size={40} color="#fff" strokeWidth={1.8} />
          </View>
        </Animated.View>
        <Animated.View style={[styles.titleBlock, { opacity: contentOpacity }]}>
          <Text style={styles.appName}>Plantual</Text>
          <Text style={styles.tagline}>Your personal plant companion</Text>
        </Animated.View>
      </View>

      <Animated.View
        style={[
          styles.bottomSection,
          { paddingBottom: insets.bottom + 32, opacity: contentOpacity },
        ]}
      >
        <View style={styles.features}>
          <View style={styles.featureRow}>
            <View style={styles.featureIconWrap}>
              <Sprout size={18} color={Colors.primary} strokeWidth={2} />
            </View>
            <Text style={styles.featureText}>Identify plants with AI</Text>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.featureIconWrap}>
              <Droplets size={18} color={Colors.primary} strokeWidth={2} />
            </View>
            <Text style={styles.featureText}>Track watering & care streaks</Text>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.featureIconWrap}>
              <Users size={18} color={Colors.primary} strokeWidth={2} />
            </View>
            <Text style={styles.featureText}>Join the plant community</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={handleGetStarted}
          disabled={isAuthenticating}
          activeOpacity={0.8}
          testID="get-started-button"
        >
          {isAuthenticating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.getStartedText}>Get Started</Text>
              <ArrowRight size={20} color="#fff" strokeWidth={2.2} />
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.privacyText}>
          No account needed. Your data stays private and anonymous.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  titleBlock: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 17,
    fontWeight: '400' as const,
    color: Colors.textSecondary,
    letterSpacing: -0.2,
  },
  bottomSection: {
    paddingHorizontal: 24,
  },
  features: {
    marginBottom: 32,
    gap: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  featureIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 16,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  getStartedText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
    letterSpacing: -0.2,
  },
  privacyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});
