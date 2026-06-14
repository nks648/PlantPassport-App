//
//  WaterSheet.swift
//  PlantPassport
//

import SwiftUI

/// Bottom sheet to log watering: pick a health rating and an optional note.
struct WaterSheet: View {
    @Environment(\.theme) private var theme
    @Environment(\.dismiss) private var dismiss
    let plant: Plant
    let onConfirm: (Int, String) -> Void

    @State private var health: Int
    @State private var note: String = ""

    init(plant: Plant, onConfirm: @escaping (Int, String) -> Void) {
        self.plant = plant
        self.onConfirm = onConfirm
        _health = State(initialValue: plant.health)
    }

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(spacing: 24) {
                    HStack(spacing: 14) {
                        RemoteImage(url: plant.image)
                            .frame(width: 56, height: 56)
                            .clipShape(.rect(cornerRadius: 14))
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Water \(plant.name)")
                                .font(.system(size: 20, weight: .bold))
                                .foregroundStyle(theme.text)
                            Text(plant.species)
                                .font(.system(size: 13))
                                .foregroundStyle(theme.textSecondary)
                        }
                        Spacer()
                    }

                    VStack(alignment: .leading, spacing: 12) {
                        Text("How healthy does it look?")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(theme.text)
                        HStack {
                            HealthDots(health: health, interactive: true, size: 28) { value in
                                let g = UIImpactFeedbackGenerator(style: .light)
                                g.impactOccurred()
                                health = value
                            }
                            Spacer()
                            Text(healthLabel)
                                .font(.system(size: 14, weight: .medium))
                                .foregroundStyle(theme.textSecondary)
                        }
                    }
                    .padding(16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(theme.inputBackground)
                    .clipShape(.rect(cornerRadius: 14))

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Add a note (optional)")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(theme.text)
                        TextField("e.g. Soil was bone dry", text: $note, axis: .vertical)
                            .lineLimit(3...5)
                            .font(.system(size: 15))
                            .foregroundStyle(theme.text)
                            .padding(14)
                            .background(theme.inputBackground)
                            .clipShape(.rect(cornerRadius: 14))
                    }
                }
                .padding(20)
            }

            Button {
                let g = UINotificationFeedbackGenerator()
                g.notificationOccurred(.success)
                onConfirm(health, note)
            } label: {
                HStack(spacing: 10) {
                    Image(systemName: "drop.fill")
                    Text("Log Watering")
                }
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(theme.accent)
                .clipShape(.rect(cornerRadius: 14))
            }
            .padding(20)
        }
        .presentationDetents([.medium, .large])
        .presentationContentInteraction(.scrolls)
    }

    private var healthLabel: String {
        switch health {
        case 1: return "Struggling"
        case 2: return "Needs care"
        case 3: return "Okay"
        case 4: return "Healthy"
        default: return "Thriving"
        }
    }
}
