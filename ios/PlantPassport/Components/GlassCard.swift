//
//  GlassCard.swift
//  PlantPassport
//

import SwiftUI

/// A soft, elevated card surface used throughout the app.
struct GlassCard<Content: View>: View {
    @Environment(\.theme) private var theme
    var padding: CGFloat = 16
    @ViewBuilder var content: () -> Content

    var body: some View {
        content()
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(theme.card)
            .clipShape(.rect(cornerRadius: 16))
            .shadow(color: .black.opacity(0.05), radius: 10, x: 0, y: 1)
    }
}
