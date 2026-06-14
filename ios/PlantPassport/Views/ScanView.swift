//
//  ScanView.swift
//  PlantPassport
//

import SwiftUI
import PhotosUI

private enum ScanMode: String, CaseIterable {
    case scan, search
}

struct ScanView: View {
    @Environment(\.theme) private var theme
    @Environment(\.dismiss) private var dismiss
    let store: PlantStore
    let settings: SettingsStore

    @State private var mode: ScanMode = .scan
    @State private var photoItem: PhotosPickerItem?
    @State private var imageData: Data?
    @State private var scanning = false
    @State private var scanError: String?
    @State private var searchQuery = ""
    @State private var searchResults: [PlantSearchResult] = []
    @State private var searching = false
    @State private var searchError = false
    @State private var result: IdentificationResult?
    @State private var navigateResult = false
    @State private var resultPayload: ScanResultPayload?

    var body: some View {
        ZStack {
            theme.background.ignoresSafeArea()
            VStack(spacing: 0) {
                modeToggle
                if mode == .scan {
                    scanBody
                } else {
                    searchBody
                }
            }
        }
        .navigationTitle("Add Plant")
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(isPresented: $navigateResult) {
            if let resultPayload {
                ScanResultView(payload: resultPayload, store: store, settings: settings)
            }
        }
        .onChange(of: photoItem) { _, item in
            Task { await handlePhoto(item) }
        }
    }

    private var modeToggle: some View {
        HStack(spacing: 0) {
            ForEach(ScanMode.allCases, id: \.self) { m in
                Button {
                    let g = UIImpactFeedbackGenerator(style: .light)
                    g.impactOccurred()
                    withAnimation(.easeInOut(duration: 0.2)) {
                        mode = m
                        searchResults = []
                        searchQuery = ""
                        imageData = nil
                        scanError = nil
                    }
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: m == .scan ? "camera.fill" : "magnifyingglass")
                            .font(.system(size: 15))
                        Text(m == .scan ? "Scan" : "Search")
                            .font(.system(size: 14, weight: .semibold))
                    }
                    .foregroundStyle(mode == m ? .white : theme.textSecondary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(mode == m ? theme.primary : .clear)
                    .clipShape(.rect(cornerRadius: 10))
                }
            }
        }
        .padding(3)
        .background(theme.inputBackground)
        .clipShape(.rect(cornerRadius: 12))
        .padding(.horizontal, 20)
        .padding(.top, 12)
    }

    // MARK: - Scan

    @ViewBuilder
    private var scanBody: some View {
        if scanning {
            VStack(spacing: 16) {
                Spacer()
                ProgressView().controlSize(.large)
                Text("Identifying plant…")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(theme.text)
                Text("Analyzing with AI")
                    .font(.system(size: 14))
                    .foregroundStyle(theme.textSecondary)
                Spacer()
            }
        } else {
            VStack(spacing: 0) {
                Spacer()
                VStack(spacing: 16) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 30).fill(theme.primaryMuted).frame(width: 100, height: 100)
                        Image(systemName: scanError == nil ? "viewfinder" : "exclamationmark.triangle")
                            .font(.system(size: 44))
                            .foregroundStyle(scanError == nil ? theme.primary : theme.error)
                    }
                    Text(scanError == nil ? "Identify Any Plant" : "Scan Failed")
                        .font(.system(size: 26, weight: .bold))
                        .foregroundStyle(scanError == nil ? theme.text : theme.error)
                    Text(scanError ?? "Choose a photo from your library to identify a plant.")
                        .font(.system(size: 15))
                        .foregroundStyle(theme.textSecondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 24)
                }
                Spacer()
                VStack(spacing: 12) {
                    PhotosPicker(selection: $photoItem, matching: .images) {
                        HStack(spacing: 10) {
                            Image(systemName: "photo.on.rectangle")
                            Text("Choose from Library")
                        }
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(theme.primary)
                        .clipShape(.rect(cornerRadius: 14))
                    }
                    Text("Install this app on your device via the Rork App to use the camera.")
                        .font(.system(size: 12))
                        .foregroundStyle(theme.textTertiary)
                        .multilineTextAlignment(.center)
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 24)
            }
        }
    }

    // MARK: - Search

    private var searchBody: some View {
        VStack(spacing: 0) {
            HStack(spacing: 10) {
                HStack(spacing: 10) {
                    Image(systemName: "magnifyingglass").foregroundStyle(theme.textSecondary)
                    TextField("Search plant name...", text: $searchQuery)
                        .font(.system(size: 16))
                        .foregroundStyle(theme.text)
                        .submitLabel(.search)
                        .onSubmit(runSearch)
                    if !searchQuery.isEmpty {
                        Button {
                            searchQuery = ""
                            searchResults = []
                        } label: {
                            Image(systemName: "xmark.circle.fill").foregroundStyle(theme.textTertiary)
                        }
                    }
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 12)
                .background(theme.card)
                .clipShape(.rect(cornerRadius: 12))
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(theme.divider, lineWidth: 1))

                Button(action: runSearch) {
                    Group {
                        if searching {
                            ProgressView().tint(.white)
                        } else {
                            Text("Go").font(.system(size: 15, weight: .bold)).foregroundStyle(.white)
                        }
                    }
                    .frame(width: 48, height: 48)
                    .background(theme.primary)
                    .clipShape(.rect(cornerRadius: 12))
                    .opacity(searchQuery.trimmingCharacters(in: .whitespaces).isEmpty ? 0.5 : 1)
                }
                .disabled(searchQuery.trimmingCharacters(in: .whitespaces).isEmpty || searching)
            }
            .padding(.horizontal, 20)
            .padding(.top, 16)

            if searching && searchResults.isEmpty {
                Spacer()
                ProgressView().controlSize(.large)
                Text("Searching...").font(.system(size: 15)).foregroundStyle(theme.textSecondary).padding(.top, 8)
                Spacer()
            } else if !searchResults.isEmpty {
                ScrollView {
                    VStack(spacing: 10) {
                        ForEach(searchResults) { result in
                            Button { selectSearch(result) } label: {
                                HStack(spacing: 14) {
                                    ZStack {
                                        RoundedRectangle(cornerRadius: 12).fill(theme.primaryMuted).frame(width: 44, height: 44)
                                        Image(systemName: "leaf.fill").foregroundStyle(theme.primary)
                                    }
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(result.commonName).font(.system(size: 16, weight: .semibold)).foregroundStyle(theme.text)
                                        Text(result.scientificName).font(.system(size: 13)).italic().foregroundStyle(theme.textSecondary)
                                        Text(result.description).font(.system(size: 13)).foregroundStyle(theme.textSecondary).lineLimit(2)
                                    }
                                    Spacer()
                                }
                                .padding(16)
                                .background(theme.card)
                                .clipShape(.rect(cornerRadius: 14))
                                .overlay(RoundedRectangle(cornerRadius: 14).stroke(theme.divider, lineWidth: 1))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(20)
                }
            } else {
                Spacer()
                VStack(spacing: 12) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 24).fill(theme.inputBackground).frame(width: 80, height: 80)
                        Image(systemName: "magnifyingglass").font(.system(size: 36)).foregroundStyle(theme.textTertiary)
                    }
                    Text(searchError ? "Search failed. Please try again." : "Search by Plant Name")
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundStyle(theme.text)
                    if !searchError {
                        Text("Type a plant name and tap Go to find it")
                            .font(.system(size: 14))
                            .foregroundStyle(theme.textSecondary)
                    }
                }
                Spacer()
            }
        }
    }

    // MARK: - Actions

    private func handlePhoto(_ item: PhotosPickerItem?) async {
        guard let item, let data = try? await item.loadTransferable(type: Data.self) else { return }
        imageData = data
        scanError = nil
        scanning = true
        do {
            let res = try await PlantIdentifier.identify(base64Image: data.base64EncodedString())
            let dir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            let url = dir.appendingPathComponent("scan_\(Int(Date().timeIntervalSince1970)).jpg")
            try? data.write(to: url)
            let g = UINotificationFeedbackGenerator()
            g.notificationOccurred(.success)
            resultPayload = ScanResultPayload(
                name: res.commonName ?? "Unknown Plant",
                species: res.scientificName ?? "Unknown Species",
                confidence: Int((res.confidence * 100).rounded()),
                notes: res.notes,
                possibleMatches: res.possibleMatches,
                imageUri: url.absoluteString
            )
            scanning = false
            navigateResult = true
        } catch {
            let g = UINotificationFeedbackGenerator()
            g.notificationOccurred(.error)
            scanError = (error as? LocalizedError)?.errorDescription ?? "Could not identify the plant."
            scanning = false
        }
        photoItem = nil
    }

    private func runSearch() {
        let q = searchQuery.trimmingCharacters(in: .whitespaces)
        guard !q.isEmpty else { return }
        let g = UIImpactFeedbackGenerator(style: .light)
        g.impactOccurred()
        searching = true
        searchError = false
        Task {
            do {
                searchResults = try await PlantIdentifier.search(query: q)
            } catch {
                searchError = true
                searchResults = []
            }
            searching = false
        }
    }

    private func selectSearch(_ r: PlantSearchResult) {
        let g = UIImpactFeedbackGenerator(style: .medium)
        g.impactOccurred()
        let keyword = r.imageKeyword.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "plant"
        resultPayload = ScanResultPayload(
            name: r.commonName,
            species: r.scientificName,
            confidence: 90,
            notes: r.description,
            possibleMatches: [],
            imageUri: "https://picsum.photos/seed/\(keyword)/400/400"
        )
        navigateResult = true
    }
}

nonisolated struct ScanResultPayload {
    var name: String
    var species: String
    var confidence: Int
    var notes: String
    var possibleMatches: [PossibleMatch]
    var imageUri: String
}
