//
//  CommunityPostCard.swift
//  PlantPassport
//

import SwiftUI

/// A single community feed post with avatar, text and a like button.
struct CommunityPostCard: View {
    @Environment(\.theme) private var theme
    let post: CommunityPost
    let onLike: (String) -> Void

    var body: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 10) {
                    RemoteImage(url: post.avatar)
                        .frame(width: 40, height: 40)
                        .clipShape(Circle())
                    VStack(alignment: .leading, spacing: 2) {
                        Text(post.userName)
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(theme.text)
                        Text(post.timeAgo)
                            .font(.system(size: 12))
                            .foregroundStyle(theme.textSecondary)
                    }
                    Spacer()
                    if let streak = post.streak {
                        StreakBadge(streak: streak, small: true)
                    }
                }

                Text(post.text)
                    .font(.system(size: 14))
                    .foregroundStyle(theme.text)
                    .fixedSize(horizontal: false, vertical: true)
                    .lineSpacing(3)

                if let plantName = post.plantName, !plantName.isEmpty {
                    HStack(spacing: 5) {
                        Image(systemName: "leaf.fill")
                            .font(.system(size: 11))
                            .foregroundStyle(theme.primary)
                        Text(plantName)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(theme.primary)
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(theme.primaryMuted)
                    .clipShape(Capsule())
                }

                HStack(spacing: 20) {
                    Button {
                        let generator = UIImpactFeedbackGenerator(style: .light)
                        generator.impactOccurred()
                        onLike(post.id)
                    } label: {
                        HStack(spacing: 5) {
                            Image(systemName: post.liked ? "heart.fill" : "heart")
                                .font(.system(size: 15))
                                .foregroundStyle(post.liked ? theme.error : theme.textSecondary)
                            Text("\(post.likes)")
                                .font(.system(size: 13, weight: .medium))
                                .foregroundStyle(theme.textSecondary)
                        }
                    }
                    .buttonStyle(.plain)

                    HStack(spacing: 5) {
                        Image(systemName: "bubble.left")
                            .font(.system(size: 14))
                            .foregroundStyle(theme.textSecondary)
                        Text("\(post.comments)")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(theme.textSecondary)
                    }
                }
            }
        }
    }
}
