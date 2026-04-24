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
    const maxRetries = 3;

    while (attempt <= maxRetries) {
      try {
        response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: {
            parts: [
              {
                text: `Identify and count all distinct objects in this image. Return the results strictly as JSON matching this schema: { "totalItems": number, "items": [{ "className": string, "count": number, "confidence": number }] }. Use a confidence threshold of ${threshold}.`
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
        const errorMsg = err.message || String(err);
        const isRetryable = errorMsg.includes('503') || errorMsg.includes('500') || errorMsg.includes('overloaded');
        
        if (isRetryable && attempt < maxRetries) {
          attempt++;
          const waitTime = Math.pow(2, attempt) * 2000;
          console.warn(`Transient error (503/500). Retrying in ${waitTime}ms... (Attempt ${attempt})`);
          await new Promise(r => setTimeout(r, waitTime));
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
      model: "Gemini 1.5 Flash (Optimized)"
    };
  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    throw error;
  }
}
