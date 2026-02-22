import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  TextInput,
  ScrollView,
  Keyboard,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Camera, ImageIcon, X, ScanLine, Search, Leaf } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { useSettings } from '@/providers/SettingsProvider';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_Plantual || '';
const GEMINI_MODEL = 'gemini-2.5-flash';
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

const SEARCH_PROMPT = `You are an expert botanist. The user is searching for a plant by name: "{QUERY}".
Return a JSON array of up to 5 matching plants. Each entry should have:
{
  "commonName": string,
  "scientificName": string,
  "description": string (1-2 sentence description),
  "imageKeyword": string (a keyword for finding images of this plant)
}
Rules:
- Return STRICT JSON array only, no markdown fences or extra text
- If no plants match, return an empty array []
- Include common houseplants, garden plants, and tropical plants
- Order by relevance to the search query`;

interface GeminiResult {
  commonName: string | null;
  scientificName: string | null;
  confidence: number;
  notes: string;
  possibleMatches: { commonName: string; scientificName: string; confidence: number }[];
}

interface SearchResult {
  commonName: string;
  scientificName: string;
  description: string;
  imageKeyword: string;
}

async function callGeminiDirect(imageBase64: string): Promise<GeminiResult> {
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
      const url = `${GEMINI_URL}?key=${GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: PROMPT }, { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
        }),
      });

      console.log(`[Gemini] Response status: ${response.status}`);
      if (response.status === 429 || response.status === 503) {
        if (attempt < MAX_RETRIES) continue;
        throw new Error(response.status === 429 ? 'Too many scans right now. Please wait a moment and try again.' : 'The identification service is busy. Please try again shortly.');
      }

      const rawText = await response.text();
      if (rawText.startsWith('<')) throw new Error('Server error. Please try again.');
      if (!response.ok) throw new Error(`Gemini API error ${response.status}: ${rawText.substring(0, 200)}`);

      let data;
      try { data = JSON.parse(rawText); } catch { throw new Error('Server error. Please try again.'); }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const parsed = parseGeminiResponse(text);

      return {
        commonName: parsed.commonName ?? null,
        scientificName: parsed.scientificName ?? null,
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
        notes: parsed.notes ?? '',
        possibleMatches: Array.isArray(parsed.possibleMatches)
          ? parsed.possibleMatches.slice(0, 3).map((m: any) => ({
              commonName: m.commonName ?? 'Unknown',
              scientificName: m.scientificName ?? 'Unknown',
              confidence: typeof m.confidence === 'number' ? m.confidence : 0,
            }))
          : [],
      };
    } catch (e: any) {
      if (attempt < MAX_RETRIES && (e?.message?.includes('429') || e?.message?.includes('503'))) continue;
      if (attempt >= MAX_RETRIES) throw e;
      throw e;
    }
  }
  throw new Error('Failed after all retries');
}

async function searchPlantByName(query: string): Promise<SearchResult[]> {
  if (!GEMINI_API_KEY) throw new Error('API key not configured');
  const url = `${GEMINI_URL}?key=${GEMINI_API_KEY}`;
  const prompt = SEARCH_PROMPT.replace('{QUERY}', query);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
    }),
  });

  if (!response.ok) {
    const raw = await response.text();
    console.log('[Search] Error:', response.status, raw.substring(0, 200));
    throw new Error('Search failed. Please try again.');
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
  const cleaned = text.trim().replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '').trim();

  try {
    const results = JSON.parse(cleaned);
    return Array.isArray(results) ? results.slice(0, 5) : [];
  } catch {
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]).slice(0, 5);
    return [];
  }
}

function parseGeminiResponse(text: string) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '');
  cleaned = cleaned.trim();
  try { return JSON.parse(cleaned); } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error('Plant not recognized. Try better lighting or a closer photo.');
  }
}

function fileToBase64Web(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.onloadend = () => {
      const result = reader.result as string;
      const parts = result.split(',');
      const base64 = parts.length > 1 ? parts[1] : parts[0];
      resolve({ base64, mimeType: file.type || 'image/jpeg' });
    };
    reader.readAsDataURL(file);
  });
}

type ScanMode = 'scan' | 'search';

export default function ScanScreen() {
  const router = useRouter();
  const { colors } = useSettings();
  const [mode, setMode] = useState<ScanMode>('scan');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const identifyMutation = useMutation({
    mutationFn: (base64: string) => callGeminiDirect(base64),
    onSuccess: (data) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({
        pathname: '/scan-result' as never,
        params: {
          name: data.commonName ?? 'Unknown Plant',
          species: data.scientificName ?? 'Unknown Species',
          confidence: String(Math.round(data.confidence * 100)),
          notes: data.notes ?? '',
          possibleMatches: JSON.stringify(data.possibleMatches ?? []),
          imageUri: imageUri ?? '',
        },
      });
    },
    onError: (error: Error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Scan Failed', error?.message || 'Could not identify the plant.');
    },
  });

  const searchMutation = useMutation({
    mutationFn: (query: string) => searchPlantByName(query),
    onSuccess: (data) => {
      console.log('[Search] Found', data.length, 'results');
      setSearchResults(data);
    },
    onError: (error: Error) => {
      Alert.alert('Search Failed', error?.message || 'Could not search for plants.');
    },
  });

  const startIdentification = useCallback((base64Data: string) => {
    if (!base64Data || base64Data.length < 100) { Alert.alert('Error', 'Image data is too small or empty.'); return; }
    if (!GEMINI_API_KEY) { Alert.alert('Error', 'API key is not configured.'); return; }
    identifyMutation.mutate(base64Data);
  }, [identifyMutation]);

  const handleWebFileSelected = useCallback(async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    const uri = URL.createObjectURL(file);
    setImageUri(uri);
    try {
      const { base64 } = await fileToBase64Web(file);
      startIdentification(base64);
    } catch {
      Alert.alert('Error', 'Failed to process the image.');
    }
    input.value = '';
  }, [startIdentification]);

  const pickImageNative = useCallback(async (useCamera: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      let result: ImagePicker.ImagePickerResult;
      if (useCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) { Alert.alert('Permission needed', 'Camera access is required.'); return; }
        result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, base64: true });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) { Alert.alert('Permission needed', 'Photo library access is required.'); return; }
        result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, base64: true });
      }
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setImageUri(asset.uri);
        let base64Data = asset.base64 || '';
        if (!base64Data) {
          const FileSystem = await import('expo-file-system');
          base64Data = await FileSystem.readAsStringAsync(asset.uri, { encoding: (FileSystem as any).EncodingType?.Base64 ?? 'base64' });
        }
        startIdentification(base64Data);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick image.');
    }
  }, [startIdentification]);

  const handleTakePhoto = useCallback(() => {
    if (Platform.OS === 'web') { cameraInputRef.current?.click(); } else { pickImageNative(true); }
  }, [pickImageNative]);

  const handleChooseGallery = useCallback(() => {
    if (Platform.OS === 'web') { fileInputRef.current?.click(); } else { pickImageNative(false); }
  }, [pickImageNative]);

  const handleClose = useCallback(() => { router.back(); }, [router]);

  const handleScanAgain = useCallback(() => {
    setImageUri(null);
    identifyMutation.reset();
  }, [identifyMutation]);

  const handleSearch = useCallback(() => {
    Keyboard.dismiss();
    const q = searchQuery.trim();
    if (!q) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    searchMutation.mutate(q);
  }, [searchQuery, searchMutation]);

  const handleSelectResult = useCallback((result: SearchResult) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace({
      pathname: '/scan-result' as never,
      params: {
        name: result.commonName,
        species: result.scientificName,
        confidence: '90',
        notes: result.description,
        possibleMatches: '[]',
        imageUri: `https://source.unsplash.com/400x400/?${encodeURIComponent(result.imageKeyword + ' plant')}`,
      },
    });
  }, [router]);

  const handleModeChange = useCallback((m: ScanMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMode(m);
    setSearchResults([]);
    setSearchQuery('');
    setImageUri(null);
    identifyMutation.reset();
    searchMutation.reset();
  }, [identifyMutation, searchMutation]);

  const isScanning = identifyMutation.isPending;
  const isSearching = searchMutation.isPending;

  const renderWebFileInputs = () => {
    if (Platform.OS !== 'web') return null;
    return (
      <View style={styles.hiddenInputs}>
        <input ref={(ref: HTMLInputElement | null) => { if (ref) { fileInputRef.current = ref; ref.onchange = handleWebFileSelected as any; } }} type="file" accept="image/*" style={{ display: 'none' }} />
        <input ref={(ref: HTMLInputElement | null) => { if (ref) { cameraInputRef.current = ref; ref.onchange = handleWebFileSelected as any; } }} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} />
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={[styles.closeBtn, { backgroundColor: colors.inputBackground }]} activeOpacity={0.7}>
            <X size={20} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Add Plant</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.modeToggle, { backgroundColor: colors.inputBackground }]}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'scan' && [styles.modeBtnActive, { backgroundColor: colors.primary }]]}
            onPress={() => handleModeChange('scan')}
            activeOpacity={0.8}
          >
            <Camera size={16} color={mode === 'scan' ? '#fff' : colors.textSecondary} strokeWidth={1.8} />
            <Text style={[styles.modeText, { color: colors.textSecondary }, mode === 'scan' && styles.modeTextActive]}>Scan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'search' && [styles.modeBtnActive, { backgroundColor: colors.primary }]]}
            onPress={() => handleModeChange('search')}
            activeOpacity={0.8}
          >
            <Search size={16} color={mode === 'search' ? '#fff' : colors.textSecondary} strokeWidth={1.8} />
            <Text style={[styles.modeText, { color: colors.textSecondary }, mode === 'search' && styles.modeTextActive]}>Search</Text>
          </TouchableOpacity>
        </View>

        {mode === 'scan' ? (
          <>
            {isScanning ? (
              <View style={styles.loadingContainer}>
                <View style={[styles.scanningCard, { backgroundColor: colors.cardSolid }]}>
                  {imageUri && <Image source={{ uri: imageUri }} style={styles.previewImage} contentFit="cover" />}
                  <View style={styles.scanOverlay}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.scanningText, { color: colors.text }]}>Identifying plant…</Text>
                    <Text style={[styles.scanningSubtext, { color: colors.textSecondary }]}>Analyzing with AI</Text>
                  </View>
                </View>
              </View>
            ) : identifyMutation.isError ? (
              <View style={styles.body}>
                <View style={styles.illustration}>
                  {imageUri && <Image source={{ uri: imageUri }} style={styles.errorPreview} contentFit="cover" />}
                  <Text style={[styles.errorTitle, { color: colors.error }]}>Scan Failed</Text>
                  <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{identifyMutation.error?.message || 'Could not identify. Try again.'}</Text>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={handleScanAgain} activeOpacity={0.8}>
                    <Camera size={22} color="#fff" strokeWidth={2} />
                    <Text style={styles.primaryButtonText}>Scan Again</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.body}>
                <View style={styles.illustration}>
                  <View style={[styles.scanIconBg, { backgroundColor: colors.primaryMuted }]}>
                    <ScanLine size={48} color={colors.primary} strokeWidth={1.5} />
                  </View>
                  <Text style={[styles.title, { color: colors.text }]}>Identify Any Plant</Text>
                  <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Take a photo or choose from your gallery to identify a plant</Text>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={handleTakePhoto} activeOpacity={0.8} disabled={isScanning}>
                    <Camera size={22} color="#fff" strokeWidth={2} />
                    <Text style={styles.primaryButtonText}>Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: colors.cardSolid }]} onPress={handleChooseGallery} activeOpacity={0.8} disabled={isScanning}>
                    <ImageIcon size={20} color={colors.text} strokeWidth={1.8} />
                    <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Choose from Gallery</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        ) : (
          <View style={styles.searchBody}>
            <View style={styles.searchInputRow}>
              <View style={[styles.searchInputWrap, { backgroundColor: colors.cardSolid, borderColor: colors.divider }]}>
                <Search size={18} color={colors.textSecondary} strokeWidth={1.8} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search plant name..."
                  placeholderTextColor={colors.textTertiary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                  onSubmitEditing={handleSearch}
                  autoFocus
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <X size={16} color={colors.textTertiary} strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                style={[styles.searchBtn, { backgroundColor: colors.primary }, (!searchQuery.trim() || isSearching) && styles.searchBtnDisabled]}
                onPress={handleSearch}
                disabled={!searchQuery.trim() || isSearching}
                activeOpacity={0.8}
              >
                {isSearching ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.searchBtnText}>Go</Text>
                )}
              </TouchableOpacity>
            </View>

            {isSearching && searchResults.length === 0 ? (
              <View style={styles.searchLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.searchLoadingText, { color: colors.textSecondary }]}>Searching...</Text>
              </View>
            ) : searchResults.length > 0 ? (
              <ScrollView style={styles.resultsList} contentContainerStyle={styles.resultsContent} showsVerticalScrollIndicator={false}>
                {searchResults.map((result, i) => (
                  <TouchableOpacity
                    key={`${result.scientificName}-${i}`}
                    style={[styles.resultCard, { backgroundColor: colors.cardSolid, borderColor: colors.divider }]}
                    onPress={() => handleSelectResult(result)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.resultIconWrap, { backgroundColor: colors.primaryMuted }]}>
                      <Leaf size={20} color={colors.primary} strokeWidth={1.8} />
                    </View>
                    <View style={styles.resultInfo}>
                      <Text style={[styles.resultName, { color: colors.text }]}>{result.commonName}</Text>
                      <Text style={[styles.resultSpecies, { color: colors.textSecondary }]}>{result.scientificName}</Text>
                      <Text style={[styles.resultDesc, { color: colors.textSecondary }]} numberOfLines={2}>{result.description}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : searchMutation.isError ? (
              <View style={styles.searchEmpty}>
                <Text style={[styles.searchEmptyText, { color: colors.textSecondary }]}>Search failed. Please try again.</Text>
              </View>
            ) : (
              <View style={styles.searchEmpty}>
                <View style={[styles.searchEmptyIcon, { backgroundColor: colors.inputBackground }]}>
                  <Search size={40} color={colors.textTertiary} strokeWidth={1.2} />
                </View>
                <Text style={[styles.searchEmptyTitle, { color: colors.text }]}>Search by Plant Name</Text>
                <Text style={[styles.searchEmptyText, { color: colors.textSecondary }]}>Type a plant name and tap Go to find it</Text>
              </View>
            )}
          </View>
        )}

        {renderWebFileInputs()}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerSpacer: { width: 40, height: 40 },
  headerTitle: { fontSize: 17, fontWeight: '600' as const },
  modeToggle: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 12, borderRadius: 12, padding: 3 },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
  modeBtnActive: { ...Platform.select({ ios: { shadowColor: '#30D158', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }, android: { elevation: 3 } }) },
  modeText: { fontSize: 14, fontWeight: '600' as const },
  modeTextActive: { color: '#fff' },
  body: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 24 },
  illustration: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  scanIconBg: { width: 100, height: 100, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '700' as const, textAlign: 'center', letterSpacing: -0.5 },
  errorTitle: { fontSize: 22, fontWeight: '700' as const, textAlign: 'center', marginTop: 16 },
  errorPreview: { width: 160, height: 160, borderRadius: 20 },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, maxWidth: 280 },
  actions: { gap: 12 },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14, ...Platform.select({ ios: { shadowColor: '#30D158', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8 }, android: { elevation: 4 } }) },
  primaryButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' as const },
  secondaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14 },
  secondaryButtonText: { fontSize: 16, fontWeight: '500' as const },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  scanningCard: { width: '100%', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 8 },
  previewImage: { width: '100%', height: 280 },
  scanOverlay: { padding: 28, alignItems: 'center', gap: 8 },
  scanningText: { fontSize: 18, fontWeight: '600' as const, marginTop: 8 },
  scanningSubtext: { fontSize: 14 },
  searchBody: { flex: 1, paddingHorizontal: 20 },
  searchInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  searchInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 12 : 8, gap: 10, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 16, padding: 0 },
  searchBtn: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  searchBtnDisabled: { opacity: 0.5 },
  searchBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' as const },
  searchLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  searchLoadingText: { fontSize: 15 },
  resultsList: { flex: 1 },
  resultsContent: { paddingBottom: 32, gap: 10 },
  resultCard: { flexDirection: 'row', borderRadius: 14, padding: 16, gap: 14, borderWidth: 1, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 }, android: { elevation: 2 } }) },
  resultIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  resultInfo: { flex: 1, gap: 2 },
  resultName: { fontSize: 16, fontWeight: '600' as const },
  resultSpecies: { fontSize: 13, fontStyle: 'italic' as const },
  resultDesc: { fontSize: 13, lineHeight: 18, marginTop: 4 },
  searchEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  searchEmptyIcon: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  searchEmptyTitle: { fontSize: 20, fontWeight: '600' as const },
  searchEmptyText: { fontSize: 14, textAlign: 'center' },
  hiddenInputs: { position: 'absolute', width: 0, height: 0, overflow: 'hidden' },
});
