//
//  LeaderboardEntry.swift
//  PlantPassport
//

import Foundation

nonisolated struct LeaderboardEntry: Codable, Identifiable, Hashable {
    var id: String
    var rank: Int
    var userName: String
    var avatar: String
    var streak: Int
    var totalPlants: Int
    var isCurrentUser: Bool
    var weeklyStreak: Int?
}
