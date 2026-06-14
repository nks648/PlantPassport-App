//
//  StreakBadge.swift
//  PlantPassport
//

import SwiftUI

/// A flame badge showing a watering streak length.
struct StreakBadge: View {
    @Environment(\.theme) private var theme
    var streak: Int
    var small: Bool = false

    var body: some View {
        HStack(spacing: small ? 3 : 4) {
            Image(systemName: "flame.fill")
                .font(.system(size: small ? 11 : 13))
                .foregroundStyle(theme.streak)
            Text("\(streak)")
                .font(.system(size: small ? 12 : 14, weight: .semibold))
                .foregroundStyle(theme.text)
        }
        .padding(.horizontal, small ? 8 : 10)
        .padding(.vertical, small ? 4 : 5)
        .background(theme.streakGlow)
        .clipShape(Capsule())
    }
}
