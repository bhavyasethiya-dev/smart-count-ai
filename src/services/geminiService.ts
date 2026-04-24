import { GoogleGenAI, Type } from "@google/genai";

export interface DetectionResult {
  className: string;
  count: number;
  confidence: number;
}

export interface ScanResult {
  totalItems: number;
  processingTime: number;
  model: string;
  items: DetectionResult[];
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
  
  // Clean base64 data
  const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
  
  console.log(`Sending image for detection (base64 length: ${base64Data.length})`);

  try {
    const ai = getAI();
    let response;
    let attempt = 0;
    const maxRetries = 2;

    while (attempt <= maxRetries) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-flash-latest",
          contents: {
            parts: [
              {
                text: `Count all objects with confidence > ${threshold}. 
                JSON schema: { "totalItems": number, "items": [{ "className": string, "count": number, "confidence": number }] }`
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
        break; // Success
      } catch (err: any) {
        // Retry on 503 (Service Unavailable)
        if (err.message?.includes('503') && attempt < maxRetries) {
          attempt++;
          console.warn(`Model overloaded. Retry attempt ${attempt}...`);
          await new Promise(r => setTimeout(r, 2000 * attempt));
          continue;
        }
        throw err;
      }
    }

    if (!response || !response.text) {
      throw new Error("Empty AI response");
    }

    const result = JSON.parse(response.text);
    return {
      ...result,
      processingTime: Date.now() - start,
      model: "Gemini Flash (Mobile-Optimized)"
    };
  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    throw error;
  }
}
