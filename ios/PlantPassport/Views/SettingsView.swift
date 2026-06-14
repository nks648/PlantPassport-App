//
//  SettingsView.swift
//  PlantPassport
//

import SwiftUI

struct SettingsView: View {
    @Environment(\.theme) private var theme
    let settings: SettingsStore

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    section(settings.t("temperature").uppercased())
                    GlassCard(padding: 0) {
                        VStack(spacing: 0) {
                            optionRow(icon: "iphone", tint: theme.accent, label: settings.t("auto"), selected: settings.temperatureUnit == .auto, last: false) { settings.temperatureUnit = .auto }
                            divider
                            optionRow(icon: "thermometer.medium", tint: theme.primary, label: settings.t("celsius"), selected: settings.temperatureUnit == .celsius, last: false) { settings.temperatureUnit = .celsius }
                            divider
                            optionRow(icon: "thermometer.high", tint: theme.streak, label: settings.t("fahrenheit"), selected: settings.temperatureUnit == .fahrenheit, last: true) { settings.temperatureUnit = .fahrenheit }
                        }
                    }

                    section(settings.t("language").uppercased())
                    GlassCard(padding: 0) {
                        VStack(spacing: 0) {
                            optionRow(emoji: "🇺🇸", label: settings.t("english"), selected: settings.language == .en, last: false) { settings.language = .en }
                            divider
                            optionRow(emoji: "🇪🇸", label: settings.t("spanish"), selected: settings.language == .es, last: false) { settings.language = .es }
                            divider
                            optionRow(emoji: "🇧🇷", label: settings.t("portuguese"), selected: settings.language == .pt, last: true) { settings.language = .pt }
                        }
                    }

                    section(settings.t("theme").uppercased())
                    GlassCard(padding: 0) {
                        VStack(spacing: 0) {
                            optionRow(icon: "sun.max.fill", tint: theme.warning, label: settings.t("light"), selected: settings.themeMode == .light, last: false) { settings.themeMode = .light }
                            divider
                            optionRow(icon: "moon.fill", tint: theme.xpPurple, label: settings.t("dark"), selected: settings.themeMode == .dark, last: false) { settings.themeMode = .dark }
                            divider
                            optionRow(icon: "iphone", tint: theme.accent, label: settings.t("system"), selected: settings.themeMode == .system, last: true) { settings.themeMode = .system }
                        }
                    }

                    Text("Plant Passport v1.0")
                        .font(.system(size: 12))
                        .foregroundStyle(theme.textTertiary)
                        .frame(maxWidth: .infinity)
                        .padding(.top, 40)
                }
                .padding(20)
            }
            .background(theme.background.ignoresSafeArea())
            .navigationTitle(settings.t("settings"))
            .navigationBarTitleDisplayMode(.large)
        }
    }

    private var divider: some View {
        Rectangle().fill(theme.divider).frame(height: 0.5).padding(.leading, 60)
    }

    private func section(_ title: String) -> some View {
        Text(title)
            .font(.system(size: 13, weight: .semibold))
            .tracking(0.5)
            .foregroundStyle(theme.textSecondary)
            .padding(.top, 24)
            .padding(.bottom, 8)
            .padding(.leading, 4)
    }

    private func optionRow(icon: String? = nil, tint: Color = .clear, emoji: String? = nil, label: String, selected: Bool, last: Bool, action: @escaping () -> Void) -> some View {
        Button {
            let g = UIImpactFeedbackGenerator(style: .light)
            g.impactOccurred()
            withAnimation(.easeInOut(duration: 0.2)) { action() }
        } label: {
            HStack(spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: 8).fill(theme.inputBackground).frame(width: 32, height: 32)
                    if let icon {
                        Image(systemName: icon).font(.system(size: 16)).foregroundStyle(tint)
                    } else if let emoji {
                        Text(emoji).font(.system(size: 18))
                    }
                }
                Text(label)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundStyle(theme.text)
                Spacer()
                if selected {
                    Image(systemName: "checkmark")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(width: 24, height: 24)
                        .background(theme.primary)
                        .clipShape(Circle())
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .contentShape(.rect)
        }
        .buttonStyle(.plain)
    }
}
