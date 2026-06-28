import { PlantNeeds } from '@/types/plant';

const GEMINI_KEY = process.env.EXPO_PUBLIC_Gemini ?? '';
const MODEL = 'gemini-2.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export interface PlantIdentification {
  commonName: string | null;
  scientificName: string | null;
  confidence: number;
  notes: string;
  needs: PlantNeeds;
  wateringFrequencyDays: number;
  possibleMatches: { commonName: string; scientificName: string; confidence: number }[];
}

export interface PlantSearchResult {
  commonName: string;
  scientificName: string;
  description: string;
  needs: PlantNeeds;
  wateringFrequencyDays: number;
}

const CARE_SCHEMA = `"care": {
  "water": number (1=very low to 5=very high watering need),
  "light": number (1=low light to 5=full sun),
  "humidity": number (1=very dry to 5=tropical),
  "idealTempMinF": number (ideal minimum temperature in Fahrenheit),
  "idealTempMaxF": number (ideal maximum temperature in Fahrenheit),
  "easeOfCare": number (1=expert only to 5=beginner friendly),
  "wateringFrequencyDays": number (typical days between waterings)
}`;

const IDENTIFY_PROMPT = `You are an expert botanist. Identify the plant in the photo and provide its real, species-specific care profile. Return STRICT JSON only (no markdown fences, no extra text) with exactly these fields:
{
  "commonName": string | null,
  "scientificName": string | null,
  "confidence": number (0 to 1),
  "notes": string (1-2 sentence care tip or interesting fact),
  ${CARE_SCHEMA},
  "possibleMatches": [{"commonName": string, "scientificName": string, "confidence": number}]
}
Rules:
- The care values MUST reflect this specific plant species, not generic averages.
- possibleMatches: up to 3 alternative identifications, sorted by confidence descending.
- If you cannot identify the plant, set commonName and scientificName to null and confidence low, but still give a best-guess generic care profile.
- confidence values are between 0 and 1.`;

const SEARCH_PROMPT = `You are an expert botanist. The user is searching for a plant by name: "{QUERY}".
Return STRICT JSON only (no markdown fences, no extra text): an array of up to 5 matching plants. Each entry:
{
  "commonName": string,
  "scientificName": string,
  "description": string (1-2 sentence description),
  ${CARE_SCHEMA}
}
Rules:
- The care values MUST reflect each specific plant species.
- If no plants match, return an empty array [].
- Include common houseplants, garden plants, and tropical plants. Order by relevance.`;

function clampLevel(n: unknown, fallback: number): number {
  const v = typeof n === 'number' ? Math.round(n) : NaN;
  if (Number.isNaN(v)) return fallback;
  return Math.min(5, Math.max(1, v));
}

function clampTemp(n: unknown, fallback: number): number {
  const v = typeof n === 'number' ? Math.round(n) : NaN;
  if (Number.isNaN(v)) return fallback;
  return Math.min(120, Math.max(20, v));
}

function normalizeNeeds(care: any): { needs: PlantNeeds; wateringFrequencyDays: number } {
  const c = care ?? {};
  let min = clampTemp(c.idealTempMinF, 60);
  let max = clampTemp(c.idealTempMaxF, 80);
  if (min > max) {
    const tmp = min;
    min = max;
    max = tmp;
  }
  const freqRaw = typeof c.wateringFrequencyDays === 'number' ? Math.round(c.wateringFrequencyDays) : 7;
  const wateringFrequencyDays = Math.min(30, Math.max(1, freqRaw));
  return {
    needs: {
      water: clampLevel(c.water, 3),
      light: clampLevel(c.light, 3),
      humidity: clampLevel(c.humidity, 3),
      idealTempMin: min,
      idealTempMax: max,
      easeOfCare: clampLevel(c.easeOfCare, 3),
    },
    wateringFrequencyDays,
  };
}

function extractJSON(text: string): any {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '').trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objMatch) return JSON.parse(objMatch[0]);
    const arrMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrMatch) return JSON.parse(arrMatch[0]);
    throw new Error('Could not read the response. Please try again.');
  }
}

type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

/**
 * Call Google Gemini directly (generateContent) with a vision-capable model.
 * The API key is read from the EXPO_PUBLIC_Gemini secret.
 */
async function callModel(parts: GeminiPart[], maxRetries = 2): Promise<string> {
  if (!GEMINI_KEY) {
    throw new Error('AI service is not configured.');
  }
  const baseDelays = [1000, 2500];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, baseDelays[attempt - 1] + Math.random() * 400));
    }
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_KEY,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (response.status === 429 || response.status >= 500) {
        if (attempt < maxRetries) continue;
        throw new Error(
          response.status === 429
            ? 'The service is busy right now. Please wait a moment and try again.'
            : 'The identification service is temporarily unavailable. Please try again shortly.'
        );
      }

      const raw = await response.text();
      if (!response.ok) {
        console.log('[plantAI] error', response.status, raw.substring(0, 200));
        throw new Error('Something went wrong. Please try again.');
      }

      let data: any;
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error('Unexpected response. Please try again.');
      }
      const candidate = data?.candidates?.[0];
      const text = candidate?.content?.parts?.map((p: any) => p?.text ?? '').join('') ?? '';
      const result = typeof text === 'string' ? text.trim() : '';
      if (result.length === 0) {
        throw new Error('No result returned. Please try again.');
      }
      return result;
    } catch (e: any) {
      const msg = e?.message ?? '';
      const transient = msg.includes('busy') || msg.includes('unavailable') || msg.includes('Network');
      if (attempt < maxRetries && transient) continue;
      throw e;
    }
  }
  throw new Error('Failed after multiple attempts. Please try again.');
}

/** Identify a plant from a base64-encoded JPEG image, returning a species-specific care profile. */
export async function identifyPlantFromImage(imageBase64: string): Promise<PlantIdentification> {
  const base64 = imageBase64.startsWith('data:')
    ? imageBase64.split(',')[1] ?? imageBase64
    : imageBase64;

  const content = await callModel([
    { text: IDENTIFY_PROMPT },
    { inline_data: { mime_type: 'image/jpeg', data: base64 } },
  ]);

  const parsed = extractJSON(content);
  const { needs, wateringFrequencyDays } = normalizeNeeds(parsed.care);

  return {
    commonName: parsed.commonName ?? null,
    scientificName: parsed.scientificName ?? null,
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
    notes: typeof parsed.notes === 'string' ? parsed.notes : '',
    needs,
    wateringFrequencyDays,
    possibleMatches: Array.isArray(parsed.possibleMatches)
      ? parsed.possibleMatches.slice(0, 3).map((m: any) => ({
          commonName: m?.commonName ?? 'Unknown',
          scientificName: m?.scientificName ?? 'Unknown',
          confidence: typeof m?.confidence === 'number' ? m.confidence : 0,
        }))
      : [],
  };
}

/** Search for plants by name, returning each plant's species-specific care profile. */
export async function searchPlantsByName(query: string): Promise<PlantSearchResult[]> {
  const content = await callModel([{ text: SEARCH_PROMPT.replace('{QUERY}', query) }]);

  const parsed = extractJSON(content);
  const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.plants) ? parsed.plants : [];
  if (!Array.isArray(list)) return [];

  return list.slice(0, 5).map((item: any) => {
    const { needs, wateringFrequencyDays } = normalizeNeeds(item?.care);
    return {
      commonName: item?.commonName ?? 'Unknown',
      scientificName: item?.scientificName ?? 'Unknown',
      description: item?.description ?? '',
      needs,
      wateringFrequencyDays,
    };
  });
}

const WIKI_SUMMARY = 'https://en.wikipedia.org/api/rest_v1/page/summary/';
const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600&h=600&fit=crop';

/** Fetch a real plant photo from Wikipedia, trying the scientific then common name. */
export async function fetchPlantImage(scientificName: string, commonName: string): Promise<string> {
  const candidates = [scientificName, commonName].filter((s) => s && s !== 'Unknown');
  for (const candidate of candidates) {
    try {
      const res = await fetch(`${WIKI_SUMMARY}${encodeURIComponent(candidate.trim())}`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) continue;
      const data = await res.json();
      const url = data?.originalimage?.source ?? data?.thumbnail?.source;
      if (typeof url === 'string' && url.length > 0) return url;
    } catch {
      // try next candidate
    }
  }
  return FALLBACK_IMAGE;
}
