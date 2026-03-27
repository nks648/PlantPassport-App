import React, { useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Heart, MessageCircle } from 'lucide-react-native';
import { useSettings } from '@/providers/SettingsProvider';
import { CommunityPost } from '@/types/plant';
import GlassCard from './GlassCard';
import StreakBadge from './StreakBadge';

interface CommunityPostCardProps {
  post: CommunityPost;
  onLike: (id: string) => void;
}

export default React.memo(function CommunityPostCard({ post, onLike }: CommunityPostCardProps) {
  const { colors } = useSettings();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleLike = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.3, duration: 120, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    onLike(post.id);
  }, [post.id, onLike, scaleAnim]);

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <Image source={{ uri: post.avatar }} style={[styles.avatar, { backgroundColor: colors.divider }]} />
        <View style={styles.headerText}>
          <Text style={[styles.userName, { color: colors.text }]}>{post.userName}</Text>
          <Text style={[styles.time, { color: colors.textSecondary }]}>{post.timeAgo}</Text>
        </View>
        {post.streak && post.streak > 0 ? (
          <StreakBadge streak={post.streak} size="small" />
        ) : null}
      </View>
      <Text style={[styles.body, { color: colors.text }]}>{post.text}</Text>
      {post.plantName ? (
        <View style={[styles.plantTag, { backgroundColor: colors.primaryMuted }]}>
          <Text style={[styles.plantTagText, { color: colors.primary }]}>🌿 {post.plantName}</Text>
        </View>
      ) : null}
      <View style={[styles.actions, { borderTopColor: colors.divider }]}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.7}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Heart
              size={18}
              color={post.liked ? colors.error : colors.textTertiary}
              fill={post.liked ? colors.error : 'none'}
              strokeWidth={1.8}
            />
          </Animated.View>
          <Text style={[styles.actionText, { color: colors.textSecondary }, post.liked && { color: colors.error }]}>
            {post.likes}
          </Text>
        </TouchableOpacity>
        <View style={styles.actionBtn}>
          <MessageCircle size={18} color={colors.textTertiary} strokeWidth={1.8} />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>{post.comments}</Text>
        </View>
      </View>
    </GlassCard>
  );
});

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerText: {
    flex: 1,
    marginLeft: 10,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  time: {
    fontSize: 12,
    marginTop: 1,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 10,
  },
  plantTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 12,
  },
  plantTagText: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  actions: {
    flexDirection: 'row',
    gap: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionText: {
    fontSize: 13,
  },
});
