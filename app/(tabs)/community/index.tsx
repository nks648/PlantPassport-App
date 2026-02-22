import React, { useCallback, useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Animated, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Send, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { usePlants } from '@/providers/PlantProvider';
import CommunityPostCard from '@/components/CommunityPostCard';

export default function CommunityScreen() {
  const { communityPosts, toggleLike, addCommunityPost, plants } = usePlants();
  const [composeVisible, setComposeVisible] = useState(false);
  const [composeText, setComposeText] = useState('');

  const handleLike = useCallback((id: string) => {
    toggleLike(id);
  }, [toggleLike]);

  const handleOpenCompose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setComposeText('');
    setComposeVisible(true);
  }, []);

  const handlePost = useCallback(async () => {
    if (!composeText.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addCommunityPost(composeText.trim(), '', 0);
    setComposeVisible(false);
    setComposeText('');
  }, [composeText, addCommunityPost]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.shareButton} onPress={handleOpenCompose} activeOpacity={0.8}>
          <Text style={styles.shareButtonText}>Share Your Win 🌿</Text>
        </TouchableOpacity>

        <Text style={styles.subtitle}>See what other plant parents are up to</Text>
        {communityPosts.map((post) => (
          <CommunityPostCard key={post.id} post={post} onLike={handleLike} />
        ))}
      </ScrollView>

      <ComposeModal
        visible={composeVisible}
        text={composeText}
        onChangeText={setComposeText}
        onClose={() => setComposeVisible(false)}
        onPost={handlePost}
      />
    </View>
  );
}

function ComposeModal({
  visible,
  text,
  onChangeText,
  onClose,
  onPost,
}: {
  visible: boolean;
  text: string;
  onChangeText: (t: string) => void;
  onClose: () => void;
  onPost: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 400, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={composeStyles.keyboardView}
      >
        <Animated.View style={[composeStyles.overlay, { opacity: fadeAnim }]}>
          <Pressable style={composeStyles.overlayPress} onPress={onClose} />
        </Animated.View>
        <Animated.View style={[composeStyles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={composeStyles.handle} />
          <View style={composeStyles.header}>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <X size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
            <Text style={composeStyles.title}>New Post</Text>
            <TouchableOpacity
              onPress={onPost}
              disabled={!text.trim()}
              style={[composeStyles.postBtn, !text.trim() && composeStyles.postBtnDisabled]}
              activeOpacity={0.8}
            >
              <Text style={[composeStyles.postBtnText, !text.trim() && composeStyles.postBtnTextDisabled]}>Post</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={composeStyles.input}
            placeholder="Share your plant win with the community..."
            placeholderTextColor={Colors.textTertiary}
            value={text}
            onChangeText={onChangeText}
            multiline
            maxLength={280}
            autoFocus
          />
          <Text style={composeStyles.charCount}>{text.length}/280</Text>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const composeStyles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
  },
  overlayPress: {
    flex: 1,
  },
  sheet: {
    backgroundColor: Colors.cardSolid,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(60, 60, 67, 0.1)',
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
  title: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  postBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postBtnDisabled: {
    backgroundColor: 'rgba(60, 60, 67, 0.06)',
  },
  postBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  postBtnTextDisabled: {
    color: Colors.textTertiary,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: Colors.text,
    minHeight: 120,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  charCount: {
    fontSize: 11,
    color: Colors.textTertiary,
    textAlign: 'right',
    marginTop: 8,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  shareButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 20,
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
    }),
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 18,
  },
});
