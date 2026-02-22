import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Camera, ImageIcon, X, ScanLine } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import Colors from '@/constants/colors';

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

interface GeminiResult {
  commonName: string | null;
  scientificName: string | null;
  confidence: number;
  notes: string;
  possibleMatches: { commonName: string; scientificName: string; confidence: number }[];
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
      console.log('[Gemini] Calling URL:', url.replace(GEMINI_API_KEY, '***'));

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: PROMPT },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
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
          response.status === 429
            ? 'Too many scans right now. Please wait a moment and try again.'
            : 'The identification service is busy. Please try again shortly.'
        );
      }

      const rawText = await response.text();

      if (rawText.startsWith('<')) {
        console.log('[Gemini] Got HTML response instead of JSON:', rawText.substring(0, 200));
        throw new Error('Server error. Please try again.');
      }

      if (!response.ok) {
        console.log(`[Gemini] Error response: ${rawText.substring(0, 300)}`);
        throw new Error(`Gemini API error ${response.status}: ${rawText.substring(0, 200)}`);
      }

      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        console.log('[Gemini] Failed to parse response as JSON:', rawText.substring(0, 200));
        throw new Error('Server error. Please try again.');
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log(`[Gemini] Response text length: ${text.length}`);

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
      if (
        attempt < MAX_RETRIES &&
        (e?.message?.includes('429') || e?.message?.includes('503'))
      ) {
        continue;
      }
      if (attempt >= MAX_RETRIES) throw e;
      throw e;
    }
  }

  throw new Error('Failed after all retries');
}

function parseGeminiResponse(text: string) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '');
  }
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Plant not recognized. Try better lighting or a closer photo.');
  }
}

function fileToBase64Web(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('FileReader failed to read file'));
    reader.onloadend = () => {
      const result = reader.result as string;
      const parts = result.split(',');
      const base64 = parts.length > 1 ? parts[1] : parts[0];
      const mimeType = file.type || 'image/jpeg';
      console.log('[Scan] Web file converted to base64, length:', base64.length, 'mime:', mimeType);
      resolve({ base64, mimeType });
    };
    reader.readAsDataURL(file);
  });
}

export default function ScanScreen() {
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const identifyMutation = useMutation({
    mutationFn: (base64: string) => callGeminiDirect(base64),
    onSuccess: (data) => {
      console.log('[Scan] Identification success:', data.commonName);
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
      console.log('[Scan] Identification failed:', error?.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      let message = error?.message || 'Could not identify the plant. Try a clearer photo.';

      if (message.includes('network') || message.includes('Network') || message.includes('fetch')) {
        message = 'No internet connection. Please check your network.';
      }

      Alert.alert('Scan Failed', message);
    },
  });

  const startIdentification = useCallback((base64Data: string) => {
    if (!base64Data || base64Data.length < 100) {
      Alert.alert('Error', 'Image data is too small or empty.');
      return;
    }

    if (!GEMINI_API_KEY) {
      Alert.alert('Error', 'Gemini API key is not configured.');
      return;
    }

    console.log('[Scan] Starting Gemini identification, base64 length:', base64Data.length);
    identifyMutation.mutate(base64Data);
  }, [identifyMutation]);

  const handleWebFileSelected = useCallback(async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) {
      console.log('[Scan] No file selected');
      return;
    }

    console.log('[Scan] Web file selected:', file.name, 'size:', file.size, 'type:', file.type);

    const uri = URL.createObjectURL(file);
    setImageUri(uri);

    try {
      const { base64 } = await fileToBase64Web(file);
      startIdentification(base64);
    } catch (e: any) {
      console.log('[Scan] Error processing web file:', e);
      Alert.alert('Error', 'Failed to process the image. Please try again.');
    }

    input.value = '';
  }, [startIdentification]);

  const pickImageNative = useCallback(async (useCamera: boolean) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      let result: ImagePicker.ImagePickerResult;

      if (useCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission needed', 'Camera access is required to scan plants.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          base64: true,
        });
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission needed', 'Photo library access is required.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.7,
          base64: true,
        });
      }

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const uri = asset.uri;
        setImageUri(uri);

        let base64Data = asset.base64 || '';

        if (!base64Data) {
          console.log('[Scan] No base64 from picker, reading file...');
          try {
            const FileSystem = await import('expo-file-system');
            base64Data = await FileSystem.readAsStringAsync(uri, {
              encoding: (FileSystem as any).EncodingType?.Base64 ?? 'base64',
            });
          } catch (e) {
            console.log('[Scan] File system read failed:', e);
            throw new Error('Failed to read image file');
          }
        }

        console.log('[Scan] Native image base64 length:', base64Data.length);
        startIdentification(base64Data);
      }
    } catch (e: any) {
      console.log('[Scan] Image picker error:', e);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  }, [startIdentification]);

  const handleTakePhoto = useCallback(() => {
    if (Platform.OS === 'web') {
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      }
    } else {
      pickImageNative(true);
    }
  }, [pickImageNative]);

  const handleChooseGallery = useCallback(() => {
    if (Platform.OS === 'web') {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    } else {
      pickImageNative(false);
    }
  }, [pickImageNative]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const handleScanAgain = useCallback(() => {
    setImageUri(null);
    identifyMutation.reset();
  }, [identifyMutation]);

  const isScanning = identifyMutation.isPending;

  const renderWebFileInputs = () => {
    if (Platform.OS !== 'web') return null;

    return (
      <View style={styles.hiddenInputs}>
        <input
          ref={(ref: HTMLInputElement | null) => {
            if (ref) {
              fileInputRef.current = ref;
              ref.onchange = handleWebFileSelected as any;
            }
          }}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
        />
        <input
          ref={(ref: HTMLInputElement | null) => {
            if (ref) {
              cameraInputRef.current = ref;
              ref.onchange = handleWebFileSelected as any;
            }
          }}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
        />
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
            <X size={20} color={Colors.text} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Plant</Text>
          <View style={styles.headerSpacer} />
        </View>

        {isScanning ? (
          <View style={styles.loadingContainer}>
            <View style={styles.scanningCard}>
              {imageUri && (
                <Image source={{ uri: imageUri }} style={styles.previewImage} contentFit="cover" />
              )}
              <View style={styles.scanOverlay}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.scanningText}>Identifying plant…</Text>
                <Text style={styles.scanningSubtext}>Analyzing with Gemini Vision</Text>
              </View>
            </View>
          </View>
        ) : identifyMutation.isError ? (
          <View style={styles.body}>
            <View style={styles.illustration}>
              {imageUri && (
                <Image source={{ uri: imageUri }} style={styles.errorPreview} contentFit="cover" />
              )}
              <Text style={styles.errorTitle}>Scan Failed</Text>
              <Text style={styles.subtitle}>
                {identifyMutation.error?.message || 'Could not identify the plant. Try again.'}
              </Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleScanAgain}
                activeOpacity={0.8}
              >
                <Camera size={22} color="#fff" strokeWidth={2} />
                <Text style={styles.primaryButtonText}>Scan Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleClose}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>Go Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.body}>
            <View style={styles.illustration}>
              <View style={styles.scanIconBg}>
                <ScanLine size={48} color={Colors.primary} strokeWidth={1.5} />
              </View>
              <Text style={styles.title}>Identify Any Plant</Text>
              <Text style={styles.subtitle}>
                Take a photo or choose from your gallery to instantly identify a plant and see its care needs
              </Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.primaryButton, isScanning && styles.disabledButton]}
                onPress={handleTakePhoto}
                activeOpacity={0.8}
                disabled={isScanning}
              >
                <Camera size={22} color="#fff" strokeWidth={2} />
                <Text style={styles.primaryButtonText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, isScanning && styles.disabledButton]}
                onPress={handleChooseGallery}
                activeOpacity={0.8}
                disabled={isScanning}
              >
                <ImageIcon size={20} color={Colors.text} strokeWidth={1.8} />
                <Text style={styles.secondaryButtonText}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {renderWebFileInputs()}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(60, 60, 67, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  body: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  illustration: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  scanIconBg: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.error,
    textAlign: 'center',
    letterSpacing: -0.3,
    marginTop: 16,
  },
  errorPreview: {
    width: 160,
    height: 160,
    borderRadius: 20,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600' as const,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.cardSolid,
    paddingVertical: 16,
    borderRadius: 14,
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '500' as const,
  },
  disabledButton: {
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  scanningCard: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.cardSolid,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  previewImage: {
    width: '100%',
    height: 280,
  },
  scanOverlay: {
    padding: 28,
    alignItems: 'center',
    gap: 8,
  },
  scanningText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 8,
  },
  scanningSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  hiddenInputs: {
    position: 'absolute',
    width: 0,
    height: 0,
    overflow: 'hidden',
  },
});
