//
//  Plant.swift
//  PlantPassport
//

import Foundation

/// Care requirement scores for a plant. Temperatures are stored in Fahrenheit.
nonisolated struct PlantNeeds: Codable, Hashable {
    var water: Int
    var light: Int
    var humidity: Int
    var idealTempMin: Int
    var idealTempMax: Int
    var easeOfCare: Int
}

nonisolated struct Plant: Codable, Identifiable, Hashable {
    var id: String
    var name: String
    var species: String
    var image: String
    var health: Int
    var streak: Int
    var lastWatered: String
    var addedDate: String
    var notes: [String]
    var needs: PlantNeeds
    var wateringFrequencyDays: Int

    /// Days since the plant was last watered.
    var daysSinceWatered: Int {
        guard let last = DateUtil.parse(lastWatered) else { return 0 }
        let seconds = Date().timeIntervalSince(last)
        return max(0, Int(seconds / 86_400))
    }

    var needsWater: Bool {
        daysSinceWatered >= wateringFrequencyDays
    }
}

/// Lightweight date helpers for the `yyyy-MM-dd` strings used throughout.
nonisolated enum DateUtil {
    static let formatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone(identifier: "UTC")
        return f
    }()

    static func parse(_ string: String) -> Date? {
        formatter.date(from: string)
    }

    static func today() -> String {
        formatter.string(from: Date())
    }
}
