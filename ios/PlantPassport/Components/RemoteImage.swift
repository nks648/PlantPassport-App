//
//  RemoteImage.swift
//  PlantPassport
//

import SwiftUI

/// AsyncImage wrapper with a themed placeholder, used for plant photos & avatars.
struct RemoteImage: View {
    @Environment(\.theme) private var theme
    let url: String
    var contentMode: ContentMode = .fill

    var body: some View {
        AsyncImage(url: URL(string: url)) { phase in
            switch phase {
            case .success(let image):
                image
                    .resizable()
                    .aspectRatio(contentMode: contentMode)
            case .empty:
                theme.backgroundWarm
                    .overlay { ProgressView().controlSize(.small) }
            case .failure:
                theme.backgroundWarm
                    .overlay {
                        Image(systemName: "leaf.fill")
                            .foregroundStyle(theme.textTertiary)
                    }
            @unknown default:
                theme.backgroundWarm
            }
        }
    }
}
