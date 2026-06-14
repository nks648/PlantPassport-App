//
//  PlantStore.swift
//  PlantPassport
//

import SwiftUI
import Observation

/// Central store for plants, water logs, activities, community posts and the
/// user profile. Mirrors the React Native PlantProvider. Persists to UserDefaults.
@MainActor
@Observable
final class PlantStore {
    var plants: [Plant] = []
    var waterLogs: [WaterLog] = []
    var activities: [ActivityItem] = []
    var communityPosts: [CommunityPost] = []
    var userProfile: UserProfile = MockData.defaultProfile

    private enum Keys {
        static let plants = "pp_plants_v3"
        static let waterLogs = "pp_water_logs_v3"
        static let activities = "pp_activities_v3"
        static let community = "pp_community_v3"
        static let profile = "pp_profile_v3"
    }

    init() {
        plants = load(Keys.plants, fallback: MockData.plants)
        waterLogs = load(Keys.waterLogs, fallback: MockData.waterLogs)
        activities = load(Keys.activities, fallback: MockData.activities)
        communityPosts = load(Keys.community, fallback: MockData.community)
        userProfile = load(Keys.profile, fallback: MockData.defaultProfile)
    }

    // MARK: - Derived values

    var totalStreak: Int { plants.map(\.streak).max() ?? 0 }

    var averageStreak: Int {
        guard !plants.isEmpty else { return 0 }
        return Int((Double(plants.map(\.streak).reduce(0, +)) / Double(plants.count)).rounded())
    }

    var averageHealth: Double {
        guard !plants.isEmpty else { return 0 }
        let avg = Double(plants.map(\.health).reduce(0, +)) / Double(plants.count)
        return (avg * 10).rounded() / 10
    }

    var plantsNeedingWater: [Plant] {
        plants.filter { $0.needsWater }
    }

    var rankInfo: RankInfo { Ranks.forXP(userProfile.xp) }

    // MARK: - Mutations

    func checkOverwatering(_ plant: Plant) -> Bool {
        guard let last = DateUtil.parse(plant.lastWatered) else { return false }
        return Date().timeIntervalSince(last) < 86_400
    }

    func updateProfile(name: String? = nil, avatar: String? = nil) {
        if let name { userProfile.name = name }
        if let avatar { userProfile.avatar = avatar }
        save(Keys.profile, userProfile)
    }

    @discardableResult
    func waterPlant(plantId: String, health: Int, note: String?) -> (streak: Int, xpGained: Int, name: String) {
        let now = DateUtil.today()
        guard let idx = plants.firstIndex(where: { $0.id == plantId }) else {
            return (0, 0, "")
        }
        let oldHealth = plants[idx].health
        let newStreak = plants[idx].streak + 1
        plants[idx].health = health
        plants[idx].streak = newStreak
        plants[idx].lastWatered = now

        let log = WaterLog(id: "w\(Int(Date().timeIntervalSince1970 * 1000))", plantId: plantId, plantName: plants[idx].name, date: now, health: health, note: note)
        waterLogs.insert(log, at: 0)

        var newActivities: [ActivityItem] = [
            ActivityItem(id: "a\(Int(Date().timeIntervalSince1970 * 1000))", type: .water, plantName: plants[idx].name, date: now, description: "Watered \(plants[idx].name)")
        ]
        var xpGained = 10
        if health != oldHealth { xpGained += 5 }
        if newStreak == 7 {
            xpGained += 50
            newActivities.append(ActivityItem(id: "a_s7_\(Int(Date().timeIntervalSince1970 * 1000))", type: .streakMilestone, plantName: plants[idx].name, date: now, description: "\(plants[idx].name) hit a 7-day streak! +50 XP"))
        } else if newStreak == 30 {
            xpGained += 100
            newActivities.append(ActivityItem(id: "a_s30_\(Int(Date().timeIntervalSince1970 * 1000))", type: .streakMilestone, plantName: plants[idx].name, date: now, description: "\(plants[idx].name) hit a 30-day streak! +100 XP"))
        }
        activities.insert(contentsOf: newActivities, at: 0)

        userProfile.xp += xpGained
        userProfile.rank = Ranks.forXP(userProfile.xp).rank
        userProfile.totalWaterings += 1

        save(Keys.plants, plants)
        save(Keys.waterLogs, waterLogs)
        save(Keys.activities, activities)
        save(Keys.profile, userProfile)

        return (newStreak, xpGained, plants[idx].name)
    }

    func toggleLike(_ postId: String) {
        guard let idx = communityPosts.firstIndex(where: { $0.id == postId }) else { return }
        if communityPosts[idx].liked {
            communityPosts[idx].liked = false
            communityPosts[idx].likes -= 1
        } else {
            communityPosts[idx].liked = true
            communityPosts[idx].likes += 1
        }
        save(Keys.community, communityPosts)
    }

    func addCommunityPost(text: String, plantName: String, streak: Int) {
        let post = CommunityPost(
            id: "c\(Int(Date().timeIntervalSince1970 * 1000))",
            userId: "current", userName: "You", avatar: userProfile.avatar,
            text: text, plantName: plantName.isEmpty ? nil : plantName,
            streak: streak == 0 ? nil : streak,
            likes: 0, comments: 0, timeAgo: "Just now", liked: false
        )
        communityPosts.insert(post, at: 0)
        userProfile.xp += 20
        userProfile.rank = Ranks.forXP(userProfile.xp).rank
        userProfile.totalCommunityPosts += 1
        save(Keys.community, communityPosts)
        save(Keys.profile, userProfile)
    }

    func addPlant(_ plant: Plant) {
        plants.append(plant)
        activities.insert(ActivityItem(id: "a\(Int(Date().timeIntervalSince1970 * 1000))", type: .newPlant, plantName: plant.name, date: DateUtil.today(), description: "Added \(plant.name) to collection"), at: 0)
        save(Keys.plants, plants)
        save(Keys.activities, activities)
    }

    func removePlant(_ plantId: String) {
        guard let plant = plants.first(where: { $0.id == plantId }) else { return }
        plants.removeAll { $0.id == plantId }
        activities.insert(ActivityItem(id: "a_rm_\(Int(Date().timeIntervalSince1970 * 1000))", type: .removePlant, plantName: plant.name, date: DateUtil.today(), description: "Removed \(plant.name) from collection"), at: 0)
        save(Keys.plants, plants)
        save(Keys.activities, activities)
    }

    func plantExists(named name: String) -> Bool {
        plants.contains { $0.name.lowercased() == name.lowercased() }
    }

    // MARK: - Persistence

    private func load<T: Decodable>(_ key: String, fallback: T) -> T {
        guard let data = UserDefaults.standard.data(forKey: key),
              let decoded = try? JSONDecoder().decode(T.self, from: data) else {
            return fallback
        }
        return decoded
    }

    private func save<T: Encodable>(_ key: String, _ value: T) {
        if let data = try? JSONEncoder().encode(value) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }
}
