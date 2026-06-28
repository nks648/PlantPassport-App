import React, { useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import { Plant, WaterLog, CommunityPost, ActivityItem, UserProfile, getRankForXP } from '@/types/plant';
import { MOCK_PLANTS, MOCK_WATER_LOGS, MOCK_ACTIVITIES, MOCK_COMMUNITY, DEFAULT_USER_PROFILE } from '@/mocks/plants';

const STORAGE_VERSION = 'v3';

const STORAGE_KEYS = {
  plants: `plant_parent_plants_${STORAGE_VERSION}`,
  waterLogs: `plant_parent_water_logs_${STORAGE_VERSION}`,
  activities: `plant_parent_activities_${STORAGE_VERSION}`,
  communityPosts: `plant_parent_community_${STORAGE_VERSION}`,
  userProfile: `plant_parent_profile_${STORAGE_VERSION}`,
};

export const [PlantProvider, usePlants] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);

  const plantsQuery = useQuery({
    queryKey: ['plants'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.plants);
        if (stored) return JSON.parse(stored) as Plant[];
        await AsyncStorage.setItem(STORAGE_KEYS.plants, JSON.stringify(MOCK_PLANTS));
        return MOCK_PLANTS;
      } catch (e) {
        console.log('Error loading plants:', e);
        return MOCK_PLANTS;
      }
    },
  });

  const logsQuery = useQuery({
    queryKey: ['waterLogs'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.waterLogs);
        if (stored) return JSON.parse(stored) as WaterLog[];
        await AsyncStorage.setItem(STORAGE_KEYS.waterLogs, JSON.stringify(MOCK_WATER_LOGS));
        return MOCK_WATER_LOGS;
      } catch (e) {
        console.log('Error loading water logs:', e);
        return MOCK_WATER_LOGS;
      }
    },
  });

  const activitiesQuery = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.activities);
        if (stored) return JSON.parse(stored) as ActivityItem[];
        await AsyncStorage.setItem(STORAGE_KEYS.activities, JSON.stringify(MOCK_ACTIVITIES));
        return MOCK_ACTIVITIES;
      } catch (e) {
        console.log('Error loading activities:', e);
        return MOCK_ACTIVITIES;
      }
    },
  });

  const communityQuery = useQuery({
    queryKey: ['community'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.communityPosts);
        if (stored) return JSON.parse(stored) as CommunityPost[];
        await AsyncStorage.setItem(STORAGE_KEYS.communityPosts, JSON.stringify(MOCK_COMMUNITY));
        return MOCK_COMMUNITY;
      } catch (e) {
        console.log('Error loading community:', e);
        return MOCK_COMMUNITY;
      }
    },
  });

  const profileQuery = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.userProfile);
        if (stored) return JSON.parse(stored) as UserProfile;
        await AsyncStorage.setItem(STORAGE_KEYS.userProfile, JSON.stringify(DEFAULT_USER_PROFILE));
        return DEFAULT_USER_PROFILE;
      } catch (e) {
        console.log('Error loading profile:', e);
        return DEFAULT_USER_PROFILE;
      }
    },
  });

  useEffect(() => {
    if (plantsQuery.data) setPlants(plantsQuery.data);
  }, [plantsQuery.data]);

  useEffect(() => {
    if (logsQuery.data) setWaterLogs(logsQuery.data);
  }, [logsQuery.data]);

  useEffect(() => {
    if (activitiesQuery.data) setActivities(activitiesQuery.data);
  }, [activitiesQuery.data]);

  useEffect(() => {
    if (communityQuery.data) setCommunityPosts(communityQuery.data);
  }, [communityQuery.data]);

  useEffect(() => {
    if (profileQuery.data) setUserProfile(profileQuery.data);
  }, [profileQuery.data]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    const updatedProfile: UserProfile = { ...userProfile, ...updates };
    setUserProfile(updatedProfile);
    await AsyncStorage.setItem(STORAGE_KEYS.userProfile, JSON.stringify(updatedProfile));
    console.log('Profile updated:', updates);
    return updatedProfile;
  }, [userProfile]);

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
    await AsyncStorage.setItem(STORAGE_KEYS.userProfile, JSON.stringify(updatedProfile));

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
    }

    console.log(`+${amount} XP: ${reason}. Total: ${newXP}. Rank: ${rankInfo.rank}`);
    return updatedProfile;
  }, [userProfile, activities]);

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

      if (health !== plant.health) {
        xpGained += 5;
      }

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
      await AsyncStorage.setItem(STORAGE_KEYS.userProfile, JSON.stringify(updatedProfileData));

      return {
        plant: updatedPlants.find(p => p.id === plantId)!,
        log: newLog,
        xpGained,
        newStreak,
      };
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async (postId: string) => {
      const updated = communityPosts.map(p =>
        p.id === postId
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p
      );
      setCommunityPosts(updated);
      await AsyncStorage.setItem(STORAGE_KEYS.communityPosts, JSON.stringify(updated));
      return updated;
    },
  });

  const addCommunityPost = useCallback(async (text: string, plantName: string, streak: number) => {
    const newPost: CommunityPost = {
      id: `c${Date.now()}`,
      userId: 'current',
      userName: 'You',
      avatar: userProfile.avatar,
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
    await AsyncStorage.setItem(STORAGE_KEYS.userProfile, JSON.stringify(updatedProfileData));
    console.log('+20 XP for community post');
  }, [communityPosts, userProfile]);

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

      console.log(`Removed plant: ${plant.name}`);
      return plant;
    },
  });

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

      return newPlant;
    },
  });

  const updatePlant = useCallback(async (plantId: string, updates: Partial<Plant>) => {
    const updated = plants.map((p) => (p.id === plantId ? { ...p, ...updates } : p));
    setPlants(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.plants, JSON.stringify(updated));
    return updated.find((p) => p.id === plantId);
  }, [plants]);

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
    isLoading: plantsQuery.isLoading,
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
