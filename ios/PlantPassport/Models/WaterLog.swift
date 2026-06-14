//
//  WaterLog.swift
//  PlantPassport
//

import Foundation

nonisolated struct WaterLog: Codable, Identifiable, Hashable {
    var id: String
    var plantId: String
    var plantName: String
    var date: String
    var health: Int
    var note: String?
}
