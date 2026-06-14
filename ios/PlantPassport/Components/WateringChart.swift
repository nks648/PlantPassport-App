//
//  WateringChart.swift
//  PlantPassport
//

import SwiftUI

/// A 30-day watering consistency bar chart.
struct WateringChart: View {
    @Environment(\.theme) private var theme
    private let data = MockData.wateringChart

    private var percentage: Int {
        let watered = data.filter { $0 == 1 }.count
        return Int((Double(watered) / Double(data.count) * 100).rounded())
    }

    var body: some View {
        GlassCard(padding: 18) {
            VStack(alignment: .leading, spacing: 14) {
                HStack {
                    Text("30-Day Consistency")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(theme.text)
                    Spacer()
                    Text("\(percentage)%")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(theme.primary)
                        .clipShape(Capsule())
                }
                HStack(alignment: .bottom, spacing: 2) {
                    ForEach(Array(data.enumerated()), id: \.offset) { _, val in
                        RoundedRectangle(cornerRadius: 3)
                            .fill(val == 1 ? theme.primary : theme.inputBackground)
                            .frame(height: val == 1 ? 28 : 6)
                            .frame(maxWidth: .infinity)
                    }
                }
                .frame(height: 32, alignment: .bottom)
                HStack {
                    Text("30 days ago")
                    Spacer()
                    Text("Today")
                }
                .font(.system(size: 11))
                .foregroundStyle(theme.textSecondary)
            }
        }
    }
}
