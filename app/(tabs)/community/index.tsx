import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Animated,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Send, X, Trophy, Flame, Leaf, Users } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { usePlants } from '@/providers/PlantProvider';
import { useSettings } from '@/providers/SettingsProvider';
import CommunityPostCard from '@/components/CommunityPostCard';
import GlassCard from '@/components/GlassCard';
import { MOCK_LEADERBOARD } from '@/mocks/plants';

type ActiveTab = 'community' | 'ranks';
type TimeFilter = 'all-time' | 'weekly';

export default function CommunityScreen() {
  const { communityPosts, toggleLike, addCommunityPost, plants } = usePlants();
  const { t } = useSettings();
  const [activeTab, setActiveTab] = useState<ActiveTab>('community');
  const [composeVisible, setComposeVisible] = useState(false);
  const [composeText, setComposeText] = useState('');
  const [filter, setFilter] = useState<TimeFilter>('all-time');

  const handleTabChange = useCallback((tab: ActiveTab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  }, []);

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

  const handleFilterChange = useCallback((f: TimeFilter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilter(f);
  }, []);

  const sorted = [...MOCK_LEADERBOARD].sort((a, b) => {
    const aVal = filter === 'weekly' ? (a.weeklyStreak ?? 0) : a.streak;
    const bVal = filter === 'weekly' ? (b.weeklyStreak ?? 0) : b.streak;
    return bVal - aVal;
  }).map((e, i) => ({ ...e, rank: i + 1 }));

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);
  const currentUser = sorted.find(e => e.isCurrentUser);
  const medalColors = [Colors.gold, Colors.silver, Colors.bronze];

  const getStreakValue = (entry: typeof sorted[0]) =>
    filter === 'weekly' ? (entry.weeklyStreak ?? 0) : entry.streak;

  return (
    <View style={styles.container}>
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'community' && styles.segmentBtnActive]}
          onPress={() => handleTabChange('community')}
          activeOpacity={0.8}
        >
          <Users size={16} color={activeTab === 'community' ? '#fff' : Colors.textSecondary} strokeWidth={1.8} />
          <Text style={[styles.segmentText, activeTab === 'community' && styles.segmentTextActive]}>
            {t('community')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'ranks' && styles.segmentBtnActive]}
          onPress={() => handleTabChange('ranks')}
          activeOpacity={0.8}
        >
          <Trophy size={16} color={activeTab === 'ranks' ? '#fff' : Colors.textSecondary} strokeWidth={1.8} />
          <Text style={[styles.segmentText, activeTab === 'ranks' && styles.segmentTextActive]}>
            {t('ranks')}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'community' ? (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.shareButton} onPress={handleOpenCompose} activeOpacity={0.8}>
            <Text style={styles.shareButtonText}>{t('shareYourWin')}</Text>
          </TouchableOpacity>

          {communityPosts.map((post) => (
            <CommunityPostCard key={post.id} post={post} onLike={handleLike} />
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterBtn, filter === 'all-time' && styles.filterBtnActive]}
              onPress={() => handleFilterChange('all-time')}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, filter === 'all-time' && styles.filterTextActive]}>
                {t('allTime')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterBtn, filter === 'weekly' && styles.filterBtnActive]}
              onPress={() => handleFilterChange('weekly')}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, filter === 'weekly' && styles.filterTextActive]}>
                {t('thisWeek')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.podium}>
            {[1, 0, 2].map((idx) => {
              const entry = top3[idx];
              if (!entry) return null;
              const isFirst = idx === 0;
              return (
                <View key={entry.id} style={[styles.podiumItem, isFirst && styles.podiumFirst]}>
                  <View style={[styles.medalCircle, { borderColor: medalColors[idx] }]}>
                    <Image source={{ uri: entry.avatar }} style={styles.podiumAvatar} />
                    <View style={[styles.rankBadge, { backgroundColor: medalColors[idx] }]}>
                      <Text style={styles.rankBadgeText}>{entry.rank}</Text>
                    </View>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>{entry.userName}</Text>
                  <View style={styles.podiumStreakRow}>
                    <Flame size={12} color={Colors.streak} strokeWidth={1.8} />
                    <Text style={styles.podiumStreak}>{getStreakValue(entry)}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {rest.map((entry) => (
            <GlassCard
              key={entry.id}
              style={[styles.listItem, entry.isCurrentUser && styles.listItemHighlight]}
            >
              <Text style={[styles.rank, entry.isCurrentUser && styles.rankHighlight]}>
                {entry.rank}
              </Text>
              <Image source={{ uri: entry.avatar }} style={styles.listAvatar} />
              <View style={styles.listInfo}>
                <Text style={[styles.listName, entry.isCurrentUser && styles.listNameHighlight]}>
                  {entry.userName}
                  {entry.isCurrentUser ? ' (You)' : ''}
                </Text>
                <View style={styles.listMeta}>
                  <Leaf size={11} color={Colors.textSecondary} strokeWidth={1.8} />
                  <Text style={styles.listMetaText}>{entry.totalPlants} plants</Text>
                </View>
              </View>
              <View style={styles.listStreak}>
                <Flame size={14} color={Colors.streak} strokeWidth={1.8} />
                <Text style={styles.listStreakText}>{getStreakValue(entry)}</Text>
              </View>
            </GlassCard>
          ))}

          {currentUser && currentUser.rank > 3 && (
            <View style={styles.pinnedSection}>
              <View style={styles.pinnedDivider}>
                <View style={styles.pinnedLine} />
                <Text style={styles.pinnedLabel}>Your Rank</Text>
                <View style={styles.pinnedLine} />
              </View>
              <GlassCard style={[styles.listItem, styles.listItemHighlight]}>
                <Text style={[styles.rank, styles.rankHighlight]}>{currentUser.rank}</Text>
                <Image source={{ uri: currentUser.avatar }} style={styles.listAvatar} />
                <View style={styles.listInfo}>
                  <Text style={[styles.listName, styles.listNameHighlight]}>
                    {currentUser.userName} (You)
                  </Text>
                  <View style={styles.listMeta}>
                    <Leaf size={11} color={Colors.textSecondary} strokeWidth={1.8} />
                    <Text style={styles.listMetaText}>{currentUser.totalPlants} plants</Text>
                  </View>
                </View>
                <View style={styles.listStreak}>
                  <Flame size={14} color={Colors.streak} strokeWidth={1.8} />
                  <Text style={styles.listStreakText}>{getStreakValue(currentUser)}</Text>
                </View>
              </GlassCard>
            </View>
          )}
        </ScrollView>
      )}

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
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: 'rgba(60, 60, 67, 0.06)',
    borderRadius: 12,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: Colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  segmentTextActive: {
    color: '#fff',
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
  filterRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 16,
    backgroundColor: 'rgba(60, 60, 67, 0.05)',
    borderRadius: 10,
    padding: 2,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterBtnActive: {
    backgroundColor: Colors.cardSolid,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.text,
    fontWeight: '600' as const,
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 28,
    paddingHorizontal: 10,
  },
  podiumItem: {
    alignItems: 'center',
    flex: 1,
  },
  podiumFirst: {
    marginBottom: 16,
  },
  medalCircle: {
    borderWidth: 3,
    borderRadius: 40,
    padding: 3,
    position: 'relative',
  },
  podiumAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.divider,
  },
  rankBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    color: '#1C1C1E',
    fontSize: 11,
    fontWeight: '700' as const,
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.text,
    marginTop: 8,
    textAlign: 'center',
  },
  podiumStreakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  podiumStreak: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 8,
  },
  listItemHighlight: {
    backgroundColor: 'rgba(48, 209, 88, 0.04)',
    borderColor: 'rgba(48, 209, 88, 0.15)',
    borderWidth: 1,
  },
  rank: {
    width: 28,
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  rankHighlight: {
    color: Colors.primary,
  },
  listAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 8,
    backgroundColor: Colors.divider,
  },
  listInfo: {
    flex: 1,
    marginLeft: 12,
  },
  listName: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  listNameHighlight: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  listMetaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  listStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.streakGlow,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  listStreakText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  pinnedSection: {
    marginTop: 8,
  },
  pinnedDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  pinnedLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.divider,
  },
  pinnedLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
});
