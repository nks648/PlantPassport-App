//
//  PlantIdentifier.swift
//  PlantPassport
//

import Foundation

nonisolated struct PossibleMatch: Identifiable, Hashable {
    let id = UUID()
    var commonName: String
    var scientificName: String
    var confidence: Double
}

nonisolated struct IdentificationResult {
    var commonName: String?
    var scientificName: String?
    var confidence: Double
    var notes: String
    var possibleMatches: [PossibleMatch]
}

nonisolated struct PlantSearchResult: Identifiable, Hashable {
    let id = UUID()
    var commonName: String
    var scientificName: String
    var description: String
    var imageKeyword: String
}

nonisolated enum PlantIdentifierError: LocalizedError {
    case noKey
    case server(String)
    case notRecognized

    var errorDescription: String? {
        switch self {
        case .noKey: return "API key is not configured."
        case .server(let m): return m
        case .notRecognized: return "Plant not recognized. Try better lighting or a closer photo."
        }
    }
}

/// Calls Gemini to identify plants from a photo or search them by name.
nonisolated enum PlantIdentifier {
    private static let model = "gemini-2.5-flash"
    private static var endpoint: String {
        "https://generativelanguage.googleapis.com/v1beta/models/\(model):generateContent"
    }

    private static let identifyPrompt = """
    You are an expert botanist. Identify the plant in the photo. Return STRICT JSON only with these fields:
    {
      "commonName": string | null,
      "scientificName": string | null,
      "confidence": number (0 to 1),
      "notes": string (brief care tips, 1-2 sentences),
      "possibleMatches": [{"commonName": string, "scientificName": string, "confidence": number}]
    }
    Rules:
    - possibleMatches: up to 3 alternatives sorted by confidence descending
    - If unidentifiable, set names to null and a low confidence
    - No markdown fences or text outside the JSON object
    """

    static func identify(base64Image: String) async throws -> IdentificationResult {
        let key = Config.EXPO_PUBLIC_Plantual
        guard !key.isEmpty else { throw PlantIdentifierError.noKey }

        let body: [String: Any] = [
            "contents": [[
                "parts": [
                    ["text": identifyPrompt],
                    ["inline_data": ["mime_type": "image/jpeg", "data": base64Image]],
                ]
            ]],
            "generationConfig": ["temperature": 0.1, "maxOutputTokens": 1024],
        ]
        let text = try await postGemini(body: body, key: key)
        let json = try parseObject(text)

        let matches = (json["possibleMatches"] as? [[String: Any]] ?? []).prefix(3).map {
            PossibleMatch(
                commonName: $0["commonName"] as? String ?? "Unknown",
                scientificName: $0["scientificName"] as? String ?? "Unknown",
                confidence: $0["confidence"] as? Double ?? 0
            )
        }
        return IdentificationResult(
            commonName: json["commonName"] as? String,
            scientificName: json["scientificName"] as? String,
            confidence: json["confidence"] as? Double ?? 0,
            notes: json["notes"] as? String ?? "",
            possibleMatches: Array(matches)
        )
    }

    static func search(query: String) async throws -> [PlantSearchResult] {
        let key = Config.EXPO_PUBLIC_Plantual
        guard !key.isEmpty else { throw PlantIdentifierError.noKey }

        let prompt = """
        You are an expert botanist. The user is searching for a plant by name: "\(query)".
        Return a JSON array of up to 5 matching plants. Each entry:
        {"commonName": string, "scientificName": string, "description": string (1-2 sentences), "imageKeyword": string}
        Rules: STRICT JSON array only, no markdown. If none match, return []. Order by relevance.
        """
        let body: [String: Any] = [
            "contents": [["parts": [["text": prompt]]]],
            "generationConfig": ["temperature": 0.2, "maxOutputTokens": 2048],
        ]
        let text = try await postGemini(body: body, key: key)
        let array = try parseArray(text)
        return array.prefix(5).map {
            PlantSearchResult(
                commonName: $0["commonName"] as? String ?? "Unknown",
                scientificName: $0["scientificName"] as? String ?? "Unknown",
                description: $0["description"] as? String ?? "",
                imageKeyword: $0["imageKeyword"] as? String ?? "plant"
            )
        }
    }

    // MARK: - Networking

    private static func postGemini(body: [String: Any], key: String) async throws -> String {
        guard let url = URL(string: "\(endpoint)?key=\(key)") else {
            throw PlantIdentifierError.server("Invalid request.")
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        if status == 429 { throw PlantIdentifierError.server("Too many scans right now. Please wait and try again.") }
        if status == 503 { throw PlantIdentifierError.server("The identification service is busy. Please try again shortly.") }
        guard status == 200 else { throw PlantIdentifierError.server("Server error (\(status)). Please try again.") }

        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              let candidates = json["candidates"] as? [[String: Any]],
              let content = candidates.first?["content"] as? [String: Any],
              let parts = content["parts"] as? [[String: Any]],
              let text = parts.first?["text"] as? String else {
            throw PlantIdentifierError.notRecognized
        }
        return text
    }

    private static func clean(_ text: String) -> String {
        var s = text.trimmingCharacters(in: .whitespacesAndNewlines)
        if s.hasPrefix("```") {
            s = s.replacingOccurrences(of: "```json", with: "")
            s = s.replacingOccurrences(of: "```", with: "")
        }
        return s.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private static func parseObject(_ text: String) throws -> [String: Any] {
        let cleaned = clean(text)
        if let data = cleaned.data(using: .utf8),
           let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            return json
        }
        if let range = cleaned.range(of: #"\{[\s\S]*\}"#, options: .regularExpression),
           let data = String(cleaned[range]).data(using: .utf8),
           let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            return json
        }
        throw PlantIdentifierError.notRecognized
    }

    private static func parseArray(_ text: String) throws -> [[String: Any]] {
        let cleaned = clean(text)
        if let data = cleaned.data(using: .utf8),
           let json = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] {
            return json
        }
        if let range = cleaned.range(of: #"\[[\s\S]*\]"#, options: .regularExpression),
           let data = String(cleaned[range]).data(using: .utf8),
           let json = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] {
            return json
        }
        return []
    }
}
