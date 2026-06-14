//
//  WeatherService.swift
//  PlantPassport
//

import Foundation

/// Weather snapshot used by the home widget & profile, in metric units.
nonisolated struct WeatherData: Equatable {
    var tempC: Int
    var humidity: Int
    var description: String
    var city: String
    var windSpeedKmh: Int
    var forecast: [DayForecast]

    static let fallback = WeatherData(
        tempC: 22, humidity: 55, description: "Partly Cloudy", city: "Your Area", windSpeedKmh: 13,
        forecast: [
            DayForecast(day: "Mon", highC: 26, lowC: 17, condition: .sunny),
            DayForecast(day: "Tue", highC: 28, lowC: 18, condition: .partlyCloudy),
            DayForecast(day: "Wed", highC: 29, lowC: 20, condition: .sunny),
            DayForecast(day: "Thu", highC: 27, lowC: 18, condition: .cloudy),
            DayForecast(day: "Fri", highC: 24, lowC: 16, condition: .rain),
        ]
    )
}

nonisolated enum WeatherCondition: String, Equatable {
    case sunny, partlyCloudy, cloudy, rain, storm

    var emoji: String {
        switch self {
        case .sunny: return "☀️"
        case .partlyCloudy: return "⛅"
        case .cloudy: return "☁️"
        case .rain: return "🌧️"
        case .storm: return "⛈️"
        }
    }
}

nonisolated struct DayForecast: Equatable {
    var day: String
    var highC: Int
    var lowC: Int
    var condition: WeatherCondition
}

/// Fetches weather from Open-Meteo and the city name from Nominatim.
nonisolated enum WeatherService {
    static func fetch(lat: Double, lon: Double) async -> WeatherData {
        let city = await fetchCity(lat: lat, lon: lon)
        guard let url = URL(string: "https://api.open-meteo.com/v1/forecast?latitude=\(lat)&longitude=\(lon)&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto&forecast_days=5") else {
            return WeatherData.fallback
        }
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
                return WeatherData.fallback
            }
            let current = json["current"] as? [String: Any] ?? [:]
            let daily = json["daily"] as? [String: Any] ?? [:]

            let times = daily["time"] as? [String] ?? []
            let maxes = daily["temperature_2m_max"] as? [Double] ?? []
            let mins = daily["temperature_2m_min"] as? [Double] ?? []
            let codes = daily["weather_code"] as? [Double] ?? []
            let dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

            var forecast: [DayForecast] = []
            for (i, dateStr) in times.enumerated() {
                let date = DateUtil.parse(dateStr) ?? Date()
                let weekday = Calendar.current.component(.weekday, from: date) - 1
                let code = i < codes.count ? codes[i] : 0
                forecast.append(DayForecast(
                    day: dayNames[max(0, min(6, weekday))],
                    highC: Int((i < maxes.count ? maxes[i] : 25).rounded()),
                    lowC: Int((i < mins.count ? mins[i] : 15).rounded()),
                    condition: condition(for: code)
                ))
            }

            let code = current["weather_code"] as? Double ?? 0
            return WeatherData(
                tempC: Int((current["temperature_2m"] as? Double ?? 22).rounded()),
                humidity: Int((current["relative_humidity_2m"] as? Double ?? 55).rounded()),
                description: describe(code),
                city: city,
                windSpeedKmh: Int((current["wind_speed_10m"] as? Double ?? 8).rounded()),
                forecast: forecast
            )
        } catch {
            return WeatherData.fallback
        }
    }

    private static func fetchCity(lat: Double, lon: Double) async -> String {
        guard let url = URL(string: "https://nominatim.openstreetmap.org/reverse?lat=\(lat)&lon=\(lon)&format=json&zoom=10") else {
            return "Your Area"
        }
        var request = URLRequest(url: url)
        request.setValue("PlantPassport/1.0", forHTTPHeaderField: "User-Agent")
        do {
            let (data, _) = try await URLSession.shared.data(for: request)
            guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let address = json["address"] as? [String: Any] else { return "Your Area" }
            return (address["city"] as? String)
                ?? (address["town"] as? String)
                ?? (address["village"] as? String)
                ?? "Your Area"
        } catch {
            return "Your Area"
        }
    }

    private static func condition(for code: Double) -> WeatherCondition {
        if code >= 61 { return .rain }
        if code >= 45 { return .cloudy }
        if code >= 2 { return .partlyCloudy }
        return .sunny
    }

    private static func describe(_ code: Double) -> String {
        if code >= 61 { return "Rainy" }
        if code >= 45 { return "Cloudy" }
        if code >= 2 { return "Partly Cloudy" }
        return "Clear"
    }
}
