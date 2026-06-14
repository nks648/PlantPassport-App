//
//  WeatherWidget.swift
//  PlantPassport
//

import SwiftUI

private struct CareHint: Identifiable {
    let id = UUID()
    let message: String
    let type: HintType
    enum HintType { case warning, info, tip }
}

/// Home-screen weather card with a 5-day forecast plus contextual care hints.
struct WeatherWidget: View {
    @Environment(\.theme) private var theme
    let settings: SettingsStore

    @State private var weather: WeatherData?
    @State private var loading = true
    private let locationManager = LocationManager()

    var body: some View {
        VStack(spacing: 10) {
            if loading {
                GlassCard {
                    VStack(alignment: .leading, spacing: 10) {
                        RoundedRectangle(cornerRadius: 7).fill(theme.backgroundWarm).frame(width: 180, height: 14)
                        RoundedRectangle(cornerRadius: 7).fill(theme.backgroundWarm).frame(width: 110, height: 14)
                    }
                }
            } else if let weather {
                weatherCard(weather)
                ForEach(hints(for: weather)) { hint in
                    hintCard(hint)
                }
            }
        }
        .task {
            await load()
        }
    }

    private func weatherCard(_ weather: WeatherData) -> some View {
        GlassCard {
            VStack(spacing: 16) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("\(displayTemp(weather.tempC))\(unit)")
                            .font(.system(size: 36, weight: .bold))
                            .foregroundStyle(theme.text)
                        Text(weather.description)
                            .font(.system(size: 14, weight: .medium))
                            .foregroundStyle(theme.textSecondary)
                        Text(weather.city)
                            .font(.system(size: 12))
                            .foregroundStyle(theme.textTertiary)
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 6) {
                        Label("\(weather.humidity)%", systemImage: "drop.fill")
                            .labelStyle(.titleAndIcon)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(theme.textSecondary)
                        Label(windText(weather), systemImage: "wind")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(theme.textSecondary)
                    }
                }
                Divider().overlay(theme.divider)
                HStack {
                    ForEach(Array(weather.forecast.enumerated()), id: \.offset) { _, day in
                        VStack(spacing: 4) {
                            Text(day.day)
                                .font(.system(size: 11, weight: .medium))
                                .foregroundStyle(theme.textSecondary)
                            Text(day.condition.emoji)
                                .font(.system(size: 18))
                            Text("\(displayTemp(day.highC))°")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundStyle(theme.text)
                            Text("\(displayTemp(day.lowC))°")
                                .font(.system(size: 11))
                                .foregroundStyle(theme.textTertiary)
                        }
                        .frame(maxWidth: .infinity)
                    }
                }
            }
        }
    }

    private func hintCard(_ hint: CareHint) -> some View {
        GlassCard(padding: 14) {
            HStack(alignment: .top, spacing: 10) {
                ZStack {
                    RoundedRectangle(cornerRadius: 8)
                        .fill(hintTint(hint.type).opacity(0.12))
                        .frame(width: 28, height: 28)
                    Image(systemName: hintIcon(hint.type))
                        .font(.system(size: 14))
                        .foregroundStyle(hintTint(hint.type))
                }
                Text(hint.message)
                    .font(.system(size: 13))
                    .foregroundStyle(theme.text)
                    .fixedSize(horizontal: false, vertical: true)
                    .lineSpacing(3)
            }
        }
    }

    // MARK: - Helpers

    private func displayTemp(_ c: Int) -> Int {
        settings.useCelsius ? c : TempUtil.cToF(c)
    }
    private var unit: String { settings.useCelsius ? "°C" : "°F" }
    private func windText(_ w: WeatherData) -> String {
        settings.useCelsius ? "\(w.windSpeedKmh) km/h" : "\(Int((Double(w.windSpeedKmh) * 0.621).rounded())) mph"
    }

    private func hintTint(_ type: CareHint.HintType) -> Color {
        switch type {
        case .warning: return theme.warning
        case .info: return theme.accent
        case .tip: return theme.primary
        }
    }
    private func hintIcon(_ type: CareHint.HintType) -> String {
        switch type {
        case .warning: return "exclamationmark.triangle.fill"
        case .info: return "cloud.sun.fill"
        case .tip: return "thermometer.medium"
        }
    }

    private func hints(for weather: WeatherData) -> [CareHint] {
        var result: [CareHint] = []
        let avgHigh = weather.forecast.isEmpty ? 0 : Double(weather.forecast.map(\.highC).reduce(0, +)) / Double(weather.forecast.count)
        if avgHigh > 30 {
            result.append(CareHint(message: "Hot days ahead — water your plants more frequently and move sensitive ones away from direct sun.", type: .warning))
        } else if avgHigh > 24 {
            result.append(CareHint(message: "Warm week coming up. Check soil moisture daily and mist humidity-loving plants.", type: .tip))
        }
        if weather.humidity < 30 {
            result.append(CareHint(message: "Low humidity detected. Consider grouping plants together or using a pebble tray.", type: .info))
        } else if weather.humidity > 70 {
            result.append(CareHint(message: "High humidity — reduce watering for succulents and watch for fungal issues.", type: .info))
        }
        if weather.tempC < 10 {
            result.append(CareHint(message: "Cold snap! Move tropical plants away from windows and reduce watering.", type: .warning))
        }
        if weather.windSpeedKmh > 24 {
            result.append(CareHint(message: "Windy conditions. Secure outdoor plants and check for drying soil.", type: .tip))
        }
        if result.isEmpty {
            result.append(CareHint(message: "Perfect plant weather! Keep up your regular watering schedule.", type: .tip))
        }
        return result
    }

    private func load() async {
        if let coord = await locationManager.requestLocation() {
            weather = await WeatherService.fetch(lat: coord.latitude, lon: coord.longitude)
        } else {
            weather = WeatherData.fallback
        }
        loading = false
    }
}
