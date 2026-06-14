//
//  MockData.swift
//  PlantPassport
//

import Foundation

nonisolated enum MockData {
    static let plantImages: [String: String] = [
        "monstera": "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=400&h=500&fit=crop",
        "snakePlant": "https://images.unsplash.com/photo-1593482892540-fa3dfc5fed4b?w=400&h=500&fit=crop",
        "fiddleLeaf": "https://images.unsplash.com/photo-1545241047-6083a3684587?w=400&h=500&fit=crop",
        "pothos": "https://images.unsplash.com/photo-1602923668104-8f9e03e77e62?w=400&h=500&fit=crop",
        "peaceLily": "https://images.unsplash.com/photo-1593691509543-c55fb32d8de5?w=400&h=500&fit=crop",
        "rubberPlant": "https://images.unsplash.com/photo-1637967886160-fd761519fb90?w=400&h=500&fit=crop",
    ]

    static let defaultProfile = UserProfile(
        name: "Plant Parent",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
        xp: 320,
        rank: "Sprout",
        badges: ["First Watering", "Week Warrior"],
        totalWaterings: 28,
        totalHealthLogs: 12,
        totalCommunityPosts: 3
    )

    static let plants: [Plant] = [
        Plant(id: "1", name: "Monstera", species: "Monstera Deliciosa", image: plantImages["monstera"]!, health: 4, streak: 15, lastWatered: "2026-06-11", addedDate: "2025-12-01", notes: ["Looking healthy!", "New leaf unfurling"], needs: PlantNeeds(water: 3, light: 3, humidity: 4, idealTempMin: 65, idealTempMax: 85, easeOfCare: 3), wateringFrequencyDays: 3),
        Plant(id: "2", name: "Snake Plant", species: "Sansevieria Trifasciata", image: plantImages["snakePlant"]!, health: 5, streak: 22, lastWatered: "2026-06-10", addedDate: "2025-11-15", notes: ["Thriving in low light"], needs: PlantNeeds(water: 1, light: 2, humidity: 1, idealTempMin: 60, idealTempMax: 85, easeOfCare: 5), wateringFrequencyDays: 7),
        Plant(id: "3", name: "Fiddle Leaf Fig", species: "Ficus Lyrata", image: plantImages["fiddleLeaf"]!, health: 3, streak: 7, lastWatered: "2026-06-09", addedDate: "2026-01-10", notes: ["Needs more sunlight", "Drooping a bit"], needs: PlantNeeds(water: 4, light: 4, humidity: 3, idealTempMin: 60, idealTempMax: 75, easeOfCare: 1), wateringFrequencyDays: 2),
        Plant(id: "4", name: "Pothos", species: "Epipremnum Aureum", image: plantImages["pothos"]!, health: 5, streak: 30, lastWatered: "2026-06-11", addedDate: "2025-10-05", notes: ["Growing like crazy"], needs: PlantNeeds(water: 2, light: 2, humidity: 2, idealTempMin: 60, idealTempMax: 80, easeOfCare: 5), wateringFrequencyDays: 4),
        Plant(id: "5", name: "Peace Lily", species: "Spathiphyllum", image: plantImages["peaceLily"]!, health: 4, streak: 12, lastWatered: "2026-06-10", addedDate: "2025-12-20", notes: ["Blooming beautifully"], needs: PlantNeeds(water: 4, light: 2, humidity: 4, idealTempMin: 65, idealTempMax: 80, easeOfCare: 4), wateringFrequencyDays: 2),
        Plant(id: "6", name: "Rubber Plant", species: "Ficus Elastica", image: plantImages["rubberPlant"]!, health: 2, streak: 3, lastWatered: "2026-06-08", addedDate: "2026-02-01", notes: ["New addition, adjusting"], needs: PlantNeeds(water: 3, light: 3, humidity: 3, idealTempMin: 60, idealTempMax: 80, easeOfCare: 3), wateringFrequencyDays: 3),
    ]

    static let waterLogs: [WaterLog] = [
        WaterLog(id: "w1", plantId: "1", plantName: "Monstera", date: "2026-06-11", health: 4, note: "Soil was dry"),
        WaterLog(id: "w2", plantId: "4", plantName: "Pothos", date: "2026-06-11", health: 5, note: nil),
        WaterLog(id: "w3", plantId: "2", plantName: "Snake Plant", date: "2026-06-10", health: 5, note: "Looking great"),
        WaterLog(id: "w4", plantId: "5", plantName: "Peace Lily", date: "2026-06-10", health: 4, note: nil),
        WaterLog(id: "w5", plantId: "3", plantName: "Fiddle Leaf Fig", date: "2026-06-09", health: 3, note: "Moved to brighter spot"),
        WaterLog(id: "w6", plantId: "6", plantName: "Rubber Plant", date: "2026-06-08", health: 2, note: nil),
        WaterLog(id: "w7", plantId: "1", plantName: "Monstera", date: "2026-06-08", health: 4, note: nil),
        WaterLog(id: "w8", plantId: "4", plantName: "Pothos", date: "2026-06-08", health: 5, note: "New growth spotted"),
        WaterLog(id: "w9", plantId: "2", plantName: "Snake Plant", date: "2026-06-07", health: 5, note: nil),
        WaterLog(id: "w10", plantId: "1", plantName: "Monstera", date: "2026-06-06", health: 4, note: nil),
    ]

    static let activities: [ActivityItem] = [
        ActivityItem(id: "a1", type: .water, plantName: "Monstera", date: "2026-06-11", description: "Watered Monstera"),
        ActivityItem(id: "a2", type: .water, plantName: "Pothos", date: "2026-06-11", description: "Watered Pothos"),
        ActivityItem(id: "a3", type: .streakMilestone, plantName: "Pothos", date: "2026-06-11", description: "Pothos hit a 30-day streak! +50 XP"),
        ActivityItem(id: "a4", type: .water, plantName: "Snake Plant", date: "2026-06-10", description: "Watered Snake Plant"),
        ActivityItem(id: "a5", type: .healthCheck, plantName: "Fiddle Leaf Fig", date: "2026-06-09", description: "Health check on Fiddle Leaf Fig"),
        ActivityItem(id: "a6", type: .newPlant, plantName: "Rubber Plant", date: "2026-02-01", description: "Added Rubber Plant to collection"),
    ]

    static let community: [CommunityPost] = [
        CommunityPost(id: "c1", userId: "u1", userName: "Emma Green", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop", text: "My Monstera just unfurled its biggest leaf yet! 🌿 30 days of consistent care pays off.", plantName: "Monstera", streak: 30, likes: 42, comments: 8, timeAgo: "2h ago", liked: false),
        CommunityPost(id: "c2", userId: "u2", userName: "Marcus Rivera", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", text: "Finally figured out the watering schedule for my Fiddle Leaf. No more brown spots!", plantName: "Fiddle Leaf Fig", streak: 14, likes: 28, comments: 5, timeAgo: "4h ago", liked: true),
        CommunityPost(id: "c3", userId: "u3", userName: "Aisha Patel", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop", text: "Propagated my Pothos and now I have 12 plants from one! Who wants a cutting? 🪴", plantName: "Pothos", streak: 45, likes: 67, comments: 23, timeAgo: "6h ago", liked: false),
        CommunityPost(id: "c4", userId: "u4", userName: "Tom Nakamura", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop", text: "Started my plant journey last month. Already addicted! My Snake Plant is thriving.", plantName: "Snake Plant", streak: 21, likes: 35, comments: 12, timeAgo: "1d ago", liked: false),
        CommunityPost(id: "c5", userId: "u5", userName: "Sofia Chen", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop", text: "Peace Lily in full bloom today! There is nothing like seeing your plant babies thrive 🌸", plantName: "Peace Lily", streak: 18, likes: 53, comments: 9, timeAgo: "1d ago", liked: true),
    ]

    static let leaderboard: [LeaderboardEntry] = [
        LeaderboardEntry(id: "l1", rank: 1, userName: "Aisha Patel", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop", streak: 45, totalPlants: 12, isCurrentUser: false, weeklyStreak: 7),
        LeaderboardEntry(id: "l2", rank: 2, userName: "Emma Green", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop", streak: 38, totalPlants: 8, isCurrentUser: false, weeklyStreak: 7),
        LeaderboardEntry(id: "l3", rank: 3, userName: "Pothos King", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop", streak: 35, totalPlants: 15, isCurrentUser: false, weeklyStreak: 6),
        LeaderboardEntry(id: "l4", rank: 4, userName: "You", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop", streak: 30, totalPlants: 6, isCurrentUser: true, weeklyStreak: 5),
        LeaderboardEntry(id: "l5", rank: 5, userName: "Tom Nakamura", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop", streak: 28, totalPlants: 4, isCurrentUser: false, weeklyStreak: 5),
        LeaderboardEntry(id: "l6", rank: 6, userName: "Sofia Chen", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop", streak: 25, totalPlants: 7, isCurrentUser: false, weeklyStreak: 4),
        LeaderboardEntry(id: "l7", rank: 7, userName: "Marcus Rivera", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", streak: 21, totalPlants: 3, isCurrentUser: false, weeklyStreak: 4),
        LeaderboardEntry(id: "l8", rank: 8, userName: "Lily Waters", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop", streak: 18, totalPlants: 5, isCurrentUser: false, weeklyStreak: 3),
        LeaderboardEntry(id: "l9", rank: 9, userName: "James Park", avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop", streak: 15, totalPlants: 9, isCurrentUser: false, weeklyStreak: 3),
        LeaderboardEntry(id: "l10", rank: 10, userName: "Priya Sharma", avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop", streak: 12, totalPlants: 6, isCurrentUser: false, weeklyStreak: 2),
    ]

    static let wateringChart: [Int] = [
        1, 1, 0, 1, 1, 1, 0, 1, 1, 1,
        1, 0, 1, 1, 1, 1, 1, 0, 0, 1,
        1, 1, 1, 0, 1, 1, 1, 1, 1, 1,
    ]
}
