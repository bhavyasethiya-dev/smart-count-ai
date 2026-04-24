import { GoogleGenAI, Type } from "@google/genai";

export interface DetectionResult {
  className: string;
  count: number;
  confidence: number;
}

export interface ScanResult {
  totalItems: number;
  items: DetectionResult[];
  processingTime: number;
  model: string;
}

let aiClient: GoogleGenAI | null = null;

function getAI() {
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

export async function detectObjects(imageBase64: string, threshold: number = 0.75): Promise<ScanResult> {
  const start = Date.now();
  
  try {
    const ai = getAI();
    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            text: `Count all distinct objects with confidence > ${threshold}. Return valid JSON: { "totalItems": number, "items": [{ "className": string, "count": number, "confidence": number }] }`
          },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data
            }
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["totalItems", "items"],
          properties: {
            totalItems: { type: Type.INTEGER },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["className", "count", "confidence"],
                properties: {
                  className: { type: Type.STRING },
                  count: { type: Type.INTEGER },
                  confidence: { type: Type.NUMBER }
                }
              }
            }
          }
        }
      }
    });

    if (!response || !response.text) {
      throw new Error("Neural Engine Error: Empty response received.");
    }

    const result = JSON.parse(response.text);
    
    return {
      ...result,
      processingTime: Date.now() - start,
      model: "Gemini 3 Flash (Real-time)"
    };
  } catch (error: any) {
    console.error("Detection Error:", error);
    throw error;
  }
}
