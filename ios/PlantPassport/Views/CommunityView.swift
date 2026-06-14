//
//  CommunityView.swift
//  PlantPassport
//

import SwiftUI

private enum CommunityTab: String, CaseIterable {
    case community, ranks
}

private enum TimeFilter {
    case allTime, weekly
}

struct CommunityView: View {
    @Environment(\.theme) private var theme
    let store: PlantStore
    let settings: SettingsStore

    @State private var tab: CommunityTab = .community
    @State private var filter: TimeFilter = .allTime
    @State private var composeText = ""
    @State private var showCompose = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                segmented
                if tab == .community {
                    feed
                } else {
                    ranks
                }
            }
            .background(theme.background.ignoresSafeArea())
            .navigationTitle(settings.t("community"))
            .navigationBarTitleDisplayMode(.inline)
            .sheet(isPresented: $showCompose) {
                composeSheet
            }
        }
    }

    private var segmented: some View {
        HStack(spacing: 0) {
            ForEach(CommunityTab.allCases, id: \.self) { item in
                Button {
                    let g = UIImpactFeedbackGenerator(style: .light)
                    g.impactOccurred()
                    withAnimation(.easeInOut(duration: 0.2)) { tab = item }
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: item == .community ? "person.2.fill" : "trophy.fill")
                            .font(.system(size: 15))
                        Text(item == .community ? settings.t("community") : settings.t("ranks"))
                            .font(.system(size: 14, weight: .semibold))
                    }
                    .foregroundStyle(tab == item ? .white : theme.textSecondary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(tab == item ? theme.primary : .clear)
                    .clipShape(.rect(cornerRadius: 10))
                }
            }
        }
        .padding(3)
        .background(theme.inputBackground)
        .clipShape(.rect(cornerRadius: 12))
        .padding(.horizontal, 20)
        .padding(.top, 8)
    }

    private var feed: some View {
        ScrollView {
            VStack(spacing: 12) {
                Button {
                    composeText = ""
                    showCompose = true
                } label: {
                    Text(settings.t("shareYourWin"))
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(theme.primary)
                        .clipShape(.rect(cornerRadius: 14))
                }
                .padding(.bottom, 8)

                ForEach(store.communityPosts) { post in
                    CommunityPostCard(post: post) { id in store.toggleLike(id) }
                }
            }
            .padding(20)
        }
    }

    private var sortedLeaderboard: [LeaderboardEntry] {
        MockData.leaderboard
            .sorted { a, b in
                let av = filter == .weekly ? (a.weeklyStreak ?? 0) : a.streak
                let bv = filter == .weekly ? (b.weeklyStreak ?? 0) : b.streak
                return av > bv
            }
            .enumerated()
            .map { idx, entry in
                var e = entry
                e.rank = idx + 1
                return e
            }
    }

    private func streakValue(_ entry: LeaderboardEntry) -> Int {
        filter == .weekly ? (entry.weeklyStreak ?? 0) : entry.streak
    }

    private var ranks: some View {
        let sorted = sortedLeaderboard
        let top3 = Array(sorted.prefix(3))
        let rest = Array(sorted.dropFirst(3))
        let currentUser = sorted.first { $0.isCurrentUser }
        let medalColors = [theme.gold, theme.silver, theme.bronze]

        return ScrollView {
            VStack(spacing: 16) {
                HStack(spacing: 4) {
                    filterButton(settings.t("allTime"), active: filter == .allTime) { filter = .allTime }
                    filterButton(settings.t("thisWeek"), active: filter == .weekly) { filter = .weekly }
                }
                .padding(2)
                .background(theme.inputBackground)
                .clipShape(.rect(cornerRadius: 10))

                HStack(alignment: .bottom, spacing: 12) {
                    ForEach([1, 0, 2], id: \.self) { idx in
                        if idx < top3.count {
                            podiumItem(top3[idx], medal: medalColors[idx], isFirst: idx == 0)
                        }
                    }
                }
                .padding(.vertical, 8)

                ForEach(rest) { entry in
                    leaderboardRow(entry, isUser: entry.isCurrentUser)
                }

                if let currentUser, currentUser.rank > 3 {
                    HStack(spacing: 10) {
                        Rectangle().fill(theme.divider).frame(height: 0.5)
                        Text("Your Rank").font(.system(size: 12, weight: .medium)).foregroundStyle(theme.textSecondary)
                        Rectangle().fill(theme.divider).frame(height: 0.5)
                    }
                    leaderboardRow(currentUser, isUser: true)
                }
            }
            .padding(20)
        }
    }

    private func filterButton(_ title: String, active: Bool, action: @escaping () -> Void) -> some View {
        Button {
            let g = UIImpactFeedbackGenerator(style: .light)
            g.impactOccurred()
            action()
        } label: {
            Text(title)
                .font(.system(size: 14, weight: active ? .semibold : .medium))
                .foregroundStyle(active ? theme.text : theme.textSecondary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .background(active ? theme.card : .clear)
                .clipShape(.rect(cornerRadius: 8))
        }
    }

    private func podiumItem(_ entry: LeaderboardEntry, medal: Color, isFirst: Bool) -> some View {
        VStack(spacing: 4) {
            ZStack(alignment: .bottomTrailing) {
                RemoteImage(url: entry.avatar)
                    .frame(width: 56, height: 56)
                    .clipShape(Circle())
                    .overlay(Circle().stroke(medal, lineWidth: 3).padding(-3))
                Text("\(entry.rank)")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(Color(hex: 0x1C1C1E))
                    .frame(width: 22, height: 22)
                    .background(medal)
                    .clipShape(Circle())
                    .offset(x: 4, y: 4)
            }
            .padding(.bottom, isFirst ? 0 : 0)
            Text(entry.userName)
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(theme.text)
                .lineLimit(1)
            HStack(spacing: 3) {
                Image(systemName: "flame.fill").font(.system(size: 12)).foregroundStyle(theme.streak)
                Text("\(streakValue(entry))").font(.system(size: 13, weight: .semibold)).foregroundStyle(theme.text)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.top, isFirst ? 0 : 16)
    }

    private func leaderboardRow(_ entry: LeaderboardEntry, isUser: Bool) -> some View {
        HStack(spacing: 0) {
            Text("\(entry.rank)")
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(isUser ? theme.primary : theme.textSecondary)
                .frame(width: 28)
            RemoteImage(url: entry.avatar)
                .frame(width: 40, height: 40)
                .clipShape(Circle())
                .padding(.leading, 8)
            VStack(alignment: .leading, spacing: 2) {
                Text(entry.userName + (isUser ? " (You)" : ""))
                    .font(.system(size: 14, weight: isUser ? .semibold : .medium))
                    .foregroundStyle(isUser ? theme.primary : theme.text)
                HStack(spacing: 4) {
                    Image(systemName: "leaf.fill").font(.system(size: 11)).foregroundStyle(theme.textSecondary)
                    Text("\(entry.totalPlants) plants").font(.system(size: 12)).foregroundStyle(theme.textSecondary)
                }
            }
            .padding(.leading, 12)
            Spacer()
            HStack(spacing: 4) {
                Image(systemName: "flame.fill").font(.system(size: 14)).foregroundStyle(theme.streak)
                Text("\(streakValue(entry))").font(.system(size: 14, weight: .semibold)).foregroundStyle(theme.text)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background(theme.streakGlow)
            .clipShape(Capsule())
        }
        .padding(14)
        .background(isUser ? theme.primary.opacity(0.05) : theme.card)
        .clipShape(.rect(cornerRadius: 16))
        .overlay {
            if isUser {
                RoundedRectangle(cornerRadius: 16).stroke(theme.primary.opacity(0.2), lineWidth: 1)
            }
        }
        .shadow(color: .black.opacity(0.04), radius: 10, x: 0, y: 1)
    }

    private var composeSheet: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 0) {
                TextField("Share your plant win with the community...", text: $composeText, axis: .vertical)
                    .lineLimit(5...10)
                    .font(.system(size: 15))
                    .foregroundStyle(theme.text)
                    .padding(16)
                    .background(theme.inputBackground)
                    .clipShape(.rect(cornerRadius: 12))
                    .padding(20)
                Spacer()
            }
            .background(theme.background.ignoresSafeArea())
            .navigationTitle(settings.t("newPost"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { showCompose = false }
                        .foregroundStyle(theme.textSecondary)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Post") {
                        let g = UINotificationFeedbackGenerator()
                        g.notificationOccurred(.success)
                        store.addCommunityPost(text: composeText.trimmingCharacters(in: .whitespacesAndNewlines), plantName: "", streak: 0)
                        showCompose = false
                    }
                    .fontWeight(.semibold)
                    .disabled(composeText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}
