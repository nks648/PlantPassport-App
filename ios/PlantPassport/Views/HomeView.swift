//
//  HomeView.swift
//  PlantPassport
//

import SwiftUI

struct HomeView: View {
    @Environment(\.theme) private var theme
    let store: PlantStore
    let settings: SettingsStore

    @State private var showScan = false

    private var greeting: String {
        let hour = Calendar.current.component(.hour, from: Date())
        if hour < 12 { return "Good morning" }
        if hour < 17 { return "Good afternoon" }
        return "Good evening"
    }

    var body: some View {
        NavigationStack {
            ZStack(alignment: .bottomTrailing) {
                theme.background.ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        header
                        xpBar
                        statsRow
                        sectionTitle("Weather & Care")
                        WeatherWidget(settings: settings)
                        Spacer().frame(height: 16)
                        WateringChart()

                        if !store.plantsNeedingWater.isEmpty {
                            needsAttention
                        }

                        sectionTitle("Recent Activity")
                        GlassCard {
                            VStack(spacing: 0) {
                                let items = Array(store.activities.prefix(6))
                                ForEach(Array(items.enumerated()), id: \.element.id) { index, item in
                                    ActivityTimelineItem(item: item, isLast: index == items.count - 1)
                                }
                            }
                        }
                        Spacer().frame(height: 90)
                    }
                    .padding(20)
                }

                scanFab
            }
            .navigationDestination(isPresented: $showScan) {
                ScanView(store: store, settings: settings)
            }
            .navigationBarHidden(true)
        }
    }

    private var header: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 0) {
                Text("\(greeting),")
                    .font(.system(size: 15))
                    .foregroundStyle(theme.textSecondary)
                Text(store.userProfile.name.components(separatedBy: " ").first ?? store.userProfile.name)
                    .font(.system(size: 30, weight: .bold))
                    .foregroundStyle(theme.text)
                HStack(spacing: 6) {
                    Text(store.rankInfo.emoji)
                    Text(store.rankInfo.rank)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(theme.textSecondary)
                    HStack(spacing: 3) {
                        Image(systemName: "bolt.fill").font(.system(size: 10))
                        Text("\(store.userProfile.xp) XP").font(.system(size: 11, weight: .semibold))
                    }
                    .foregroundStyle(theme.accent)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(theme.accent.opacity(0.1))
                    .clipShape(Capsule())
                }
                .padding(.top, 4)
            }
            Spacer()
            RemoteImage(url: store.userProfile.avatar)
                .frame(width: 48, height: 48)
                .clipShape(Circle())
                .overlay(Circle().stroke(theme.primary.opacity(0.2), lineWidth: 2))
        }
    }

    @ViewBuilder
    private var xpBar: some View {
        if let xpToNext = store.rankInfo.xpToNext, let nextRank = store.rankInfo.nextRank {
            let fraction = Double(store.userProfile.xp) / Double(store.userProfile.xp + xpToNext)
            VStack(alignment: .trailing, spacing: 4) {
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule().fill(theme.inputBackground)
                        Capsule().fill(theme.accent)
                            .frame(width: geo.size.width * min(fraction, 1))
                    }
                }
                .frame(height: 4)
                Text("\(xpToNext) XP to \(nextRank)")
                    .font(.system(size: 11))
                    .foregroundStyle(theme.textSecondary)
            }
            .padding(.top, 14)
        }
    }

    private var statsRow: some View {
        HStack(spacing: 12) {
            statCard(icon: "leaf.fill", iconBg: theme.primaryMuted, iconColor: theme.primary, value: "\(store.plants.count)", label: "My Plants")
            statCard(icon: "flame.fill", iconBg: theme.streakGlow, iconColor: theme.streak, value: "\(store.averageStreak)", label: "Avg Streak")
        }
        .padding(.top, 20)
    }

    private func statCard(icon: String, iconBg: Color, iconColor: Color, value: String, label: String) -> some View {
        GlassCard {
            VStack(spacing: 0) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12).fill(iconBg).frame(width: 40, height: 40)
                    Image(systemName: icon).font(.system(size: 18)).foregroundStyle(iconColor)
                }
                .padding(.bottom, 10)
                Text(value).font(.system(size: 28, weight: .bold)).foregroundStyle(theme.text)
                Text(label).font(.system(size: 12)).foregroundStyle(theme.textSecondary)
            }
            .frame(maxWidth: .infinity)
        }
    }

    private func sectionTitle(_ title: String) -> some View {
        Text(title)
            .font(.system(size: 20, weight: .semibold))
            .foregroundStyle(theme.text)
            .padding(.top, 24)
            .padding(.bottom, 12)
    }

    private var needsAttention: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 8) {
                Text("Needs Attention")
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundStyle(theme.text)
                Text("\(store.plantsNeedingWater.count)")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(width: 22, height: 22)
                    .background(theme.error)
                    .clipShape(Circle())
            }
            .padding(.top, 24)
            .padding(.bottom, 12)

            GlassCard(padding: 4) {
                VStack(spacing: 0) {
                    let items = store.plantsNeedingWater
                    ForEach(Array(items.enumerated()), id: \.element.id) { index, plant in
                        HStack(spacing: 12) {
                            RemoteImage(url: plant.image)
                                .frame(width: 44, height: 44)
                                .clipShape(.rect(cornerRadius: 12))
                            VStack(alignment: .leading, spacing: 2) {
                                Text(plant.name).font(.system(size: 15, weight: .semibold)).foregroundStyle(theme.text)
                                Text("Last watered \(plant.daysSinceWatered)d ago")
                                    .font(.system(size: 13)).foregroundStyle(theme.warning)
                            }
                            Spacer()
                            ZStack {
                                Circle().fill(theme.accent.opacity(0.1)).frame(width: 36, height: 36)
                                Image(systemName: "drop.fill").font(.system(size: 14)).foregroundStyle(theme.accent)
                            }
                        }
                        .padding(12)
                        if index < items.count - 1 {
                            Rectangle().fill(theme.divider).frame(height: 0.5).padding(.leading, 12)
                        }
                    }
                }
            }
        }
    }

    private var scanFab: some View {
        Button {
            let g = UIImpactFeedbackGenerator(style: .medium)
            g.impactOccurred()
            showScan = true
        } label: {
            Image(systemName: "plus")
                .font(.system(size: 24, weight: .bold))
                .foregroundStyle(.white)
                .frame(width: 56, height: 56)
                .background(theme.primary)
                .clipShape(Circle())
                .shadow(color: theme.primary.opacity(0.4), radius: 12, x: 0, y: 4)
        }
        .padding(.trailing, 20)
        .padding(.bottom, 24)
    }
}
