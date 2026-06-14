//
//  PlantInfoView.swift
//  PlantPassport
//

import SwiftUI

struct PlantInfoView: View {
    @Environment(\.theme) private var theme
    let plantId: String
    let store: PlantStore
    let settings: SettingsStore

    private var plant: Plant? { store.plants.first { $0.id == plantId } }

    var body: some View {
        Group {
            if let plant {
                ScrollView {
                    VStack(spacing: 16) {
                        header(plant)
                        PlantNeedsCard(needs: plant.needs, useCelsius: settings.useCelsius, showTitle: false)
                        careGuide(plant)
                        aboutSection(plant)
                    }
                    .padding(20)
                }
                .background(theme.background.ignoresSafeArea())
                .navigationTitle("\(plant.name) Info")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button(role: .destructive) {
                            store.removePlant(plant.id)
                        } label: {
                            Image(systemName: "trash")
                        }
                    }
                }
            } else {
                VStack(spacing: 12) {
                    Image(systemName: "leaf.fill")
                        .font(.system(size: 48))
                        .foregroundStyle(theme.textTertiary)
                    Text("Plant not found")
                        .foregroundStyle(theme.textTertiary)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(theme.background.ignoresSafeArea())
            }
        }
    }

    private func header(_ plant: Plant) -> some View {
        VStack(spacing: 12) {
            RemoteImage(url: plant.image)
                .frame(height: 200)
                .frame(maxWidth: .infinity)
                .clipShape(.rect(cornerRadius: 18))
            Text(plant.name)
                .font(.system(size: 24, weight: .bold))
                .foregroundStyle(theme.text)
            Text(plant.species)
                .font(.system(size: 14))
                .italic()
                .foregroundStyle(theme.textSecondary)
        }
    }

    private func careGuide(_ plant: Plant) -> some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 12) {
                Label("Care Instructions", systemImage: "sparkles")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(theme.text)
                ForEach(Array(careInstructions(for: plant).enumerated()), id: \.offset) { i, instruction in
                    HStack(alignment: .top, spacing: 12) {
                        Circle()
                            .fill(bulletColor(i))
                            .frame(width: 8, height: 8)
                            .padding(.top, 6)
                        Text(instruction)
                            .font(.system(size: 14))
                            .foregroundStyle(theme.textSecondary)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
            }
        }
    }

    private func aboutSection(_ plant: Plant) -> some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 12) {
                Label("About", systemImage: "book")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(theme.text)
                Text("\(plant.name) (\(plant.species)) is a popular houseplant known for its beautiful foliage. It thrives in indoor conditions and is a wonderful addition to any plant collection.")
                    .font(.system(size: 14))
                    .foregroundStyle(theme.textSecondary)
                    .lineSpacing(4)
                if !plant.notes.isEmpty {
                    HStack(alignment: .top, spacing: 12) {
                        Rectangle().fill(theme.primary).frame(width: 3).clipShape(Capsule())
                        VStack(alignment: .leading, spacing: 4) {
                            Text("YOUR OBSERVATIONS")
                                .font(.system(size: 11, weight: .semibold))
                                .tracking(0.6)
                                .foregroundStyle(theme.primary)
                            Text(plant.notes.joined(separator: ". "))
                                .font(.system(size: 13))
                                .italic()
                                .foregroundStyle(theme.textSecondary)
                        }
                    }
                    .padding(14)
                    .background(theme.primary.opacity(0.05))
                    .clipShape(.rect(cornerRadius: 12))
                }
            }
        }
    }

    private func careInstructions(for plant: Plant) -> [String] {
        [
            "Water when the top inch of soil feels dry",
            "Provide \(NeedLabels.at(NeedLabels.light, plant.needs.light).lowercased()) light for best growth",
            "Maintain humidity around \(NeedLabels.at(NeedLabels.humidity, plant.needs.humidity).lowercased()) levels",
            "Fertilize monthly during the growing season",
            "Wipe leaves regularly to remove dust",
        ]
    }

    private func bulletColor(_ index: Int) -> Color {
        let colors = [theme.waterBlue, theme.success, theme.warning, Color(hex: 0xFF6961), theme.primary]
        return colors[index % colors.count]
    }
}
