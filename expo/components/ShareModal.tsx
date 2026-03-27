import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Animated,
  Pressable,
} from 'react-native';
import { X, Share2, Send } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSettings } from '@/providers/SettingsProvider';

interface ShareModalProps {
  visible: boolean;
  plantName: string;
  streak: number;
  onClose: () => void;
  onShare: (text: string) => void;
}

export default function ShareModal({ visible, plantName, streak, onClose, onShare }: ShareModalProps) {
  const { colors } = useSettings();
  const defaultText = `Just watered my ${plantName}! 🌿 ${streak}-day streak and counting!`;
  const [text, setText] = useState(defaultText);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setText(`Just watered my ${plantName}! 🌿 ${streak}-day streak and counting!`);
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
  }, [visible, plantName, streak]);

  const handleShare = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onShare(text);
  }, [text, onShare]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.container}>
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <Pressable style={styles.overlayPress} onPress={onClose} />
        </Animated.View>
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }], backgroundColor: colors.cardSolid }]}>
          <View style={[styles.handle, { backgroundColor: colors.handleColor }]} />
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Share2 size={18} color={colors.primary} strokeWidth={1.8} />
              <Text style={[styles.title, { color: colors.text }]}>Share Your Win!</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <X size={22} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={280}
            placeholderTextColor={colors.textTertiary}
          />
          <Text style={[styles.charCount, { color: colors.textTertiary }]}>{text.length}/280</Text>
          <TouchableOpacity style={[styles.shareButton, { backgroundColor: colors.primary }]} onPress={handleShare} activeOpacity={0.85}>
            <Send size={16} color="#fff" strokeWidth={2} />
            <Text style={styles.shareText}>Post to Community</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.skipButton}>
            <Text style={[styles.skipText, { color: colors.textTertiary }]}>Skip</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
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
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
  },
  input: {
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  charCount: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 6,
    marginBottom: 20,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  shareText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  skipButton: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 14,
  },
});
