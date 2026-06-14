//
//  ActivityItem.swift
//  PlantPassport
//

import Foundation

nonisolated enum ActivityType: String, Codable {
    case water
    case healthCheck = "health_check"
    case newPlant = "new_plant"
    case removePlant = "remove_plant"
    case streakMilestone = "streak_milestone"
    case badgeEarned = "badge_earned"
    case levelUp = "level_up"
}

nonisolated struct ActivityItem: Codable, Identifiable, Hashable {
    var id: String
    var type: ActivityType
    var plantName: String
    var date: String
    var description: String
}
