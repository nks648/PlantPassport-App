//
//  ContentView.swift
//  PlantPassport
//

import SwiftUI

struct ContentView: View {
    @Environment(\.colorScheme) private var colorScheme
    @State private var store = PlantStore()
    @State private var settings = SettingsStore()

    var body: some View {
        TabView {
            HomeView(store: store, settings: settings)
                .tabItem { Label(settings.t("home"), systemImage: "house.fill") }

            PlantsView(store: store, settings: settings)
                .tabItem { Label(settings.t("plants"), systemImage: "leaf.fill") }

            CommunityView(store: store, settings: settings)
                .tabItem { Label(settings.t("community"), systemImage: "person.2.fill") }

            ProfileView(store: store, settings: settings)
                .tabItem { Label(settings.t("profile"), systemImage: "person.fill") }

            SettingsView(settings: settings)
                .tabItem { Label(settings.t("settings"), systemImage: "gearshape.fill") }
        }
        .tint(settings.colors.primary)
        .environment(\.theme, settings.colors)
        .preferredColorScheme(settings.preferredColorScheme)
        .onAppear { settings.systemIsDark = colorScheme == .dark }
        .onChange(of: colorScheme) { _, newValue in
            settings.systemIsDark = newValue == .dark
        }
    }
}

#Preview {
    ContentView()
}
