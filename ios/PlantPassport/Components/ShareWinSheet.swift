//
//  ShareWinSheet.swift
//  PlantPassport
//

import SwiftUI

/// Sheet shown after watering to optionally share the win to the community.
struct ShareWinSheet: View {
    @Environment(\.theme) private var theme
    let plantName: String
    let streak: Int
    let onShare: (String) -> Void
    let onSkip: () -> Void

    @State private var text: String

    init(plantName: String, streak: Int, onShare: @escaping (String) -> Void, onSkip: @escaping () -> Void) {
        self.plantName = plantName
        self.streak = streak
        self.onShare = onShare
        self.onSkip = onSkip
        _text = State(initialValue: "Just watered my \(plantName)! 🌿 \(streak)-day streak going strong.")
    }

    var body: some View {
        VStack(spacing: 20) {
            VStack(spacing: 8) {
                Text("🌿")
                    .font(.system(size: 44))
                Text("Share Your Win")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(theme.text)
                Text("Celebrate your \(streak)-day streak with the community!")
                    .font(.system(size: 14))
                    .foregroundStyle(theme.textSecondary)
                    .multilineTextAlignment(.center)
            }
            .padding(.top, 24)

            TextField("Share something...", text: $text, axis: .vertical)
                .lineLimit(3...6)
                .font(.system(size: 15))
                .foregroundStyle(theme.text)
                .padding(14)
                .background(theme.inputBackground)
                .clipShape(.rect(cornerRadius: 14))

            VStack(spacing: 10) {
                Button {
                    let g = UINotificationFeedbackGenerator()
                    g.notificationOccurred(.success)
                    onShare(text)
                } label: {
                    Text("Share to Community")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(theme.primary)
                        .clipShape(.rect(cornerRadius: 14))
                }
                Button(action: onSkip) {
                    Text("Maybe Later")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(theme.textSecondary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                }
            }
            Spacer(minLength: 0)
        }
        .padding(20)
        .presentationDetents([.medium])
    }
}
