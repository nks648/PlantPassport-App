import * as z from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const PROMPT = `You are an expert botanist. Identify the plant in the photo. Return STRICT JSON only with these fields:
{
  "commonName": string | null,
  "scientificName": string | null,
  "confidence": number (0 to 1, e.g. 0.85),
  "notes": string (brief care tips or interesting facts, 1-2 sentences),
  "possibleMatches": [{"commonName": string, "scientificName": string, "confidence": number}]
}
Rules:
- possibleMatches should contain up to 3 alternative identifications sorted by confidence descending
- If you cannot identify the plant, set commonName and scientificName to null and confidence to a low value
- Do NOT include markdown code fences or any text outside the JSON object
- confidence values must be between 0 and 1`;

async function callGeminiWithRetry(imageBase64: string): Promise<string> {
  const MAX_RETRIES = 3;
  const BASE_DELAYS = [2000, 4000, 8000];

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const jitter = Math.random() * 1000 - 500;
      const delay = BASE_DELAYS[attempt - 1] + jitter;
      console.log(`[Gemini] Retry ${attempt}/${MAX_RETRIES}, waiting ${Math.round(delay)}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    try {
      console.log(`[Gemini] Attempt ${attempt + 1}/${MAX_RETRIES + 1}`);

      const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: PROMPT },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
          },
        }),
      });

      console.log(`[Gemini] Response status: ${response.status}`);

      if (response.status === 429 || response.status === 503) {
        console.log(`[Gemini] Rate limited/overloaded (${response.status})`);
        if (attempt < MAX_RETRIES) continue;
        throw new Error(
          response.status === 429 ? "RATE_LIMIT" : "OVERLOADED"
        );
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`[Gemini] Error: ${errorText.substring(0, 300)}`);
        throw new Error(`Gemini API error ${response.status}: ${errorText.substring(0, 200)}`);
      }

      const data = await response.json();
      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      console.log(`[Gemini] Response text length: ${text.length}`);
      return text;
    } catch (e: any) {
      if (e?.message === "RATE_LIMIT" || e?.message === "OVERLOADED") {
        if (attempt >= MAX_RETRIES) throw e;
        continue;
      }
      throw e;
    }
  }

  throw new Error("Failed after all retries");
}

function parseGeminiResponse(text: string) {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "");
  }
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Could not parse Gemini response as JSON");
  }
}

export const plantIdentifyRouter = createTRPCRouter({
  identify: publicProcedure
    .input(
      z.object({
        imageBase64: z.string().min(100, "Image data is too small"),
      })
    )
    .mutation(async ({ input }) => {
      if (!GEMINI_API_KEY) {
        console.log("[Gemini] API key not configured");
        throw new Error("Gemini API key not configured on server");
      }

      console.log(`[Gemini] Identifying plant, base64 length: ${input.imageBase64.length}`);

      try {
        const rawText = await callGeminiWithRetry(input.imageBase64);
        const parsed = parseGeminiResponse(rawText);

        const result = {
          commonName: parsed.commonName ?? null,
          scientificName: parsed.scientificName ?? null,
          confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
          notes: parsed.notes ?? "",
          possibleMatches: Array.isArray(parsed.possibleMatches)
            ? parsed.possibleMatches.slice(0, 3).map((m: any) => ({
                commonName: m.commonName ?? "Unknown",
                scientificName: m.scientificName ?? "Unknown",
                confidence: typeof m.confidence === "number" ? m.confidence : 0,
              }))
            : [],
        };

        console.log(`[Gemini] Identified: ${result.commonName} (${result.confidence})`);
        return result;
      } catch (e: any) {
        if (e?.message === "RATE_LIMIT") {
          throw new Error("Too many scans right now. Please wait a moment and try again.");
        }
        if (e?.message === "OVERLOADED") {
          throw new Error("The identification service is busy. Please try again shortly.");
        }
        console.log(`[Gemini] Error: ${e?.message}`);
        throw e;
      }
    }),
});
