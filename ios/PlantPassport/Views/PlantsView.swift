//
//  PlantsView.swift
//  PlantPassport
//

import SwiftUI

struct PlantsView: View {
    @Environment(\.theme) private var theme
    let store: PlantStore
    let settings: SettingsStore

    @State private var expandedId: String?
    @State private var waterPlant: Plant?
    @State private var overwaterPlant: Plant?
    @State private var shareWin: (name: String, streak: Int)?
    @State private var showScan = false

    var body: some View {
        NavigationStack {
            ZStack(alignment: .bottomTrailing) {
                theme.background.ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("\(store.plants.count) plant\(store.plants.count == 1 ? "" : "s") in your garden")
                            .font(.system(size: 13))
                            .foregroundStyle(theme.textSecondary)
                            .padding(.bottom, 4)

                        ForEach(store.plants) { plant in
                            VStack(spacing: 0) {
                                NavigationLink(value: plant.id) {
                                    PlantRow(plant: plant) { handleWater(plant) }
                                }
                                .buttonStyle(.plain)

                                Button {
                                    withAnimation(.easeInOut(duration: 0.2)) {
                                        expandedId = expandedId == plant.id ? nil : plant.id
                                    }
                                } label: {
                                    HStack(spacing: 4) {
                                        Text(expandedId == plant.id ? "Hide Care Guide" : "View Care Guide")
                                            .font(.system(size: 13, weight: .medium))
                                        Image(systemName: "chevron.down")
                                            .font(.system(size: 12))
                                            .rotationEffect(.degrees(expandedId == plant.id ? 180 : 0))
                                    }
                                    .foregroundStyle(theme.primary)
                                    .padding(.vertical, 6)
                                }

                                if expandedId == plant.id {
                                    PlantNeedsCard(needs: plant.needs, useCelsius: settings.useCelsius)
                                        .padding(.bottom, 6)
                                }
                            }
                        }
                        Spacer().frame(height: 90)
                    }
                    .padding(20)
                }

                fab
            }
            .navigationTitle(settings.t("plants"))
            .navigationDestination(for: String.self) { id in
                PlantInfoView(plantId: id, store: store, settings: settings)
            }
            .navigationDestination(isPresented: $showScan) {
                ScanView(store: store, settings: settings)
            }
            .sheet(item: $waterPlant) { plant in
                WaterSheet(plant: plant) { health, note in
                    let result = store.waterPlant(plantId: plant.id, health: health, note: note.isEmpty ? nil : note)
                    waterPlant = nil
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
                        shareWin = (result.name, result.streak)
                    }
                }
            }
            .sheet(item: Binding(
                get: { shareWin.map { ShareWinPayload(name: $0.name, streak: $0.streak) } },
                set: { if $0 == nil { shareWin = nil } }
            )) { payload in
                ShareWinSheet(plantName: payload.name, streak: payload.streak) { text in
                    store.addCommunityPost(text: text, plantName: payload.name, streak: payload.streak)
                    shareWin = nil
                } onSkip: {
                    shareWin = nil
                }
            }
            .alert("Are you sure?", isPresented: Binding(
                get: { overwaterPlant != nil },
                set: { if !$0 { overwaterPlant = nil } }
            )) {
                Button("Not Now", role: .cancel) { overwaterPlant = nil }
                Button("Water Anyway") {
                    if let plant = overwaterPlant { waterPlant = plant }
                    overwaterPlant = nil
                }
            } message: {
                Text("\(overwaterPlant?.name ?? "This plant") was watered less than 24 hours ago. Overwatering can harm your plant.")
            }
        }
    }

    private func handleWater(_ plant: Plant) {
        if store.checkOverwatering(plant) {
            overwaterPlant = plant
        } else {
            waterPlant = plant
        }
    }

    private var fab: some View {
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

private struct ShareWinPayload: Identifiable {
    var id: String { name }
    let name: String
    let streak: Int
}

private struct PlantRow: View {
    @Environment(\.theme) private var theme
    let plant: Plant
    let onWater: () -> Void

    private var lastWateredText: String {
        let days = plant.daysSinceWatered
        if days == 0 { return "Today" }
        if days == 1 { return "Yesterday" }
        return "\(days)d ago"
    }

    var body: some View {
        HStack(spacing: 0) {
            RemoteImage(url: plant.image)
                .frame(width: 100, height: 140)
            VStack(alignment: .leading, spacing: 0) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(plant.name)
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundStyle(theme.text)
                            .lineLimit(1)
                        Text(plant.species)
                            .font(.system(size: 12))
                            .foregroundStyle(theme.textSecondary)
                            .lineLimit(1)
                    }
                    Spacer()
                    StreakBadge(streak: plant.streak, small: true)
                }
                Spacer()
                HStack {
                    HealthDots(health: plant.health)
                    Spacer()
                    Text(lastWateredText)
                        .font(.system(size: 12))
                        .foregroundStyle(theme.textSecondary)
                }
                Spacer()
                Button(action: onWater) {
                    HStack(spacing: 6) {
                        Image(systemName: "drop.fill").font(.system(size: 13))
                        Text("Water").font(.system(size: 14, weight: .semibold))
                    }
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .background(theme.accent)
                    .clipShape(Capsule())
                }
                .buttonStyle(.plain)
            }
            .padding(14)
        }
        .background(theme.card)
        .clipShape(.rect(cornerRadius: 16))
        .shadow(color: .black.opacity(0.04), radius: 10, x: 0, y: 1)
    }
}
