import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { X, Droplets, Check, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSettings } from '@/providers/SettingsProvider';
import { Plant } from '@/types/plant';
import HealthDots from './HealthDots';

interface WaterModalProps {
  visible: boolean;
  plant: Plant | null;
  onClose: () => void;
  onConfirm: (health: number, note: string) => void;
}

export default function WaterModal({ visible, plant, onClose, onConfirm }: WaterModalProps) {
  const { colors } = useSettings();
  const [health, setHealth] = useState<number>(4);
  const [note, setNote] = useState<string>('');
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const streakAnim = useRef(new Animated.Value(0)).current;
  const [showSuccess, setShowSuccess] = useState(false);

  const confettiAnims = useRef(
    Array.from({ length: 12 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      setHealth(plant?.health ?? 4);
      setNote('');
      setShowSuccess(false);
      successAnim.setValue(0);
      streakAnim.setValue(0);
      confettiAnims.forEach(c => {
        c.x.setValue(0);
        c.y.setValue(0);
        c.opacity.setValue(0);
        c.scale.setValue(0);
      });
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const triggerConfetti = useCallback(() => {
    const animations = confettiAnims.map((c, i) => {
      const angle = (i / confettiAnims.length) * Math.PI * 2;
      const dist = 60 + Math.random() * 40;
      return Animated.parallel([
        Animated.timing(c.opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(c.scale, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(c.x, {
          toValue: Math.cos(angle) * dist,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(c.y, {
            toValue: Math.sin(angle) * dist - 30,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(c.y, {
            toValue: Math.sin(angle) * dist + 20,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(400),
          Animated.timing(c.opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]),
      ]);
    });
    Animated.parallel(animations).start();
  }, [confettiAnims]);

  const handleConfirm = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowSuccess(true);
    Animated.parallel([
      Animated.spring(successAnim, { toValue: 1, useNativeDriver: true, damping: 8 }),
      Animated.sequence([
        Animated.delay(300),
        Animated.spring(streakAnim, { toValue: 1, useNativeDriver: true, damping: 12 }),
      ]),
    ]).start();
    triggerConfetti();
    setTimeout(() => {
      onConfirm(health, note);
    }, 1200);
  }, [health, note, onConfirm, successAnim, streakAnim, triggerConfetti]);

  if (!plant) return null;

  const confettiEmojis = ['🌿', '💧', '🌱', '✨', '🔥', '🌸', '💚', '🪴', '🌻', '⭐', '🎉', '🌈'];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <Pressable style={styles.overlayPress} onPress={onClose} />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: slideAnim }], backgroundColor: colors.cardSolid },
          ]}
        >
          {showSuccess ? (
            <View style={styles.successWrapper}>
              <Animated.View
                style={[
                  styles.successContainer,
                  {
                    transform: [{ scale: successAnim }],
                    opacity: successAnim,
                  },
                ]}
              >
                <View style={[styles.successCircle, { backgroundColor: colors.success }]}>
                  <Check size={40} color="#fff" strokeWidth={3} />
                </View>

                {confettiAnims.map((c, i) => (
                  <Animated.Text
                    key={i}
                    style={[
                      styles.confettiPiece,
                      {
                        opacity: c.opacity,
                        transform: [
                          { translateX: c.x },
                          { translateY: c.y },
                          { scale: c.scale },
                        ],
                      },
                    ]}
                  >
                    {confettiEmojis[i % confettiEmojis.length]}
                  </Animated.Text>
                ))}
              </Animated.View>

              <Animated.View
                style={{
                  opacity: streakAnim,
                  transform: [{ scale: streakAnim }],
                }}
              >
                <Text style={[styles.successText, { color: colors.text }]}>Watered!</Text>
                <Text style={[styles.streakToast, { color: colors.accent }]}>🔥 Streak: {(plant.streak ?? 0) + 1} days!</Text>
                <View style={styles.xpGainBadge}>
                  <Zap size={14} color={colors.xpPurple} />
                  <Text style={[styles.xpGainText, { color: colors.xpPurple }]}>+10 XP</Text>
                </View>
              </Animated.View>
            </View>
          ) : (
            <>
              <View style={[styles.handle, { backgroundColor: colors.handleColor }]} />
              <View style={styles.sheetHeader}>
                <View style={styles.sheetTitleRow}>
                  <Droplets size={20} color={colors.waterBlue} strokeWidth={1.8} />
                  <Text style={[styles.sheetTitle, { color: colors.text }]}>Water {plant.name}</Text>
                </View>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <X size={22} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>How's {plant.name} looking?</Text>
              <View style={styles.healthRow}>
                <HealthDots health={health} interactive onSelect={setHealth} size={22} />
                <Text style={[styles.healthLabel, { color: colors.primary }]}>
                  {health <= 2 ? 'Needs care' : health <= 3 ? 'Okay' : health <= 4 ? 'Healthy' : 'Thriving!'}
                </Text>
              </View>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Add a note (optional)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
                placeholder="e.g. Soil was dry, new growth spotted..."
                placeholderTextColor={colors.textTertiary}
                value={note}
                onChangeText={setNote}
                multiline
                maxLength={200}
              />
              <TouchableOpacity style={[styles.confirmButton, { backgroundColor: colors.waterBlue }]} onPress={handleConfirm} activeOpacity={0.85}>
                <Droplets size={18} color="#fff" strokeWidth={2} />
                <Text style={styles.confirmText}>Confirm Watering</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  overlayPress: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    minHeight: 360,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '400' as const,
    marginBottom: 10,
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  healthLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  input: {
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 24,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  successWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confettiPiece: {
    position: 'absolute',
    fontSize: 18,
  },
  successText: {
    fontSize: 24,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  streakToast: {
    fontSize: 16,
    fontWeight: '500' as const,
    textAlign: 'center',
    marginTop: 6,
  },
  xpGainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(175, 82, 222, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
    marginTop: 10,
  },
  xpGainText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
