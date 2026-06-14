//
//  UserProfile.swift
//  PlantPassport
//

import Foundation

nonisolated struct UserProfile: Codable, Hashable {
    var name: String
    var avatar: String
    var xp: Int
    var rank: String
    var badges: [String]
    var totalWaterings: Int
    var totalHealthLogs: Int
    var totalCommunityPosts: Int
}

nonisolated struct RankInfo: Hashable {
    let rank: String
    let emoji: String
    var nextRank: String?
    var xpToNext: Int?
}

nonisolated enum Ranks {
    struct Threshold {
        let rank: String
        let minXP: Int
        let emoji: String
    }

    static let thresholds: [Threshold] = [
        Threshold(rank: "Seedling", minXP: 0, emoji: "🌱"),
        Threshold(rank: "Sprout", minXP: 100, emoji: "🌿"),
        Threshold(rank: "Green Thumb", minXP: 500, emoji: "🪴"),
        Threshold(rank: "Plant Whisperer", minXP: 1500, emoji: "🌳"),
        Threshold(rank: "Master Botanist", minXP: 5000, emoji: "🏆"),
    ]

    static func forXP(_ xp: Int) -> RankInfo {
        for i in stride(from: thresholds.count - 1, through: 0, by: -1) {
            if xp >= thresholds[i].minXP {
                let current = thresholds[i]
                let next = i + 1 < thresholds.count ? thresholds[i + 1] : nil
                return RankInfo(
                    rank: current.rank,
                    emoji: current.emoji,
                    nextRank: next?.rank,
                    xpToNext: next.map { $0.minXP - xp }
                )
            }
        }
        let first = thresholds[0]
        return RankInfo(rank: first.rank, emoji: first.emoji, nextRank: nil, xpToNext: nil)
    }
}
