//
//  CommunityPost.swift
//  PlantPassport
//

import Foundation

nonisolated struct CommunityPost: Codable, Identifiable, Hashable {
    var id: String
    var userId: String
    var userName: String
    var avatar: String
    var text: String
    var plantName: String?
    var streak: Int?
    var likes: Int
    var comments: Int
    var timeAgo: String
    var liked: Bool
}
