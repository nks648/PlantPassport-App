//
//  NeedBar.swift
//  PlantPassport
//

import SwiftUI

/// A five-segment level bar for a care attribute.
struct NeedBar: View {
    @Environment(\.theme) private var theme
    var level: Int
    var color: Color

    var body: some View {
        HStack(spacing: 4) {
            ForEach(1...5, id: \.self) { i in
                RoundedRectangle(cornerRadius: 3)
                    .fill(i <= level ? color.opacity(0.85 + Double(i) * 0.03) : theme.inputBackground)
                    .frame(height: 6)
            }
        }
    }
}

nonisolated enum NeedLabels {
    static let water = ["", "Very Low", "Low", "Moderate", "High", "Very High"]
    static let light = ["", "Low Light", "Partial Shade", "Indirect", "Bright", "Full Sun"]
    static let humidity = ["", "Very Dry", "Low", "Average", "Humid", "Tropical"]
    static let ease = ["", "Expert", "Advanced", "Intermediate", "Easy", "Beginner"]

    static func at(_ list: [String], _ index: Int) -> String {
        guard index >= 0, index < list.count else { return "" }
        return list[index]
    }
}
