//
//  SettingsStore.swift
//  PlantPassport
//

import SwiftUI
import Observation

enum TemperatureUnit: String, Codable, CaseIterable {
    case auto, celsius, fahrenheit
}

enum AppLanguage: String, Codable, CaseIterable {
    case en, es, pt
}

enum ThemeMode: String, Codable, CaseIterable {
    case light, dark, system
}

/// App-wide preferences: temperature units, language, and appearance.
/// Persisted to UserDefaults. Drives the active `ThemeColors` palette.
@MainActor
@Observable
final class SettingsStore {
    var temperatureUnit: TemperatureUnit = .auto {
        didSet { persist() }
    }
    var language: AppLanguage = .en {
        didSet { persist() }
    }
    var themeMode: ThemeMode = .system {
        didSet { persist() }
    }

    /// Mirror of the system color scheme, updated by the root view.
    var systemIsDark: Bool = false

    private let key = "plant_passport_settings_v1"

    init() {
        load()
    }

    var isDark: Bool {
        switch themeMode {
        case .dark: return true
        case .light: return false
        case .system: return systemIsDark
        }
    }

    var colors: ThemeColors {
        isDark ? .dark : .light
    }

    var preferredColorScheme: ColorScheme? {
        switch themeMode {
        case .dark: return .dark
        case .light: return .light
        case .system: return nil
        }
    }

    var useCelsius: Bool {
        switch temperatureUnit {
        case .celsius: return true
        case .fahrenheit: return false
        case .auto: return SettingsStore.regionPrefersCelsius()
        }
    }

    static func regionPrefersCelsius() -> Bool {
        let imperial: Set<String> = ["US", "MM", "LR", "BS", "KY", "PW", "MH"]
        let region = Locale.current.region?.identifier.uppercased() ?? ""
        return !imperial.contains(region)
    }

    // MARK: - Localization

    func t(_ key: String) -> String {
        Self.strings[language]?[key] ?? Self.strings[.en]?[key] ?? key
    }

    private func load() {
        guard let data = UserDefaults.standard.data(forKey: key),
              let decoded = try? JSONDecoder().decode(Persisted.self, from: data) else { return }
        temperatureUnit = decoded.temperatureUnit
        language = decoded.language
        themeMode = decoded.themeMode
    }

    private func persist() {
        let payload = Persisted(temperatureUnit: temperatureUnit, language: language, themeMode: themeMode)
        if let data = try? JSONEncoder().encode(payload) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }

    private struct Persisted: Codable {
        var temperatureUnit: TemperatureUnit
        var language: AppLanguage
        var themeMode: ThemeMode
    }

    static let strings: [AppLanguage: [String: String]] = [
        .en: [
            "home": "Home", "plants": "Plants", "community": "Community", "profile": "Profile",
            "settings": "Settings", "ranks": "Ranks", "temperature": "Temperature Unit",
            "language": "Language", "theme": "Appearance", "celsius": "Celsius (°C)",
            "fahrenheit": "Fahrenheit (°F)", "auto": "Auto", "light": "Light", "dark": "Dark",
            "system": "System", "english": "English", "spanish": "Spanish", "portuguese": "Portuguese",
            "allTime": "All Time", "thisWeek": "This Week", "shareYourWin": "Share Your Win 🌿",
            "newPost": "New Post",
        ],
        .es: [
            "home": "Inicio", "plants": "Plantas", "community": "Comunidad", "profile": "Perfil",
            "settings": "Ajustes", "ranks": "Ranking", "temperature": "Unidad de Temperatura",
            "language": "Idioma", "theme": "Apariencia", "celsius": "Celsius (°C)",
            "fahrenheit": "Fahrenheit (°F)", "auto": "Automático", "light": "Claro", "dark": "Oscuro",
            "system": "Sistema", "english": "Inglés", "spanish": "Español", "portuguese": "Portugués",
            "allTime": "Todo el Tiempo", "thisWeek": "Esta Semana", "shareYourWin": "Comparte Tu Logro 🌿",
            "newPost": "Nueva Publicación",
        ],
        .pt: [
            "home": "Início", "plants": "Plantas", "community": "Comunidade", "profile": "Perfil",
            "settings": "Configurações", "ranks": "Ranking", "temperature": "Unidade de Temperatura",
            "language": "Idioma", "theme": "Aparência", "celsius": "Celsius (°C)",
            "fahrenheit": "Fahrenheit (°F)", "auto": "Automático", "light": "Claro", "dark": "Escuro",
            "system": "Sistema", "english": "Inglês", "spanish": "Espanhol", "portuguese": "Português",
            "allTime": "Todo o Tempo", "thisWeek": "Esta Semana", "shareYourWin": "Compartilhe Sua Conquista 🌿",
            "newPost": "Nova Publicação",
        ],
    ]
}

// MARK: - Temperature helpers

enum TempUtil {
    static func cToF(_ c: Int) -> Int { Int((Double(c) * 9 / 5 + 32).rounded()) }
    static func fToC(_ f: Int) -> Int { Int((Double(f - 32) * 5 / 9).rounded()) }

    static func formatRange(minF: Int, maxF: Int, useCelsius: Bool) -> String {
        if useCelsius {
            return "\(fToC(minF))°–\(fToC(maxF))°C"
        }
        return "\(minF)°–\(maxF)°F"
    }
}
