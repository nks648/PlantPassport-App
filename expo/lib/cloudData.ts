import { supabase } from '@/lib/supabase';
import type { Database, Json } from '@/src/integrations/supabase/types';
import type { Plant, WaterLog, ActivityItem, CommunityPost, UserProfile } from '@/types/plant';

// ── Helpers ────────────────────────────────────────────────────────────────

type PlantRow = Database['public']['Tables']['plants']['Row'];
type PlantInsert = Database['public']['Tables']['plants']['Insert'];
type WaterLogRow = Database['public']['Tables']['water_logs']['Row'];
type WaterLogInsert = Database['public']['Tables']['water_logs']['Insert'];
type ActivityRow = Database['public']['Tables']['activities']['Row'];
type ActivityInsert = Database['public']['Tables']['activities']['Insert'];
type CommunityPostRow = Database['public']['Tables']['community_posts']['Row'];
type CommunityPostInsert = Database['public']['Tables']['community_posts']['Insert'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];

function plantToRow(plant: Plant, userId: string): PlantInsert {
  return {
    id: plant.id,
    user_id: userId,
    name: plant.name,
    species: plant.species,
    image: plant.image,
    health: plant.health,
    streak: plant.streak,
    last_watered: plant.lastWatered,
    added_date: plant.addedDate,
    notes: plant.notes,
    needs: plant.needs as unknown as Json,
    watering_frequency_days: plant.wateringFrequencyDays ?? 3,
    care_guide: plant.careGuide ? (plant.careGuide as unknown as Json) : null,
  };
}

function rowToPlant(row: PlantRow): Plant {
  return {
    id: row.id,
    name: row.name,
    species: row.species,
    image: row.image,
    health: row.health,
    streak: row.streak,
    lastWatered: row.last_watered,
    addedDate: row.added_date,
    notes: row.notes ?? [],
    needs: (row.needs as unknown as Plant['needs']) ?? { water: 3, light: 3, humidity: 3, idealTempMin: 60, idealTempMax: 80, easeOfCare: 3 },
    wateringFrequencyDays: row.watering_frequency_days,
    careGuide: row.care_guide ? (row.care_guide as unknown as Plant['careGuide']) : undefined,
  };
}

function waterLogToRow(log: WaterLog, userId: string): WaterLogInsert {
  return {
    id: log.id,
    user_id: userId,
    plant_id: log.plantId,
    plant_name: log.plantName,
    date: log.date,
    health: log.health,
    note: log.note ?? null,
  };
}

function rowToWaterLog(row: WaterLogRow): WaterLog {
  return {
    id: row.id,
    plantId: row.plant_id,
    plantName: row.plant_name,
    date: row.date,
    health: row.health,
    note: row.note ?? undefined,
  };
}

function activityToRow(activity: ActivityItem, userId: string): ActivityInsert {
  return {
    id: activity.id,
    user_id: userId,
    type: activity.type,
    plant_name: activity.plantName,
    date: activity.date,
    description: activity.description,
  };
}

function rowToActivity(row: ActivityRow): ActivityItem {
  return {
    id: row.id,
    type: row.type as ActivityItem['type'],
    plantName: row.plant_name,
    date: row.date,
    description: row.description,
  };
}

function communityPostToRow(post: CommunityPost, userId: string): CommunityPostInsert {
  return {
    id: post.id,
    user_id: userId,
    user_name: post.userName,
    avatar: post.avatar,
    text: post.text,
    plant_name: post.plantName ?? null,
    streak: post.streak ?? null,
    image: post.image ?? null,
    likes_count: post.likes,
    comments_count: post.comments,
  };
}

function rowToCommunityPost(row: CommunityPostRow, liked: boolean): CommunityPost {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    avatar: row.avatar,
    text: row.text,
    plantName: row.plant_name ?? undefined,
    streak: row.streak ?? undefined,
    image: row.image ?? undefined,
    likes: row.likes_count,
    comments: row.comments_count,
    timeAgo: timeAgoFromDate(row.created_at),
    liked,
  };
}

function timeAgoFromDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

// ── Plants ──────────────────────────────────────────────────────────────────

export async function cloudFetchPlants(userId: string): Promise<Plant[]> {
  const { data, error } = await supabase!
    .from('plants')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[cloudData] fetch plants failed:', error.message);
    return [];
  }
  return (data ?? []).map(rowToPlant);
}

export async function cloudUpsertPlant(plant: Plant, userId: string): Promise<void> {
  const row = plantToRow(plant, userId);
  const { error } = await supabase!.from('plants').upsert(row, { onConflict: 'id' });
  if (error) {
    console.error('[cloudData] upsert plant failed:', error.message);
  }
}

export async function cloudDeletePlant(plantId: string): Promise<void> {
  const { error } = await supabase!.from('plants').delete().eq('id', plantId);
  if (error) {
    console.error('[cloudData] delete plant failed:', error.message);
  }
}

// ── Water Logs ──────────────────────────────────────────────────────────────

export async function cloudFetchWaterLogs(userId: string): Promise<WaterLog[]> {
  const { data, error } = await supabase!
    .from('water_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('[cloudData] fetch water logs failed:', error.message);
    return [];
  }
  return (data ?? []).map(rowToWaterLog);
}

export async function cloudUpsertWaterLog(log: WaterLog, userId: string): Promise<void> {
  const row = waterLogToRow(log, userId);
  const { error } = await supabase!.from('water_logs').upsert(row, { onConflict: 'id' });
  if (error) {
    console.error('[cloudData] upsert water log failed:', error.message);
  }
}

// ── Activities ──────────────────────────────────────────────────────────────

export async function cloudFetchActivities(userId: string): Promise<ActivityItem[]> {
  const { data, error } = await supabase!
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('[cloudData] fetch activities failed:', error.message);
    return [];
  }
  return (data ?? []).map(rowToActivity);
}

export async function cloudUpsertActivity(activity: ActivityItem, userId: string): Promise<void> {
  const row = activityToRow(activity, userId);
  const { error } = await supabase!.from('activities').upsert(row, { onConflict: 'id' });
  if (error) {
    console.error('[cloudData] upsert activity failed:', error.message);
  }
}

// ── Community Posts ─────────────────────────────────────────────────────────

export async function cloudFetchCommunityPosts(): Promise<CommunityPost[]> {
  const { data, error } = await supabase!
    .from('community_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[cloudData] fetch community posts failed:', error.message);
    return [];
  }

  // Fetch likes for the current user to know which posts they liked
  const { data: likes } = await supabase!.from('post_likes').select('post_id');
  const likedSet = new Set((likes ?? []).map((l) => l.post_id));

  return (data ?? []).map((row) => rowToCommunityPost(row, likedSet.has(row.id)));
}

export async function cloudUpsertCommunityPost(post: CommunityPost, userId: string): Promise<void> {
  const row = communityPostToRow(post, userId);
  const { error } = await supabase!.from('community_posts').upsert(row, { onConflict: 'id' });
  if (error) {
    console.error('[cloudData] upsert community post failed:', error.message);
  }
}

export async function cloudDeleteCommunityPost(postId: string): Promise<void> {
  const { error } = await supabase!.from('community_posts').delete().eq('id', postId);
  if (error) {
    console.error('[cloudData] delete community post failed:', error.message);
  }
}

// ── Post Likes ──────────────────────────────────────────────────────────────

export async function cloudLikePost(postId: string, userId: string): Promise<void> {
  const { error: insertErr } = await supabase!
    .from('post_likes')
    .upsert({ post_id: postId, user_id: userId }, { onConflict: 'post_id,user_id' });

  if (insertErr) {
    console.error('[cloudData] like post failed:', insertErr.message);
    return;
  }

  // Increment the likes_count on the post
  const { error: updateErr } = await supabase!.rpc('increment_likes', { p_post_id: postId });
  if (updateErr) {
    console.error('[cloudData] increment likes failed:', updateErr.message);
  }
}

export async function cloudUnlikePost(postId: string, userId: string): Promise<void> {
  const { error: deleteErr } = await supabase!
    .from('post_likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId);

  if (deleteErr) {
    console.error('[cloudData] unlike post failed:', deleteErr.message);
    return;
  }

  const { error: updateErr } = await supabase!.rpc('decrement_likes', { p_post_id: postId });
  if (updateErr) {
    console.error('[cloudData] decrement likes failed:', updateErr.message);
  }
}

// ── Profile ─────────────────────────────────────────────────────────────────

export async function cloudFetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase!
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    if (error?.code !== 'PGRST116') {
      console.error('[cloudData] fetch profile failed:', error?.message);
    }
    return null;
  }

  return {
    name: data.name ?? 'Plant Parent',
    avatar: data.avatar_url ?? '',
    xp: data.xp ?? 0,
    rank: (data.rank as UserProfile['rank']) ?? 'Seedling',
    badges: data.badges ?? [],
    totalWaterings: data.total_waterings ?? 0,
    totalHealthLogs: data.total_health_logs ?? 0,
    totalCommunityPosts: data.total_community_posts ?? 0,
  };
}

export async function cloudUpsertProfile(profile: UserProfile, userId: string, email?: string): Promise<void> {
  const row: ProfileInsert = {
    id: userId,
    email: email ?? null,
    name: profile.name,
    avatar_url: profile.avatar,
    xp: profile.xp,
    rank: profile.rank,
    badges: profile.badges,
    total_waterings: profile.totalWaterings,
    total_health_logs: profile.totalHealthLogs,
    total_community_posts: profile.totalCommunityPosts,
  };
  const { error } = await supabase!.from('profiles').upsert(row, { onConflict: 'id' });
  if (error) {
    console.error('[cloudData] upsert profile failed:', error.message);
  }
}

// ── Bulk Sync ───────────────────────────────────────────────────────────────

export interface CloudData {
  plants: Plant[];
  waterLogs: WaterLog[];
  activities: ActivityItem[];
  communityPosts: CommunityPost[];
  profile: UserProfile | null;
}

/** Pull all cloud data for the signed-in user. */
export async function cloudPullAll(userId: string): Promise<CloudData> {
  const [plants, waterLogs, activities, communityPosts, profile] = await Promise.all([
    cloudFetchPlants(userId),
    cloudFetchWaterLogs(userId),
    cloudFetchActivities(userId),
    cloudFetchCommunityPosts(),
    cloudFetchProfile(userId),
  ]);

  return { plants, waterLogs, activities, communityPosts, profile };
}

/** Push all local data to the cloud (used on first sign-in). */
export async function cloudPushAll(
  userId: string,
  email: string | undefined,
  plants: Plant[],
  waterLogs: WaterLog[],
  activities: ActivityItem[],
  profile: UserProfile,
): Promise<void> {
  await Promise.all([
    ...plants.map((p) => cloudUpsertPlant(p, userId)),
    ...waterLogs.map((w) => cloudUpsertWaterLog(w, userId)),
    ...activities.map((a) => cloudUpsertActivity(a, userId)),
    cloudUpsertProfile(profile, userId, email),
  ]);
}

/** Check if the user has any cloud data (used to detect first sign-in). */
export async function cloudHasData(userId: string): Promise<boolean> {
  const { count, error } = await supabase!
    .from('plants')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    console.error('[cloudData] check data failed:', error.message);
    return false;
  }
  return (count ?? 0) > 0;
}
