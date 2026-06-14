//
//  ActivityTimelineItem.swift
//  PlantPassport
//

import SwiftUI

/// A single row in the recent-activity timeline.
struct ActivityTimelineItem: View {
    @Environment(\.theme) private var theme
    let item: ActivityItem
    let isLast: Bool

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(spacing: 0) {
                ZStack {
                    Circle()
                        .fill(iconBackground)
                        .frame(width: 32, height: 32)
                    Image(systemName: iconName)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(iconColor)
                }
                if !isLast {
                    Rectangle()
                        .fill(theme.divider)
                        .frame(width: 1.5)
                        .frame(maxHeight: .infinity)
                }
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(item.description)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(theme.text)
                Text(relativeDate)
                    .font(.system(size: 12))
                    .foregroundStyle(theme.textSecondary)
            }
            .padding(.bottom, isLast ? 0 : 16)
            Spacer(minLength: 0)
        }
    }

    private var relativeDate: String {
        guard let date = DateUtil.parse(item.date) else { return item.date }
        let days = Int(Date().timeIntervalSince(date) / 86_400)
        if days <= 0 { return "Today" }
        if days == 1 { return "Yesterday" }
        return "\(days)d ago"
    }

    private var iconName: String {
        switch item.type {
        case .water: return "drop.fill"
        case .healthCheck: return "heart.fill"
        case .newPlant: return "leaf.fill"
        case .removePlant: return "trash.fill"
        case .streakMilestone: return "flame.fill"
        case .badgeEarned: return "rosette"
        case .levelUp: return "arrow.up.circle.fill"
        }
    }

    private var iconColor: Color {
        switch item.type {
        case .water: return theme.accent
        case .healthCheck: return theme.success
        case .newPlant: return theme.primary
        case .removePlant: return theme.error
        case .streakMilestone: return theme.streak
        case .badgeEarned: return theme.gold
        case .levelUp: return theme.xpPurple
        }
    }

    private var iconBackground: Color {
        iconColor.opacity(0.12)
    }
}
