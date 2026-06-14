//
//  ProfileView.swift
//  PlantPassport
//

import SwiftUI
import PhotosUI

private struct LocationCareAdvice: Identifiable {
    let id = UUID()
    let title: String
    let message: String
    let type: HintType
    enum HintType { case warning, info, tip }
}

struct ProfileView: View {
    @Environment(\.theme) private var theme
    let store: PlantStore
    let settings: SettingsStore

    @State private var isEditing = false
    @State private var editName = ""
    @State private var weather: WeatherData?
    @State private var loading = true
    @State private var photoItem: PhotosPickerItem?
    private let locationManager = LocationManager()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    profileCard
                    statsGrid
                    if let weather, !loading {
                        locationSection(weather)
                    }
                    healthOverview
                    Spacer().frame(height: 20)
                }
                .padding(20)
            }
            .background(theme.background.ignoresSafeArea())
            .navigationTitle("Plant Passport")
            .navigationBarTitleDisplayMode(.inline)
            .task { await loadLocation() }
            .onChange(of: photoItem) { _, newItem in
                Task { await loadAvatar(newItem) }
            }
        }
    }

    private var rankInfo: RankInfo { store.rankInfo }

    private var profileCard: some View {
        GlassCard(padding: 20) {
            VStack(spacing: 16) {
                HStack(spacing: 16) {
                    PhotosPicker(selection: $photoItem, matching: .images) {
                        ZStack(alignment: .bottomTrailing) {
                            RemoteImage(url: store.userProfile.avatar)
                                .frame(width: 68, height: 68)
                                .clipShape(Circle())
                                .overlay(Circle().stroke(theme.primary.opacity(0.2), lineWidth: 3))
                            Image(systemName: "camera.fill")
                                .font(.system(size: 11))
                                .foregroundStyle(.white)
                                .frame(width: 26, height: 26)
                                .background(theme.primary)
                                .clipShape(Circle())
                                .overlay(Circle().stroke(theme.card, lineWidth: 2))
                        }
                    }
                    VStack(alignment: .leading, spacing: 6) {
                        if isEditing {
                            HStack(spacing: 6) {
                                TextField("Name", text: $editName)
                                    .font(.system(size: 18, weight: .semibold))
                                    .foregroundStyle(theme.text)
                                Button {
                                    let name = editName.trimmingCharacters(in: .whitespaces)
                                    if !name.isEmpty { store.updateProfile(name: name) }
                                    isEditing = false
                                } label: {
                                    Image(systemName: "checkmark").foregroundStyle(theme.primary)
                                }
                                Button {
                                    isEditing = false
                                } label: {
                                    Image(systemName: "xmark").foregroundStyle(theme.error)
                                }
                            }
                        } else {
                            HStack(spacing: 8) {
                                Text(store.userProfile.name)
                                    .font(.system(size: 22, weight: .bold))
                                    .foregroundStyle(theme.text)
                                Button {
                                    editName = store.userProfile.name
                                    isEditing = true
                                } label: {
                                    Image(systemName: "pencil")
                                        .font(.system(size: 12))
                                        .foregroundStyle(theme.textSecondary)
                                        .frame(width: 28, height: 28)
                                        .background(theme.inputBackground)
                                        .clipShape(Circle())
                                }
                            }
                        }
                        HStack(spacing: 5) {
                            Text(rankInfo.emoji)
                            Text(rankInfo.rank)
                                .font(.system(size: 14, weight: .medium))
                                .foregroundStyle(theme.textSecondary)
                        }
                    }
                    Spacer()
                }

                if let xpToNext = rankInfo.xpToNext, let nextRank = rankInfo.nextRank {
                    let fraction = Double(store.userProfile.xp) / Double(store.userProfile.xp + xpToNext)
                    VStack(spacing: 6) {
                        GeometryReader { geo in
                            ZStack(alignment: .leading) {
                                Capsule().fill(theme.inputBackground)
                                Capsule().fill(theme.accent).frame(width: geo.size.width * min(fraction, 1))
                            }
                        }
                        .frame(height: 6)
                        HStack {
                            HStack(spacing: 3) {
                                Image(systemName: "bolt.fill").font(.system(size: 10))
                                Text("\(store.userProfile.xp) XP").font(.system(size: 12, weight: .semibold))
                            }
                            .foregroundStyle(theme.accent)
                            Spacer()
                            Text("\(xpToNext) to \(nextRank)")
                                .font(.system(size: 11))
                                .foregroundStyle(theme.textSecondary)
                        }
                    }
                }
            }
        }
    }

    private var statsGrid: some View {
        let columns = [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)]
        return LazyVGrid(columns: columns, spacing: 10) {
            miniStat(icon: "leaf.fill", tint: theme.primary, value: "\(store.plants.count)", label: "Plants")
            miniStat(icon: "drop.fill", tint: theme.accent, value: "\(store.userProfile.totalWaterings)", label: "Waterings")
            miniStat(icon: "chart.line.uptrend.xyaxis", tint: theme.streak, value: "\(store.averageStreak)", label: "Avg Streak")
            miniStat(icon: "rosette", tint: theme.xpPurple, value: String(format: "%.1f", store.averageHealth), label: "Avg Health")
        }
    }

    private func miniStat(icon: String, tint: Color, value: String, label: String) -> some View {
        GlassCard(padding: 14) {
            VStack(spacing: 6) {
                Image(systemName: icon).font(.system(size: 18)).foregroundStyle(tint)
                Text(value).font(.system(size: 22, weight: .bold)).foregroundStyle(theme.text)
                Text(label).font(.system(size: 11)).foregroundStyle(theme.textSecondary)
            }
            .frame(maxWidth: .infinity)
        }
    }

    private func locationSection(_ weather: WeatherData) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 8) {
                Image(systemName: "mappin.and.ellipse").font(.system(size: 16)).foregroundStyle(theme.accent)
                Text("Plant care for \(weather.city == "Your Area" ? "your location" : weather.city)")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(theme.text)
            }

            GlassCard(padding: 14) {
                HStack {
                    detail("thermometer.medium", theme.text, "\(displayTemp(weather.tempC))\(unit)")
                    Spacer()
                    detail("drop.fill", theme.accent, "\(weather.humidity)%")
                    Spacer()
                    detail("wind", theme.textSecondary, windText(weather))
                    Spacer()
                    detail("cloud.sun.fill", theme.warning, weather.description)
                }
            }

            ForEach(advice(for: weather)) { item in
                adviceCard(item)
            }
        }
    }

    private func detail(_ icon: String, _ tint: Color, _ value: String) -> some View {
        HStack(spacing: 5) {
            Image(systemName: icon).font(.system(size: 13)).foregroundStyle(tint)
            Text(value).font(.system(size: 13, weight: .medium)).foregroundStyle(theme.text)
        }
    }

    private func adviceCard(_ item: LocationCareAdvice) -> some View {
        GlassCard(padding: 14) {
            HStack(alignment: .top, spacing: 10) {
                ZStack {
                    RoundedRectangle(cornerRadius: 8).fill(tint(item.type).opacity(0.12)).frame(width: 28, height: 28)
                    Image(systemName: icon(item.type)).font(.system(size: 14)).foregroundStyle(tint(item.type))
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(item.title).font(.system(size: 14, weight: .semibold)).foregroundStyle(theme.text)
                    Text(item.message).font(.system(size: 13)).foregroundStyle(theme.textSecondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
    }

    private var healthOverview: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 8) {
                Image(systemName: "leaf.fill").font(.system(size: 16)).foregroundStyle(theme.primary)
                Text("Plant Health Overview")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(theme.text)
            }
            if store.plants.isEmpty {
                GlassCard(padding: 24) {
                    Text("No plants yet. Add some to see their health!")
                        .font(.system(size: 14))
                        .foregroundStyle(theme.textSecondary)
                        .frame(maxWidth: .infinity)
                }
            } else {
                GlassCard(padding: 6) {
                    VStack(spacing: 0) {
                        ForEach(Array(store.plants.enumerated()), id: \.element.id) { index, plant in
                            HStack(spacing: 10) {
                                RemoteImage(url: plant.image)
                                    .frame(width: 40, height: 40)
                                    .clipShape(.rect(cornerRadius: 10))
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(plant.name).font(.system(size: 14, weight: .semibold)).foregroundStyle(theme.text).lineLimit(1)
                                    Text("🔥 \(plant.streak)d").font(.system(size: 11)).foregroundStyle(theme.streak)
                                }
                                Spacer()
                                HealthDots(health: plant.health)
                                trendBadge(plant.health)
                            }
                            .padding(12)
                            if index < store.plants.count - 1 {
                                Rectangle().fill(theme.divider).frame(height: 0.5).padding(.leading, 12)
                            }
                        }
                    }
                }
            }
        }
    }

    private func trendBadge(_ health: Int) -> some View {
        let up = health >= 4
        let down = health < 3
        let color = up ? theme.success : (down ? theme.error : theme.textSecondary)
        return ZStack {
            Circle().fill(color.opacity(0.12)).frame(width: 26, height: 26)
            Image(systemName: "arrow.up.right")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(color)
                .rotationEffect(.degrees(down ? 90 : 0))
        }
    }

    // MARK: - Helpers

    private func displayTemp(_ c: Int) -> Int { settings.useCelsius ? c : TempUtil.cToF(c) }
    private var unit: String { settings.useCelsius ? "°C" : "°F" }
    private func windText(_ w: WeatherData) -> String {
        settings.useCelsius ? "\(w.windSpeedKmh) km/h" : "\(Int((Double(w.windSpeedKmh) * 0.621).rounded())) mph"
    }
    private func tint(_ type: LocationCareAdvice.HintType) -> Color {
        switch type {
        case .warning: return theme.warning
        case .info: return theme.accent
        case .tip: return theme.primary
        }
    }
    private func icon(_ type: LocationCareAdvice.HintType) -> String {
        switch type {
        case .warning: return "exclamationmark.triangle.fill"
        case .info: return "drop.fill"
        case .tip: return "leaf.fill"
        }
    }

    private func advice(for weather: WeatherData) -> [LocationCareAdvice] {
        var result: [LocationCareAdvice] = []
        let currentTemp = settings.useCelsius ? weather.tempC : TempUtil.cToF(weather.tempC)
        for plant in store.plants {
            let idealMin = settings.useCelsius ? TempUtil.fToC(plant.needs.idealTempMin) : plant.needs.idealTempMin
            let idealMax = settings.useCelsius ? TempUtil.fToC(plant.needs.idealTempMax) : plant.needs.idealTempMax
            if currentTemp > idealMax {
                result.append(LocationCareAdvice(title: plant.name, message: "Current \(currentTemp)\(unit) exceeds ideal range (\(idealMin)–\(idealMax)\(unit)). Move to a cooler spot and increase watering.", type: .warning))
            } else if currentTemp < idealMin {
                result.append(LocationCareAdvice(title: plant.name, message: "Current \(currentTemp)\(unit) is below ideal (\(idealMin)–\(idealMax)\(unit)). Keep away from cold drafts and reduce watering.", type: .warning))
            }
            if weather.humidity < 30 && plant.needs.humidity >= 4 {
                result.append(LocationCareAdvice(title: plant.name, message: "Humidity is only \(weather.humidity)%. This plant loves moisture — mist regularly or use a humidifier.", type: .info))
            }
        }
        if result.isEmpty {
            let label = weather.city == "Your Area" ? "your area" : weather.city
            result.append(LocationCareAdvice(title: "All Clear", message: "Conditions in \(label) look great for your plants right now. Keep up the routine!", type: .tip))
        }
        return Array(result.prefix(4))
    }

    private func loadLocation() async {
        if let coord = await locationManager.requestLocation() {
            weather = await WeatherService.fetch(lat: coord.latitude, lon: coord.longitude)
        } else {
            weather = WeatherData.fallback
        }
        loading = false
    }

    private func loadAvatar(_ item: PhotosPickerItem?) async {
        guard let item,
              let data = try? await item.loadTransferable(type: Data.self) else { return }
        let dir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let url = dir.appendingPathComponent("avatar_\(Int(Date().timeIntervalSince1970)).jpg")
        try? data.write(to: url)
        store.updateProfile(avatar: url.absoluteString)
    }
}
