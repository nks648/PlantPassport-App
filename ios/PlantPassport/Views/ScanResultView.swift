//
//  ScanResultView.swift
//  PlantPassport
//

import SwiftUI

struct ScanResultView: View {
    @Environment(\.theme) private var theme
    @Environment(\.dismiss) private var dismiss
    let payload: ScanResultPayload
    let store: PlantStore
    let settings: SettingsStore

    @State private var fillProgress: CGFloat = 0
    @State private var showAddedAlert = false
    @State private var alreadyExists = false

    private var confidenceColor: Color {
        if payload.confidence >= 70 { return theme.primary }
        if payload.confidence >= 40 { return theme.warning }
        return theme.error
    }

    private var confidenceLabel: String {
        if payload.confidence >= 80 { return "High confidence" }
        if payload.confidence >= 50 { return "Moderate confidence" }
        return "Low confidence"
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            theme.background.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 0) {
                    RemoteImage(url: payload.imageUri)
                        .frame(height: 300)
                        .frame(maxWidth: .infinity)
                        .clipped()
                        .overlay(alignment: .bottomLeading) {
                            HStack(spacing: 6) {
                                Image(systemName: "leaf.fill").font(.system(size: 14))
                                Text("Identified").font(.system(size: 13, weight: .semibold))
                            }
                            .foregroundStyle(.white)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background(theme.primary)
                            .clipShape(Capsule())
                            .padding(16)
                        }

                    card
                        .padding(.horizontal, 16)
                        .offset(y: -32)

                    Spacer().frame(height: 80)
                }
            }

            addBar
        }
        .navigationBarTitleDisplayMode(.inline)
        .alert(alreadyExists ? "Already Added" : "Plant Added!", isPresented: $showAddedAlert) {
            if alreadyExists {
                Button("OK", role: .cancel) {}
            } else {
                Button("View My Plants") { dismiss() }
            }
        } message: {
            Text(alreadyExists ? "\(payload.name) is already in your garden!" : "\(payload.name) has been added to your garden.")
        }
    }

    private var card: some View {
        VStack(alignment: .leading, spacing: 20) {
            VStack(alignment: .leading, spacing: 2) {
                Text(payload.name)
                    .font(.system(size: 26, weight: .bold))
                    .foregroundStyle(theme.text)
                Text(payload.species)
                    .font(.system(size: 15))
                    .italic()
                    .foregroundStyle(theme.textSecondary)
            }

            Rectangle().fill(theme.divider).frame(height: 0.5)

            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    HStack(spacing: 6) {
                        Image(systemName: "checkmark").font(.system(size: 14, weight: .bold))
                        Text(confidenceLabel).font(.system(size: 14, weight: .semibold))
                    }
                    .foregroundStyle(confidenceColor)
                    Spacer()
                    Text("\(payload.confidence)%")
                        .font(.system(size: 22, weight: .bold))
                        .foregroundStyle(confidenceColor)
                }
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule().fill(theme.inputBackground)
                        Capsule().fill(confidenceColor).frame(width: geo.size.width * fillProgress)
                    }
                }
                .frame(height: 8)
            }

            if !payload.notes.isEmpty {
                Rectangle().fill(theme.divider).frame(height: 0.5)
                VStack(alignment: .leading, spacing: 8) {
                    HStack(spacing: 6) {
                        Image(systemName: "info.circle").font(.system(size: 16)).foregroundStyle(theme.accent)
                        Text("NOTES").font(.system(size: 12, weight: .semibold)).tracking(1).foregroundStyle(theme.textSecondary)
                    }
                    Text(payload.notes)
                        .font(.system(size: 15))
                        .foregroundStyle(theme.text)
                        .lineSpacing(4)
                }
            }

            if !payload.possibleMatches.isEmpty {
                Rectangle().fill(theme.divider).frame(height: 0.5)
                Text("POSSIBLE MATCHES").font(.system(size: 12, weight: .semibold)).tracking(1).foregroundStyle(theme.textSecondary)
                VStack(spacing: 10) {
                    ForEach(Array(payload.possibleMatches.enumerated()), id: \.element.id) { index, match in
                        HStack(spacing: 12) {
                            Text("\(index + 1)")
                                .font(.system(size: 13, weight: .bold))
                                .foregroundStyle(theme.primary)
                                .frame(width: 28, height: 28)
                                .background(theme.primaryMuted)
                                .clipShape(Circle())
                            VStack(alignment: .leading, spacing: 1) {
                                Text(match.commonName).font(.system(size: 14, weight: .semibold)).foregroundStyle(theme.text)
                                Text(match.scientificName).font(.system(size: 12)).italic().foregroundStyle(theme.textSecondary)
                            }
                            Spacer()
                            Text("\(Int((match.confidence * 100).rounded()))%")
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(theme.textSecondary)
                        }
                        .padding(12)
                        .background(theme.background)
                        .clipShape(.rect(cornerRadius: 12))
                    }
                }
            }
        }
        .padding(24)
        .background(theme.card)
        .clipShape(.rect(cornerRadius: 20))
        .shadow(color: .black.opacity(0.08), radius: 16, x: 0, y: 4)
        .onAppear {
            withAnimation(.easeOut(duration: 0.8).delay(0.3)) {
                fillProgress = CGFloat(payload.confidence) / 100
            }
        }
    }

    private var addBar: some View {
        Button(action: addPlant) {
            HStack(spacing: 10) {
                Image(systemName: "plus")
                Text("Add to My Plants")
            }
            .font(.system(size: 17, weight: .semibold))
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(theme.primary)
            .clipShape(.rect(cornerRadius: 14))
        }
        .padding(.horizontal, 20)
        .padding(.top, 12)
        .padding(.bottom, 8)
        .background(theme.elevatedBackground)
    }

    private func addPlant() {
        let g = UINotificationFeedbackGenerator()
        g.notificationOccurred(.success)
        if store.plantExists(named: payload.name) {
            alreadyExists = true
            showAddedAlert = true
            return
        }
        let now = DateUtil.today()
        let plant = Plant(
            id: "plant_\(Int(Date().timeIntervalSince1970 * 1000))",
            name: payload.name,
            species: payload.species,
            image: payload.imageUri,
            health: 4,
            streak: 0,
            lastWatered: now,
            addedDate: now,
            notes: payload.notes.isEmpty ? [] : [payload.notes],
            needs: PlantNeeds(water: 3, light: 3, humidity: 3, idealTempMin: 60, idealTempMax: 80, easeOfCare: 3),
            wateringFrequencyDays: 3
        )
        store.addPlant(plant)
        alreadyExists = false
        showAddedAlert = true
    }
}
