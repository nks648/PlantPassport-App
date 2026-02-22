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
import { Leaf, Chrome, Apple } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/providers/AuthProvider';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signInWithGoogle, signInWithApple, isAuthenticating } = useAuth();
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

  const handleGoogle = useCallback(async () => {
    try {
      await signInWithGoogle();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong';
      Alert.alert('Sign In Failed', msg);
    }
  }, [signInWithGoogle]);

  const handleApple = useCallback(async () => {
    try {
      await signInWithApple();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong';
      Alert.alert('Sign In Failed', msg);
    }
  }, [signInWithApple]);

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
        <View style={styles.featureRow}>
          <View style={styles.featureDot} />
          <Text style={styles.featureText}>Identify plants with AI</Text>
        </View>
        <View style={styles.featureRow}>
          <View style={styles.featureDot} />
          <Text style={styles.featureText}>Track watering & care streaks</Text>
        </View>
        <View style={styles.featureRow}>
          <View style={styles.featureDot} />
          <Text style={styles.featureText}>Join the plant community</Text>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogle}
            disabled={isAuthenticating}
            activeOpacity={0.8}
            testID="google-sign-in"
          >
            {isAuthenticating ? (
              <ActivityIndicator size="small" color={Colors.text} />
            ) : (
              <>
                <Chrome size={20} color={Colors.text} strokeWidth={1.6} />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.appleButton}
            onPress={handleApple}
            disabled={isAuthenticating}
            activeOpacity={0.8}
            testID="apple-sign-in"
          >
            {isAuthenticating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Apple size={20} color="#fff" strokeWidth={1.6} />
                <Text style={styles.appleButtonText}>Continue with Apple</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.termsText}>
          By continuing, you agree to our Terms of Service and Privacy Policy
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
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginRight: 12,
  },
  featureText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  buttonGroup: {
    marginTop: 28,
    gap: 12,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    height: 54,
    borderRadius: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(60, 60, 67, 0.12)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1E',
    height: 54,
    borderRadius: 14,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  appleButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  termsText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});
