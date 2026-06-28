import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { Plant, WaterLog, CommunityPost, ActivityItem, UserProfile, getRankForXP } from '@/types/plant';
import { MOCK_PLANTS, MOCK_WATER_LOGS, MOCK_ACTIVITIES, MOCK_COMMUNITY, DEFAULT_USER_PROFILE } from '@/mocks/plants';
import { useAuth } from '@/providers/AuthProvider';
import {
  cloudFetchPlants,
  cloudUpsertPlant,
  cloudDeletePlant,
  cloudFetchWaterLogs,
  cloudUpsertWaterLog,
  cloudFetchActivities,
  cloudUpsertActivity,
  cloudFetchCommunityPosts,
  cloudUpsertCommunityPost,
  cloudDeleteCommunityPost,
  cloudLikePost,
  cloudUnlikePost,
  cloudFetchProfile,
  cloudUpsertProfile,
  cloudPushAll,
  cloudHasData,
  cloudPullAll,
} from '@/lib/cloudData';
import { supabase } from '@/lib/supabase';

const STORAGE_VERSION = 'v4';
const SYNC_FLAG_KEY = `plant_parent_synced_v4`;

const STORAGE_KEYS = {
  plants: `plant_parent_plants_${STORAGE_VERSION}`,
  waterLogs: `plant_parent_water_logs_${STORAGE_VERSION}`,
  activities: `plant_parent_activities_${STORAGE_VERSION}`,
  communityPosts: `plant_parent_community_${STORAGE_VERSION}`,
  userProfile: `plant_parent_profile_${STORAGE_VERSION}`,
};

function isSupabaseReady(): boolean {
  return supabase !== null;
}

/** Merge two arrays by a key field — items from `incoming` win on conflict. */
function mergeArrays<T>(base: T[], incoming: T[], key: keyof T): T[] {
  const map = new Map<unknown, T>();
  for (const item of base) map.set(item[key], item);
  for (const item of incoming) map.set(item[key], item);
  return Array.from(map.values());
}

export const [PlantProvider, usePlants] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  const [plants, setPlants] = useState<Plant[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);

  const [isSyncing, setIsSyncing] = useState(false);
  const userIdRef = useRef<string | null>(null);

  // ── Load from AsyncStorage (instant, always runs) ──────────────────────────

  const plantsQuery = useQuery({
    queryKey: ['plants'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.plants);
        if (stored) return JSON.parse(stored) as Plant[];
        // Only seed mock data for anonymous users
        if (!isAuthenticated) {
          await AsyncStorage.setItem(STORAGE_KEYS.plants, JSON.stringify(MOCK_PLANTS));
          return MOCK_PLANTS;
        }
        return [];
      } catch (e) {
        console.log('[PlantProvider] Error loading plants:', e);
        return isAuthenticated ? [] : MOCK_PLANTS;
      }
    },
    staleTime: 0,
  });

  const logsQuery = useQuery({
    queryKey: ['waterLogs'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.waterLogs);
        if (stored) return JSON.parse(stored) as WaterLog[];
        if (!isAuthenticated) {
          await AsyncStorage.setItem(STORAGE_KEYS.waterLogs, JSON.stringify(MOCK_WATER_LOGS));
          return MOCK_WATER_LOGS;
        }
        return [];
      } catch (e) {
        console.log('[PlantProvider] Error loading water logs:', e);
        return isAuthenticated ? [] : MOCK_WATER_LOGS;
      }
    },
    staleTime: 0,
  });

  const activitiesQuery = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.activities);
        if (stored) return JSON.parse(stored) as ActivityItem[];
        if (!isAuthenticated) {
          await AsyncStorage.setItem(STORAGE_KEYS.activities, JSON.stringify(MOCK_ACTIVITIES));
          return MOCK_ACTIVITIES;
        }
        return [];
      } catch (e) {
        console.log('[PlantProvider] Error loading activities:', e);
        return isAuthenticated ? [] : MOCK_ACTIVITIES;
      }
    },
    staleTime: 0,
  });

  const communityQuery = useQuery({
    queryKey: ['community'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.communityPosts);
        if (stored) return JSON.parse(stored) as CommunityPost[];
        if (!isAuthenticated) {
          await AsyncStorage.setItem(STORAGE_KEYS.communityPosts, JSON.stringify(MOCK_COMMUNITY));
          return MOCK_COMMUNITY;
        }
        return [];
      } catch (e) {
        console.log('[PlantProvider] Error loading community:', e);
        return isAuthenticated ? [] : MOCK_COMMUNITY;
      }
    },
    staleTime: 0,
  });

  const profileQuery = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.userProfile);
        if (stored) return JSON.parse(stored) as UserProfile;
        if (!isAuthenticated) {
          await AsyncStorage.setItem(STORAGE_KEYS.userProfile, JSON.stringify(DEFAULT_USER_PROFILE));
          return DEFAULT_USER_PROFILE;
        }
        return DEFAULT_USER_PROFILE;
      } catch (e) {
        console.log('[PlantProvider] Error loading profile:', e);
        return DEFAULT_USER_PROFILE;
      }
    },
    staleTime: 0,
  });

  // Sync queries into state
  useEffect(() => { if (plantsQuery.data) setPlants(plantsQuery.data); }, [plantsQuery.data]);
  useEffect(() => { if (logsQuery.data) setWaterLogs(logsQuery.data); }, [logsQuery.data]);
  useEffect(() => { if (activitiesQuery.data) setActivities(activitiesQuery.data); }, [activitiesQuery.data]);
  useEffect(() => { if (communityQuery.data) setCommunityPosts(communityQuery.data); }, [communityQuery.data]);
  useEffect(() => { if (profileQuery.data) setUserProfile(profileQuery.data); }, [profileQuery.data]);

  // ── Cloud sync on auth change ─────────────────────────────────────────────

  useEffect(() => {
    if (!isAuthenticated || !user || !isSupabaseReady()) {
      userIdRef.current = null;
      return;
    }

    // Avoid re-syncing if the user ID hasn't changed
    if (userIdRef.current === user.id) return;
    userIdRef.current = user.id;

    const sync = async () => {
      setIsSyncing(true);
      try {
        const hasCloud = await cloudHasData(user.id);

        if (!hasCloud) {
          // First sign-in: upload all local data to cloud
          console.log('[PlantProvider] First sign-in detected — uploading local data to cloud');
          await cloudPushAll(
            user.id,
            user.email,
            plants,
            waterLogs,
            activities,
            userProfile,
          );
          await AsyncStorage.setItem(SYNC_FLAG_KEY, '1');
        } else {
          // Returning user: pull cloud data and merge (cloud wins for same-ID conflicts)
          console.log('[PlantProvider] Returning user — pulling cloud data');
          const cloud = await cloudPullAll(user.id);

          // Merge plants (cloud wins)
          const mergedPlants = mergeArrays(plants, cloud.plants, 'id');
          setPlants(mergedPlants);
          await AsyncStorage.setItem(STORAGE_KEYS.plants, JSON.stringify(mergedPlants));

          // Merge water logs (cloud wins for same ID)
          const mergedLogs = mergeArrays(waterLogs, cloud.waterLogs, 'id');
          setWaterLogs(mergedLogs);
          await AsyncStorage.setItem(STORAGE_KEYS.waterLogs, JSON.stringify(mergedLogs));

          // Merge activities (cloud wins)
          const mergedActivities = mergeArrays(activities, cloud.activities, 'id');
          setActivities(mergedActivities);
          await AsyncStorage.setItem(STORAGE_KEYS.activities, JSON.stringify(mergedActivities));

          // Community posts: use cloud data (it has real counts)
          if (cloud.communityPosts.length > 0) {
            setCommunityPosts(cloud.communityPosts);
            await AsyncStorage.setItem(STORAGE_KEYS.communityPosts, JSON.stringify(cloud.communityPosts));
          }

          // Profile: cloud wins if it has more XP
          if (cloud.profile && cloud.profile.xp >= userProfile.xp) {
            setUserProfile(cloud.profile);
            await AsyncStorage.setItem(STORAGE_KEYS.userProfile, JSON.stringify(cloud.profile));
          } else if (!cloud.profile) {
            // No cloud profile yet — upsert local one
            await cloudUpsertProfile(userProfile, user.id, user.email);
          }

          await AsyncStorage.setItem(SYNC_FLAG_KEY, '1');
        }

        // Sync community posts from cloud (always refresh on auth)
        try {
          const cloudPosts = await cloudFetchCommunityPosts();
          if (cloudPosts.length > 0) {
            setCommunityPosts(cloudPosts);
            await AsyncStorage.setItem(STORAGE_KEYS.communityPosts, JSON.stringify(cloudPosts));
          }
        } catch (e) {
          console.log('[PlantProvider] Community sync failed:', e);
        }
      } catch (e) {
        console.log('[PlantProvider] Cloud sync error:', e instanceof Error ? e.message : String(e));
      } finally {
        setIsSyncing(false);
      }
    };

    sync();
  }, [isAuthenticated, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Profile helpers ────────────────────────────────────────────────────────

  const persistProfile = useCallback(async (updated: UserProfile) => {
    await AsyncStorage.setItem(STORAGE_KEYS.userProfile, JSON.stringify(updated));
    if (isAuthenticated && user && isSupabaseReady()) {
      cloudUpsertProfile(updated, user.id, user.email).catch((e) =>
        console.log('[PlantProvider] Cloud profile sync failed:', e)
      );
    }
  }, [isAuthenticated, user]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    const updatedProfile: UserProfile = { ...userProfile, ...updates };
    setUserProfile(updatedProfile);
    await persistProfile(updatedProfile);
    return updatedProfile;
  }, [userProfile, persistProfile]);

  const addXP = useCallback(async (amount: number, reason: string) => {
    const newXP = userProfile.xp + amount;
    const rankInfo = getRankForXP(newXP);
    const oldRank = userProfile.rank;
    const updatedProfile: UserProfile = {
      ...userProfile,
      xp: newXP,
      rank: rankInfo.rank,
    };
    setUserProfile(updatedProfile);
    await persistProfile(updatedProfile);

    if (rankInfo.rank !== oldRank) {
      const levelUpActivity: ActivityItem = {
        id: `a_lu_${Date.now()}`,
        type: 'level_up',
        plantName: '',
        date: new Date().toISOString().split('T')[0],
        description: `Leveled up to ${rankInfo.emoji} ${rankInfo.rank}!`,
      };
      const updatedActivities = [levelUpActivity, ...activities];
      setActivities(updatedActivities);
      await AsyncStorage.setItem(STORAGE_KEYS.activities, JSON.stringify(updatedActivities));
      if (isAuthenticated && user && isSupabaseReady()) {
        cloudUpsertActivity(levelUpActivity, user.id).catch((e) => console.log('[PlantProvider] Cloud activity sync failed:', e));
      }
    }

    console.log(`+${amount} XP: ${reason}. Total: ${newXP}. Rank: ${rankInfo.rank}`);
    return updatedProfile;
  }, [userProfile, activities, isAuthenticated, user, persistProfile]);

  // ── Water plant mutation ──────────────────────────────────────────────────

  const checkOverwatering = useCallback((plant: Plant): boolean => {
    const lastWateredDate = new Date(plant.lastWatered + 'T00:00:00');
    const now = new Date();
    const hoursSince = (now.getTime() - lastWateredDate.getTime()) / (1000 * 60 * 60);
    return hoursSince < 24;
  }, []);

  const waterPlantMutation = useMutation({
    mutationFn: async ({ plantId, health, note }: { plantId: string; health: number; note?: string }) => {
      const now = new Date().toISOString().split('T')[0];
      const plant = plants.find(p => p.id === plantId);
      if (!plant) throw new Error('Plant not found');

      const newStreak = plant.streak + 1;
      const updatedPlants = plants.map(p =>
        p.id === plantId
          ? { ...p, health, streak: newStreak, lastWatered: now }
          : p
      );

      const newLog: WaterLog = {
        id: `w${Date.now()}`,
        plantId,
        plantName: plant.name,
        date: now,
        health,
        note,
      };
      const updatedLogs = [newLog, ...waterLogs];

      const newActivities: ActivityItem[] = [];
      newActivities.push({
        id: `a${Date.now()}`,
        type: 'water',
        plantName: plant.name,
        date: now,
        description: `Watered ${plant.name}`,
      });

      let xpGained = 10;
      if (health !== plant.health) xpGained += 5;

      if (newStreak === 7) {
        xpGained += 50;
        newActivities.push({
          id: `a_s7_${Date.now()}`,
          type: 'streak_milestone',
          plantName: plant.name,
          date: now,
          description: `${plant.name} hit a 7-day streak! +50 XP`,
        });
      } else if (newStreak === 30) {
        xpGained += 100;
        newActivities.push({
          id: `a_s30_${Date.now()}`,
          type: 'streak_milestone',
          plantName: plant.name,
          date: now,
          description: `${plant.name} hit a 30-day streak! +100 XP`,
        });
      }

      const updatedActivities = [...newActivities, ...activities];

      // Local persistence
      await AsyncStorage.setItem(STORAGE_KEYS.plants, JSON.stringify(updatedPlants));
      await AsyncStorage.setItem(STORAGE_KEYS.waterLogs, JSON.stringify(updatedLogs));
      await AsyncStorage.setItem(STORAGE_KEYS.activities, JSON.stringify(updatedActivities));

      setPlants(updatedPlants);
      setWaterLogs(updatedLogs);
      setActivities(updatedActivities);

      const newXP = userProfile.xp + xpGained;
      const rankInfo = getRankForXP(newXP);
      const updatedProfileData: UserProfile = {
        ...userProfile,
        xp: newXP,
        rank: rankInfo.rank,
        totalWaterings: userProfile.totalWaterings + 1,
      };
      setUserProfile(updatedProfileData);
      await persistProfile(updatedProfileData);

      // Cloud sync (fire-and-forget)
      if (isAuthenticated && user && isSupabaseReady()) {
        const updatedPlant = updatedPlants.find(p => p.id === plantId)!;
        cloudUpsertPlant(updatedPlant, user.id).catch((e) => console.log('[PlantProvider] Cloud plant sync failed:', e));
        cloudUpsertWaterLog(newLog, user.id).catch((e) => console.log('[PlantProvider] Cloud log sync failed:', e));
        for (const act of newActivities) {
          cloudUpsertActivity(act, user.id).catch((e) => console.log('[PlantProvider] Cloud activity sync failed:', e));
        }
        cloudUpsertProfile(updatedProfileData, user.id, user.email).catch((e) => console.log('[PlantProvider] Cloud profile sync failed:', e));
      }

      return {
        plant: updatedPlants.find(p => p.id === plantId)!,
        log: newLog,
        xpGained,
        newStreak,
      };
    },
  });

  // ── Toggle like mutation ──────────────────────────────────────────────────

  const toggleLikeMutation = useMutation({
    mutationFn: async (postId: string) => {
      const post = communityPosts.find(p => p.id === postId);
      if (!post) return communityPosts;

      const wasLiked = post.liked;
      const updated = communityPosts.map(p =>
        p.id === postId
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p
      );
      setCommunityPosts(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.communityPosts, JSON.stringify(updated));

      // Cloud sync
      if (isAuthenticated && user && isSupabaseReady()) {
        if (wasLiked) {
          cloudUnlikePost(postId, user.id).catch((e) => console.log('[PlantProvider] Cloud unlike failed:', e));
        } else {
          cloudLikePost(postId, user.id).catch((e) => console.log('[PlantProvider] Cloud like failed:', e));
        }
      }

      return updated;
    },
  });

  // ── Add community post ────────────────────────────────────────────────────

  const addCommunityPost = useCallback(async (text: string, plantName: string, streak: number) => {
    const now = Date.now();
    const newPost: CommunityPost = {
      id: `c${now}`,
      userId: user?.id ?? 'current',
      userName: user?.name ?? 'You',
      avatar: user?.picture ?? userProfile.avatar,
      text,
      plantName,
      streak,
      likes: 0,
      comments: 0,
      timeAgo: 'Just now',
      liked: false,
    };
    const updated = [newPost, ...communityPosts];
    setCommunityPosts(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.communityPosts, JSON.stringify(updated));

    const newXP = userProfile.xp + 20;
    const rankInfo = getRankForXP(newXP);
    const updatedProfileData: UserProfile = {
      ...userProfile,
      xp: newXP,
      rank: rankInfo.rank,
      totalCommunityPosts: userProfile.totalCommunityPosts + 1,
    };
    setUserProfile(updatedProfileData);
    await persistProfile(updatedProfileData);

    // Cloud sync
    if (isAuthenticated && user && isSupabaseReady()) {
      cloudUpsertCommunityPost(newPost, user.id).catch((e) => console.log('[PlantProvider] Cloud post sync failed:', e));
      cloudUpsertProfile(updatedProfileData, user.id, user.email).catch((e) => console.log('[PlantProvider] Cloud profile sync failed:', e));
    }

    console.log('+20 XP for community post');
  }, [communityPosts, userProfile, user, isAuthenticated, persistProfile]);

  // ── Remove plant mutation ─────────────────────────────────────────────────

  const removePlantMutation = useMutation({
    mutationFn: async (plantId: string) => {
      const plant = plants.find(p => p.id === plantId);
      if (!plant) throw new Error('Plant not found');

      const updated = plants.filter(p => p.id !== plantId);
      setPlants(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.plants, JSON.stringify(updated));

      const newActivity: ActivityItem = {
        id: `a_rm_${Date.now()}`,
        type: 'remove_plant',
        plantName: plant.name,
        date: new Date().toISOString().split('T')[0],
        description: `Removed ${plant.name} from collection`,
      };
      const updatedActivities = [newActivity, ...activities];
      setActivities(updatedActivities);
      await AsyncStorage.setItem(STORAGE_KEYS.activities, JSON.stringify(updatedActivities));

      // Cloud sync
      if (isAuthenticated && user && isSupabaseReady()) {
        cloudDeletePlant(plantId).catch((e) => console.log('[PlantProvider] Cloud delete plant failed:', e));
        cloudUpsertActivity(newActivity, user.id).catch((e) => console.log('[PlantProvider] Cloud activity sync failed:', e));
      }

      console.log(`Removed plant: ${plant.name}`);
      return plant;
    },
  });

  // ── Add plant mutation ────────────────────────────────────────────────────

  const addPlantMutation = useMutation({
    mutationFn: async (newPlant: Plant) => {
      const updated = [...plants, newPlant];
      setPlants(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.plants, JSON.stringify(updated));

      const newActivity: ActivityItem = {
        id: `a${Date.now()}`,
        type: 'new_plant',
        plantName: newPlant.name,
        date: new Date().toISOString().split('T')[0],
        description: `Added ${newPlant.name} to collection`,
      };
      const updatedActivities = [newActivity, ...activities];
      setActivities(updatedActivities);
      await AsyncStorage.setItem(STORAGE_KEYS.activities, JSON.stringify(updatedActivities));

      // Cloud sync
      if (isAuthenticated && user && isSupabaseReady()) {
        cloudUpsertPlant(newPlant, user.id).catch((e) => console.log('[PlantProvider] Cloud plant sync failed:', e));
        cloudUpsertActivity(newActivity, user.id).catch((e) => console.log('[PlantProvider] Cloud activity sync failed:', e));
      }

      return newPlant;
    },
  });

  // ── Update plant ──────────────────────────────────────────────────────────

  const updatePlant = useCallback(async (plantId: string, updates: Partial<Plant>) => {
    const updated = plants.map((p) => (p.id === plantId ? { ...p, ...updates } : p));
    setPlants(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.plants, JSON.stringify(updated));

    const changed = updated.find((p) => p.id === plantId);
    if (changed && isAuthenticated && user && isSupabaseReady()) {
      cloudUpsertPlant(changed, user.id).catch((e) => console.log('[PlantProvider] Cloud plant update failed:', e));
    }

    return changed;
  }, [plants, isAuthenticated, user]);

  // ── Derived data ──────────────────────────────────────────────────────────

  const totalStreak = useMemo(() => plants.reduce((max, p) => Math.max(max, p.streak), 0), [plants]);
  const averageStreak = useMemo(() => {
    if (plants.length === 0) return 0;
    return Math.round(plants.reduce((sum, p) => sum + p.streak, 0) / plants.length);
  }, [plants]);
  const averageHealth = useMemo(() => {
    if (plants.length === 0) return 0;
    return Math.round((plants.reduce((sum, p) => sum + p.health, 0) / plants.length) * 10) / 10;
  }, [plants]);

  const plantsNeedingWater = useMemo(() => {
    const today = new Date();
    return plants.filter(p => {
      const lastWatered = new Date(p.lastWatered + 'T00:00:00');
      const daysSince = Math.floor((today.getTime() - lastWatered.getTime()) / (1000 * 60 * 60 * 24));
      const freq = p.wateringFrequencyDays ?? 3;
      return daysSince >= freq;
    });
  }, [plants]);

  return {
    plants,
    waterLogs,
    activities,
    communityPosts,
    userProfile,
    totalStreak,
    averageStreak,
    averageHealth,
    plantsNeedingWater,
    isLoading: plantsQuery.isLoading || isSyncing,
    isSyncing,
    waterPlant: waterPlantMutation.mutateAsync,
    isWatering: waterPlantMutation.isPending,
    toggleLike: toggleLikeMutation.mutate,
    addCommunityPost,
    addPlant: addPlantMutation.mutateAsync,
    isAddingPlant: addPlantMutation.isPending,
    removePlant: removePlantMutation.mutateAsync,
    isRemovingPlant: removePlantMutation.isPending,
    updatePlant,
    checkOverwatering,
    addXP,
    updateProfile,
  };
});
