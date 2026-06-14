//
//  PlantNeedsCard.swift
//  PlantPassport
//

import SwiftUI

/// A detailed care guide card for a plant's needs.
struct PlantNeedsCard: View {
    @Environment(\.theme) private var theme
    let needs: PlantNeeds
    let useCelsius: Bool
    var showTitle: Bool = true

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if showTitle {
                Text("CARE GUIDE")
                    .font(.system(size: 12, weight: .semibold))
                    .tracking(0.8)
                    .foregroundStyle(theme.textTertiary)
            }

            needRow(icon: "drop.fill", tint: theme.waterBlue, label: "Water", value: NeedLabels.at(NeedLabels.water, needs.water), level: needs.water)
            divider
            needRow(icon: "sun.max.fill", tint: theme.warning, label: "Light", value: NeedLabels.at(NeedLabels.light, needs.light), level: needs.light)
            divider
            needRow(icon: "cloud.rain.fill", tint: theme.humidityTeal, label: "Humidity", value: NeedLabels.at(NeedLabels.humidity, needs.humidity), level: needs.humidity)
            divider
            tempRow
            divider
            needRow(icon: "wrench.adjustable.fill", tint: theme.primary, label: "Ease of Care", value: NeedLabels.at(NeedLabels.ease, needs.easeOfCare), level: needs.easeOfCare)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(theme.card)
        .clipShape(.rect(cornerRadius: 16))
        .shadow(color: .black.opacity(0.04), radius: 8, x: 0, y: 2)
    }

    private var divider: some View {
        Rectangle().fill(theme.divider).frame(height: 0.5)
    }

    private func needRow(icon: String, tint: Color, label: String, value: String, level: Int) -> some View {
        HStack(alignment: .top, spacing: 10) {
            iconWrap(icon, tint: tint)
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text(label)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(theme.text)
                    Spacer()
                    Text(value)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(theme.textSecondary)
                }
                NeedBar(level: level, color: tint)
            }
        }
    }

    private var tempRow: some View {
        let minV = useCelsius ? TempUtil.fToC(needs.idealTempMin) : needs.idealTempMin
        let maxV = useCelsius ? TempUtil.fToC(needs.idealTempMax) : needs.idealTempMax
        let scaleMin = useCelsius ? TempUtil.fToC(40) : 40
        let scaleMax = useCelsius ? TempUtil.fToC(120) : 120
        let unit = useCelsius ? "°C" : "°F"
        let range = Double(scaleMax - scaleMin)
        let leadFraction = Double(minV - scaleMin) / range
        let widthFraction = Double(maxV - minV) / range

        return HStack(alignment: .top, spacing: 10) {
            iconWrap("thermometer.medium", tint: Color(hex: 0xFF6961))
            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    Text("Temperature")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(theme.text)
                    Spacer()
                    Text(TempUtil.formatRange(minF: needs.idealTempMin, maxF: needs.idealTempMax, useCelsius: useCelsius))
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(theme.textSecondary)
                }
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        Capsule().fill(theme.inputBackground)
                        Capsule()
                            .fill(Color(hex: 0xFF6961).opacity(0.75))
                            .frame(width: max(6, geo.size.width * widthFraction))
                            .offset(x: geo.size.width * leadFraction)
                    }
                }
                .frame(height: 6)
                HStack {
                    Text("\(scaleMin)\(unit)")
                    Spacer()
                    Text("\(scaleMax)\(unit)")
                }
                .font(.system(size: 9))
                .foregroundStyle(theme.textTertiary)
            }
        }
    }

    private func iconWrap(_ icon: String, tint: Color) -> some View {
        ZStack {
            RoundedRectangle(cornerRadius: 10)
                .fill(tint.opacity(0.1))
                .frame(width: 32, height: 32)
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundStyle(tint)
        }
    }
}
