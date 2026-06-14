//
//  Theme.swift
//  PlantPassport
//
//  Apple-inspired light & dark theme palettes mirroring the design system.
//

import SwiftUI

/// A full set of semantic colors used across the app. Two concrete palettes
/// (light & dark) are provided and switched at runtime via `SettingsStore`.
struct ThemeColors {
    let primary: Color
    let primaryDark: Color
    let primaryMuted: Color
    let accent: Color
    let accentLight: Color
    let background: Color
    let backgroundWarm: Color
    let card: Color
    let cardBorder: Color
    let text: Color
    let textSecondary: Color
    let textTertiary: Color
    let success: Color
    let warning: Color
    let error: Color
    let streak: Color
    let streakGlow: Color
    let divider: Color
    let waterBlue: Color
    let humidityTeal: Color
    let gold: Color
    let silver: Color
    let bronze: Color
    let xpPurple: Color
    let inputBackground: Color
    let elevatedBackground: Color

    static let light = ThemeColors(
        primary: Color(hex: 0x30D158),
        primaryDark: Color(hex: 0x248A3D),
        primaryMuted: Color(hex: 0x30D158).opacity(0.12),
        accent: Color(hex: 0x007AFF),
        accentLight: Color(hex: 0x5AC8FA),
        background: Color(hex: 0xF2F2F7),
        backgroundWarm: Color(hex: 0xE5E5EA),
        card: Color.white,
        cardBorder: Color(hex: 0x3C3C43).opacity(0.06),
        text: Color(hex: 0x1C1C1E),
        textSecondary: Color(hex: 0x8E8E93),
        textTertiary: Color(hex: 0xC7C7CC),
        success: Color(hex: 0x34C759),
        warning: Color(hex: 0xFF9500),
        error: Color(hex: 0xFF3B30),
        streak: Color(hex: 0xFF9500),
        streakGlow: Color(hex: 0xFF9500).opacity(0.12),
        divider: Color(hex: 0x3C3C43).opacity(0.08),
        waterBlue: Color(hex: 0x007AFF),
        humidityTeal: Color(hex: 0x30B0C7),
        gold: Color(hex: 0xFFD60A),
        silver: Color(hex: 0x8E8E93),
        bronze: Color(hex: 0xAC8E68),
        xpPurple: Color(hex: 0xAF52DE),
        inputBackground: Color(hex: 0x3C3C43).opacity(0.06),
        elevatedBackground: Color(hex: 0xF5F5F7)
    )

    static let dark = ThemeColors(
        primary: Color(hex: 0x30D158),
        primaryDark: Color(hex: 0x248A3D),
        primaryMuted: Color(hex: 0x30D158).opacity(0.18),
        accent: Color(hex: 0x0A84FF),
        accentLight: Color(hex: 0x64D2FF),
        background: Color(hex: 0x000000),
        backgroundWarm: Color(hex: 0x1C1C1E),
        card: Color(hex: 0x1C1C1E),
        cardBorder: Color(hex: 0x545458).opacity(0.36),
        text: Color.white,
        textSecondary: Color(hex: 0xEBEBF5).opacity(0.6),
        textTertiary: Color(hex: 0xEBEBF5).opacity(0.3),
        success: Color(hex: 0x30D158),
        warning: Color(hex: 0xFF9F0A),
        error: Color(hex: 0xFF453A),
        streak: Color(hex: 0xFF9F0A),
        streakGlow: Color(hex: 0xFF9F0A).opacity(0.18),
        divider: Color(hex: 0x545458).opacity(0.36),
        waterBlue: Color(hex: 0x0A84FF),
        humidityTeal: Color(hex: 0x64D2FF),
        gold: Color(hex: 0xFFD60A),
        silver: Color(hex: 0x98989D),
        bronze: Color(hex: 0xAC8E68),
        xpPurple: Color(hex: 0xBF5AF2),
        inputBackground: Color(hex: 0x787880).opacity(0.24),
        elevatedBackground: Color(hex: 0x1C1C1E)
    )
}

extension Color {
    init(hex: UInt, alpha: Double = 1.0) {
        let r = Double((hex >> 16) & 0xFF) / 255.0
        let g = Double((hex >> 8) & 0xFF) / 255.0
        let b = Double(hex & 0xFF) / 255.0
        self.init(.sRGB, red: r, green: g, blue: b, opacity: alpha)
    }
}

private struct ThemeKey: EnvironmentKey {
    static let defaultValue: ThemeColors = .light
}

extension EnvironmentValues {
    var theme: ThemeColors {
        get { self[ThemeKey.self] }
        set { self[ThemeKey.self] = newValue }
    }
}
