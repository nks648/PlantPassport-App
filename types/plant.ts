export interface PlantNeeds {
  water: number;
  light: number;
  humidity: number;
  idealTempMin: number;
  idealTempMax: number;
  easeOfCare: number;
}

export interface Plant {
  id: string;
  name: string;
  species: string;
  image: string;
  health: number;
  streak: number;
  lastWatered: string;
  addedDate: string;
  notes: string[];
  needs: PlantNeeds;
  wateringFrequencyDays?: number;
}

export interface WaterLog {
  id: string;
  plantId: string;
  plantName: string;
  date: string;
  health: number;
  note?: string;
}

export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  avatar: string;
  text: string;
  plantName?: string;
  streak?: number;
  image?: string;
  likes: number;
  comments: number;
  timeAgo: string;
  liked: boolean;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  userName: string;
  avatar: string;
  streak: number;
  totalPlants: number;
  isCurrentUser: boolean;
  weeklyStreak?: number;
}

export interface ActivityItem {
  id: string;
  type: 'water' | 'health_check' | 'new_plant' | 'streak_milestone' | 'badge_earned' | 'level_up';
  plantName: string;
  date: string;
  description: string;
}

export type RankTitle = 'Seedling' | 'Sprout' | 'Green Thumb' | 'Plant Whisperer' | 'Master Botanist';

export interface UserProfile {
  name: string;
  avatar: string;
  xp: number;
  rank: RankTitle;
  badges: string[];
  totalWaterings: number;
  totalHealthLogs: number;
  totalCommunityPosts: number;
}

export const RANK_THRESHOLDS: { rank: RankTitle; minXP: number; emoji: string }[] = [
  { rank: 'Seedling', minXP: 0, emoji: '🌱' },
  { rank: 'Sprout', minXP: 100, emoji: '🌿' },
  { rank: 'Green Thumb', minXP: 500, emoji: '🪴' },
  { rank: 'Plant Whisperer', minXP: 1500, emoji: '🌳' },
  { rank: 'Master Botanist', minXP: 5000, emoji: '🏆' },
];

export function getRankForXP(xp: number): { rank: RankTitle; emoji: string; nextRank?: RankTitle; xpToNext?: number } {
  let current = RANK_THRESHOLDS[0];
  for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= RANK_THRESHOLDS[i].minXP) {
      current = RANK_THRESHOLDS[i];
      const next = RANK_THRESHOLDS[i + 1];
      return {
        rank: current.rank,
        emoji: current.emoji,
        nextRank: next?.rank,
        xpToNext: next ? next.minXP - xp : undefined,
      };
    }
  }
  return { rank: current.rank, emoji: current.emoji };
}
