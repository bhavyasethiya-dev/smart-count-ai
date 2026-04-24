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
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt <= maxRetries) {
    try {
      const ai = getAI();
      const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            {
              text: `Detect and count distinct physical objects in this image. Results should be strictly structured as JSON. Use confidence threshold: ${threshold}.`
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
        model: "Gemini 3 Flash (Real-time Vision)"
      };
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      const isRetryable = errorMsg.includes('429') || errorMsg.includes('Quota') || errorMsg.includes('503') || errorMsg.includes('overloaded');
      
      if (isRetryable && attempt < maxRetries) {
        attempt++;
        const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.warn(`Transient busy signal detected. Automatic retry ${attempt}/${maxRetries} in ${waitTime}ms...`);
        await new Promise(r => setTimeout(r, waitTime));
        continue;
      }
      
      console.error("Detection Error (Terminal):", error);
      throw error;
    }
  }
  throw new Error("Maximum retries exhausted. AI engine is persistently busy.");
}
