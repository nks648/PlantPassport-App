//
//  HealthDots.swift
//  PlantPassport
//

import SwiftUI

/// Five colored dots representing a plant's health (1–5). Optionally tappable.
struct HealthDots: View {
    @Environment(\.theme) private var theme
    var health: Int
    var interactive: Bool = false
    var size: CGFloat = 10
    var onSelect: ((Int) -> Void)? = nil

    var body: some View {
        HStack(spacing: 5) {
            ForEach(1...5, id: \.self) { dot in
                let filled = dot <= health
                Circle()
                    .fill(color(for: dot, filled: filled))
                    .frame(width: size, height: size)
                    .contentShape(.rect)
                    .onTapGesture {
                        if interactive { onSelect?(dot) }
                    }
                    .allowsHitTesting(interactive)
            }
        }
    }

    private func color(for index: Int, filled: Bool) -> Color {
        guard filled else { return theme.inputBackground }
        if index <= 2 { return theme.error }
        if index <= 3 { return theme.warning }
        return theme.success
    }
}
