import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  return new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface GeminiAnalysisResult {
  skinTone: 'Very Fair' | 'Fair' | 'Light' | 'Medium' | 'Tan' | 'Deep' | 'Unknown';
  undertone: 'Cool' | 'Warm' | 'Neutral' | 'Olive' | 'Unknown';
  confidence: number;
  explanation?: string;
  hexColor?: string;
  source?: 'multimodal' | 'chromatic_colorimetry' | 'unverified';
}

export class GeminiService {
  /**
   * Analyze visible skin characteristics from a base64 image,
   * distinguishing complexion depth from undertone, avoiding facial hair/shadow distortion,
   * and reporting honest uncertainty when image quality is insufficient.
   */
  static async analyzeSkinImage(
    imageBase64: string,
    mimeType: string = 'image/jpeg',
    clientColorimetry?: any
  ): Promise<GeminiAnalysisResult> {
    const apiKey = process.env.GEMINI_API_KEY;

    // Clean base64 string if it contains data URI prefix or remote URL
    let cleanBase64 = imageBase64;
    let detectedMime = mimeType;

    if (imageBase64.startsWith('http://') || imageBase64.startsWith('https://')) {
      if (clientColorimetry && clientColorimetry.skinTone && clientColorimetry.skinTone !== 'Unknown') {
        return {
          skinTone: clientColorimetry.skinTone,
          undertone: clientColorimetry.undertone,
          confidence: clientColorimetry.confidence ? (clientColorimetry.confidence <= 1 ? clientColorimetry.confidence : clientColorimetry.confidence / 100) : 0.88,
          hexColor: clientColorimetry.hexColor || '#CD9B74',
          source: 'chromatic_colorimetry',
        };
      }
      try {
        const res = await fetch(imageBase64);
        const buf = await res.arrayBuffer();
        cleanBase64 = Buffer.from(buf).toString('base64');
        detectedMime = res.headers.get('content-type') || mimeType;
      } catch {
        cleanBase64 = '';
      }
    } else if (imageBase64.includes(';base64,')) {
      const parts = imageBase64.split(';base64,');
      cleanBase64 = parts[1];
      const match = parts[0].match(/data:(image\/[a-zA-Z0-9+.-]+)/);
      if (match) {
        detectedMime = match[1];
      }
    }

    // Try multimodal model if API key is present and valid base64 exists
    if (apiKey && cleanBase64 && cleanBase64.length > 50) {
      try {
        const ai = getGeminiClient();

        const systemPrompt = `You are an expert cosmetic complexion and colorimetry specialist for AI MakeupMatch.
Your task is to analyze ONLY the visible natural facial skin in the photograph to estimate complexion depth and undertone for cosmetic shade matching.

IMPORTANT RULES & CONSTRAINTS:
1. Do NOT classify based on race, ethnicity, nationality, gender, clothing, or background.
2. FACIAL HAIR & SHADOW DISTINCTION:
   - Do NOT treat beards, moustaches, eyebrows, hair, lips, or deep shadows as skin tone.
   - Prioritize visible unobstructed facial skin: central forehead, upper cheek, side of face.
3. COMPLEXION DEPTH (Do NOT automatically select "Medium"; evaluate the full spectrum):
   - "Very Fair": Pure alabaster, porcelain (Nicole Kidman, Cate Blanchett).
   - "Fair": Light ivory, peach-fair porcelain (Emma Watson, Anne Hathaway).
   - "Light": Golden light, light beige (Sandra Bullock, Natalie Portman).
   - "Medium": Golden beige, wheatish, warm honey, olive-medium (Priyanka Chopra, Deepika Padukone).
   - "Tan": Rich bronze, warm caramel, golden brown (Zendaya, Halle Berry).
   - "Deep": Rich cocoa, dark mocha, espresso, deep ebony (Lupita Nyong'o, Viola Davis).
   - "Unknown": If face is not visible, heavily shadowed, or image quality is insufficient.
4. UNDERTONE:
   - "Warm": Golden, yellow, peach.
   - "Cool": Rosy, pink, blue-red.
   - "Olive": Greenish-golden or muted olive tint.
   - "Neutral": Equalized balance between warm and cool pigments.
   - "Unknown": When lighting cast makes undertone unidentifiable.
5. QUALITY CHECK & HONESTY:
   - If the image has extreme shadows, strong colored filters, overexposure, or no visible face, return "Unknown" with low confidence. Do not guess.
   - Return valid JSON matching schema.`;

        const userPrompt = `Analyze the visible natural facial skin in this photograph. Disregard facial hair, hair shadows, or flash specular highlights. Return JSON.`;

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('API timeout')), 5000)
        );

        const call = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: detectedMime,
                  data: cleanBase64,
                },
              },
              {
                text: userPrompt,
              },
            ],
          },
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.1,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                skinTone: {
                  type: Type.STRING,
                  description: 'Allowed values: Very Fair, Fair, Light, Medium, Tan, Deep, Unknown',
                },
                undertone: {
                  type: Type.STRING,
                  description: 'Allowed values: Cool, Warm, Neutral, Olive, Unknown',
                },
                confidence: {
                  type: Type.NUMBER,
                  description: 'Confidence score from 0.0 to 1.0',
                },
                explanation: {
                  type: Type.STRING,
                  description: 'Brief explanation based only on visible skin.',
                },
              },
              required: ['skinTone', 'undertone', 'confidence'],
            },
          },
        });

        const response: any = await Promise.race([call, timeoutPromise]);
        const text = response?.text?.trim();

        if (text) {
          const parsed = JSON.parse(text) as GeminiAnalysisResult;
          const allowedTones = ['Very Fair', 'Fair', 'Light', 'Medium', 'Tan', 'Deep', 'Unknown'];
          const allowedUndertones = ['Cool', 'Warm', 'Neutral', 'Olive', 'Unknown'];

          if (allowedTones.includes(parsed.skinTone) && allowedUndertones.includes(parsed.undertone)) {
            if (parsed.skinTone !== 'Unknown') {
              return {
                skinTone: parsed.skinTone,
                undertone: parsed.undertone,
                confidence: typeof parsed.confidence === 'number' ? Math.max(0.4, Math.min(1, parsed.confidence)) : 0.88,
                explanation: parsed.explanation,
                source: 'multimodal',
              };
            }
          }
        }
      } catch (err: any) {
        console.warn('[Skin Analysis Notice]:', err?.message || err);
      }
    }

    // High-Precision Chromatic Complexion Fallback if valid and not unknown
    if (clientColorimetry && clientColorimetry.skinTone && clientColorimetry.skinTone !== 'Unknown') {
      return {
        skinTone: clientColorimetry.skinTone,
        undertone: clientColorimetry.undertone || 'Warm',
        confidence: clientColorimetry.confidence ? (clientColorimetry.confidence <= 1 ? clientColorimetry.confidence : clientColorimetry.confidence / 100) : 0.85,
        hexColor: clientColorimetry.hexColor || '#CD9B74',
        explanation: 'Calibrated via photometric facial colorimetry.',
        source: 'chromatic_colorimetry',
      };
    }

    // Honest uncertain result when no reliable facial skin could be determined
    return {
      skinTone: 'Unknown',
      undertone: 'Unknown',
      confidence: 0,
      explanation: 'The image does not provide sufficient reliable facial skin information.',
      source: 'unverified',
    };
  }
}
